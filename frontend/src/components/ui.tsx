import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { audio } from '../systems/audio/audioEngine';

type Variant = 'primary' | 'ghost' | 'menu' | 'danger';

export function Button({
  variant = 'ghost',
  className = '',
  children,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    'inline-flex items-center justify-center gap-2 transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40';
  const styles: Record<Variant, string> = {
    primary: 'rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#e04b60] active:translate-y-px',
    ghost: 'rounded-md border border-line px-4 py-2 text-sm text-paper hover:border-fog/50 hover:bg-white/5',
    danger: 'rounded-md border border-accent/40 px-4 py-2 text-sm text-accent-soft hover:bg-accent/10',
    menu:
      'group w-full justify-start border-l-2 border-transparent px-4 py-2.5 text-left font-display text-2xl tracking-wide text-paper/80 hover:border-accent hover:bg-gradient-to-r hover:from-accent/10 hover:to-transparent hover:text-white',
  };
  return (
    <button
      type="button"
      className={`${base} ${styles[variant]} ${className}`}
      onClick={(e) => {
        audio.ui();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.6rem] items-center justify-center rounded border border-paper/30 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-paper shadow-[0_1px_0_rgba(255,255,255,0.15)]">
      {children}
    </kbd>
  );
}

export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`font-mono text-[11px] uppercase tracking-[0.22em] text-fog ${className}`}>{children}</div>;
}

/** A centred modal panel over a dimmed backdrop. */
export function Modal({
  children,
  onClose,
  className = '',
  label,
}: {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  label: string;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex animate-fade-in items-center justify-center bg-ink/70 p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className={`animate-rise rounded-xl border border-line bg-panel shadow-2xl shadow-black/60 ${className}`}>{children}</div>
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' }) {
  const tones = {
    neutral: 'border-line text-fog',
    ok: 'border-ok/40 text-ok',
    warn: 'border-warn/40 text-warn',
    bad: 'border-accent/40 text-accent-soft',
    accent: 'border-accent/50 bg-accent/10 text-accent-soft',
  };
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        audio.ui();
        onChange(!checked);
      }}
      className={`relative h-6 w-11 rounded-full border transition focus-visible:outline-2 focus-visible:outline-accent ${checked ? 'border-accent bg-accent/70' : 'border-line bg-white/5'}`}
    >
      <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-paper transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} />
    </button>
  );
}
