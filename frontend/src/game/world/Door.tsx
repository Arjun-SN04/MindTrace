import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';
import { M } from './materials';
import { Prop } from './primitives';

interface DoorProps {
  /** Hinge position at floor level. */
  hinge: [number, number, number];
  width: number;
  height: number;
  /** Angle when open (radians, around Y). Closed = 0, door extends along +z. */
  openAngle: number;
  flag: string;
}

const q = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);

/** A hinged door driven by a game flag. Its collider swings with it. */
export function Door({ hinge, width, height, openAngle, flag }: DoorProps) {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const angle = useRef(0);
  const open = useGame((s) => s.flags.includes(flag));

  useFrame((_, dt) => {
    const target = open ? openAngle : 0;
    angle.current += (target - angle.current) * (1 - Math.exp(-dt * 5));
    q.setFromAxisAngle(up, angle.current);
    body.current?.setNextKinematicRotation(q);
    visual.current?.quaternion.copy(q);
  });

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" position={hinge} colliders={false}>
        <CuboidCollider args={[0.05, height / 2, width / 2]} position={[0, height / 2, width / 2]} />
      </RigidBody>
      <group ref={visual} position={hinge}>
        <Prop size={[0.07, height, width]} position={[0, height / 2, width / 2]} material={M.darkWood()} />
        <mesh position={[0.07, height * 0.47, width - 0.12]} material={M.brass()}>
          <sphereGeometry args={[0.04, 10, 10]} />
        </mesh>
        <mesh position={[-0.07, height * 0.47, width - 0.12]} material={M.brass()}>
          <sphereGeometry args={[0.04, 10, 10]} />
        </mesh>
        <Prop size={[0.08, 0.14, 0.22]} position={[0, height * 0.78, width / 2]} material={M.brass()} />
      </group>
    </>
  );
}
