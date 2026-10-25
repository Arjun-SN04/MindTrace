import {
  activeContradictions,
  CASE_TITLE,
  CHARACTERS,
  CLUES,
  getClue,
  type ClueDefinition,
  type EvidenceType,
  type TimelineEntry,
} from '@shared';
import { useEffect, useMemo, useState } from 'react';
import { progressOf, useGame } from '../state/gameStore';
import { relockPointer } from '../systems/evidence/interact';
import { Badge, Button, Kbd, Kicker, Modal } from './ui';

type Tab = 'evidence' | 'timeline' | 'contradictions' | 'people';

const TYPE_LABEL: Record<EvidenceType, string> = {
  message: 'Message',
  digital: 'Digital record',
  physical: 'Physical',
  document: 'Document',
  footage: 'Footage',
  photograph: 'Photograph',
};

const TYPE_ICON: Record<EvidenceType, string> = {
  message: '✉',
  digital: '⌗',
  physical: '◉',
  document: '¶',
  footage: '▣',
  photograph: '▤',
};

const LOCATION_LABEL: Record<string, string> = {
  calloway_street: 'Calloway Street',
  halvorsen_lobby: 'Halvorsen lobby',
  unit_1c: 'Unit 1C',
  noctua_alley: 'Alley beside Café Noctua',
  alex_phone: 'Your phone',
};

const reliabilityTone = { verified: 'ok', unverified: 'warn', questionable: 'bad' } as const;

/** Night-of ordering: times before noon belong to the following morning. */
function sortKey(time: string) {
  const [h, m] = time.split(':').map(Number);
  return (h < 12 ? h + 24 : h) * 60 + m;
}

function EvidenceTab({ found }: { found: ClueDefinition[] }) {
  const discovered = useGame((s) => s.discovered);
  const [selected, setSelected] = useState(found[found.length - 1]?.id ?? null);
  const clue = selected ? getClue(selected) : undefined;
  const d = clue ? discovered[clue.id] : undefined;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-5 md:grid-cols-[18rem_1fr]">
      <ul className="scroll-thin min-h-0 space-y-1.5 overflow-y-auto pr-1" aria-label="Evidence">
        {found.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${selected === c.id ? 'border-accent/60 bg-accent/10' : 'border-line hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 text-center text-fog" aria-hidden>{TYPE_ICON[c.type]}</span>
                <span className="text-sm text-paper">{c.name}</span>
                {c.interpretation && !discovered[c.id]?.interpreted && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-warn" title="Can be examined further" />}
              </div>
              <div className="mt-0.5 pl-6 text-xs text-dim">{c.summary}</div>
            </button>
          </li>
        ))}
        {Array.from({ length: CLUES.length - found.length }, (_, i) => (
          <li key={`u${i}`} className="rounded-lg border border-dashed border-line px-3 py-2.5 text-xs text-dim">
            Undiscovered evidence
          </li>
        ))}
      </ul>

      {clue && (
        <article className="scroll-thin min-h-0 overflow-y-auto rounded-lg border border-line bg-black/20 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{TYPE_LABEL[clue.type]}</Badge>
            <Badge tone={clue.status === 'confirmed' ? 'ok' : clue.status === 'disproven' ? 'bad' : 'neutral'}>{clue.status}</Badge>
            <Badge tone={reliabilityTone[clue.reliability]}>{clue.reliability}</Badge>
          </div>
          <h3 className="mt-3 font-display text-2xl text-white">{clue.name}</h3>
          <div className="mt-1 text-xs text-fog">
            Found: {LOCATION_LABEL[clue.location] ?? clue.location}
            {d && ` · ${new Date(d.discoveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-paper/90">{clue.description}</p>

          {clue.interpretation &&
            (d?.interpreted ? (
              <div className="mt-4 rounded-lg border border-ok/30 bg-ok/5 p-4">
                <Kicker className="!text-ok">Insight</Kicker>
                <p className="mt-1.5 text-sm leading-relaxed text-paper">{clue.interpretation.insight}</p>
              </div>
            ) : (
              <p className="mt-4 border-l-2 border-warn pl-3 text-sm text-paper/80 italic">There may be more to this. Go back and examine it more closely.</p>
            ))}

          {(clue.timestamps.length > 0 || (d?.interpreted && clue.interpretation?.timestamps)) && (
            <div className="mt-5">
              <Kicker>Timestamps</Kicker>
              <ul className="mt-2 space-y-1 font-mono text-[13px]">
                {[...clue.timestamps, ...(d?.interpreted ? clue.interpretation?.timestamps ?? [] : [])].map((t) => (
                  <li key={t.time + t.label} className="flex gap-3">
                    <span className="text-dim">{t.time}</span>
                    <span className="text-paper/90">{t.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-6">
            <div>
              <Kicker>People</Kicker>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {clue.relatedCharacters.map((id) => (
                  <Badge key={id}>{id === 'unknown' ? 'Unknown person' : CHARACTERS.find((c) => c.id === id)?.name}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Kicker>Linked evidence</Kicker>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {clue.links.map((id) =>
                  discovered[id] ? (
                    <button key={id} type="button" onClick={() => setSelected(id)} className="rounded border border-line px-1.5 py-0.5 text-xs text-paper hover:border-fog">
                      {getClue(id)?.name}
                    </button>
                  ) : (
                    <span key={id} className="rounded border border-dashed border-line px-1.5 py-0.5 text-xs text-dim">
                      Unknown lead
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}

function TimelineTab({ found }: { found: ClueDefinition[] }) {
  const discovered = useGame((s) => s.discovered);
  const flags = useGame((s) => s.flags);
  const contradictionClues = new Set(activeContradictions(progressOf({ discovered, flags })).flatMap((c) => c.clueIds));
  const entries = useMemo(() => {
    const out: (TimelineEntry & { clue: ClueDefinition })[] = [];
    for (const c of found) {
      for (const t of c.timestamps) out.push({ ...t, clue: c });
      if (discovered[c.id]?.interpreted) for (const t of c.interpretation?.timestamps ?? []) out.push({ ...t, clue: c });
    }
    return out.sort((a, b) => sortKey(a.time) - sortKey(b.time));
  }, [found, discovered]);

  if (!entries.length) return <p className="text-sm text-dim">No timestamped evidence yet.</p>;
  return (
    <ol className="scroll-thin relative h-full overflow-y-auto pl-6">
      <span className="absolute top-2 bottom-2 left-[7px] w-px bg-line" aria-hidden />
      {entries.map((e, i) => {
        const flagged = contradictionClues.has(e.clue.id);
        return (
          <li key={i} className="relative pb-4">
            <span className={`absolute top-1.5 -left-[22px] h-2.5 w-2.5 rounded-full border-2 ${flagged ? 'border-accent bg-accent/40' : 'border-fog bg-ink'}`} />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-sm text-white">{e.time}</span>
              <span className="text-sm text-paper/90">{e.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-dim">
              <span>{e.clue.name}</span>
              <Badge tone={reliabilityTone[e.clue.reliability]}>{e.clue.reliability}</Badge>
              {flagged && <Badge tone="accent">conflict</Badge>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ContradictionsTab() {
  const discovered = useGame((s) => s.discovered);
  const flags = useGame((s) => s.flags);
  const setFlag = useGame((s) => s.setFlag);
  const list = activeContradictions(progressOf({ discovered, flags }));

  useEffect(() => {
    if (list.length && !flags.includes('reviewed_contradiction')) setFlag('reviewed_contradiction');
  }, [list.length, flags, setFlag]);

  if (!list.length) {
    return (
      <div className="max-w-lg text-sm leading-relaxed text-paper/80">
        <p>No contradictions confirmed yet.</p>
        <p className="mt-2 text-dim">
          Compare times between records. Some evidence only contradicts something else after you examine it closely. Look for the amber dot in the evidence list.
        </p>
      </div>
    );
  }
  return (
    <ul className="scroll-thin h-full space-y-3 overflow-y-auto">
      {list.map((c) => (
        <li key={c.id} className="rounded-lg border border-accent/30 bg-accent/5 p-5">
          <Kicker className="!text-accent-soft">Contradiction</Kicker>
          <h3 className="mt-1 font-display text-xl text-white">{c.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-paper/90">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.clueIds.map((id) => (
              <Badge key={id}>{getClue(id)?.name}</Badge>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PeopleTab({ found }: { found: ClueDefinition[] }) {
  return (
    <ul className="scroll-thin grid h-full gap-3 overflow-y-auto sm:grid-cols-2">
      {CHARACTERS.map((p) => {
        const mentions = found.filter((c) => c.relatedCharacters.includes(p.id));
        return (
          <li key={p.id} className="rounded-lg border border-line bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-night font-display text-lg text-fog">
                {p.name.split(' ').map((w) => w[0]).join('')}
              </div>
              <div>
                <div className="font-display text-lg text-white">{p.name}</div>
                <div className="text-xs text-fog">{p.role}</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-paper/80">{p.publicBio}</p>
            <div className="mt-3 text-xs text-dim">
              {mentions.length ? (
                <>Appears in: {mentions.map((m) => m.name).join(', ')}</>
              ) : (
                'No evidence links yet.'
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CaseJournal() {
  const discovered = useGame((s) => s.discovered);
  const flags = useGame((s) => s.flags);
  const closeOverlay = useGame((s) => s.closeOverlay);
  const [tab, setTab] = useState<Tab>('evidence');
  const found = useMemo(
    () => CLUES.filter((c) => discovered[c.id]).sort((a, b) => discovered[a.id].discoveredAt - discovered[b.id].discoveredAt),
    [discovered],
  );
  const contradictions = activeContradictions(progressOf({ discovered, flags }));
  const close = () => {
    closeOverlay();
    relockPointer();
  };

  const tabs: { id: Tab; label: string; count?: number; alert?: boolean }[] = [
    { id: 'evidence', label: 'Evidence', count: found.length },
    { id: 'timeline', label: 'Timeline' },
    { id: 'contradictions', label: 'Contradictions', count: contradictions.length, alert: contradictions.length > 0 && !flags.includes('reviewed_contradiction') },
    { id: 'people', label: 'People' },
  ];

  return (
    <Modal label="Case file" onClose={close} className="flex h-[min(46rem,92vh)] w-full max-w-5xl flex-col p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Kicker>Case file · GH-2026-1023</Kicker>
          <h2 className="mt-1 font-display text-3xl text-white">{CASE_TITLE}</h2>
        </div>
        <Button onClick={close}>
          Close <Kbd>J</Kbd>
        </Button>
      </header>
      <nav className="mt-5 flex gap-1 border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition ${tab === t.id ? 'border-accent text-white' : 'border-transparent text-fog hover:text-paper'}`}
          >
            {t.label}
            {t.count !== undefined && <span className="font-mono text-xs text-dim">{t.count}</span>}
            {t.alert && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
          </button>
        ))}
      </nav>
      <div className="mt-5 min-h-0 flex-1">
        {tab === 'evidence' && <EvidenceTab found={found} />}
        {tab === 'timeline' && <TimelineTab found={found} />}
        {tab === 'contradictions' && <ContradictionsTab />}
        {tab === 'people' && <PeopleTab found={found} />}
      </div>
    </Modal>
  );
}
