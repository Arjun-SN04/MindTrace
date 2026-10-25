import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/gameStore';
import { audio } from '../../systems/audio/audioEngine';
import { INTERACTABLES } from '../interaction/interactables';
import { SPAWN, zoneAt } from '../world/layout';
import { CharacterModel, type AnimState } from './CharacterModel';
import { Detective } from './Detective';
import { keys, moveAxes } from './input';
import { mouseDelta, playerRuntime } from './runtime';

const HALF_HEIGHT = 0.5;
const RADIUS = 0.35;
const CENTER_TO_FEET = HALF_HEIGHT + RADIUS;
const WALK = 2.0;
const SPRINT = 4.2;
const JUMP = 5.2;
const GRAVITY = 18;
const CAM_DIST = 3.3;
const SHOULDER = 0.55;
const PITCH_MIN = -0.45;
const PITCH_MAX = 1.05;

const v = {
  fwd: new THREE.Vector3(),
  right: new THREE.Vector3(),
  wish: new THREE.Vector3(),
  target: new THREE.Vector3(),
  camPos: new THREE.Vector3(),
  dir: new THREE.Vector3(),
  tmp: new THREE.Vector3(),
};

function lerpAngle(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const model = useRef<THREE.Group>(null);
  const controller = useRef<KinematicCharacterController | null>(null);
  const { world, rapier } = useRapier();
  const camera = useThree((s) => s.camera);

  const vel = useRef(new THREE.Vector3());
  const vy = useRef(0);
  const grounded = useRef(true);
  const cam = useRef({ yaw: SPAWN.yaw, pitch: 0.18, dist: CAM_DIST, smoothTarget: new THREE.Vector3(), init: false });
  const facing = useRef(SPAWN.yaw + Math.PI);
  const anim = useRef<AnimState>({ speed: 0, grounded: true, running: false, interactAt: 0 });
  const timers = useRef({ focus: 0, zone: 0 });
  const lastTeleport = useRef(0);

  useEffect(() => {
    const c = world.createCharacterController(0.03);
    c.enableAutostep(0.35, 0.02, false);
    c.enableSnapToGround(0.35);
    c.setMaxSlopeClimbAngle((60 * Math.PI) / 180);
    c.setMinSlopeSlideAngle((35 * Math.PI) / 180);
    c.setSlideEnabled(true);
    controller.current = c;
    return () => {
      world.removeCharacterController(c);
      controller.current = null;
    };
  }, [world]);

  useFrame((_, dtRaw) => {
    const b = body.current, col = collider.current, ctrl = controller.current;
    if (!b || !col || !ctrl) return;
    const dt = Math.min(dtRaw, 1 / 20);
    const s = useGame.getState();

    // Teleports (new game / continue / dev tools).
    if (s.teleport && s.teleport.nonce !== lastTeleport.current) {
      lastTeleport.current = s.teleport.nonce;
      const [x, y, z] = s.teleport.position;
      b.setTranslation({ x, y, z }, true);
      b.setNextKinematicTranslation({ x, y, z });
      vel.current.set(0, 0, 0);
      vy.current = 0;
      cam.current.yaw = s.teleport.yaw;
      cam.current.init = false;
      facing.current = s.teleport.yaw + Math.PI;
      playerRuntime.position = [x, y, z];
      return;
    }

    const active = s.screen === 'playing' && s.overlay === null;
    const c = cam.current;

    // Camera look.
    if (active) {
      const sens = 0.0022 * s.settings.sensitivity;
      c.yaw -= mouseDelta.x * sens;
      c.pitch += mouseDelta.y * sens * (s.settings.invertY ? -1 : 1);
      c.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, c.pitch));
    }
    mouseDelta.x = 0;
    mouseDelta.y = 0;

    // Movement relative to the camera.
    v.fwd.set(-Math.sin(c.yaw), 0, -Math.cos(c.yaw));
    v.right.set(Math.cos(c.yaw), 0, -Math.sin(c.yaw));
    const input = active ? moveAxes() : { forward: 0, right: 0, sprint: false };
    v.wish.set(0, 0, 0).addScaledVector(v.fwd, input.forward).addScaledVector(v.right, input.right);
    const moving = v.wish.lengthSq() > 0;
    if (moving) v.wish.normalize().multiplyScalar(input.sprint ? SPRINT : WALK);
    const accel = moving ? (grounded.current ? 12 : 4) : grounded.current ? 10 : 1;
    vel.current.lerp(v.wish, 1 - Math.exp(-dt * accel));

    // Gravity and jumping.
    const jump = keys.consumeJump();
    if (grounded.current) {
      if (active && jump) vy.current = JUMP;
      else if (vy.current < 0) vy.current = -2;
    }
    vy.current -= GRAVITY * dt;

    const desired = { x: vel.current.x * dt, y: vy.current * dt, z: vel.current.z * dt };
    ctrl.computeColliderMovement(col, desired, rapier.QueryFilterFlags.EXCLUDE_SENSORS);
    const m = ctrl.computedMovement();
    const wasGrounded = grounded.current;
    grounded.current = ctrl.computedGrounded();
    if (vy.current > 0 && m.y < desired.y * 0.5) vy.current = 0; // bumped the ceiling
    if (!wasGrounded && grounded.current && vy.current < -6) audio.land();

    const p = b.translation();
    const next = { x: p.x + m.x, y: p.y + m.y, z: p.z + m.z };
    if (next.y < -10) {
      // Fell out of the world: put the player back on the street.
      const [x, y, z] = SPAWN.position;
      next.x = x; next.y = y; next.z = z;
      b.setTranslation(next, true);
    }
    b.setNextKinematicTranslation(next);

    // Actual horizontal speed after collisions, for animation.
    const hs = Math.hypot(m.x, m.z) / Math.max(dt, 1e-4);
    playerRuntime.position = [next.x, next.y, next.z];
    playerRuntime.speed = hs;
    playerRuntime.cameraYaw = c.yaw;

    // Character model follows the body and turns toward movement.
    if (model.current) {
      model.current.position.set(next.x, next.y - CENTER_TO_FEET, next.z);
      if (hs > 0.3 && moving) facing.current = lerpAngle(facing.current, Math.atan2(vel.current.x, vel.current.z), 1 - Math.exp(-dt * 12));
      model.current.rotation.y = facing.current;
      playerRuntime.yaw = facing.current - Math.PI;
    }
    anim.current.speed = hs;
    anim.current.grounded = grounded.current;
    anim.current.running = input.sprint && hs > WALK + 0.3;
    anim.current.interactAt = s.lastInteractAt;

    // Third-person camera with collision.
    if (s.screen === 'playing') {
      // Head position, then the over-the-shoulder offset, shortened if a wall is in the way.
      v.target.set(next.x, next.y - CENTER_TO_FEET + 1.55, next.z);
      const side = world.castRay(new rapier.Ray(v.target, v.right), SHOULDER + 0.3, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, b);
      const shoulder = side ? Math.max(0, Math.min(SHOULDER, side.timeOfImpact - 0.3)) : SHOULDER;
      v.target.addScaledVector(v.right, shoulder);
      if (!c.init) {
        c.smoothTarget.copy(v.target);
        c.init = true;
      }
      c.smoothTarget.x = v.target.x;
      c.smoothTarget.z = v.target.z;
      c.smoothTarget.y += (v.target.y - c.smoothTarget.y) * (1 - Math.exp(-dt * 14));

      v.dir.set(Math.sin(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), Math.cos(c.yaw) * Math.cos(c.pitch));
      let want = CAM_DIST;
      const ray = new rapier.Ray(c.smoothTarget, v.dir);
      const hit = world.castRay(ray, CAM_DIST + 0.3, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, b);
      if (hit) want = Math.max(0.35, hit.timeOfImpact - 0.3);
      c.dist = want < c.dist ? want : c.dist + (want - c.dist) * (1 - Math.exp(-dt * 4));
      v.camPos.copy(c.smoothTarget).addScaledVector(v.dir, c.dist);
      camera.position.copy(v.camPos);
      camera.lookAt(c.smoothTarget);
    }

    // Interaction focus (10 Hz).
    timers.current.focus -= dt;
    if (timers.current.focus <= 0) {
      timers.current.focus = 0.1;
      if (!active) {
        s.setFocused(null);
      } else {
        const chest = v.tmp.set(next.x, next.y + 0.35, next.z);
        let best: string | null = null;
        let bestScore = Infinity;
        for (const it of INTERACTABLES) {
          if (it.id === 'burner_phone' && s.discovered.clue_discarded_phone) continue;
          const dx = it.position[0] - chest.x, dy = it.position[1] - chest.y, dz = it.position[2] - chest.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist > (it.radius ?? 1.6)) continue;
          const flat = Math.hypot(dx, dz) || 1;
          const dot = (dx * v.fwd.x + dz * v.fwd.z) / flat;
          if (dot < 0.35 && flat > 0.8) continue;
          // Line of sight: ignore objects behind walls.
          const dir = { x: dx / dist, y: dy / dist, z: dz / dist };
          const los = world.castRay(new rapier.Ray(chest, dir), dist, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, b);
          if (los && los.timeOfImpact < dist - 0.4) continue;
          const score = dist * (2 - dot);
          if (score < bestScore) {
            bestScore = score;
            best = it.id;
          }
        }
        s.setFocused(best);
      }
    }

    // Zone tracking (4 Hz).
    timers.current.zone -= dt;
    if (timers.current.zone <= 0) {
      timers.current.zone = 0.25;
      const zone = zoneAt(next.x, next.z);
      s.setZone(zone.name, zone.indoors);
      if (s.screen === 'playing') {
        if (zone.indoors && !s.flags.includes('entered_building')) s.setFlag('entered_building');
        if (zone.id === 'unit_1c' && !s.flags.includes('entered_apartment')) s.setFlag('entered_apartment');
      }
    }
  });

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={SPAWN.position} enabledRotations={[false, false, false]}>
        <CapsuleCollider ref={collider} args={[HALF_HEIGHT, RADIUS]} />
      </RigidBody>
      <Suspense fallback={<CharacterModel ref={model} anim={anim} />}>
        <Detective ref={model} anim={anim} />
      </Suspense>
    </>
  );
}
