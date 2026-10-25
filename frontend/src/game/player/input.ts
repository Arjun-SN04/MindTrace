// Keyboard state for the player controller. Polled every frame.

const pressed = new Set<string>();
let jumpQueued = false;

export const keys = {
  isDown: (code: string) => pressed.has(code),
  /** Returns true once per Space press. */
  consumeJump: () => {
    const j = jumpQueued;
    jumpQueued = false;
    return j;
  },
  clear: () => {
    pressed.clear();
    jumpQueued = false;
  },
};

export function moveAxes() {
  const f = (pressed.has('KeyW') || pressed.has('ArrowUp') ? 1 : 0) - (pressed.has('KeyS') || pressed.has('ArrowDown') ? 1 : 0);
  const r = (pressed.has('KeyD') || pressed.has('ArrowRight') ? 1 : 0) - (pressed.has('KeyA') || pressed.has('ArrowLeft') ? 1 : 0);
  return { forward: f, right: r, sprint: pressed.has('ShiftLeft') || pressed.has('ShiftRight') };
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

export function attachKeyboard(): () => void {
  const down = (e: KeyboardEvent) => {
    if (isTyping(e)) return;
    if (e.code === 'Space' && !e.repeat) jumpQueued = true;
    pressed.add(e.code);
  };
  const up = (e: KeyboardEvent) => pressed.delete(e.code);
  const blur = () => keys.clear();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}
