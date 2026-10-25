// Procedural fallback character: a trench-coated detective built from
// primitives, animated in code. Replace with a rigged GLB when one is licensed.

import { useFrame } from '@react-three/fiber';
import { forwardRef, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audio } from '../../systems/audio/audioEngine';

export interface AnimState {
  speed: number;
  grounded: boolean;
  running: boolean;
  /** performance.now() of the last interaction, for the reach animation. */
  interactAt: number;
}

const mats = () => ({
  coat: new THREE.MeshStandardMaterial({ color: '#5b4f43', roughness: 0.75 }),
  coatDark: new THREE.MeshStandardMaterial({ color: '#3d342c', roughness: 0.8 }),
  trousers: new THREE.MeshStandardMaterial({ color: '#1d2026', roughness: 0.8 }),
  shoes: new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.35, metalness: 0.2 }),
  skin: new THREE.MeshStandardMaterial({ color: '#b98d70', roughness: 0.6 }),
  hat: new THREE.MeshStandardMaterial({ color: '#16171b', roughness: 0.6 }),
  scarf: new THREE.MeshStandardMaterial({ color: '#6b1b25', roughness: 0.9 }),
});

export const CharacterModel = forwardRef<THREE.Group, { anim: React.RefObject<AnimState> }>(function CharacterModel({ anim }, ref) {
  const m = useMemo(mats, []);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const coatTail = useRef<THREE.Mesh>(null);
  const phase = useRef(0);
  const lastSin = useRef(0);
  const air = useRef(0);

  useFrame((state, dtRaw) => {
    const a = anim.current;
    if (!a || !body.current) return;
    const dt = Math.min(dtRaw, 0.05);
    const k = Math.min(a.speed / 3, 1.4);
    phase.current += dt * a.speed * 2.3;
    const s = Math.sin(phase.current);

    // Footsteps on each half-cycle.
    if (a.grounded && a.speed > 0.6 && Math.sign(s) !== Math.sign(lastSin.current)) audio.footstep(a.running);
    lastSin.current = s;

    air.current += ((a.grounded ? 0 : 1) - air.current) * (1 - Math.exp(-dt * 12));
    const swing = s * 0.55 * k * (1 - air.current);
    const t = state.clock.elapsedTime;

    legL.current!.rotation.x = swing - air.current * 0.6;
    legR.current!.rotation.x = -swing + air.current * 0.25;
    armL.current!.rotation.x = -swing * 0.8 - air.current * 0.3;

    const since = (performance.now() - a.interactAt) / 1000;
    const reach = since < 0.9 ? Math.sin((since / 0.9) * Math.PI) : 0;
    armR.current!.rotation.x = swing * 0.8 * (1 - reach) - reach * 1.25 - air.current * 0.3;

    const bob = Math.abs(Math.cos(phase.current)) * 0.045 * k;
    const breathe = Math.sin(t * 1.6) * 0.006 * (1 - Math.min(k, 1));
    body.current.position.y = bob + breathe;
    body.current.rotation.x = Math.min(k, 1) * (a.running ? 0.14 : 0.05);
    if (coatTail.current) coatTail.current.rotation.x = -Math.min(k, 1.2) * 0.25 - air.current * 0.2;
  });

  return (
    <group ref={ref}>
      <group ref={body}>
        {/* Legs (pivot at hip) */}
        {([[legL, -0.11], [legR, 0.11]] as const).map(([r, x]) => (
          <group key={x} ref={r} position={[x, 0.9, 0]}>
            <mesh position={[0, -0.42, 0]} material={m.trousers} castShadow>
              <cylinderGeometry args={[0.075, 0.065, 0.84, 10]} />
            </mesh>
            <mesh position={[0, -0.86, 0.05]} material={m.shoes} castShadow>
              <boxGeometry args={[0.11, 0.08, 0.27]} />
            </mesh>
          </group>
        ))}
        {/* Coat */}
        <mesh position={[0, 1.18, 0]} material={m.coat} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 0.62, 14]} />
        </mesh>
        <mesh ref={coatTail} position={[0, 0.88, 0]} material={m.coat} castShadow>
          <cylinderGeometry args={[0.25, 0.3, 0.42, 14, 1, true]} />
        </mesh>
        <mesh position={[0, 1.04, 0]} material={m.coatDark}>
          <cylinderGeometry args={[0.235, 0.235, 0.06, 14]} />
        </mesh>
        <mesh position={[0, 1.46, 0]} material={m.coat} castShadow>
          <boxGeometry args={[0.5, 0.14, 0.27]} />
        </mesh>
        {/* Lapels */}
        <mesh position={[-0.07, 1.36, 0.18]} rotation={[0.15, 0, 0.35]} material={m.coatDark}>
          <boxGeometry args={[0.07, 0.24, 0.03]} />
        </mesh>
        <mesh position={[0.07, 1.36, 0.18]} rotation={[0.15, 0, -0.35]} material={m.coatDark}>
          <boxGeometry args={[0.07, 0.24, 0.03]} />
        </mesh>
        {/* Scarf, head, hat */}
        <mesh position={[0, 1.55, 0]} material={m.scarf}>
          <cylinderGeometry args={[0.1, 0.12, 0.09, 12]} />
        </mesh>
        <mesh position={[0, 1.68, 0.01]} material={m.skin} castShadow>
          <sphereGeometry args={[0.11, 16, 14]} />
        </mesh>
        <mesh position={[0, 1.765, 0]} material={m.hat} castShadow>
          <cylinderGeometry args={[0.21, 0.21, 0.02, 20]} />
        </mesh>
        <mesh position={[0, 1.83, 0]} material={m.hat} castShadow>
          <cylinderGeometry args={[0.115, 0.125, 0.12, 16]} />
        </mesh>
        <mesh position={[0, 1.79, 0]} material={m.scarf}>
          <cylinderGeometry args={[0.127, 0.127, 0.025, 16]} />
        </mesh>
        {/* Arms (pivot at shoulder) */}
        {([[armL, -0.27], [armR, 0.27]] as const).map(([r, x]) => (
          <group key={x} ref={r} position={[x, 1.44, 0]}>
            <mesh position={[0, -0.3, 0]} material={m.coat} castShadow>
              <cylinderGeometry args={[0.06, 0.055, 0.6, 10]} />
            </mesh>
            <mesh position={[0, -0.63, 0]} material={m.skin}>
              <sphereGeometry args={[0.045, 10, 10]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
});
