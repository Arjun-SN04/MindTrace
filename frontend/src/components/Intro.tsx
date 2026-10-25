import { useEffect, useState } from 'react';
import { useGame } from '../state/gameStore';
import { Button, Kbd } from './ui';

const BEATS = [
  { at: 0, el: 'kicker' },
  { at: 900, el: 'line1' },
  { at: 2200, el: 'message' },
  { at: 5200, el: 'line2' },
  { at: 6600, el: 'line3' },
  { at: 8000, el: 'line4' },
  { at: 9300, el: 'begin' },
] as const;

export function Intro() {
  const beginPlay = useGame((s) => s.beginPlay);
  const [shown, setShown] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timers = BEATS.map((b) => setTimeout(() => setShown((s) => new Set(s).add(b.el)), b.at));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        beginPlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beginPlay]);

  const show = (k: string) => (shown.has(k) ? 'animate-rise' : 'invisible');

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/80 p-6 backdrop-blur-[2px]">
      <div className="w-full max-w-xl">
        <div className={`font-mono text-xs uppercase tracking-[0.4em] text-accent-soft ${show('kicker')}`}>Prologue · The Call at 2:13 AM</div>
        <p className={`mt-6 font-display text-xl text-paper/90 ${show('line1')}`}>
          Your phone lights up on the nightstand. One new message from <span className="text-white">Daniel Reed</span>.
        </p>

        <div className={`mt-6 rounded-xl border border-line bg-night/90 p-5 shadow-2xl ${show('message')}`}>
          <div className="flex items-center justify-between font-mono text-[11px] text-fog">
            <span>DANIEL REED</span>
            <span>02:13</span>
          </div>
          <p className="mt-3 font-mono text-[15px] leading-relaxed text-paper">
            If you’re reading this, someone has already started rewriting the truth. Don’t trust the evidence.{' '}
            <span className="text-accent-soft">Find the original.</span>
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-md border border-line bg-black/40 p-2.5">
            <div className="cctv-still h-12 w-16 shrink-0 rounded" />
            <div className="text-xs">
              <div className="font-mono text-paper">IMG_0305.jpg</div>
              <div className="text-fog">Case GH-2021-0305 · Pell Street warehouse · 5 March 2021</div>
            </div>
          </div>
        </div>

        <p className={`mt-6 font-display text-lg text-paper/85 ${show('line2')}`}>You know that photograph. It ended your career five years ago.</p>
        <p className={`mt-2 font-display text-lg text-paper/85 ${show('line3')}`}>You have never met Daniel Reed. By morning, he is reported missing.</p>
        <p className={`mt-2 font-display text-lg text-paper/85 italic ${show('line4')}`}>Ninety minutes later, you’re standing in the rain across from his building.</p>

        <div className={`mt-10 flex items-center gap-4 ${show('begin')}`}>
          <Button variant="primary" onClick={beginPlay} className="px-6 py-2.5">
            Begin investigation
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-fog"><Kbd>Enter</Kbd></span>
        </div>
        {!shown.has('begin') && (
          <button type="button" onClick={beginPlay} className="fixed right-6 bottom-6 font-mono text-xs uppercase tracking-widest text-fog hover:text-paper">
            Skip ›
          </button>
        )}
      </div>
    </div>
  );
}
