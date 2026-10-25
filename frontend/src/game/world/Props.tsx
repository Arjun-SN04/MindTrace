// Real-world-scale CC0 models from Poly Haven (polyhaven.com), compressed to GLB.

import { useGLTF } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { ipos } from '../interaction/interactables';
import { FLOOR_Y as F } from './layout';

const url = (id: string) => `/assets/models/props/${id}.glb`;

const PRELOAD = [
  'covered_car', 'fire_hydrant', 'metal_trash_can', 'street_lamp_01', 'street_lamp_02', 'exterior_aircon_unit', 'utility_box_01',
  'water_manhole_cover', 'security_camera_01', 'street_rat', 'old_tyre', 'concrete_road_barrier', 'Sofa_01', 'CoffeeTable_01',
  'metal_office_desk', 'ArmChair_01', 'desk_lamp_arm_01', 'potted_plant_01', 'cardboard_box_01', 'book_encyclopedia_set_01',
  'hanging_industrial_lamp',
];
for (const id of PRELOAD) useGLTF.preload(url(id), false, true);

interface ModelProps {
  id: string;
  position: [number, number, number];
  rotation?: number;
  scale?: number | [number, number, number];
  /** Keep only top-level children whose names pass this test (for files with several variants). */
  pick?: (name: string) => boolean;
  shadows?: boolean;
}

export function Model({ id, position, rotation = 0, scale = 1, pick, shadows = true }: ModelProps) {
  const { scene } = useGLTF(url(id), false, true);
  const object = useMemo(() => {
    const root = new THREE.Group();
    const parts = pick ? scene.children.filter((c) => pick(c.name)) : scene.children;
    for (const p of parts) root.add(p.clone(true));
    if (pick) {
      // Re-centre the chosen variant on the origin (x/z only).
      const box = new THREE.Box3().setFromObject(root);
      const c = box.getCenter(new THREE.Vector3());
      root.children.forEach((ch) => ch.position.sub(new THREE.Vector3(c.x, 0, c.z)));
    }
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = shadows;
        m.receiveShadow = true;
      }
    });
    return root;
  }, [scene, pick, shadows]);
  const s = typeof scale === 'number' ? [scale, scale, scale] : scale;
  return <primitive object={object} position={position} rotation={[0, rotation, 0]} scale={s as [number, number, number]} />;
}

const notAged = (n: string) => !/aged|rust/i.test(n);
const rusted = (n: string) => /rust/i.test(n);

/** Exterior dressing: covered cars, street furniture, wall units. */
export function StreetProps() {
  const [sx] = ipos('sedan');
  return (
    <Suspense fallback={null}>
      <Model id="covered_car" position={[sx, 0, 2.4]} rotation={Math.PI / 2} />
      <Model id="covered_car" position={[12, 0, -2.5]} rotation={-Math.PI / 2 + 0.03} />
      <Model id="covered_car" position={[-38, 0, 2.6]} rotation={Math.PI / 2 - 0.04} />
      <Model id="fire_hydrant" position={[-14, 0.15, 4.6]} pick={notAged} rotation={Math.PI} />
      <Model id="fire_hydrant" position={[24, 0.15, -4.6]} pick={(n) => !notAged(n)} />
      <Model id="metal_trash_can" position={[8.5, 0.15, 7.3]} pick={notAged} />
      <Model id="metal_trash_can" position={[-30, 0.15, -7.3]} pick={rusted} rotation={0.5} />
      <Model id="metal_trash_can" position={[18, 0.15, -7.3]} pick={notAged} rotation={2.2} />
      <Model id="water_manhole_cover" position={[-6, 0.0, 0.8]} />
      <Model id="water_manhole_cover" position={[18, 0.0, -1.2]} rotation={0.7} />
      <Model id="utility_box_01" position={[-11.3, 0.15, 7.6]} rotation={Math.PI} />
      <Model id="utility_box_01" position={[23, 0.15, -7.6]} />
      {/* Air-conditioning units hung on the facades */}
      {[[-30, 5.6, 7.75, Math.PI], [-44, 8.8, 7.75, Math.PI], [30, 6.0, 7.75, Math.PI], [52, 9.2, 7.75, Math.PI], [-36, 5.8, -7.75, 0], [28, 9.0, -7.75, 0]].map(([x, y, z, r], i) => (
        <Model key={i} id="exterior_aircon_unit" position={[x, y, z]} rotation={r} pick={i % 2 ? rusted : notAged} />
      ))}
      <Model id="exterior_aircon_unit" position={[2.25, 5.2, -21]} rotation={Math.PI / 2} pick={rusted} />
      <Model id="exterior_aircon_unit" position={[5.75, 6.5, -11]} rotation={-Math.PI / 2} pick={rusted} />
      {/* Alley details */}
      <Model id="old_tyre" position={[5.7, 0.43, -23.4]} rotation={-Math.PI / 2 + 0.3} />
      <Model id="street_rat" position={[4.4, 0.15, -16.7]} rotation={2.4} scale={1.3} />
      <Model id="security_camera_01" position={[5.85, 3.4, -9.2]} rotation={-Math.PI / 2 - 0.5} />
      <Model id="street_lamp_02" position={[2.0, 2.4, -13.1]} rotation={Math.PI / 2} scale={0.9} />
      {/* Harbor barricade */}
      {[-3.4, -1.7, 1.7, 3.4].map((z) => (
        <Model key={z} id="concrete_road_barrier" position={[45.2, 0, z]} rotation={Math.PI / 2 + (z > 0 ? 0.05 : -0.04)} />
      ))}
      {/* Wall lamp over the Halvorsen entrance */}
      <Model id="street_lamp_02" position={[3.55, 2.6, 8.0]} rotation={Math.PI} scale={0.7} />
    </Suspense>
  );
}

/** A post-top street lamp model (3.87 m), scaled to street height. */
export function LampPost({ x, z }: { x: number; z: number }) {
  return (
    <Suspense fallback={null}>
      <Model id="street_lamp_01" position={[x, 0.15, z]} scale={1.25} />
    </Suspense>
  );
}

/** Interior furniture for the Halvorsen. */
export function InteriorProps() {
  const [gx, , gz] = ipos('glasses');
  return (
    <Suspense fallback={null}>
      {/* Living room */}
      <Model id="Sofa_01" position={[-6.5, F, 13.55]} rotation={Math.PI} scale={1.05} />
      <Model id="CoffeeTable_01" position={[gx, F, gz]} scale={[0.85, 0.85, 0.75]} />
      <Model id="ArmChair_01" position={[-9.3, F, 11.6]} rotation={Math.PI / 2 + 0.3} />
      <Model id="potted_plant_01" position={[-4.2, F, 15.9]} scale={0.9} />
      <Model id="book_encyclopedia_set_01" position={[-9.9, F + 1.65, 16.62]} rotation={0} />
      {/* Study */}
      <Model id="metal_office_desk" position={[-7.5, F, 23.2]} rotation={Math.PI} scale={[0.9, 0.96, 0.84]} />
      <Model id="desk_lamp_arm_01" position={[-6.75, F + 0.76, 23.35]} rotation={-2.4} scale={0.8} />
      <Model id="hanging_industrial_lamp" position={[-8, 3.95, 20.4]} scale={0.9} />
      <Model id="cardboard_box_01" position={[-2.8, F, 23.1]} rotation={0.3} scale={1.4} />
      <Model id="cardboard_box_01" position={[-2.75, F + 0.47, 23.05]} rotation={-0.2} scale={1.2} />
      <Model id="cardboard_box_01" position={[-3.6, F, 23.2]} rotation={1.4} scale={1.3} />
      {/* Lobby */}
      <Model id="potted_plant_01" position={[9.0, F, 9.0]} />
      <Model id="security_camera_01" position={[9.55, 3.75, 14.6]} rotation={-2.3} />
    </Suspense>
  );
}
