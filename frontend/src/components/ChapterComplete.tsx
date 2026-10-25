import { activeContradictions, CLUES, CONTRADICTIONS } from '@shared';
import { progressOf, useGame } from '../state/gameStore';
import { relockPointer } from '../systems/evidence/interact';
import { Button, Kicker, Modal } from './ui';

export function ChapterComplete() {
  const discovered = useGame((s) => s.discovered);
  const flags = useGame((s) => s.flags);
  const { closeOverlay, openOverlay, quitToMenu } = useGame();
  const found = Object.values(discovered);
  const insights = found.filter((d) => d.interpreted).length;
  const totalInsights = CLUES.filter((c) => c.interpretation).length;
  const contradictions = activeContradictions(progressOf({ discovered, flags })).length;

  const stats = [
    { label: 'Evidence', value: `${found.length}/${CLUES.length}` },
    { label: 'Insights', value: `${insights}/${totalInsights}` },
    { label: 'Contradictions', value: `${contradictions}/${CONTRADICTIONS.length}` },
  ];

  return (
    <Modal label="Prologue complete" className="w-full max-w-lg p-8 text-center">
      <Kicker className="!text-accent-soft">Prologue complete</Kicker>
      <h2 className="mt-2 font-display text-4xl text-white">The Missing Researcher</h2>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-paper/85">
        Someone came into Daniel’s apartment during the missing footage. Someone made a call to “E.M.” from the alley. Three names keep surfacing: Maya Chen, Inspector Rao and Elias Moreau.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-black/30 py-3">
            <div className="font-display text-2xl text-white">{s.value}</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fog">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-dim">
        Interrogations, the evidence board and the chapter endings come in the next build. Your progress is saved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          variant="primary"
          onClick={() => {
            closeOverlay();
            relockPointer();
          }}
          autoFocus
        >
          Keep exploring
        </Button>
        <Button onClick={() => openOverlay('journal')}>Open case file</Button>
        <Button onClick={quitToMenu}>Main menu</Button>
      </div>
    </Modal>
  );
}
