import { Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';
import { HALVORSEN } from './layout';
import { rand } from './textures';

const RAIN_VERT = /* glsl */ `
uniform float uTime;
uniform vec3 uCenter;
uniform vec3 uBox;
uniform vec4 uMask;
attribute vec3 aSeed;
attribute float aEnd;
varying float vAlpha;

void main() {
  vec3 lo = uCenter - uBox * 0.5;
  vec3 p;
  p.x = lo.x + mod(aSeed.x * uBox.x - lo.x, uBox.x);
  p.z = lo.z + mod(aSeed.z * uBox.z - lo.z, uBox.z);
  p.y = lo.y + mod(aSeed.y * uBox.y - uTime * (13.0 + aSeed.x * 4.0) - lo.y, uBox.y);
  p += aEnd * vec3(0.03, -0.32, 0.012);

  // No rain inside the Halvorsen.
  bool inside = p.x > uMask.x && p.x < uMask.y && p.z > uMask.z && p.z < uMask.w && p.y < 20.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = length(mv.xyz);
  vAlpha = inside ? 0.0 : (1.0 - smoothstep(9.0, 24.0, dist)) * (0.55 + 0.45 * aEnd);
  gl_Position = projectionMatrix * mv;
}
`;

const RAIN_FRAG = /* glsl */ `
varying float vAlpha;
void main() {
  if (vAlpha <= 0.001) discard;
  gl_FragColor = vec4(0.7, 0.76, 0.86, vAlpha * 0.2);
}
`;

function Rain({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 2 * 3);
    const seeds = new Float32Array(count * 2 * 3);
    const ends = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const s = [rand(), rand(), rand()];
      for (let e = 0; e < 2; e++) {
        seeds.set(s, (i * 2 + e) * 3);
        ends[i * 2 + e] = e;
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const [x0, x1, z0, z1] = HALVORSEN;
    const m = new THREE.ShaderMaterial({
      vertexShader: RAIN_VERT,
      fragmentShader: RAIN_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector3() },
        uBox: { value: new THREE.Vector3(40, 22, 40) },
        uMask: { value: new THREE.Vector4(x0, x1, z0, z1) },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame(({ camera, clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uCenter.value.copy(camera.position);
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}

export function Atmosphere() {
  const quality = useGame((s) => s.settings.quality);
  return (
    <>
      <color attach="background" args={['#070a12']} />
      <fogExp2 attach="fog" args={['#0a0f19', 0.034]} />
      <hemisphereLight args={['#2c3a58', '#08080b', 0.22]} />
      <directionalLight position={[-30, 40, -20]} color="#8ea6d8" intensity={0.18} />
      {/* Real night-street HDRI (Poly Haven, CC0), used only for lighting and reflections. */}
      <Environment files="/assets/hdri/night.hdr" environmentIntensity={0.28} />
      <Rain count={quality === 'high' ? 12000 : 4000} />
      <Splashes count={quality === 'high' ? 260 : 90} />
    </>
  );
}

const SPLASH_VERT = /* glsl */ `
uniform float uTime;
uniform vec3 uCenter;
uniform vec4 uMask;
attribute vec3 aSeed;
varying vec2 vUv;
varying float vLife;
void main() {
  float cycle = 0.55 + aSeed.z * 0.4;
  float t = uTime / cycle + aSeed.x * 10.0;
  float epoch = floor(t);
  vLife = fract(t);
  // New random spot each cycle, inside a 14 m square around the camera.
  vec2 h = fract(sin(vec2(epoch * 12.9898 + aSeed.x * 78.233, epoch * 39.346 + aSeed.y * 11.135)) * 43758.5453);
  vec3 c = vec3(uCenter.x + (h.x - 0.5) * 14.0, 0.0, uCenter.z + (h.y - 0.5) * 14.0);
  c.y = abs(c.z) < 3.95 ? 0.012 : 0.162;
  bool inside = c.x > uMask.x && c.x < uMask.y && c.z > uMask.z && c.z < uMask.w;
  float size = (0.04 + vLife * 0.14) * (inside ? 0.0 : 1.0);
  vec3 p = c + vec3(position.x, 0.0, position.y) * size;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const SPLASH_FRAG = /* glsl */ `
varying vec2 vUv;
varying float vLife;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float ring = smoothstep(0.7, 0.85, d) * (1.0 - smoothstep(0.85, 1.0, d));
  float a = ring * (1.0 - vLife) * 0.35;
  if (a < 0.003) discard;
  gl_FragColor = vec4(0.75, 0.8, 0.9, a);
}
`;

/** Expanding ripple rings where raindrops hit the ground near the camera. */
function Splashes({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) seeds[i] = rand();
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 3));
    g.instanceCount = count;
    const [x0, x1, z0, z1] = HALVORSEN;
    const m = new THREE.ShaderMaterial({
      vertexShader: SPLASH_VERT,
      fragmentShader: SPLASH_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uMask: { value: new THREE.Vector4(x0 - 0.3, x1 + 0.3, z0, z1) } },
    });
    return { geometry: g, material: m };
  }, [count]);
  useFrame(({ camera, clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uCenter.value.copy(camera.position);
  });
  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
