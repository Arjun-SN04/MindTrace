import { CuboidCollider } from '@react-three/rapier';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';
import { ipos } from '../interaction/interactables';
import { CEIL_Y, FLOOR_Y as F } from './layout';
import { glow, M } from './materials';
import { Block, Prop } from './primitives';
import { InteriorProps } from './Props';
import { Sign } from './Street';
import { rand, textTexture } from './textures';

const C = CEIL_Y;
const DOOR_TOP = F + 2.3;

/** Exterior facade segment: brick outside, plaster inside. */
function FacadeSeg({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  return (
    <>
      <Block b={[x0, x1, y0, y1, 8, 8.15]} material={M.brick()} />
      <Block b={[x0, x1, y0, y1, 8.15, 8.3]} material={M.plasterWarm()} collide={false} />
    </>
  );
}

function Window({ x0, x1 }: { x0: number; x1: number }) {
  const y0 = 1.7, y1 = 3.2;
  return (
    <>
      <FacadeSeg x0={x0} x1={x1} y0={F} y1={y0} />
      <FacadeSeg x0={x0} x1={x1} y0={y1} y1={C} />
      <Block b={[x0, x1, y0, y1, 8.12, 8.16]} material={M.glass()} />
      <Block b={[x0 - 0.05, x1 + 0.05, y0 - 0.08, y0 + 0.012, 7.9, 8.35]} material={M.stone()} collide={false} />
      <Block b={[(x0 + x1) / 2 - 0.03, (x0 + x1) / 2 + 0.03, y0, y1, 8.08, 8.2]} material={M.trim()} collide={false} />
      <Block b={[x0, x1, (y0 + y1) / 2 - 0.03, (y0 + y1) / 2 + 0.03, 8.08, 8.2]} material={M.trim()} collide={false} />
    </>
  );
}

function Books() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 64;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const colors = ['#5a2a2a', '#2a3a5a', '#3a4a3a', '#6a5a3a', '#2a2a2a', '#4a3a5a', '#7a6a5a'];
    let i = 0;
    for (let shelf = 0; shelf < 4; shelf++) {
      let x = -9.9;
      while (x < -8.55 && i < count) {
        const w = 0.03 + rand() * 0.04;
        const h = 0.22 + rand() * 0.1;
        o.position.set(x + w / 2, F + 0.3 + shelf * 0.45 + h / 2, 16.66);
        o.rotation.set(0, 0, rand() > 0.9 ? 0.2 : 0);
        o.scale.set(w, h, 0.2);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, new THREE.Color(colors[i % colors.length]));
        x += w + 0.005;
        i++;
      }
    }
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      <boxGeometry />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

function screen(key: string, lines: { text: string; color?: string; font?: string }[], bg: string) {
  return textTexture(key, '', { width: 512, height: 320, background: bg, align: 'left', lines });
}

function Laptop() {
  const unlocked = useGame((s) => !!s.discovered.clue_laptop_messages);
  const [x, , z] = ipos('laptop');
  const locked = screen(
    'laptop-locked',
    [
      { text: '' },
      { text: '  D. REED', font: '600 40px "IBM Plex Mono", monospace', color: '#cfe0ff' },
      { text: '  Enter passcode', font: '28px "IBM Plex Mono", monospace', color: '#7f93b0' },
      { text: '  • • • •', font: '34px "IBM Plex Mono", monospace', color: '#cfe0ff' },
      { text: '  hint: the day it started', font: 'italic 22px "IBM Plex Mono", monospace', color: '#5d6d85' },
    ],
    '#0b1424',
  );
  const open = screen(
    'laptop-open',
    [
      { text: ' MESSAGES (cache)', font: '600 28px "IBM Plex Mono", monospace', color: '#cfe0ff' },
      { text: ' 21:04 Maya: the numbers...', font: '22px "IBM Plex Mono", monospace', color: '#9fb2cc' },
      { text: ' 22:15 ???: Last warning.', font: '22px "IBM Plex Mono", monospace', color: '#e07a85' },
      { text: ' 23:09 draft: They changed', font: '22px "IBM Plex Mono", monospace', color: '#9fb2cc' },
      { text: ' DRIVE: NOT FOUND', font: '600 22px "IBM Plex Mono", monospace', color: '#e0a35a' },
    ],
    '#0b1424',
  );
  return (
    <group position={[x, F + 0.77, z + 0.05]}>
      <Prop size={[0.36, 0.02, 0.25]} position={[0, 0.01, 0]} material={M.darkMetal()} />
      <group position={[0, 0.02, 0.12]} rotation={[-0.25, 0, 0]}>
        <Prop size={[0.36, 0.24, 0.012]} position={[0, 0.12, 0]} material={M.darkMetal()} />
        <mesh position={[0, 0.12, -0.007]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.33, 0.21]} />
          <meshBasicMaterial map={unlocked ? open : locked} color={new THREE.Color(1.4, 1.4, 1.4)} toneMapped={false} />
        </mesh>
      </group>
      {/* The removed drive's screws */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.26 + i * 0.03, 0.005, -0.05]} material={M.metal()}>
          <cylinderGeometry args={[0.006, 0.006, 0.01, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function CctvTerminal() {
  const [x, , z] = ipos('cctv');
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    const g = c.getContext('2d')!;
    g.fillStyle = '#05080a';
    g.fillRect(0, 0, 512, 320);
    const cams = ['LOBBY', 'ENTRANCE', 'STAIR B', 'GARAGE'];
    cams.forEach((name, i) => {
      const x0 = (i % 2) * 256 + 6, y0 = Math.floor(i / 2) * 160 + 6;
      const grd = g.createLinearGradient(x0, y0, x0, y0 + 148);
      grd.addColorStop(0, '#2b3a33');
      grd.addColorStop(1, '#0f1714');
      g.fillStyle = grd;
      g.fillRect(x0, y0, 244, 148);
      for (let k = 0; k < 600; k++) {
        g.fillStyle = `rgba(200,255,220,${rand() * 0.08})`;
        g.fillRect(x0 + rand() * 244, y0 + rand() * 148, 2, 1);
      }
      g.fillStyle = '#9fe0b5';
      g.font = '16px "IBM Plex Mono", monospace';
      g.fillText(`CAM ${i + 1} ${name}`, x0 + 8, y0 + 20);
      if (i === 0) {
        g.fillStyle = '#e04a55';
        g.fillText('● REC GAP', x0 + 150, y0 + 20);
      }
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group position={[x, F + 1.1, z + 0.15]}>
      <Prop size={[0.6, 0.38, 0.05]} position={[0, 0.25, 0]} material={M.black()} />
      <mesh position={[0, 0.25, -0.03]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.55, 0.33]} />
        <meshBasicMaterial map={tex} color={new THREE.Color(1.5, 1.5, 1.5)} toneMapped={false} />
      </mesh>
      <Prop size={[0.08, 0.1, 0.08]} position={[0, 0.03, 0.02]} material={M.black()} />
      <Prop size={[0.45, 0.02, 0.16]} position={[0, 0.01, -0.22]} material={M.black()} />
    </group>
  );
}

function Corkboard() {
  const [, , pz] = ipos('photo');
  const x = -11.66;
  const papers: [number, number, number, number][] = [
    [0.55, 0.35, 0.22, 0.28], [-0.6, 0.3, 0.2, 0.15], [0.7, -0.25, 0.24, 0.18], [-0.45, -0.3, 0.18, 0.24], [0.1, 0.4, 0.2, 0.14],
  ];
  const photoTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 180;
    const g = c.getContext('2d')!;
    const grd = g.createLinearGradient(0, 0, 0, 180);
    grd.addColorStop(0, '#463a2e');
    grd.addColorStop(1, '#1b1612');
    g.fillStyle = '#e9e2d0';
    g.fillRect(0, 0, 256, 180);
    g.fillStyle = grd;
    g.fillRect(10, 10, 236, 140);
    // Three figures in the foreground, two small ones behind.
    const fig = (x: number, y: number, s: number, col: string) => {
      g.fillStyle = col;
      g.beginPath(); g.arc(x, y, 9 * s, 0, Math.PI * 2); g.fill();
      g.fillRect(x - 13 * s, y + 10 * s, 26 * s, 50 * s);
    };
    fig(190, 70, 0.5, '#5e5650');
    fig(205, 70, 0.5, '#6d665c');
    fig(70, 60, 1, '#c9b8a2');
    fig(128, 55, 1, '#d8c7b4');
    fig(186, 62, 1, '#b5a28c');
    g.strokeStyle = 'rgba(80,80,80,0.6)';
    g.beginPath(); g.ellipse(198, 78, 22, 18, 0, 0, Math.PI * 2); g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group>
      <Prop size={[0.04, 1.2, 2.0]} position={[x, F + 1.6, pz + 0.2]} material={M.cork()} />
      <Prop size={[0.05, 1.28, 2.08]} position={[x - 0.01, F + 1.6, pz + 0.2]} material={M.darkWood()} />
      {papers.map(([dz, dy, w, h], i) => (
        <mesh key={i} position={[x + 0.025, F + 1.6 + dy, pz + 0.2 + dz]} rotation={[0, Math.PI / 2, (i - 2) * 0.05]} material={M.paper()}>
          <planeGeometry args={[w, h]} />
        </mesh>
      ))}
      {/* The photograph */}
      <mesh position={[x + 0.03, F + 1.55, pz - 0.1]} rotation={[0, Math.PI / 2, 0.04]}>
        <planeGeometry args={[0.3, 0.21]} />
        <meshStandardMaterial map={photoTex} roughness={0.4} />
      </mesh>
      <mesh position={[x + 0.05, F + 1.65, pz - 0.1]} material={glow('#d8283a', 1)}>
        <sphereGeometry args={[0.012, 8, 8]} />
      </mesh>
      {/* Red string */}
      {[[[0.55, 0.35], [-0.1, 0.1]], [[-0.6, 0.3], [-0.1, 0.1]], [[0.7, -0.25], [-0.45, -0.3]]].map(([a, b], i) => {
        const az = pz + 0.2 + a[0], ay = F + 1.6 + a[1], bz = pz + 0.2 + b[0], by = F + 1.6 + b[1];
        const len = Math.hypot(bz - az, by - ay);
        return (
          <mesh key={i} position={[x + 0.035, (ay + by) / 2, (az + bz) / 2]} rotation={[-Math.atan2(by - ay, bz - az), 0, 0]} material={glow('#a01828', 0.8)}>
            <boxGeometry args={[0.004, 0.004, len]} />
          </mesh>
        );
      })}
    </group>
  );
}

const doorGlass = new THREE.MeshPhysicalMaterial({ color: '#2a3542', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45, envMapIntensity: 0.6 });

/** The building's front door, propped open against the inside wall of the lobby. */
function EntranceDoor() {
  const w = 0.88, h = 2.45, t = 0.05;
  return (
    <group position={[1.1, F, 8.36]} rotation={[0, 0.2, 0]}>
      {/* Solid wooden frame around a glass panel */}
      <Prop size={[w, 0.9, t]} position={[-w / 2, 0.45, 0]} material={M.darkWood()} />
      <Prop size={[w, 0.16, t]} position={[-w / 2, h - 0.08, 0]} material={M.darkWood()} />
      <Prop size={[0.12, h - 1.06, t]} position={[-0.06, 0.9 + (h - 1.06) / 2, 0]} material={M.darkWood()} />
      <Prop size={[0.12, h - 1.06, t]} position={[-w + 0.06, 0.9 + (h - 1.06) / 2, 0]} material={M.darkWood()} />
      <mesh position={[-w / 2, 0.9 + (h - 1.06) / 2, 0]} material={doorGlass} renderOrder={1}>
        <boxGeometry args={[w - 0.24, h - 1.06, 0.012]} />
      </mesh>
      <mesh position={[-w + 0.1, 1.05, 0.04]} material={M.brass()}>
        <boxGeometry args={[0.03, 0.18, 0.03]} />
      </mesh>
    </group>
  );
}

export function Halvorsen() {
  const plaque = textTexture('halvorsen', '', {
    width: 1024,
    height: 256,
    lines: [
      { text: 'THE HALVORSEN', font: '600 110px "Playfair Display", serif', color: '#d9b878' },
      { text: '41 CALLOWAY STREET · EST. 1928', font: '500 48px "IBM Plex Sans", sans-serif', color: '#a88a55' },
    ],
  });
  const unitSign = textTexture('unit1c', '1C', { width: 256, height: 256, color: '#d9b878', font: '600 170px "Playfair Display", serif' });
  const elevatorSign = textTexture('elev-sign', '', {
    width: 512,
    height: 256,
    background: '#f2efe6',
    lines: [
      { text: 'OUT OF SERVICE', font: '700 64px "IBM Plex Sans", sans-serif', color: '#a0161f' },
      { text: 'upper floors closed', font: 'italic 44px "Playfair Display", serif', color: '#222' },
    ],
  });
  const mailTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const g = c.getContext('2d')!;
    g.fillStyle = '#6b5530';
    g.fillRect(0, 0, 512, 384);
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 6; k++) {
        g.fillStyle = '#3a2d18';
        g.fillRect(k * 85 + 8, r * 96 + 10, 72, 76);
        g.fillStyle = '#c9a75f';
        g.fillRect(k * 85 + 14, r * 96 + 16, 60, 18);
        g.fillStyle = '#e9e2cf';
        g.fillRect(k * 85 + 18, r * 96 + 54, 52, 14);
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const [gx, , gz] = ipos('glasses');
  const [nx, , nz] = ipos('note');

  return (
    <group>
      {/* Floor slab, interior floors */}
      <Block b={[-12, 10, 0, F, 8, 24]} material={M.stone()} />
      <Block b={[-11.7, -0.85, F - 0.02, F + 0.002, 8.3, 23.7]} material={M.wood()} collide={false} />
      <Block b={[-0.85, 9.7, F - 0.02, F + 0.002, 8.3, 14.85]} material={M.tiles()} collide={false} />

      {/* Facade: [-12,-9] | window [-9,-5] | [-5,1] | door [1,3] | [3,5] | window [5,8] | [8,10] */}
      <FacadeSeg x0={-12} x1={-9} y0={F} y1={C} />
      <Window x0={-9} x1={-5} />
      <FacadeSeg x0={-5} x1={1} y0={F} y1={C} />
      <FacadeSeg x0={1} x1={3} y0={3.35} y1={C} />
      <FacadeSeg x0={3} x1={5} y0={F} y1={C} />
      <Window x0={5} x1={8} />
      <FacadeSeg x0={8} x1={10} y0={F} y1={C} />

      {/* Outer walls */}
      <Block b={[-12, -11.7, F, C, 8.3, 23.7]} material={M.plaster()} />
      <Block b={[9.7, 10, F, C, 8.3, 23.7]} material={M.plasterWarm()} />
      <Block b={[-12, 10, F, C, 23.7, 24]} material={M.plaster()} />

      {/* Lobby / apartment divider with the door gap at z 11.4–12.6 */}
      <Block b={[-1.15, -0.85, F, C, 8.3, 11.4]} material={M.plaster()} />
      <Block b={[-1.15, -0.85, F, C, 12.6, 23.7]} material={M.plaster()} />
      <Block b={[-1.15, -0.85, DOOR_TOP, C, 11.4, 12.6]} material={M.plaster()} />
      <Block b={[-0.85, -0.8, F, DOOR_TOP + 0.08, 11.3, 11.4]} material={M.darkWood()} collide={false} />
      <Block b={[-0.85, -0.8, F, DOOR_TOP + 0.08, 12.6, 12.7]} material={M.darkWood()} collide={false} />

      {/* Lobby back wall */}
      <Block b={[-0.85, 9.7, F, C, 14.85, 15.15]} material={M.plasterWarm()} />

      {/* Apartment internal wall with opening at x −5.2…−3.8 */}
      <Block b={[-11.7, -5.2, F, C, 16.85, 17.15]} material={M.plaster()} />
      <Block b={[-3.8, -1.15, F, C, 16.85, 17.15]} material={M.plaster()} />
      <Block b={[-5.2, -3.8, DOOR_TOP, C, 16.85, 17.15]} material={M.plaster()} />

      {/* Ceiling, upper floors, cornice */}
      <Block b={[-12, 10, C, C + 0.3, 8, 24]} material={M.ceiling()} />
      <Block b={[-12, 10, C + 0.3, 20, 8, 24]} material={M.brick()} />
      <Block b={[-12.2, 10.2, C - 0.05, C + 0.35, 7.8, 8.0]} material={M.stone()} collide={false} />
      <Block b={[-12.2, 10.2, 20, 20.4, 7.8, 24.2]} material={M.trim()} collide={false} />

      {/* Entrance: stoop steps, frame, plaque, lamp */}
      <Block b={[0.6, 3.4, 0.15, 0.35, 6.8, 8]} material={M.stone()} collide={false} />
      <Block b={[0.6, 3.4, 0.35, 0.55, 7.2, 8]} material={M.stone()} collide={false} />
      <Block b={[0.6, 3.4, 0.55, F, 7.6, 8]} material={M.stone()} collide={false} />
      {/* Invisible ramp over the steps: smooth climbing at any speed. */}
      <CuboidCollider args={[1.4, 0.1, 0.671]} position={[2, 0.45 - 0.0894, 7.4 + 0.0447]} rotation={[-0.4636, 0, 0]} />
      {/* Door frame lines the opening (never flush with the wall, which caused z-fighting) */}
      <Block b={[1.0, 1.1, F, 3.35, 7.84, 8.31]} material={M.darkWood()} collide={false} />
      <Block b={[2.9, 3.0, F, 3.35, 7.84, 8.31]} material={M.darkWood()} collide={false} />
      <Block b={[1.0, 3.0, 3.25, 3.35, 7.84, 8.31]} material={M.darkWood()} collide={false} />
      <EntranceDoor />
      <Sign texture={plaque} position={[2, 3.66, 7.97]} size={[1.9, 0.48]} facing="south" basic={false} />
      <mesh position={[3.55, 3.12, 7.55]} material={glow('#ffc886', 3)}>
        <sphereGeometry args={[0.07, 12, 12]} />
      </mesh>
      <pointLight position={[3.4, 3.0, 7.2]} color="#ffbe7a" intensity={4} distance={6} decay={1.8} />
      {[0.65, 3.35].map((x) => (
        <group key={x}>
          <Prop size={[0.04, 0.9, 0.04]} position={[x, 0.75, 6.85]} material={M.darkMetal()} />
          <mesh position={[x, 1.03, 7.4]} rotation={[0.35, 0, 0]} material={M.darkMetal()}>
            <boxGeometry args={[0.04, 0.04, 1.25]} />
          </mesh>
        </group>
      ))}

      {/* ---------- Lobby ---------- */}
      <Prop size={[2.6, 1.1, 0.8]} position={[6.5, F + 0.55, 11.9]} material={M.darkWood()} />
      <Prop size={[2.7, 0.05, 0.9]} position={[6.5, F + 1.12, 11.9]} material={M.stone()} />
      <Block b={[5.2, 7.8, F, F + 1.1, 11.5, 12.3]} material={M.darkWood()} visible={false} />
      <CctvTerminal />
      <mesh position={[9.66, F + 1.4, 11.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.6, 1.2]} />
        <meshStandardMaterial map={mailTex} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Elevator */}
      <Prop size={[1.5, 2.4, 0.06]} position={[3, F + 1.2, 14.82]} material={M.metal()} />
      <Prop size={[0.02, 2.4, 0.08]} position={[3, F + 1.2, 14.8]} material={M.black()} />
      <Prop size={[1.8, 2.7, 0.04]} position={[3, F + 1.35, 14.84]} material={M.brass()} />
      <Sign texture={elevatorSign} position={[4.15, F + 1.3, 14.8]} size={[0.32, 0.16]} facing="south" basic={false} />
      {/* Bench and plant */}
      <Block b={[0.2, 2.0, F, F + 0.45, 14.3, 14.8]} material={M.darkWood()} />
      {/* Fluorescent fixture and lobby light */}
      <Prop size={[2.4, 0.06, 0.2]} position={[4, C - 0.05, 11.6]} material={glow('#dde8ff', 2.5)} />
      <pointLight position={[4, C - 0.4, 11.6]} color="#d6e2ff" intensity={14} distance={14} decay={1.6} />
      <Sign texture={unitSign} position={[-0.79, F + 2.0, 13.0]} size={[0.24, 0.24]} facing="east" basic={false} />
      {/* Smart lock keypad */}
      <group position={ipos('smartlock')}>
        <Prop size={[0.03, 0.22, 0.12]} position={[0.01, 0, 0]} material={M.metal()} />
        <mesh position={[0.03, 0.07, 0]} material={glow('#4dff9a', 2.5)}>
          <sphereGeometry args={[0.008, 8, 8]} />
        </mesh>
        <mesh position={[0.028, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} material={glow('#4a7aa8', 0.8)}>
          <planeGeometry args={[0.08, 0.1]} />
        </mesh>
      </group>

      {/* ---------- Living room ---------- */}
      <Block b={[-9.2, -4.0, F, F + 0.01, 10.4, 14.6]} material={M.rug()} collide={false} />
      {/* Sofa */}
      <Block b={[-7.3, -5.7, F, F + 0.5, 13.2, 13.9]} material={M.fabric()} visible={false} />
      {/* Coffee table with glasses and bottle */}
      <Block b={[gx - 0.62, gx + 0.62, F, F + 0.44, gz - 0.34, gz + 0.34]} material={M.darkWood()} visible={false} />
      <mesh position={[gx - 0.25, F + 0.49, gz]} material={M.glass()}>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 14, 1, true]} />
      </mesh>
      <mesh position={[gx + 0.15, F + 0.49, gz + 0.05]} material={M.glass()}>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 14, 1, true]} />
      </mesh>
      <mesh position={[gx + 0.15, F + 0.465, gz + 0.05]}>
        <cylinderGeometry args={[0.034, 0.034, 0.03, 14]} />
        <meshStandardMaterial color="#8a4a12" roughness={0.1} transparent opacity={0.85} />
      </mesh>
      <mesh position={[gx + 0.4, F + 0.59, gz - 0.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
        <meshStandardMaterial color="#5a3010" roughness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Kitchen counter, fruit bowl, note, fridge */}
      <Block b={[-11.7, -11.0, F, F + 0.95, 9.0, 14.0]} material={M.darkWood()} />
      <Prop size={[0.75, 0.04, 5.05]} position={[-11.35, F + 0.97, 11.5]} material={M.stone()} />
      <mesh position={[nx, F + 1.02, nz]} material={M.darkMetal()}>
        <sphereGeometry args={[0.13, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <mesh position={[nx - 0.03, F + 1.05, nz]} material={M.fabricRed()}>
        <sphereGeometry args={[0.05, 10, 10]} />
      </mesh>
      <mesh position={[nx, F + 0.995, nz + 0.17]} rotation={[-Math.PI / 2, 0, 0.3]} material={M.paper()}>
        <planeGeometry args={[0.15, 0.2]} />
      </mesh>
      <Block b={[-11.7, -11.0, F, F + 1.9, 14.2, 15.0]} material={M.metal()} />
      {/* Bookshelf */}
      <Block b={[-10.0, -8.4, F, F + 2.0, 16.45, 16.85]} material={M.darkWood()} />
      <Books />
      {/* Floor lamp, curtains */}
      <mesh position={[-9.6, F + 0.8, 15.8]} material={M.darkMetal()}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
      </mesh>
      <mesh position={[-9.6, F + 1.65, 15.8]}>
        <cylinderGeometry args={[0.15, 0.22, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#e0c8a0" emissive="#ffb070" emissiveIntensity={1.2} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[-9.6, F + 1.6, 15.6]} color="#ffb070" intensity={9} distance={11} decay={1.6} />
      <Prop size={[0.5, 2.3, 0.06]} position={[-9.3, F + 1.5, 8.4]} material={M.fabricRed()} />
      <Prop size={[0.5, 2.3, 0.06]} position={[-4.7, F + 1.5, 8.4]} material={M.fabricRed()} />
      {/* Red neon spill from across the street */}
      <pointLight position={[-7, F + 2.2, 9.0]} color="#ff3050" intensity={3} distance={6} decay={1.8} />

      {/* ---------- Study ---------- */}
      <Block b={[-8.4, -6.6, F, F + 0.76, 22.8, 23.6]} material={M.darkWood()} visible={false} />
      <Laptop />
      <Prop size={[0.5, 0.05, 0.5]} position={[-7.5, F + 0.48, 22.3]} material={M.black()} />
      <Prop size={[0.5, 0.55, 0.05]} position={[-7.5, F + 0.78, 22.05]} material={M.black()} />
      <pointLight position={[-6.9, F + 1.15, 23.1]} color="#bcd2ff" intensity={5} distance={7} decay={1.6} />
      <mesh position={[-8, C - 1.08, 20.4]} material={glow('#ffcf9a', 2.5)}>
        <sphereGeometry args={[0.05, 12, 12]} />
      </mesh>
      <pointLight position={[-8, C - 1.3, 20.4]} color="#ffc890" intensity={6} distance={9} decay={1.6} />
      <Corkboard />
      {/* Whiteboard */}
      <Prop size={[0.03, 1.1, 1.8]} position={[-1.18, F + 1.6, 20.5]} material={M.whiteboard()} />
      {/* Filing cabinet with open drawers */}
      <Block b={[-11.4, -10.5, F, F + 1.3, 22.6, 23.4]} material={M.darkMetal()} />
      <Prop size={[0.8, 0.3, 0.5]} position={[-10.95, F + 1.0, 22.35]} material={M.darkMetal()} />
      <Prop size={[0.8, 0.3, 0.35]} position={[-10.95, F + 0.6, 22.42]} material={M.darkMetal()} />
      {/* Cardboard boxes */}
      <Block b={[-3.2, -2.4, F, F + 0.5, 22.6, 23.5]} material={M.pot()} visible={false} />
      <InteriorProps />
    </group>
  );
}
