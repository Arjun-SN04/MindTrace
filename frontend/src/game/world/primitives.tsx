import { CuboidCollider } from '@react-three/rapier';
import type { ThreeElements } from '@react-three/fiber';
import type * as THREE from 'three';
import { worldBox } from './materials';

/** [x0, x1, y0, y1, z0, z1] */
export type Box6 = [number, number, number, number, number, number];

interface BlockProps {
  b: Box6;
  material: THREE.Material;
  /** Adds a static collider (requires a fixed RigidBody ancestor). */
  collide?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  visible?: boolean;
}

/** An axis-aligned box defined by its bounds, with optional collider. */
export function Block({ b, material, collide = true, castShadow = false, receiveShadow = true, visible = true }: BlockProps) {
  const [x0, x1, y0, y1, z0, z1] = b;
  const sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  return (
    <>
      {visible && (
        <mesh
          geometry={worldBox(sx, sy, sz)}
          material={material}
          position={[cx, cy, cz]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
      {collide && <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} position={[cx, cy, cz]} />}
    </>
  );
}

/** A simple centred box mesh with no collider, for props. */
export function Prop({
  size,
  material,
  ...rest
}: { size: [number, number, number]; material: THREE.Material } & Omit<ThreeElements['mesh'], 'material' | 'geometry'>) {
  return <mesh geometry={worldBox(size[0], size[1], size[2])} material={material} castShadow receiveShadow {...rest} />;
}
