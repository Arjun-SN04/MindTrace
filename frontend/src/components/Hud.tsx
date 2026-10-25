import { CLUES, currentObjective } from '@shared';
import { useEffect, useState } from 'react';
import { progressOf, useGame, type Toast } from '../state/gameStore';
import { promptLabel } from '../systems/evidence/interact';
import { Kbd } from './ui';

function ObjectivePanel() {
  const discovered = useGame((s) => s.discovered);
  const flags = useGame((s) => s.flags);
  const objective = currentObjective(progressOf({ discovered, flags }));
  return (
    <div className="max-w-sm animate-fade-in">
      <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent-soft">
        <span className="h-px w-5 bg-accent" />
        {objective ? 'Objective' : 'Prologue complete'}
      </div>
      <p className="font-display text-[17px] leading-snug text-paper drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
        {objective ? objective.text : 'Review the case file. The investigation continues.'}
      </p>
      {objective?.hint && <p className="mt-1 text-xs text-fog/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{objective.hint}</p>}
    </div>
  );
}

function CaseStatus() {
  const count = useGame((s) => Object.keys(s.discovered).length);
  const zone = useGame((s) => s.zoneName);
  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-fog/80 drop-shadow">{zone}</div>
      <div className="flex items-center gap-3 rounded-md border border-line bg-ink/55 px-3 py-1.5 backdrop-blur-sm">
        <div className="flex gap-0.5" aria-hidden>
          {CLUES.map((c, i) => (
            <span key={c.id} className={`h-3 w-1.5 rounded-sm ${i < count ? 'bg-accent' : 'bg-white/15'}`} />
          ))}
        </div>
        <span className="font-mono text-xs text-paper">
          Evidence {count}/{CLUES.length}
        </span>
      </div>
      <div className="flex gap-3 text-[11px] text-fog">
        <span className="flex items-center gap-1.5"><Kbd>J</Kbd> Case file</span>
        <span className="flex items-center gap-1.5"><Kbd>M</Kbd> Map</span>
        <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd> Pause</span>
      </div>
    </div>
  );
}

function Prompt() {
  const focusedId = useGame((s) => s.focusedId);
  // Re-render when door state changes so the label flips.
  useGame((s) => s.flags.length);
  if (!focusedId) return null;
  return (
    <div key={focusedId} className="flex animate-rise items-center gap-3 rounded-full border border-line bg-ink/75 py-1.5 pr-5 pl-1.5 shadow-lg backdrop-blur-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper font-mono text-sm font-bold text-ink">E</span>
      <span className="text-sm tracking-wide text-paper">{promptLabel(focusedId)}</span>
    </div>
  );
}

const toastStyle: Record<Toast['kind'], string> = {
  evidence: 'border-l-accent',
  objective: 'border-l-brass',
  insight: 'border-l-ok',
  info: 'border-l-fog',
  location: 'border-l-transparent',
};

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="flex w-80 flex-col items-end gap-2" aria-live="polite">
      {toasts.map((t) =>
        t.kind === 'location' ? (
          <div key={t.id} className="animate-rise font-display text-lg text-paper/90 italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {t.title}
          </div>
        ) : (
          <div key={t.id} className={`w-full animate-rise rounded-md border border-l-4 border-line bg-ink/85 px-4 py-2.5 shadow-xl backdrop-blur ${toastStyle[t.kind]}`}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">{t.title}</div>
            {t.body && <div className="mt-0.5 text-sm text-paper">{t.body}</div>}
          </div>
        ),
      )}
    </div>
  );
}

function ControlsHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 25000);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div className="flex animate-fade-in flex-wrap gap-x-4 gap-y-1 text-[11px] text-fog/90 drop-shadow">
      <span className="flex items-center gap-1"><Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd> Move</span>
      <span className="flex items-center gap-1"><Kbd>Shift</Kbd> Sprint</span>
      <span className="flex items-center gap-1"><Kbd>Space</Kbd> Jump</span>
      <span className="flex items-center gap-1"><Kbd>E</Kbd> Interact</span>
    </div>
  );
}

export function Hud() {
  const overlay = useGame((s) => s.overlay);
  const locked = useGame((s) => s.pointerLocked);
  const mouseLock = useGame((s) => s.settings.mouseLock);
  const hidden = overlay !== null;
  return (
    <div className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-300 ${hidden ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute top-5 left-6"><ObjectivePanel /></div>
      <div className="absolute top-5 right-6"><CaseStatus /></div>
      <div className="absolute top-36 right-6"><Toasts /></div>
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2"><Prompt /></div>
      <div className="absolute bottom-5 left-6"><ControlsHint /></div>
      <div className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper/60" />
      {!hidden && mouseLock && !locked && (
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 animate-fade-in rounded-full bg-ink/70 px-4 py-1.5 text-xs text-paper backdrop-blur">
          Click to look around
        </div>
      )}
      {!hidden && !mouseLock && (
        <div className="absolute bottom-5 right-6 text-[11px] text-fog/80">Drag with the mouse to look around</div>
      )}
    </div>
  );
}
