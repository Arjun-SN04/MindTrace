import { getInteractable } from '../../game/interaction/interactables';
import { useGame } from '../../state/gameStore';
import { audio } from '../audio/audioEngine';

/** Re-acquire mouse look after closing a panel (needs a user gesture). */
export function relockPointer() {
  const s = useGame.getState();
  if (!s.settings.mouseLock || s.screen !== 'playing') return;
  const canvas = document.querySelector('canvas');
  if (canvas && document.pointerLockElement !== canvas) {
    try {
      const p = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      p?.catch?.(() => {});
    } catch {
      /* Browsers may refuse right after Esc; the click-to-resume hint covers it. */
    }
  }
}

export function interact(id: string) {
  const def = getInteractable(id);
  const s = useGame.getState();
  if (!def) return;
  if (def.kind === 'door' && def.doorFlag) {
    s.setFlag(def.doorFlag, !s.flags.includes(def.doorFlag));
    useGame.setState({ lastInteractAt: performance.now() });
    audio.door();
    return;
  }
  s.inspect(id);
}

export function promptLabel(id: string): string {
  const def = getInteractable(id);
  if (!def) return '';
  if (def.kind === 'door' && def.doorFlag) {
    return useGame.getState().flags.includes(def.doorFlag) ? 'Close Door' : 'Open Door';
  }
  return def.label;
}
