// Realistic player character: Microsoft Rocketbox "Business_Male_01" (MIT license),
// converted to a compressed GLB with idle / walk / run / examine animations.

import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { audio } from '../../systems/audio/audioEngine';
import type { AnimState } from './CharacterModel';

const MODEL_URL = '/assets/models/detective.glb';
useGLTF.preload(MODEL_URL, false, true);

/** Natural ground speed of each locomotion clip in m/s, so feet don't slide. */
const NATURAL_SPEED: Record<string, number> = { walkFast: 1.49, run: 2.9 };
const FADE = 0.25;

/** A felt fedora built from lathe profiles. */
function useFedora() {
  return useMemo(() => {
    const felt = new THREE.MeshPhysicalMaterial({ color: '#1a1b1f', roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#3a3d46'), sheenRoughness: 0.6, side: THREE.DoubleSide });
    const band = new THREE.MeshStandardMaterial({ color: '#4a1219', roughness: 0.7 });
    const crown = new THREE.LatheGeometry(
      [[0.0, 0.128], [0.04, 0.132], [0.07, 0.122], [0.092, 0.1], [0.104, 0.06], [0.108, 0.02], [0.11, 0.0]].map(([r, y]) => new THREE.Vector2(r, y)),
      32,
    );
    const brim = new THREE.LatheGeometry(
      [[0.104, 0.004], [0.14, 0.0], [0.175, 0.004], [0.192, 0.014], [0.196, 0.022]].map(([r, y]) => new THREE.Vector2(r, y)),
      40,
    );
    const g = new THREE.Group();
    g.name = 'Fedora';
    g.scale.setScalar(0.9);
    const c = new THREE.Mesh(crown, felt);
    c.scale.set(1, 1, 1.12); // oval crown
    const b = new THREE.Mesh(brim, felt);
    b.scale.set(1, 1, 1.12);
    const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1095, 0.111, 0.026, 32, 1, true), band);
    bandMesh.position.y = 0.016;
    bandMesh.scale.set(1, 1, 1.12);
    // Crease on top of the crown.
    const dent = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), felt);
    dent.position.y = 0.105;
    dent.scale.set(0.6, 0.35, 1.2);
    for (const m of [c, b, bandMesh, dent]) {
      m.castShadow = true;
      g.add(m);
    }
    return g;
  }, []);
}

export const Detective = forwardRef<THREE.Group, { anim: React.RefObject<AnimState> }>(function Detective({ anim }, ref) {
  const group = useRef<THREE.Group>(null);
  useImperativeHandle(ref, () => group.current!, []);
  const { scene, animations } = useGLTF(MODEL_URL, false, true);
  const { actions } = useAnimations(animations, group);
  const fedora = useFedora();
  const current = useRef<string>('idle');
  const lastHalf = useRef(0);
  const idleTime = useRef(0);

  // Materials, shadows and the hat (attached to the head bone, computed from the rest pose).
  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        for (const m of [mesh.material].flat() as THREE.MeshStandardMaterial[]) {
          m.envMapIntensity = 0.8;
          if (m.name === 'hair') m.alphaTest = 0.4;
        }
      }
    });
    const head = scene.getObjectByName('Bip01_Head');
    if (head && !fedora.parent) {
      scene.updateMatrixWorld(true);
      const rootInv = scene.matrixWorld.clone().invert();
      const headPos = new THREE.Vector3().setFromMatrixPosition(head.matrixWorld).applyMatrix4(rootInv);
      const desired = new THREE.Matrix4().compose(
        headPos.add(new THREE.Vector3(0, 0.145, 0.012)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.07, 0, 0)),
        new THREE.Vector3(1, 1, 1),
      );
      const local = head.matrixWorld.clone().invert().multiply(scene.matrixWorld).multiply(desired);
      const s = fedora.scale.x;
      local.decompose(fedora.position, fedora.quaternion, fedora.scale);
      fedora.scale.multiplyScalar(s);
      head.add(fedora);
    }
  }, [scene, fedora]);

  useLayoutEffect(() => {
    const interact = actions.interact;
    if (interact) {
      interact.setLoop(THREE.LoopOnce, 1);
      interact.clampWhenFinished = true;
    }
    const look = actions.look;
    if (look) {
      look.setLoop(THREE.LoopOnce, 1);
      look.clampWhenFinished = true;
    }
    actions.idle?.reset().play();
    current.current = 'idle';
  }, [actions]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;

    let target: string;
    const sinceInteract = performance.now() - a.interactAt;
    if (sinceInteract < 1900 && a.speed < 0.6) target = 'interact';
    else if (a.speed > 3.1) target = 'run';
    else if (a.speed > 0.25) target = 'walkFast';
    else target = current.current === 'look' && actions.look?.isRunning() ? 'look' : 'idle';

    // Occasional look-around while standing still.
    if (target === 'idle') {
      idleTime.current += dt;
      if (idleTime.current > 9) {
        target = 'look';
        idleTime.current = 0;
      }
    } else if (target !== 'look') {
      idleTime.current = 0;
    }

    if (target !== current.current) {
      const prev = actions[current.current];
      const next = actions[target];
      if (next) {
        next.reset();
        if (target === 'interact') next.time = 0.55;
        next.setEffectiveWeight(1).fadeIn(FADE).play();
        prev?.fadeOut(FADE);
        current.current = target;
      }
    }

    const act = actions[current.current];
    if (act) {
      const natural = NATURAL_SPEED[current.current];
      let scale = natural ? THREE.MathUtils.clamp(a.speed / natural, 0.6, 1.8) : current.current === 'interact' ? 1.5 : 1;
      if (!a.grounded) scale *= 0.25;
      act.timeScale = scale;

      // Footsteps at the two contact points of each locomotion cycle.
      if (natural && a.grounded) {
        const phase = (act.time % act.getClip().duration) / act.getClip().duration;
        const half = phase < 0.5 ? 0 : 1;
        if (half !== lastHalf.current) audio.footstep(current.current === 'run');
        lastHalf.current = half;
      }
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  );
});
