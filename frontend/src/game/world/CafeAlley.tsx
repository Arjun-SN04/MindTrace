import { useFrame } from '@react-three/fiber';
import { CuboidCollider } from '@react-three/rapier';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';
import { ipos } from '../interaction/interactables';
import { glow, M } from './materials';
import { Block, Prop } from './primitives';
import { FlickerLight, Sign } from './Street';
import { rand, textTexture } from './textures';

function cafeInteriorTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#3a2014');
  bg.addColorStop(0.6, '#6a3a1e');
  bg.addColorStop(1, '#24140c');
  g.fillStyle = bg;
  g.fillRect(0, 0, 1024, 256);
  // Back shelves with bottles.
  g.fillStyle = 'rgba(20,10,5,0.7)';
  for (let y = 40; y < 140; y += 34) g.fillRect(0, y, 1024, 5);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `hsla(${20 + rand() * 30},50%,${25 + rand() * 30}%,0.8)`;
    const x = rand() * 1024, y = 40 + Math.floor(rand() * 3) * 34;
    g.fillRect(x, y - 22, 8, 22);
  }
  // Pendant lamps.
  for (let x = 90; x < 1024; x += 170) {
    const r = g.createRadialGradient(x, 30, 0, x, 30, 70);
    r.addColorStop(0, 'rgba(255,214,150,1)');
    r.addColorStop(1, 'rgba(255,180,100,0)');
    g.fillStyle = r;
    g.fillRect(x - 70, 0, 140, 110);
  }
  // Tables and stools in silhouette.
  g.fillStyle = '#120a06';
  for (let x = 60; x < 1024; x += 150) {
    g.fillRect(x, 190, 90, 8);
    g.fillRect(x + 40, 198, 10, 58);
    g.fillRect(x - 20, 210, 20, 6);
    g.fillRect(x + 110, 210, 20, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Cafe() {
  const interior = useMemo(() => cafeInteriorTexture(), []);
  const neon = textTexture('noctua', 'NOCTUA', {
    glow: '#ff2a4a',
    glowBlur: 40,
    color: '#ffd0d6',
    font: 'italic 600 170px "Playfair Display", serif',
  });
  const sub = textTexture('noctua-sub', 'café · open late', {
    width: 1024,
    height: 128,
    glow: '#ff6a7d',
    glowBlur: 20,
    color: '#ffd8dc',
    font: '500 70px "IBM Plex Sans", sans-serif',
  });
  const closed = textTexture('closed', 'CLOSED', { width: 256, height: 96, background: '#efe8d8', color: '#7a1620', font: '700 60px "IBM Plex Sans", sans-serif' });
  const board = textTexture('chalk', '', {
    width: 256,
    height: 384,
    background: '#1d2420',
    lines: [
      { text: 'TONIGHT', font: '700 40px "IBM Plex Sans", sans-serif', color: '#e8e4d8' },
      { text: 'the Night', font: 'italic 34px "Playfair Display", serif', color: '#d8d4c8' },
      { text: 'Shift', font: 'italic 34px "Playfair Display", serif', color: '#d8d4c8' },
      { text: '— 3 shots —', font: '26px "IBM Plex Mono", monospace', color: '#c8b48a' },
    ],
  });
  const neonRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = neonRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (!m) return;
    const t = clock.elapsedTime;
    m.opacity = t % 11 > 10.7 && Math.sin(t * 60) > 0 ? 0.35 : 1;
  });
  const [tx, , tz] = ipos('cafe_menu');

  return (
    <group>
      {/* Shopfront frame */}
      <Block b={[-14, 2, 0.15, 0.7, -8, -7.85]} material={M.darkWood()} collide={false} />
      <Block b={[-14, -12.5, 0.15, 4.2, -8, -7.85]} material={M.darkWood()} collide={false} />
      <Block b={[-3, 2, 0.15, 4.2, -8, -7.85]} material={M.darkWood()} collide={false} />
      <Block b={[-14, 2, 3.2, 4.2, -8, -7.85]} material={M.darkWood()} collide={false} />
      {/* Interior backdrop seen through the window */}
      <mesh position={[-7.75, 1.95, -7.99]}>
        <planeGeometry args={[9.5, 2.5]} />
        <meshBasicMaterial map={interior} color={new THREE.Color(1.15, 1.1, 1.0)} toneMapped={false} />
      </mesh>
      <Block b={[-12.5, -3, 0.7, 3.2, -7.9, -7.87]} material={M.glass()} collide={false} />
      {[-10.1, -7.75, -5.4].map((x) => (
        <Block key={x} b={[x - 0.04, x + 0.04, 0.7, 3.2, -7.9, -7.84]} material={M.darkWood()} collide={false} />
      ))}
      {/* Door */}
      <Block b={[-2.0, -0.6, 0.15, 2.6, -7.86, -7.8]} material={M.darkWood()} collide={false} />
      <Block b={[-1.8, -0.8, 1.2, 2.4, -7.8, -7.78]} material={M.glass()} collide={false} />
      <Sign texture={closed} position={[-1.3, 1.6, -7.77]} size={[0.4, 0.15]} facing="north" basic={false} />
      <mesh position={[-0.75, 1.2, -7.75]} material={M.brass()}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>
      {/* Awning */}
      <mesh position={[-7.75, 3.15, -7.2]} rotation={[0.42, 0, 0]} material={M.fabricRed()} castShadow>
        <boxGeometry args={[10.2, 0.05, 1.7]} />
      </mesh>
      <mesh position={[-7.75, 2.82, -6.42]} material={M.fabricRed()}>
        <boxGeometry args={[10.2, 0.25, 0.04]} />
      </mesh>
      {/* Neon sign */}
      <mesh ref={neonRef} position={[-7.75, 3.82, -7.78]}>
        <planeGeometry args={[3.6, 0.9]} />
        <meshBasicMaterial map={neon} color={new THREE.Color(2.6, 2.6, 2.6)} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <Sign texture={sub} position={[-0.6, 3.55, -7.78]} size={[2.0, 0.25]} facing="north" intensity={1.8} />
      <pointLight position={[-7.75, 3.9, -6.6]} color="#ff2a4a" intensity={10} distance={13} decay={1.6} />
      <pointLight position={[-7.75, 1.9, -6.8]} color="#ffb36b" intensity={6} distance={9} decay={1.7} />

      {/* Outdoor table, chairs and chalkboard */}
      <mesh position={[tx, 0.88, tz]} material={M.darkMetal()}>
        <cylinderGeometry args={[0.38, 0.38, 0.03, 18]} />
      </mesh>
      <mesh position={[tx, 0.52, tz]} material={M.darkMetal()}>
        <cylinderGeometry args={[0.03, 0.03, 0.72, 8]} />
      </mesh>
      <Prop size={[0.2, 0.01, 0.28]} position={[tx + 0.08, 0.9, tz]} rotation={[0, 0.4, 0]} material={M.paper()} />
      {[-0.65, 0.65].map((dx) => (
        <group key={dx} position={[tx + dx, 0.15, tz]}>
          <Prop size={[0.4, 0.04, 0.4]} position={[0, 0.45, 0]} material={M.darkMetal()} />
          <Prop size={[0.04, 0.45, 0.4]} position={[dx > 0 ? 0.2 : -0.2, 0.68, 0]} material={M.darkMetal()} />
          <Prop size={[0.03, 0.45, 0.03]} position={[0, 0.22, 0]} material={M.darkMetal()} />
        </group>
      ))}
      <CuboidCollider args={[1.0, 0.4, 0.4]} position={[tx, 0.55, tz]} />
      <group position={[-3.6, 0.15, -6.6]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.5, 0.12]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.55, 0.85]} />
          <meshStandardMaterial map={board} roughness={0.9} />
        </mesh>
        <Prop size={[0.6, 0.9, 0.04]} position={[0, 0.5, 0.1]} rotation={[-0.2, 0, 0]} material={M.darkWood()} />
        <Prop size={[0.6, 0.9, 0.04]} position={[0, 0.5, -0.1]} rotation={[0.2, 0, 0]} material={M.darkWood()} />
      </group>
      <CuboidCollider args={[0.32, 0.45, 0.2]} position={[-3.6, 0.6, -6.6]} />
    </group>
  );
}

function Steam({ position, count = 14, spread = 0.5 }: { position: [number, number, number]; count?: number; spread?: number }) {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ offset: i / count, x: (rand() - 0.5) * spread, z: (rand() - 0.5) * spread })), [count, spread]);
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture((() => {
          const c = document.createElement('canvas');
          c.width = c.height = 64;
          const g = c.getContext('2d')!;
          const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
          r.addColorStop(0, 'rgba(170,185,205,0.35)');
          r.addColorStop(1, 'rgba(200,210,225,0)');
          g.fillStyle = r;
          g.fillRect(0, 0, 64, 64);
          return c;
        })()),
        transparent: true,
        depthWrite: false,
        opacity: 0.3,
      }),
    [],
  );
  const mats = useMemo(() => seeds.map(() => mat.clone()), [seeds, mat]);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime * 0.25;
    g.children.forEach((child, i) => {
      const s = seeds[i];
      const life = (t + s.offset) % 1;
      child.position.set(s.x + Math.sin(life * 6 + i) * 0.2, 0.2 + life * 2.6, s.z);
      const scale = 0.4 + life * 1.4;
      child.scale.set(scale, scale, scale);
      ((child as THREE.Sprite).material as THREE.SpriteMaterial).opacity = Math.sin(life * Math.PI) * 0.07;
    });
  });
  return (
    <group ref={group} position={position}>
      {mats.map((m, i) => (
        <sprite key={i} material={m} />
      ))}
    </group>
  );
}

export { Steam };

/** Lumpy, slightly knotted bin bag. */
const bagCache = new Map<string, THREE.BufferGeometry>();
function bagGeometry(r: number, seed: number) {
  const key = `${r}-${seed}`;
  let g = bagCache.get(key);
  if (g) return g;
  g = new THREE.SphereGeometry(r, 28, 20);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 17 + seed) * Math.sin(v.y * 13 + seed * 2) * Math.sin(v.z * 19) * 0.12 + Math.sin(v.x * 41 + v.z * 37) * 0.025;
    v.multiplyScalar(1 + n);
    if (v.y < -r * 0.55) v.y = -r * 0.55; // flattened where it sits
    if (v.y > r * 0.8) { v.x *= 0.5; v.z *= 0.5; } // tied neck
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  bagCache.set(key, g);
  return g;
}

function Alley() {
  const phoneFound = useGame((s) => !!s.discovered.clue_discarded_phone);
  const [px, , pz] = ipos('burner_phone');
  const phoneGlow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (phoneGlow.current) phoneGlow.current.visible = Math.sin(clock.elapsedTime * 2.2) > -0.2;
  });
  return (
    <group>
      {/* Dumpster */}
      <Block b={[4.8, 5.85, 0.15, 1.35, -19.4, -17.6]} material={M.dumpster()} castShadow />
      <mesh position={[5.3, 1.42, -18.5]} rotation={[0, 0, -0.12]} material={M.darkMetal()}>
        <boxGeometry args={[1.15, 0.05, 1.9]} />
      </mesh>
      {/* Trash bags */}
      {[[2.6, -16.2, 0.4], [2.9, -15.5, 0.33], [5.4, -21.4, 0.38], [2.5, -22.5, 0.35]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.15 + r * 0.62, z]} rotation={[0, i * 1.7, 0]} scale={[1, 0.72, 1.1]} geometry={bagGeometry(r, i)} material={M.trashBag()} castShadow />
      ))}
      <CuboidCollider args={[0.45, 0.35, 0.8]} position={[2.7, 0.45, -15.8]} />
      {/* Pallets */}
      <Prop size={[1.2, 0.15, 1.0]} position={[2.7, 0.75, -24.5]} rotation={[0, 0, 1.3]} material={M.wood()} />
      {/* Back door and lamp on the café wall */}
      <Block b={[1.95, 2.02, 0.15, 2.4, -13.6, -12.6]} material={M.darkMetal()} collide={false} />
      <mesh position={[2.15, 2.73, -13.1]} rotation={[-Math.PI / 2, 0, 0]} material={glow('#d4f0de', 3)}>
        <planeGeometry args={[0.2, 0.2]} />
      </mesh>
      <FlickerLight position={[2.6, 2.6, -13.1]} color="#cfe8d8" intensity={7} distance={11} />
      {/* Fire escape */}
      {[4.8, 7.4].map((y) => (
        <group key={y}>
          <Prop size={[1.0, 0.05, 3.2]} position={[2.5, y, -17]} material={M.darkMetal()} />
          <Prop size={[0.03, 0.9, 3.2]} position={[3.0, y + 0.45, -17]} material={M.darkMetal()} />
        </group>
      ))}
      <mesh position={[2.8, 6.1, -15.8]} rotation={[0.6, 0, 0]} material={M.darkMetal()}>
        <boxGeometry args={[0.5, 0.04, 3.0]} />
      </mesh>
      {/* Pipes */}
      <mesh position={[5.93, 4.5, -11]} material={M.darkMetal()}>
        <cylinderGeometry args={[0.06, 0.06, 9, 8]} />
      </mesh>
      {/* The burner phone */}
      {!phoneFound && (
        <group position={[px, 0.16, pz]} rotation={[0, 0.7, 0]}>
          <Prop size={[0.07, 0.012, 0.14]} position={[0, 0, 0]} material={M.black()} />
          <mesh ref={phoneGlow} position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glow('#7fb4ff', 1.6)}>
            <planeGeometry args={[0.055, 0.11]} />
          </mesh>
        </group>
      )}
      {/* Puddle */}
      <mesh position={[4.1, 0.155, -17.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 24]} />
        <meshStandardMaterial color="#0b0d12" roughness={0.02} metalness={0.4} />
      </mesh>
    </group>
  );
}

export function CafeAlley() {
  return (
    <>
      <Cafe />
      <Alley />
      <Steam position={[-6, 0, 0.8]} />
      <Steam position={[3.2, 0.15, -20.5]} count={10} spread={0.3} />
    </>
  );
}
