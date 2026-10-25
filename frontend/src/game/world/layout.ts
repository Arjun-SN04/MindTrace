// World layout for the Old Town slice (Calloway Street). Units are metres.
// +x = east, +z = north. The street runs east–west.

import type { Vec3 } from '@shared';

export const ROAD_Y = 0;
export const SIDEWALK_Y = 0.15;
/** Interior floor height of the Halvorsen building. */
export const FLOOR_Y = 0.75;
export const CEIL_Y = 3.95;

export type Bounds = [x0: number, x1: number, z0: number, z1: number];

export const HALVORSEN: Bounds = [-12, 10, 8, 24];

export const SPAWN: { position: Vec3; yaw: number } = { position: [-4, 1.0, -2.6], yaw: Math.PI };

export interface Zone {
  id: string;
  name: string;
  bounds: Bounds;
  indoors: boolean;
}

// First match wins.
export const ZONES: Zone[] = [
  { id: 'unit_1c', name: 'The Halvorsen — Unit 1C', bounds: [-11.7, -1, 8.3, 23.7], indoors: true },
  { id: 'halvorsen_lobby', name: 'The Halvorsen — Lobby', bounds: [-1, 9.7, 8.3, 15], indoors: true },
  { id: 'noctua_alley', name: 'Alley beside Café Noctua', bounds: [2, 6, -26, -8.4], indoors: false },
  { id: 'harbor_road', name: 'Calloway Street — toward Harbor Bridge', bounds: [30, 50, -8, 8], indoors: false },
  { id: 'calloway_street', name: 'Calloway Street, Old Town', bounds: [-60, 60, -40, 40], indoors: false },
];

export function zoneAt(x: number, z: number): Zone {
  return (
    ZONES.find((zn) => x >= zn.bounds[0] && x <= zn.bounds[1] && z >= zn.bounds[2] && z <= zn.bounds[3]) ??
    ZONES[ZONES.length - 1]
  );
}

/** Building footprints for the map overlay. */
export const MAP_BLOCKS: { bounds: Bounds; label?: string; highlight?: boolean }[] = [
  { bounds: [-50, -12, 8, 30], label: 'Hotel Argent' },
  { bounds: [-12, 10, 8, 24], label: 'The Halvorsen', highlight: true },
  { bounds: [10, 50, 8, 30], label: 'Meridian Security' },
  { bounds: [-50, -14, -30, -8], label: 'Laundromat' },
  { bounds: [-14, 2, -30, -8], label: 'Café Noctua' },
  { bounds: [6, 50, -30, -8], label: 'Kessler Pawn' },
  { bounds: [2, 6, -30, -26] },
];
