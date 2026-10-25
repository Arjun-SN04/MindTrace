// Instanced window geometry for building facades: frame, sill, reflective glass,
// and lit interiors with simple room silhouettes. A handful of draw calls covers the street.

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { M } from './materials';
import { rand } from './textures';

export type Face = 'north' | 'south' | 'east' | 'west';

export interface FacadeSpec {
  face: Face;
  /** Coordinate of the wall plane (z for north/south, x for east/west). */
  at: number;
  /** Extent along the wall. */
  from: number;
  to: number;
  /** Vertical range for windows. */
  y0: number;
  y1: number;
  spacing?: number;
  floorHeight?: number;
}

const W = 1.25;
const H = 1.85;

const NORMALS: Record<Face, THREE.Vector3> = {
  north: new THREE.Vector3(0, 0, 1),
  south: new THREE.Vector3(0, 0, -1),
  east: new THREE.Vector3(1, 0, 0),
  west: new THREE.Vector3(-1, 0, 0),
};
const ROT: Record<Face, number> = { north: 0, south: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 };

/** Canvas textures of lit rooms seen through a window. */
function makeInterior(variant: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 192;
  const g = c.getContext('2d')!;
  const wall = g.createLinearGradient(0, 0, 0, 192);
  wall.addColorStop(0, '#fff2d8');
  wall.addColorStop(0.55, '#c9a77c');
  wall.addColorStop(1, '#5a4330');
  g.fillStyle = wall;
  g.fillRect(0, 0, 128, 192);
  // Ceiling light falloff.
  const lamp = g.createRadialGradient(64 + (rand() - 0.5) * 50, 10, 0, 64, 10, 120);
  lamp.addColorStop(0, 'rgba(255,255,240,0.9)');
  lamp.addColorStop(1, 'rgba(255,255,240,0)');
  g.fillStyle = lamp;
  g.fillRect(0, 0, 128, 192);
  g.fillStyle = 'rgba(30,20,12,0.85)';
  if (variant === 0) {
    // Bookshelf + lamp
    g.fillRect(8, 70, 34, 122);
    for (let y = 80; y < 190; y += 22) g.fillRect(8, y, 34, 3);
    g.fillRect(96, 110, 4, 82);
    g.beginPath(); g.moveTo(86, 110); g.lineTo(110, 110); g.lineTo(104, 92); g.lineTo(92, 92); g.fill();
  } else if (variant === 1) {
    // Curtains half drawn + plant
    g.fillStyle = 'rgba(70,30,30,0.9)';
    g.fillRect(0, 0, 30, 192);
    g.fillRect(98, 0, 30, 192);
    g.fillStyle = 'rgba(20,30,15,0.9)';
    g.beginPath(); g.ellipse(70, 150, 18, 26, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(64, 170, 12, 22);
  } else if (variant === 2) {
    // Blinds
    g.fillStyle = 'rgba(40,28,18,0.75)';
    for (let y = 0; y < 150; y += 9) g.fillRect(0, y, 128, 5);
  } else {
    // A figure silhouette by the window
    g.fillStyle = 'rgba(15,10,8,0.85)';
    g.beginPath(); g.arc(78, 80, 11, 0, Math.PI * 2); g.fill();
    g.fillRect(62, 92, 32, 100);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const glassMat = new THREE.MeshStandardMaterial({ color: '#0b0f16', roughness: 0.06, metalness: 0.85, envMapIntensity: 1.6 });
const sillMat = M.stone;

interface Instance {
  matrix: THREE.Matrix4;
  lit: number; // -1 dark, otherwise interior variant
  tint: THREE.Color;
}

function buildInstances(specs: FacadeSpec[]): Instance[] {
  const out: Instance[] = [];
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  for (const s of specs) {
    const spacing = s.spacing ?? 3;
    const fh = s.floorHeight ?? 3.2;
    const n = NORMALS[s.face];
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ROT[s.face]);
    const len = s.to - s.from;
    const cols = Math.max(1, Math.floor(len / spacing));
    const start = s.from + (len - (cols - 1) * spacing) / 2;
    for (let y = s.y0 + H / 2; y + H / 2 <= s.y1; y += fh) {
      for (let i = 0; i < cols; i++) {
        const along = start + i * spacing;
        const p = s.face === 'north' || s.face === 'south' ? new THREE.Vector3(along, y, s.at) : new THREE.Vector3(s.at, y, along);
        p.addScaledVector(n, 0.001);
        const r = rand();
        const lit = r < 0.32 ? Math.floor(rand() * 4) : -1;
        const warm = rand() > 0.3;
        const k = 0.7 + rand() * 0.9;
        const tint = warm ? new THREE.Color(1.0 * k, 0.78 * k, 0.52 * k) : new THREE.Color(0.62 * k, 0.78 * k, 1.0 * k);
        out.push({ matrix: new THREE.Matrix4().compose(p, q.clone(), one), lit, tint });
      }
    }
  }
  return out;
}

function Instanced({ geometry, material, items, offset, colors }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Instance[]; offset: THREE.Matrix4; colors?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const tmp = new THREE.Matrix4();
    items.forEach((it, i) => {
      m.setMatrixAt(i, tmp.multiplyMatrices(it.matrix, offset));
      if (colors) m.setColorAt(i, it.tint);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items, offset, colors]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} receiveShadow />;
}

export function FacadeWindows({ specs }: { specs: FacadeSpec[] }) {
  const { all, litGroups, geo, mats, offsets } = useMemo(() => {
    const all = buildInstances(specs);
    const litGroups = [0, 1, 2, 3].map((v) => all.filter((i) => i.lit === v));
    const geo = {
      frame: new THREE.BoxGeometry(W + 0.16, H + 0.16, 0.12),
      sill: new THREE.BoxGeometry(W + 0.3, 0.08, 0.26),
      lintel: new THREE.BoxGeometry(W + 0.3, 0.16, 0.14),
      pane: new THREE.PlaneGeometry(W, H),
      mullion: new THREE.BoxGeometry(0.04, H, 0.03),
    };
    const mats = [0, 1, 2, 3].map(
      (v) => new THREE.MeshBasicMaterial({ map: makeInterior(v), color: '#ffffff', toneMapped: true }),
    );
    const offsets = {
      frame: new THREE.Matrix4().makeTranslation(0, 0, 0.02),
      sill: new THREE.Matrix4().makeTranslation(0, -H / 2 - 0.1, 0.1),
      lintel: new THREE.Matrix4().makeTranslation(0, H / 2 + 0.14, 0.05),
      pane: new THREE.Matrix4().makeTranslation(0, 0, 0.1),
      mullion: new THREE.Matrix4().makeTranslation(0, 0, 0.12),
    };
    return { all, litGroups, geo, mats, offsets };
  }, [specs]);

  return (
    <group>
      <Instanced geometry={geo.frame} material={M.trim()} items={all} offset={offsets.frame} />
      <Instanced geometry={geo.sill} material={sillMat()} items={all} offset={offsets.sill} />
      <Instanced geometry={geo.lintel} material={sillMat()} items={all} offset={offsets.lintel} />
      <Instanced geometry={geo.pane} material={glassMat} items={all.filter((i) => i.lit < 0)} offset={offsets.pane} />
      {litGroups.map((items, v) => (
        <Instanced key={v} geometry={geo.pane} material={mats[v]} items={items} offset={offsets.pane} colors />
      ))}
      <Instanced geometry={geo.mullion} material={M.trim()} items={all} offset={offsets.mullion} />
    </group>
  );
}
