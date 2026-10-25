import { getClue } from '@shared';
import { useState, type FormEvent } from 'react';
import { getInteractable, type InteractableDef } from '../game/interaction/interactables';
import { useGame } from '../state/gameStore';
import { audio } from '../systems/audio/audioEngine';
import { relockPointer } from '../systems/evidence/interact';
import { Badge, Button, Kbd, Kicker, Modal } from './ui';

function useClueState(clueId?: string) {
  const d = useGame((s) => (clueId ? s.discovered[clueId] : undefined));
  return { discovered: !!d, interpreted: !!d?.interpreted };
}

function Findings({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((f) => (
        <li key={f} className="flex gap-3 text-sm leading-relaxed text-paper/90">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function AddButton({ clueId }: { clueId: string }) {
  const discoverClue = useGame((s) => s.discoverClue);
  const { discovered } = useClueState(clueId);
  if (discovered) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ok">
        <span aria-hidden>✓</span> In case file
      </span>
    );
  }
  return (
    <Button variant="primary" onClick={() => discoverClue(clueId)} autoFocus>
      Add to case file
    </Button>
  );
}

function Insight({ clueId, allowAction = true }: { clueId: string; allowAction?: boolean }) {
  const clue = getClue(clueId)!;
  const { discovered, interpreted } = useClueState(clueId);
  const { discoverClue, interpretClue } = useGame();
  if (!clue.interpretation) return null;
  if (interpreted) {
    return (
      <div className="mt-5 animate-rise rounded-lg border border-ok/30 bg-ok/5 p-4">
        <Kicker className="!text-ok">Insight</Kicker>
        <p className="mt-1.5 text-sm leading-relaxed text-paper">{clue.interpretation.insight}</p>
      </div>
    );
  }
  if (!allowAction) return null;
  return (
    <div className="mt-5">
      <Button
        onClick={() => {
          if (!discovered) discoverClue(clueId);
          interpretClue(clueId);
        }}
      >
        <span className="text-accent-soft">◆</span> {clue.interpretation.action}
      </Button>
    </div>
  );
}

// ---- Laptop ----
const PASSCODE = '0305';

function PasscodeView({ def }: { def: InteractableDef }) {
  const clue = getClue(def.clueId!)!;
  const { discovered } = useClueState(def.clueId);
  const discoverClue = useGame((s) => s.discoverClue);
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);

  if (discovered) {
    const lines = [
      { t: '21:04', from: 'Maya', text: 'We need to talk about the numbers before Friday. Not over the phone.', tone: 'text-paper' },
      { t: '22:15', from: 'Unknown number', text: 'Stop digging into GH-2021-0305. Last warning.', tone: 'text-accent-soft' },
      { t: '23:09', from: 'Draft → Alex Mercer', text: 'They changed the timestamps. The original is…', tone: 'text-warn' },
    ];
    return (
      <div className="mt-4 rounded-lg border border-line bg-black/40 p-4 font-mono text-[13px]">
        <div className="mb-3 flex justify-between text-[11px] text-fog">
          <span>MESSAGES — recovered from cache</span>
          <span className="text-warn">STORAGE DRIVE: NOT FOUND</span>
        </div>
        <ul className="space-y-2.5">
          {lines.map((l) => (
            <li key={l.t} className="grid grid-cols-[3.2rem_1fr] gap-2">
              <span className="text-dim">{l.t}</span>
              <span>
                <span className="text-fog">{l.from}: </span>
                <span className={l.tone}>{l.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-sans text-xs text-dim">{clue.summary}</p>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.replace(/\D/g, '') === PASSCODE) {
      discoverClue(def.clueId!);
    } else {
      audio.error();
      setAttempts((a) => a + 1);
      setError(true);
      setTimeout(() => setError(false), 400);
      setCode('');
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 rounded-lg border border-line bg-[#0b1424] p-5">
      <div className="font-mono text-xs text-fog">D. REED — locked</div>
      <label className="mt-3 block text-sm text-paper" htmlFor="passcode">
        Enter passcode <span className="text-dim italic">— hint: “the day it started”</span>
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="passcode"
          autoFocus
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          className={`w-36 rounded-md border bg-black/50 px-3 py-2 font-mono text-lg tracking-[0.4em] text-white outline-none focus:border-fog ${error ? 'animate-shake border-accent' : 'border-line'}`}
          placeholder="••••"
          aria-invalid={error}
        />
        <Button variant="primary" type="submit">
          Unlock
        </Button>
      </div>
      {attempts > 0 && <p className="mt-2 text-xs text-accent-soft">Incorrect passcode. {attempts} failed attempt{attempts > 1 ? 's' : ''}.</p>}
      {attempts >= 2 && (
        <p className="mt-3 animate-rise border-l-2 border-brass pl-3 text-sm text-paper/85 italic">
          The day it started… Daniel’s message carried a case number you will never forget: GH-2021-<span className="text-white">0305</span>. The fifth of March.
        </p>
      )}
    </form>
  );
}

// ---- Smart lock ----
function LogView({ def }: { def: InteractableDef }) {
  const clue = getClue(def.clueId!)!;
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-line font-mono text-[13px]">
      <div className="bg-white/5 px-4 py-2 text-[11px] text-fog">ACCESS LOG — UNIT 1C — LAST 24H</div>
      <table className="w-full">
        <tbody>
          {clue.timestamps.map((t) => (
            <tr key={t.time} className="border-t border-line">
              <td className="px-4 py-2 text-dim">{t.time}</td>
              <td className={`px-4 py-2 ${t.label.includes('guest') ? 'text-warn' : 'text-paper'}`}>{t.label.replace('Unit 1C ', '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- CCTV ----
const FRAMES = [
  { time: '21:57:12', frame: '13,032', text: 'Daniel Reed enters, soaked, a laptop bag over one shoulder. He glances back at the street.', person: true },
  { time: '22:40:03', frame: '15,603', text: 'Lobby empty. Rain on the glass.', person: false },
  { time: '23:11:58', frame: '18,844', text: 'Lobby empty. The ceiling light flickers.', person: false },
  { time: '23:39:41', frame: '20,456', text: 'Lobby empty. Puddles on the tiles that were not there before.', person: false },
  { time: '23:46:20', frame: '20,855', text: 'A figure in a long grey coat crosses to the street, umbrella low, and turns toward the alley beside Café Noctua.', person: true },
  { time: '23:58:02', frame: '21,557', text: 'Lobby empty.', person: false },
];
const ANOMALY = 3;

function CctvView({ def }: { def: InteractableDef }) {
  const { discovered, interpreted } = useClueState(def.clueId);
  const { discoverClue, interpretClue } = useGame();
  const [i, setI] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const f = FRAMES[i];

  const flag = () => {
    if (i === ANOMALY) {
      if (!discovered) discoverClue(def.clueId!);
      interpretClue(def.clueId!);
      setFeedback(null);
    } else {
      audio.error();
      setFeedback(i === ANOMALY - 1 ? 'Nothing wrong with this frame itself. Compare it with the one after it.' : 'Nothing irregular about this frame.');
    }
  };

  return (
    <div className="mt-4">
      <div className="cctv-still relative aspect-video overflow-hidden rounded-lg border border-line">
        <div className="absolute top-2 left-3 font-mono text-[11px] text-[#9fe0b5]">CAM 1 · LOBBY</div>
        <div className="absolute top-2 right-3 font-mono text-[11px] text-[#9fe0b5]">FRAME {f.frame}</div>
        <div className="absolute bottom-2 left-3 font-mono text-sm text-[#cfeedd]">{f.time}</div>
        {f.person && <div className="absolute bottom-6 left-1/2 h-24 w-10 -translate-x-1/2 rounded-t-full bg-black/70 blur-[1px]" />}
        <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 text-center font-mono text-xs text-[#cfeedd]/90">{f.text}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0} aria-label="Previous frame">
          ‹
        </Button>
        <input
          type="range"
          min={0}
          max={FRAMES.length - 1}
          value={i}
          onChange={(e) => {
            setI(Number(e.target.value));
            setFeedback(null);
          }}
          className="flex-1"
          aria-label="Scrub footage"
        />
        <Button onClick={() => setI((n) => Math.min(FRAMES.length - 1, n + 1))} disabled={i === FRAMES.length - 1} aria-label="Next frame">
          ›
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!discovered && <Button variant="primary" onClick={() => discoverClue(def.clueId!)}>Save footage to case file</Button>}
        {!interpreted && <Button onClick={flag}><span className="text-accent-soft">◆</span> Flag anomaly at this frame</Button>}
        {discovered && !interpreted && <span className="text-xs text-dim">Something about the recording doesn’t add up. Watch the frame counter.</span>}
      </div>
      {feedback && <p className="mt-2 text-xs text-accent-soft">{feedback}</p>}
    </div>
  );
}

export function InspectPanel() {
  const id = useGame((s) => s.inspectingId);
  const closeOverlay = useGame((s) => s.closeOverlay);
  const def = id ? getInteractable(id) : undefined;
  const clue = def?.clueId ? getClue(def.clueId) : undefined;
  const { discovered } = useClueState(def?.clueId);
  if (!def) return null;

  const close = () => {
    closeOverlay();
    relockPointer();
  };

  return (
    <Modal label={def.title} onClose={close} className="scroll-thin max-h-[90vh] w-full max-w-xl overflow-y-auto p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Kicker>{def.kind === 'evidence' ? 'Investigate' : 'Observe'}</Kicker>
          <h2 className="mt-1 font-display text-3xl text-white">{def.title}</h2>
        </div>
        {clue && (
          <div className="flex flex-col items-end gap-1 pt-1">
            <Badge tone={discovered ? 'ok' : 'accent'}>{discovered ? 'Collected' : 'Evidence'}</Badge>
            <Badge>{clue.type}</Badge>
          </div>
        )}
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-paper/85">{def.description}</p>

      {def.mechanic === 'passcode' && <PasscodeView def={def} />}
      {def.mechanic === 'log' && <LogView def={def} />}
      {def.mechanic === 'cctv' && <CctvView def={def} />}
      {def.findings && def.mechanic !== 'cctv' && <Findings items={def.findings} />}
      {clue && def.mechanic !== 'passcode' && <Insight clueId={clue.id} allowAction={def.mechanic !== 'cctv'} />}

      <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
        <div>{clue && (def.mechanic !== 'passcode' || discovered) && <AddButton clueId={clue.id} />}</div>
        <Button onClick={close} autoFocus={!clue}>
          Close <Kbd>Esc</Kbd>
        </Button>
      </div>
    </Modal>
  );
}
