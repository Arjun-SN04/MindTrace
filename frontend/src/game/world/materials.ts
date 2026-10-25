import * as THREE from 'three';
import { tex } from './textures';

const cache = new Map<string, THREE.Material>();

function mat<T extends THREE.Material>(key: string, make: () => T): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = make();
    cache.set(key, m);
  }
  return m;
}

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

/** Neon/emissive materials are pushed above 1.0 so only they trigger bloom. */
export function glow(color: string, intensity = 3): THREE.MeshBasicMaterial {
  return mat(`glow-${color}-${intensity}`, () => {
    const c = new THREE.Color(color).multiplyScalar(intensity);
    return new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  });
}

const texLoader = new THREE.TextureLoader();
const pbrCache = new Map<string, THREE.Texture>();

/** Loads a CC0 Poly Haven texture from /assets/textures. `metres` = real-world size of one tile. */
function pbrTex(name: string, kind: 'diff' | 'nor' | 'rough', metres: number): THREE.Texture {
  const key = `${name}_${kind}_${metres}`;
  let t = pbrCache.get(key);
  if (!t) {
    t = texLoader.load(`/assets/textures/${name}_${kind}.webp`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / metres, 1 / metres);
    t.anisotropy = 8;
    t.colorSpace = kind === 'diff' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    pbrCache.set(key, t);
  }
  return t;
}

interface PbrOptions {
  color?: string;
  roughness?: number;
  normalScale?: number;
  envMapIntensity?: number;
  /** 0..1: how much of the surface is covered by puddles. */
  wet?: number;
}

function pbr(name: string, metres: number, o: PbrOptions = {}): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    map: pbrTex(name, 'diff', metres),
    normalMap: pbrTex(name, 'nor', metres),
    roughnessMap: pbrTex(name, 'rough', metres),
    color: o.color ?? '#ffffff',
    roughness: o.roughness ?? 1,
    metalness: 0,
    envMapIntensity: o.envMapIntensity ?? 1,
  });
  const n = o.normalScale ?? 1;
  m.normalScale.set(n, n);
  if (o.wet) makeWet(m, o.wet);
  return m;
}

/**
 * Rain-soaked look: a large-scale puddle mask makes parts of the surface
 * glossy, darker and flat, so they mirror the HDRI and street lights.
 */
function makeWet(m: THREE.MeshStandardMaterial, amount: number) {
  const puddles = tex.puddles();
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uPuddles = { value: puddles };
    shader.uniforms.uWet = { value: amount };
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform sampler2D uPuddles;\nuniform float uWet;\nvoid main() {')
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float pud = texture2D(uPuddles, vRoughnessMapUv * 0.27).g;
        float wetMask = smoothstep(0.5, 0.66, pud) * uWet;
        roughnessFactor = mix(roughnessFactor * mix(1.0, 0.55, uWet), 0.03, wetMask);
        diffuseColor.rgb *= mix(mix(1.0, 0.68, uWet), 0.42, wetMask);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = normalize(mix(normal, nonPerturbedNormal, wetMask));`,
      );
  };
  m.customProgramCacheKey = () => `wet-${amount}`;
}

export const M = {
  asphalt: () => mat('asphalt', () => pbr('asphalt_02', 4, { color: '#70737a', wet: 1, envMapIntensity: 1.6 })),
  sidewalk: () => mat('sidewalk', () => pbr('concrete_pavement', 3, { color: '#a4a6aa', wet: 0.55, envMapIntensity: 1.1 })),
  curb: () => mat('curb', () => pbr('concrete_floor_02', 2, { color: '#8a8c90', wet: 0.4 })),
  brick: () => mat('brick', () => pbr('red_brick_03', 2.4, { color: '#c8b8b0', roughness: 1, normalScale: 1.2 })),
  brickBrown: () => mat('brickBrown', () => pbr('brick_wall_10', 2.4, { color: '#c0b4ac', normalScale: 1.2 })),
  brickGrey: () => mat('brickGrey', () => pbr('brick_wall_001', 2.4, { color: '#9a9ea6', normalScale: 1.2 })),
  facade: (v = 0) =>
    mat(`facade-${v}`, () =>
      std({ map: tex.windows(v), emissiveMap: tex.windowsEmissive(v), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.0, roughness: 0.8 }),
    ),
  stone: () => mat('stone', () => pbr('concrete_floor_02', 3, { color: '#8e9096' })),
  trim: () => mat('trim', () => std({ color: '#1b1d22', roughness: 0.5, metalness: 0.3 })),
  plaster: () => mat('plaster', () => pbr('painted_plaster_wall', 2, { color: '#a3a89c', normalScale: 0.6 })),
  plasterWarm: () => mat('plasterWarm', () => pbr('painted_plaster_wall', 2, { color: '#b5a691', normalScale: 0.6 })),
  ceiling: () => mat('ceiling', () => std({ color: '#3b3d40', roughness: 1 })),
  wood: () => mat('wood', () => pbr('old_wood_floor', 2.5, { color: '#d8c8b8', roughness: 0.8 })),
  darkWood: () => mat('darkWood', () => std({ color: '#2e1f17', roughness: 0.5 })),
  tiles: () => mat('tiles', () => pbr('floor_tiles_06', 1.6, { roughness: 0.6, envMapIntensity: 1.3 })),
  metal: () => mat('metal', () => std({ color: '#7d828a', roughness: 0.35, metalness: 0.85 })),
  darkMetal: () => mat('darkMetal', () => std({ color: '#2a2d33', roughness: 0.45, metalness: 0.7 })),
  brass: () => mat('brass', () => std({ color: '#9c7a3c', roughness: 0.35, metalness: 0.9 })),
  fabric: () => mat('fabric', () => std({ color: '#3a4250', roughness: 1 })),
  fabricRed: () => mat('fabricRed', () => std({ color: '#5a1f26', roughness: 1 })),
  rug: () => mat('rug', () => std({ color: '#40302c', roughness: 1 })),
  paper: () => mat('paper', () => std({ color: '#d9d3c4', roughness: 0.9 })),
  black: () => mat('black', () => std({ color: '#0d0e10', roughness: 0.6 })),
  shutter: () => mat('shutter', () => pbr('rusty_metal_shutter', 2, { color: '#8a8f98' })),
  cork: () => mat('cork', () => std({ map: tex.cork(), roughness: 1 })),
  whiteboard: () => mat('whiteboard', () => std({ color: '#c9ccd0', roughness: 0.25 })),
  glass: () =>
    mat('glass', () => new THREE.MeshPhysicalMaterial({ color: '#9fb4c8', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, envMapIntensity: 2, depthWrite: false })),
  chainlink: () =>
    mat('chainlink', () => std({ map: tex.chainlink(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4 })),
  stripes: () => mat('stripes', () => std({ map: tex.stripes(), roughness: 0.6 })),
  car: () => mat('car', () => std({ color: '#3d434c', roughness: 0.25, metalness: 0.7 })),
  tyre: () => mat('tyre', () => std({ color: '#111214', roughness: 0.9 })),
  dumpster: () => mat('dumpster', () => pbr('rusty_metal_shutter', 1.5, { color: '#5b7a63', roughness: 1 })),
  trashBag: () => mat('trashBag', () => new THREE.MeshPhysicalMaterial({ color: '#0e1013', roughness: 0.32, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25 })),
  plant: () => mat('plant', () => std({ color: '#25402b', roughness: 0.8 })),
  pot: () => mat('pot', () => std({ color: '#5c3b2a', roughness: 0.8 })),
  hydrant: () => mat('hydrant', () => std({ color: '#7a1c22', roughness: 0.5, metalness: 0.3 })),
  invisible: () => mat('invisible', () => new THREE.MeshBasicMaterial({ visible: false })),
};

/**
 * Box geometry whose UVs are in metres, so tiled textures keep a consistent
 * scale no matter how big the box is.
 */
const geoCache = new Map<string, THREE.BoxGeometry>();
export function worldBox(sx: number, sy: number, sz: number): THREE.BoxGeometry {
  const key = `${sx.toFixed(3)}|${sy.toFixed(3)}|${sz.toFixed(3)}`;
  let g = geoCache.get(key);
  if (g) return g;
  g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // Face order: +x, -x, +y, -y, +z, -z; 4 verts per face.
  const dims: [number, number][] = [
    [sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  uv.needsUpdate = true;
  geoCache.set(key, g);
  return g;
}
