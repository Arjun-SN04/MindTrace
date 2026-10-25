import { useGame } from '../state/gameStore';
import { relockPointer } from '../systems/evidence/interact';
import { Button, Kicker, Modal } from './ui';

export function PauseMenu() {
  const { closeOverlay, openOverlay, openSettings, quitToMenu, saveGame, lastSavedAt, serverStatus } = useGame();
  const resume = () => {
    closeOverlay();
    relockPointer();
  };
  const serverText = {
    unknown: 'not yet synced',
    synced: 'synced to case server',
    offline: 'server offline — local only',
    rejected: 'server rejected save — local only',
  }[serverStatus];

  return (
    <Modal label="Paused" onClose={resume} className="w-full max-w-sm p-7">
      <Kicker>Paused</Kicker>
      <h2 className="mt-1 font-display text-3xl text-white">The Missing Researcher</h2>
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="primary" onClick={resume} autoFocus>
          Resume
        </Button>
        <Button onClick={() => openOverlay('journal')}>Case file</Button>
        <Button onClick={() => openOverlay('map')}>Map</Button>
        <Button onClick={openSettings}>Settings</Button>
        <Button onClick={saveGame}>Save now</Button>
        <Button variant="danger" onClick={quitToMenu}>
          Save &amp; quit to main menu
        </Button>
      </div>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-dim">
        {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${serverText}` : 'Not saved yet'}
      </p>
    </Modal>
  );
}
