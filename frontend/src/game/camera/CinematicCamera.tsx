import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';

const look = new THREE.Vector3();

/** Slow establishing shots for the menu and prologue screens. */
export function CinematicCamera() {
  useFrame(({ camera, clock }) => {
    const screen = useGame.getState().screen;
    if (screen === 'playing') return;
    const t = clock.elapsedTime;
    if (screen === 'menu') {
      // Drift along the street toward the Halvorsen and Café Noctua.
      const k = (Math.sin(t * 0.04) + 1) / 2;
      camera.position.set(-22 + k * 12, 2.4 + Math.sin(t * 0.13) * 0.25, -1.5 + Math.sin(t * 0.07) * 1.2);
      look.set(-2 + k * 4, 2.6, 2 + Math.sin(t * 0.05) * 3);
    } else {
      // Prologue: low over the street, facing Daniel's window.
      camera.position.set(-6.5 + Math.sin(t * 0.08) * 0.6, 1.7, -5.2);
      look.set(-5, 2.6, 8);
    }
    camera.lookAt(look);
  });
  return null;
}
