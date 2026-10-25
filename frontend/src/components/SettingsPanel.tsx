import type { ReactNode } from 'react';
import { DEFAULT_SETTINGS, useGame } from '../state/gameStore';
import { Button, Kicker, Modal, Toggle } from './ui';

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line py-3.5 last:border-0">
      <div>
        <div className="text-sm text-paper">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-dim">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPanel() {
  const { settings, updateSettings, closeOverlay } = useGame();
  return (
    <Modal label="Settings" onClose={closeOverlay} className="w-full max-w-md p-7">
      <Kicker>Settings</Kicker>
      <h2 className="mt-1 font-display text-3xl text-white">Preferences</h2>
      <div className="mt-4">
        <Row label="Mouse sensitivity" hint={`${settings.sensitivity.toFixed(2)}×`}>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.05}
            value={settings.sensitivity}
            onChange={(e) => updateSettings({ sensitivity: Number(e.target.value) })}
            aria-label="Mouse sensitivity"
            className="w-40"
          />
        </Row>
        <Row label="Invert vertical look">
          <Toggle label="Invert vertical look" checked={settings.invertY} onChange={(v) => updateSettings({ invertY: v })} />
        </Row>
        <Row label="Lock mouse to game" hint="Off: drag with the mouse to look around">
          <Toggle label="Lock mouse to game" checked={settings.mouseLock} onChange={(v) => updateSettings({ mouseLock: v })} />
        </Row>
        <Row label="Volume" hint={`${Math.round(settings.volume * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            aria-label="Volume"
            className="w-40"
          />
        </Row>
        <Row label="Graphics quality" hint="Low turns off bloom, shadows and reduces rain">
          <div className="flex overflow-hidden rounded-md border border-line">
            {(['low', 'high'] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => updateSettings({ quality: q })}
                className={`px-3 py-1.5 text-xs capitalize ${settings.quality === q ? 'bg-accent text-white' : 'text-fog hover:bg-white/5'}`}
              >
                {q}
              </button>
            ))}
          </div>
        </Row>
      </div>
      <div className="mt-6 flex justify-between">
        <Button onClick={() => updateSettings(DEFAULT_SETTINGS)}>Reset to defaults</Button>
        <Button variant="primary" onClick={closeOverlay} autoFocus>
          Done
        </Button>
      </div>
    </Modal>
  );
}
