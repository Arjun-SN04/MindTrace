import { CLUES } from '@shared';
import { useEffect, useState } from 'react';
import { useGame } from '../state/gameStore';
import { checkServer, readLocalSave } from '../systems/saves/saveSystem';
import { Button, Kbd } from './ui';

function timeAgo(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(ts).toLocaleDateString();
}

export function MainMenu() {
  const { newGame, continueGame, openSettings, hasSave, overlay } = useGame();
  const [confirming, setConfirming] = useState(false);
  const [server, setServer] = useState<'checking' | 'online' | 'offline'>('checking');
  const save = hasSave ? readLocalSave() : null;

  useEffect(() => {
    let alive = true;
    checkServer().then((ok) => alive && setServer(ok ? 'online' : 'offline'));
    return () => {
      alive = false;
    };
  }, []);

  if (overlay === 'settings') return null;

  return (
    <div className="fixed inset-0 z-20 flex animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      <div className="relative flex w-full max-w-xl flex-col justify-center px-10 sm:px-16">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.4em] text-accent-soft">Greyhaven · 02:13 AM</div>
        <h1 className="font-display text-6xl font-semibold tracking-[0.12em] text-white sm:text-7xl">MINDTRACE</h1>
        <div className="mt-2 font-mono text-sm uppercase tracking-[0.45em] text-fog">The City That Lies</div>
        <p className="mt-6 max-w-sm font-display text-lg text-paper/75 italic">Every suspect has a story. Every story hides a truth.</p>

        <nav className="mt-12 flex flex-col gap-1" aria-label="Main menu">
          {save && (
            <Button variant="menu" onClick={() => void continueGame()}>
              <span className="flex flex-col">
                <span>Continue Investigation</span>
                <span className="font-sans text-xs tracking-normal text-fog">
                  Evidence {save.discovered.length}/{CLUES.length} · saved {timeAgo(save.savedAt)}
                </span>
              </span>
            </Button>
          )}
          {!confirming ? (
            <Button variant="menu" onClick={() => (save ? setConfirming(true) : newGame())}>
              New Investigation
            </Button>
          ) : (
            <div className="animate-rise border-l-2 border-accent bg-accent/5 px-4 py-3">
              <p className="text-sm text-paper">Start over? Your current investigation will be overwritten.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="primary" onClick={newGame} autoFocus>
                  Start new case
                </Button>
                <Button onClick={() => setConfirming(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <Button variant="menu" onClick={openSettings}>
            Settings
          </Button>
        </nav>

        <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-fog">
          <span className="flex items-center gap-1.5"><Kbd>WASD</Kbd> move</span>
          <span className="flex items-center gap-1.5"><Kbd>Mouse</Kbd> look</span>
          <span className="flex items-center gap-1.5"><Kbd>E</Kbd> examine</span>
          <span className="flex items-center gap-1.5"><Kbd>J</Kbd> case file</span>
        </div>
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-dim">
          <span className={`h-1.5 w-1.5 rounded-full ${server === 'online' ? 'bg-ok' : server === 'offline' ? 'bg-warn' : 'bg-dim'}`} />
          {server === 'online' ? 'Case server online — saves sync' : server === 'offline' ? 'Case server offline — saving locally' : 'Contacting case server…'}
        </div>
      </div>
    </div>
  );
}
