import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../state/gameStore';
import { CinematicCamera } from './camera/CinematicCamera';
import { FocusMarker } from './interaction/FocusMarker';
import { attachKeyboard } from './player/input';
import { Player } from './player/Player';
import { mouseDelta } from './player/runtime';
import { World } from './world/World';

function Effects() {
  const quality = useGame((s) => s.settings.quality);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    // With post-processing, tone mapping runs as the last effect instead.
    gl.toneMapping = quality === 'high' ? THREE.NoToneMapping : THREE.AgXToneMapping;
  }, [gl, quality]);
  if (quality === 'low') return null;
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.9} intensity={2.2} distanceFalloff={0.8} quality="medium" halfRes />
      <SMAA />
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={1.0} luminanceSmoothing={0.25} radius={0.75} />
      <BrightnessContrast brightness={0.0} contrast={0.08} />
      <HueSaturation saturation={-0.12} />
      <Noise opacity={0.03} premultiply />
      <Vignette offset={0.3} darkness={0.7} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  );
}

/** Pointer lock + mouse-look input bound to the canvas element. */
function useMouseLook(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dragging = false;

    const onMove = (e: MouseEvent) => {
      const s = useGame.getState();
      if (s.screen !== 'playing' || s.overlay) return;
      if (document.pointerLockElement === canvas || (!s.settings.mouseLock && dragging)) {
        mouseDelta.x += e.movementX;
        mouseDelta.y += e.movementY;
      }
    };
    const onDown = (e: MouseEvent) => {
      const s = useGame.getState();
      if (s.screen !== 'playing' || s.overlay) return;
      if (s.settings.mouseLock) {
        if (document.pointerLockElement !== canvas) void canvas.requestPointerLock()?.catch?.(() => {});
      } else if (e.button === 0 || e.button === 2) {
        dragging = true;
      }
    };
    const onUp = () => (dragging = false);
    const onLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      const s = useGame.getState();
      s.setPointerLocked(locked);
      // Browser releases the lock on Esc: treat that as a pause request.
      if (!locked && s.screen === 'playing' && s.overlay === null && s.settings.mouseLock) s.openOverlay('pause');
    };
    const onContext = (e: Event) => e.preventDefault();

    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('contextmenu', onContext);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('contextmenu', onContext);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, [canvasRef]);
}

export function GameCanvas({ onReady }: { onReady?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quality = useGame((s) => s.settings.quality);
  useEffect(() => attachKeyboard(), []);
  useMouseLook(canvasRef);

  return (
    <Canvas
      ref={canvasRef}
      className="!fixed inset-0"
      shadows={quality === 'high' ? 'percentage' : false}
      dpr={quality === 'high' ? [1, 1.75] : [0.75, 1]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 55, near: 0.1, far: 220, position: [-20, 2.4, -1.5] }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
    >
      <Suspense fallback={null}>
        <Physics timeStep="vary" gravity={[0, -18, 0]}>
          <World />
          <Player />
        </Physics>
        <FocusMarker />
        <CinematicCamera />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
