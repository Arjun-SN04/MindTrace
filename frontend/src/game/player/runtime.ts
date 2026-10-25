// Per-frame mutable player state. Kept outside React/Zustand so the
// 60 fps loop never triggers re-renders. UI reads it on intervals.

import type { Vec3 } from '@shared';
import { SPAWN } from '../world/layout';

export const playerRuntime = {
  position: [...SPAWN.position] as Vec3,
  yaw: SPAWN.yaw,
  /** Camera yaw, used by the map to draw the view direction. */
  cameraYaw: SPAWN.yaw,
  speed: 0,
};

/** Mouse movement accumulated between frames. */
export const mouseDelta = { x: 0, y: 0 };
