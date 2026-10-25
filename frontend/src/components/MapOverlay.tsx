import { currentObjective } from '@shared';
import { useEffect, useState } from 'react';
import { ipos } from '../game/interaction/interactables';
import { playerRuntime } from '../game/player/runtime';
import { MAP_BLOCKS } from '../game/world/layout';
import { progressOf, useGame } from '../state/gameStore';
import { relockPointer } from '../systems/evidence/interact';
import { Button, Kbd, Kicker, Modal } from './ui';

// Map view: x from -50..50, z from -30..30. North (+z) is up.
const X0 = -50, X1 = 50, Z0 = -30, Z1 = 30;
const W = 1000, H = ((Z1 - Z0) / (X1 - X0)) * W;
const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
const sz = (z: number) => ((Z1 - z) / (Z1 - Z0)) * H;

const OBJECTIVE_TARGETS: Record<string, [number, number]> = {
  obj_enter_building: [2, 7.2],
  obj_search_apartment: [-6.5, 16],
  obj_check_cctv: [ipos('cctv')[0], ipos('cctv')[2]],
  obj_follow_figure: [4, -18],
};

export function MapOverlay() {
  const closeOverlay = useGame((s) => s.closeOverlay);
  const discovered = useGame((s) => s.discovered);
  const flags = useGame((s) => s.flags);
  const [pos, setPos] = useState({ x: playerRuntime.position[0], z: playerRuntime.position[2], yaw: playerRuntime.cameraYaw });
  const objective = currentObjective(progressOf({ discovered, flags }));
  const target = objective ? OBJECTIVE_TARGETS[objective.id] : undefined;

  useEffect(() => {
    const id = setInterval(() => setPos({ x: playerRuntime.position[0], z: playerRuntime.position[2], yaw: playerRuntime.cameraYaw }), 200);
    return () => clearInterval(id);
  }, []);

  const close = () => {
    closeOverlay();
    relockPointer();
  };
  // Camera forward is (-sin yaw, -cos yaw) in xz; on the map +z is up.
  const heading = (Math.atan2(-Math.sin(pos.yaw), -Math.cos(pos.yaw)) * 180) / Math.PI;

  return (
    <Modal label="Map" onClose={close} className="w-full max-w-4xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <Kicker>Old Town · Greyhaven</Kicker>
          <h2 className="mt-1 font-display text-3xl text-white">Calloway Street</h2>
        </div>
        <Button onClick={close}>
          Close <Kbd>M</Kbd>
        </Button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full rounded-lg border border-line bg-[#080c14]" role="img" aria-label="District map">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(143,163,194,0.06)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <rect x={sx(X0)} y={sz(8)} width={W} height={sz(-8) - sz(8)} fill="#1a2030" />
        <rect x={sx(X0)} y={sz(4)} width={W} height={sz(-4) - sz(4)} fill="#121722" />
        <rect x={sx(2)} y={sz(-8)} width={sx(6) - sx(2)} height={sz(-26) - sz(-8)} fill="#1a2030" />
        {MAP_BLOCKS.map(({ bounds: [x0, x1, z0, z1], label, highlight }) => (
          <g key={`${x0}${z0}`}>
            <rect
              x={sx(Math.max(x0, X0))}
              y={sz(Math.min(z1, Z1))}
              width={sx(Math.min(x1, X1)) - sx(Math.max(x0, X0))}
              height={sz(Math.max(z0, Z0)) - sz(Math.min(z1, Z1))}
              fill={highlight ? '#2a2030' : '#161b26'}
              stroke={highlight ? '#d6394f' : 'rgba(143,163,194,0.25)'}
              strokeWidth={highlight ? 2 : 1}
            />
            {label && (
              <text x={sx((Math.max(x0, X0) + Math.min(x1, X1)) / 2)} y={sz((z0 + z1) / 2) + 5} textAnchor="middle" fill={highlight ? '#e2707f' : '#7d8aa0'} fontSize="16" fontFamily="IBM Plex Sans">
                {label}
              </text>
            )}
          </g>
        ))}
        <text x={sx(4)} y={sz(-17)} textAnchor="middle" fill="#7d8aa0" fontSize="13" transform={`rotate(-90 ${sx(4)} ${sz(-17)})`}>
          alley
        </text>
        <text x={sx(44)} y={sz(0) + 5} textAnchor="middle" fill="#e0a35a" fontSize="13">
          ✕ to Harbor (closed)
        </text>
        {target && (
          <g transform={`translate(${sx(target[0])} ${sz(target[1])})`}>
            <circle r="14" fill="none" stroke="#c9a661" strokeWidth="2">
              <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="4" fill="#c9a661" />
          </g>
        )}
        <g transform={`translate(${sx(pos.x)} ${sz(pos.z)}) rotate(${heading})`}>
          <path d="M0 -14 L9 9 L0 4 L-9 9 Z" fill="#d9dfe8" stroke="#05070c" strokeWidth="2" />
        </g>
      </svg>
      <div className="mt-3 flex gap-5 text-xs text-fog">
        <span className="flex items-center gap-2"><span className="inline-block h-0 w-0 border-x-[5px] border-b-[9px] border-x-transparent border-b-paper" /> You</span>
        {target && <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brass" /> Current objective</span>}
      </div>
    </Modal>
  );
}
