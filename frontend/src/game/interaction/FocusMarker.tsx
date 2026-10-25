import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';
import { getInteractable } from './interactables';

/** A small floating diamond above whatever the player can interact with. */
export function FocusMarker() {
  const focusedId = useGame((s) => s.focusedId);
  const ref = useRef<THREE.Mesh>(null);
  const def = focusedId ? getInteractable(focusedId) : undefined;

  useFrame(({ clock }) => {
    if (!ref.current || !def) return;
    const t = clock.elapsedTime;
    ref.current.position.set(def.position[0], def.position[1] + 0.32 + Math.sin(t * 3) * 0.03, def.position[2]);
    ref.current.rotation.y = t * 1.5;
  });

  if (!def) return null;
  const color = def.kind === 'evidence' ? new THREE.Color(3, 1.1, 1.3) : new THREE.Color(1.6, 1.9, 2.4);
  return (
    <mesh ref={ref} scale={[0.06, 0.09, 0.06]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.9} />
    </mesh>
  );
}
