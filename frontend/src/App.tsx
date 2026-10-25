import { useEffect, useState } from 'react';
import { CaseJournal } from './components/CaseJournal';
import { ChapterComplete } from './components/ChapterComplete';
import { Hud } from './components/Hud';
import { InspectPanel } from './components/InspectPanel';
import { Intro } from './components/Intro';
import { MainMenu } from './components/MainMenu';
import { MapOverlay } from './components/MapOverlay';
import { PauseMenu } from './components/PauseMenu';
import { SettingsPanel } from './components/SettingsPanel';
import { GameCanvas } from './game/GameCanvas';
import { useGame } from './state/gameStore';
import { interact, relockPointer } from './systems/evidence/interact';

/** Global hotkeys for menus and interaction. Movement keys are handled in the game loop. */
function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
      const s = useGame.getState();
      if (s.screen !== 'playing') {
        if (e.code === 'Escape' && s.overlay === 'settings') s.closeOverlay();
        return;
      }

      if (e.code === 'Escape') {
        if (s.overlay) s.closeOverlay();
        else s.openOverlay('pause');
        return;
      }
      if (typing) return;

      const toggle = (o: 'journal' | 'map') => {
        if (s.overlay === o) {
          s.closeOverlay();
          relockPointer();
        } else if (s.overlay === null || s.overlay === 'pause' || s.overlay === 'journal' || s.overlay === 'map') {
          s.openOverlay(o);
        }
      };

      switch (e.code) {
        case 'KeyE':
          if (s.overlay === null && s.focusedId) interact(s.focusedId);
          else if (s.overlay === 'inspect') {
            s.closeOverlay();
            relockPointer();
          }
          break;
        case 'KeyJ':
          toggle('journal');
          break;
        case 'KeyM':
          toggle('map');
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function LoadingScreen({ fading }: { fading: boolean }) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink transition-opacity duration-700 ${fading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
      <div className="font-display text-4xl tracking-[0.2em] text-white">MINDTRACE</div>
      <div className="mt-3 font-mono text-xs uppercase tracking-[0.35em] text-fog">Loading Greyhaven…</div>
      <div className="mt-6 h-px w-48 overflow-hidden bg-line">
        <div className="h-full w-1/3 bg-accent" style={{ animation: "loading-bar 1.2s ease-in-out infinite alternate" }} />
      </div>
      <style>{'@keyframes loading-bar{from{transform:translateX(-100%)}to{transform:translateX(300%)}}'}</style>
    </div>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function App() {
  const screen = useGame((s) => s.screen);
  const overlay = useGame((s) => s.overlay);
  const [fontsReady, setFontsReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const [webgl] = useState(hasWebGL);
  useHotkeys();

  useEffect(() => {
    // Canvas-drawn signs need the web fonts loaded first.
    const fonts = ['600 40px "Playfair Display"', 'italic 600 40px "Playfair Display"', '600 40px "IBM Plex Sans"', '400 40px "IBM Plex Mono"'];
    Promise.all(fonts.map((f) => document.fonts.load(f)))
      .catch(() => undefined)
      .finally(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    if (!sceneReady) return;
    const id = setTimeout(() => setLoaderGone(true), 900);
    return () => clearTimeout(id);
  }, [sceneReady]);

  // Autosave every 30 s while playing.
  useEffect(() => {
    if (screen !== 'playing') return;
    const id = setInterval(() => useGame.getState().saveGame(), 30000);
    const onHide = () => useGame.getState().saveGame();
    window.addEventListener('beforeunload', onHide);
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', onHide);
    };
  }, [screen]);

  if (!webgl) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <h1 className="font-display text-3xl text-white">MINDTRACE needs WebGL</h1>
          <p className="mt-3 text-fog">Your browser or device has WebGL disabled. Try a recent version of Chrome, Edge or Firefox with hardware acceleration enabled.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {fontsReady && <GameCanvas onReady={() => setTimeout(() => setSceneReady(true), 300)} />}
      {screen === 'menu' && <MainMenu />}
      {screen === 'intro' && <Intro />}
      {screen === 'playing' && <Hud />}
      {overlay === 'pause' && <PauseMenu />}
      {overlay === 'settings' && <SettingsPanel />}
      {overlay === 'inspect' && <InspectPanel />}
      {overlay === 'journal' && <CaseJournal />}
      {overlay === 'map' && <MapOverlay />}
      {overlay === 'complete' && <ChapterComplete />}
      {!loaderGone && <LoadingScreen fading={sceneReady} />}
    </>
  );
}
