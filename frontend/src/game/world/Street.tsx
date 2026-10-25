import { useFrame } from '@react-three/fiber';
import { CuboidCollider } from '@react-three/rapier';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';
import { ipos } from '../interaction/interactables';
import { glow, M } from './materials';
import { Block, Prop, type Box6 } from './primitives';
import { FacadeWindows, type FacadeSpec } from './FacadeWindows';
import { LampPost, StreetProps } from './Props';
import { textTexture } from './textures';

const FACADES: FacadeSpec[] = [
  { face: 'south', at: 8, from: -60, to: -12, y0: 4.9, y1: 13.4 },
  { face: 'south', at: 8, from: 10, to: 80, y0: 4.9, y1: 21.4 },
  { face: 'south', at: 8, from: -12, to: 10, y0: 4.9, y1: 19.6 },
  { face: 'north', at: -8, from: -60, to: -14, y0: 4.9, y1: 15.4 },
  { face: 'north', at: -8, from: -14, to: 2, y0: 4.9, y1: 8.6 },
  { face: 'north', at: -8, from: 6, to: 80, y0: 4.9, y1: 17.4 },
  { face: 'east', at: 2, from: -26, to: -8, y0: 4.9, y1: 8.6, spacing: 3.6 },
  { face: 'west', at: 6, from: -26, to: -8, y0: 4.9, y1: 17.4, spacing: 3.6 },
  { face: 'east', at: -60, from: -10, to: 10, y0: 4.9, y1: 19.4 },
];

const GROUND_H = 4.2;

interface BuildingProps {
  b: [number, number, number, number];
  h: number;
  ground: THREE.Material;
  upper: THREE.Material;
}

/** A city block: a textured ground floor, lit windows above, and a cornice. */
export function Building({ b, h, ground, upper }: BuildingProps) {
  const [x0, x1, z0, z1] = b;
  return (
    <>
      <Block b={[x0, x1, 0, GROUND_H, z0, z1]} material={ground} collide={false} />
      <Block b={[x0, x1, GROUND_H, h, z0, z1]} material={upper} collide={false} />
      <Block b={[x0 - 0.15, x1 + 0.15, h, h + 0.35, z0 - 0.15, z1 + 0.15]} material={M.trim()} collide={false} />
      <Block b={[x0 - 0.08, x1 + 0.08, GROUND_H, GROUND_H + 0.25, z0 - 0.08, z1 + 0.08]} material={M.stone()} collide={false} />
      <CuboidCollider args={[(x1 - x0) / 2, h / 2, (z1 - z0) / 2]} position={[(x0 + x1) / 2, h / 2, (z0 + z1) / 2]} />
    </>
  );
}

/** A flat textured sign. `facing` is the direction the sign faces. */
export function Sign({
  texture,
  position,
  size,
  facing = 'south',
  intensity = 1,
  color = '#ffffff',
  basic = true,
}: {
  texture: THREE.Texture;
  position: [number, number, number];
  size: [number, number];
  facing?: 'north' | 'south' | 'east' | 'west';
  intensity?: number;
  color?: string;
  basic?: boolean;
}) {
  const rot = { north: 0, south: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 }[facing];
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(intensity), [color, intensity]);
  return (
    <mesh position={position} rotation={[0, rot, 0]}>
      <planeGeometry args={size} />
      {basic ? (
        <meshBasicMaterial map={texture} color={c} transparent toneMapped={false} depthWrite={false} />
      ) : (
        <meshStandardMaterial map={texture} transparent roughness={0.6} />
      )}
    </mesh>
  );
}

const coneMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  uniforms: { uColor: { value: new THREE.Color('#ffcf94') }, uIntensity: { value: 0.16 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vN = normalize(mat3(modelMatrix) * normal);
      vV = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor; uniform float uIntensity;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() {
      float edge = pow(abs(dot(vN, vV)), 2.0);
      float fall = pow(vUv.y, 1.6);
      gl_FragColor = vec4(uColor * edge * fall * uIntensity, 1.0);
    }`,
});

/** Soft volumetric-looking cone of light through the rain. */
function LightCone({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} material={coneMaterial} renderOrder={2}>
      <coneGeometry args={[2.3, 5.2, 32, 1, true]} />
    </mesh>
  );
}

function StreetLamp({ x, z, side, light }: { x: number; z: number; side: 1 | -1; light: boolean }) {
  const quality = useGame((s) => s.settings.quality);
  const shadow = light && quality === 'high' && (x === 4 || x === -10);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(x, 0, z - side * 0.8);
    return o;
  }, [x, z, side]);
  return (
    <group>
      <LampPost x={x} z={z} />
      <mesh position={[x, 4.42, z]} material={glow('#ffd9a0', 3)}>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>
      {light && (
        <>
          <LightCone position={[x, 2.15, z]} />
          <primitive object={target} />
          <spotLight
            position={[x, 4.35, z]}
            target={target}
            color="#ffcf94"
            intensity={42}
            distance={20}
            angle={0.95}
            penumbra={0.7}
            decay={1.6}
            castShadow={shadow}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
          />
        </>
      )}
    </group>
  );
}

function FlickerLight({ position, color, intensity, distance }: { position: [number, number, number]; color: string; intensity: number; distance: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const off = Math.sin(t * 13) > 0.92 || (t % 7 > 6.6 && Math.sin(t * 40) > 0);
    ref.current.intensity = off ? intensity * 0.1 : intensity;
  });
  return <pointLight ref={ref} position={position} color={color} intensity={intensity} distance={distance} decay={1.8} />;
}

export { FlickerLight };

function Barricade() {
  const notice = textTexture('barricade', '', {
    width: 1024,
    height: 512,
    background: '#e9e4d8',
    lines: [
      { text: 'HARBOR BRIDGE', font: '800 120px "IBM Plex Sans", sans-serif', color: '#151515' },
      { text: 'CLOSED', font: '800 150px "IBM Plex Sans", sans-serif', color: '#a0161f' },
      { text: 'STRUCTURAL INSPECTION — GPD', font: '600 60px "IBM Plex Sans", sans-serif', color: '#333' },
    ],
  });
  const amber = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (amber.current) amber.current.visible = Math.sin(clock.elapsedTime * 4) > 0;
  });
  return (
    <group>
      <mesh ref={amber} position={[45.2, 0.95, 1.7]} material={glow('#ffae2a', 6)}>
        <sphereGeometry args={[0.07, 10, 10]} />
      </mesh>
      <Prop size={[0.06, 1.0, 1.9]} position={[43.9, 1.6, 0]} material={M.darkMetal()} />
      <mesh position={[43.85, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.8, 0.9]} />
        <meshStandardMaterial map={notice} roughness={0.7} />
      </mesh>
      {[-4.6, -3.6, 3.7, 4.6].map((z) => (
        <mesh key={z} position={[43.4, 0.35, z]} material={glow('#ff6a1a', 0.7)}>
          <coneGeometry args={[0.2, 0.7, 12]} />
        </mesh>
      ))}
    </group>
  );
}

function BusShelter() {
  const [px, , pz] = ipos('busstop');
  const poster = textTexture('meridian-poster', '', {
    width: 512,
    height: 1024,
    background: '#0f1a2a',
    lines: [
      { text: 'MERIDIAN', font: '700 92px "IBM Plex Sans", sans-serif', color: '#e8eef8' },
      { text: 'SECURITY', font: '300 70px "IBM Plex Sans", sans-serif', color: '#8fb0d8' },
      { text: '', font: '20px sans-serif' },
      { text: 'Because the truth', font: 'italic 46px "Playfair Display", serif', color: '#d8e0ea' },
      { text: 'needs protecting.', font: 'italic 46px "Playfair Display", serif', color: '#d8e0ea' },
      { text: 'editing', font: 'italic 700 64px "IBM Plex Sans", sans-serif', color: '#c8303f' },
    ],
  });
  return (
    <group>
      <Prop size={[3.2, 0.08, 1.5]} position={[px, 2.6, pz - 0.5]} material={M.darkMetal()} />
      <Prop size={[3.2, 2.3, 0.04]} position={[px, 1.4, pz - 1.15]} material={M.glass()} />
      <Prop size={[0.08, 2.5, 0.08]} position={[px - 1.55, 1.35, pz - 1.15]} material={M.darkMetal()} />
      <Prop size={[0.08, 2.5, 0.08]} position={[px + 1.55, 1.35, pz - 1.15]} material={M.darkMetal()} />
      <Prop size={[0.08, 2.5, 0.08]} position={[px - 1.55, 1.35, pz + 0.15]} material={M.darkMetal()} />
      <Prop size={[2.2, 0.08, 0.45]} position={[px + 0.3, 0.6, pz - 0.85]} material={M.wood()} />
      <Prop size={[0.1, 2.2, 1.2]} position={[px - 1.55, 1.4, pz - 0.5]} material={M.darkMetal()} />
      <mesh position={[px - 1.49, 1.45, pz - 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.0, 1.9]} />
        <meshBasicMaterial map={poster} color={new THREE.Color(1.3, 1.3, 1.3)} toneMapped={false} />
      </mesh>
      <CuboidCollider args={[1.6, 1.2, 0.08]} position={[px, 1.35, pz - 1.15]} />
      <CuboidCollider args={[0.08, 1.2, 0.65]} position={[px - 1.55, 1.35, pz - 0.5]} />
    </group>
  );
}

function StreetFurniture() {
  const [nx, , nz] = ipos('newsbox');
  return (
    <group>
      {/* Newspaper box */}
      <Prop size={[0.5, 1.0, 0.45]} position={[nx, 0.65, nz + 0.2]} material={M.hydrant()} />
      <Prop size={[0.42, 0.3, 0.02]} position={[nx, 0.95, nz - 0.03]} material={M.paper()} />
      <CuboidCollider args={[0.25, 0.5, 0.23]} position={[nx, 0.65, nz + 0.2]} />
      {/* Hydrant */}
      <CuboidCollider args={[0.18, 0.35, 0.18]} position={[-14, 0.5, 4.6]} />
      {/* Trash bins */}
      {[[8.5, 7.3], [-30, -7.4], [18, -7.3]].map(([x, z]) => (
        <group key={`${x}-${z}`}>
          <CuboidCollider args={[0.3, 0.45, 0.3]} position={[x, 0.6, z]} />
        </group>
      ))}
    </group>
  );
}

function RoadMarkings() {
  const dashes = useMemo(() => {
    const out: number[] = [];
    for (let x = -58; x < 78; x += 5) if (x < -1 || x > 6) out.push(x);
    return out;
  }, []);
  const lineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a89a6a', roughness: 0.5 }), []);
  const zebraMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#bdbdb5', roughness: 0.45 }), []);
  return (
    <group>
      {dashes.map((x) => (
        <mesh key={x} position={[x, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lineMat}>
          <planeGeometry args={[2.4, 0.12]} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => -3.3 + i * 1.1).map((z) => (
        <mesh key={z} position={[2.5, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]} material={zebraMat}>
          <planeGeometry args={[3.2, 0.55]} />
        </mesh>
      ))}
    </group>
  );
}

export function Street() {
  const hotel = textTexture('hotel', '', {
    width: 256,
    height: 1024,
    glow: '#7fe7e0',
    glowBlur: 26,
    lines: 'ARGENT'.split('').map((ch) => ({ text: ch, font: '700 130px "Playfair Display", serif', color: '#d8fffb' })),
  });
  const laundry = textTexture('laundry', 'LAUNDRY · 24H', {
    glow: '#3ad7ff',
    glowBlur: 30,
    color: '#c8f6ff',
    font: '600 120px "IBM Plex Sans", sans-serif',
  });
  const pawn = textTexture('pawn', 'KESSLER & SONS · PAWN', {
    width: 1536,
    glow: '#4d7bff',
    glowBlur: 28,
    color: '#cfdcff',
    font: '600 110px "IBM Plex Sans", sans-serif',
  });
  const meridian = textTexture('meridian', 'MERIDIAN SECURITY', {
    width: 1536,
    background: '#15181d',
    color: '#c9ced6',
    font: '600 120px "IBM Plex Sans", sans-serif',
  });
  const graffiti = textTexture('graffiti', 'WHO EDITS THE EDITORS?', {
    width: 1536,
    color: '#b3283a',
    font: 'italic 700 130px "IBM Plex Sans", sans-serif',
  });

  const pawnRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = pawnRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (m) m.opacity = Math.sin(clock.elapsedTime * 9) > 0.97 ? 0.25 : 1;
  });

  const ground: Box6[] = [
    [-60, 80, -0.5, 0, -4, 4],
  ];

  return (
    <group>
      {/* Ground */}
      {ground.map((b, i) => <Block key={i} b={b} material={M.asphalt()} />)}
      <Block b={[-60, 80, -0.5, 0.15, 4, 8]} material={M.sidewalk()} />
      <Block b={[-60, 80, -0.5, 0.15, -8, -4]} material={M.sidewalk()} />
      <Block b={[2, 6, -0.5, 0.15, -26, -8]} material={M.sidewalk()} />
      <Block b={[-60, 80, 0, 0.16, 3.95, 4.08]} material={M.curb()} collide={false} />
      <Block b={[-60, 80, 0, 0.16, -4.08, -3.95]} material={M.curb()} collide={false} />
      <RoadMarkings />
      {/* Invisible chamfers so the 15 cm curbs can be walked up at any speed. */}
      <CuboidCollider args={[70, 0.05, 0.261]} position={[10, 0.027, 3.864]} rotation={[-0.2915, 0, 0]} />
      <CuboidCollider args={[70, 0.05, 0.261]} position={[10, 0.027, -3.864]} rotation={[0.2915, 0, 0]} />

      {/* City blocks */}
      <Building b={[-60, -12, 8, 30]} h={14} ground={M.brickGrey()} upper={M.brickBrown()} />
      <Building b={[10, 80, 8, 30]} h={22} ground={M.brickBrown()} upper={M.brickGrey()} />
      <Building b={[-60, -14, -30, -8]} h={16} ground={M.brickBrown()} upper={M.brick()} />
      <Building b={[-14, 2, -30, -8]} h={9} ground={M.brickBrown()} upper={M.brickBrown()} />
      <Building b={[6, 80, -30, -8]} h={18} ground={M.brickBrown()} upper={M.brickGrey()} />
      <Building b={[2, 6, -30, -26]} h={9} ground={M.brick()} upper={M.brick()} />
      <Building b={[-75, -60, -30, 30]} h={20} ground={M.brickGrey()} upper={M.brickGrey()} />
      <FacadeWindows specs={FACADES} />

      {/* Hotel Argent vertical sign and entrance */}
      <Prop size={[0.25, 6.4, 0.9]} position={[-22, 8.6, 7.4]} material={M.trim()} />
      <Sign texture={hotel} position={[-21.86, 8.6, 7.4]} size={[0.8, 6.0]} facing="east" intensity={2.2} />
      <Sign texture={hotel} position={[-22.14, 8.6, 7.4]} size={[0.8, 6.0]} facing="west" intensity={2.2} />
      <Block b={[-33, -27, 0.15, 3.0, 7.94, 8.0]} material={M.glass()} collide={false} />
      <Block b={[-33.2, -26.8, 3.0, 3.25, 7.6, 8.0]} material={M.brass()} collide={false} />

      {/* Meridian Security shutters */}
      <Block b={[14, 26, 0.15, 3.4, 7.94, 8.0]} material={M.shutter()} collide={false} />
      <Block b={[30, 40, 0.15, 3.4, 7.94, 8.0]} material={M.shutter()} collide={false} />
      <Sign texture={meridian} position={[20, 3.8, 7.93]} size={[5, 0.6]} facing="south" basic={false} />

      {/* Laundromat */}
      <mesh position={[-21, 1.9, -7.95]} material={glow('#7fb8c8', 0.45)}>
        <planeGeometry args={[7, 2.6]} />
      </mesh>
      <Block b={[-24.6, -17.4, 0.6, 3.25, -7.96, -7.9]} material={M.glass()} collide={false} />
      <Sign texture={laundry} position={[-21, 3.65, -7.9]} size={[4, 1]} facing="north" intensity={2.4} />
      <pointLight position={[-21, 2.2, -6.5]} color="#7fd6f0" intensity={6} distance={9} decay={1.6} />

      {/* Kessler Pawn */}
      <Block b={[10, 22, 0.15, 3.4, -8.0, -7.94]} material={M.shutter()} collide={false} />
      <mesh ref={pawnRef} position={[16, 3.85, -7.9]}>
        <planeGeometry args={[6, 1]} />
        <meshBasicMaterial map={pawn} color={new THREE.Color(2, 2, 2)} transparent toneMapped={false} depthWrite={false} />
      </mesh>

      {/* Alley end wall graffiti */}
      <Sign texture={graffiti} position={[4, 2.0, -25.97]} size={[3.8, 0.6]} facing="north" basic={false} />

      {/* Street lamps: the first five cast light, the far ones are emissive only. */}
      <StreetLamp x={-22} z={4.5} side={1} light />
      <StreetLamp x={4} z={4.5} side={1} light />
      <StreetLamp x={26} z={4.5} side={1} light />
      <StreetLamp x={-10} z={-4.5} side={-1} light />
      <StreetLamp x={14} z={-4.5} side={-1} light />
      <StreetLamp x={-40} z={-4.5} side={-1} light={false} />
      <StreetLamp x={44} z={-4.5} side={-1} light={false} />
      <StreetLamp x={58} z={4.5} side={1} light={false} />
      <StreetLamp x={72} z={-4.5} side={-1} light={false} />

      {/* Covered cars (models in StreetProps) */}
      <CuboidCollider args={[2.2, 0.7, 0.9]} position={[ipos('sedan')[0], 0.7, 2.4]} />
      <CuboidCollider args={[2.2, 0.7, 0.9]} position={[12, 0.7, -2.5]} />
      <CuboidCollider args={[2.2, 0.7, 0.9]} position={[-38, 0.7, 2.6]} />
      <StreetProps />

      <BusShelter />
      <StreetFurniture />
      <Barricade />

      {/* Invisible boundaries */}
      <CuboidCollider args={[0.5, 4, 8]} position={[46.5, 4, 0]} />
      <CuboidCollider args={[0.5, 4, 8]} position={[-52, 4, 0]} />
      <group position={[-51.5, 0, 0]} rotation={[0, Math.PI, 0]}>
        {[-2.6, 0, 2.6].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <Prop size={[0.12, 0.25, 2.2]} position={[0, 0.95, 0]} material={M.stripes()} />
            <Prop size={[0.08, 1.1, 0.08]} position={[0, 0.55, -1]} material={M.darkMetal()} />
            <Prop size={[0.08, 1.1, 0.08]} position={[0, 0.55, 1]} material={M.darkMetal()} />
          </group>
        ))}
      </group>
    </group>
  );
}
