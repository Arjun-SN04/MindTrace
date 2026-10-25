import {
  activeContradictions,
  canDiscover,
  computeCompletedObjectives,
  DISTRICT_ID,
  getClue,
  OBJECTIVES,
  SAVE_VERSION,
  type DiscoveredClue,
  type ProgressSnapshot,
  type SaveGame,
  type Vec3,
} from '@shared';
import { create } from 'zustand';
import { playerRuntime } from '../game/player/runtime';
import { SPAWN } from '../game/world/layout';
import { audio } from '../systems/audio/audioEngine';
import {
  fetchServerSave,
  readLocalSave,
  readSettings,
  syncSaveToServer,
  writeLocalSave,
  writeSettings,
} from '../systems/saves/saveSystem';

export type Screen = 'menu' | 'intro' | 'playing';
export type Overlay = null | 'pause' | 'settings' | 'journal' | 'map' | 'inspect' | 'complete';

export interface Settings {
  sensitivity: number;
  invertY: boolean;
  mouseLock: boolean;
  volume: number;
  quality: 'low' | 'high';
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1,
  invertY: false,
  mouseLock: true,
  volume: 0.7,
  quality: 'high',
};

export interface Toast {
  id: number;
  kind: 'evidence' | 'objective' | 'insight' | 'info' | 'location';
  title: string;
  body?: string;
}

type ServerStatus = 'unknown' | 'synced' | 'offline' | 'rejected';

interface GameState {
  screen: Screen;
  overlay: Overlay;
  /** Overlay to return to when closing settings. */
  settingsReturn: Overlay;

  // Authoritative-for-the-client progress (validated again by the server on save).
  discovered: Record<string, DiscoveredClue>;
  flags: string[];

  // Presentation state.
  focusedId: string | null;
  inspectingId: string | null;
  zoneName: string;
  indoors: boolean;
  pointerLocked: boolean;
  toasts: Toast[];
  lastInteractAt: number;
  teleport: { position: Vec3; yaw: number; nonce: number } | null;
  settings: Settings;
  hasSave: boolean;
  lastSavedAt: number | null;
  serverStatus: ServerStatus;

  newGame: () => void;
  beginPlay: () => void;
  continueGame: () => Promise<void>;
  quitToMenu: () => void;
  openOverlay: (o: Overlay) => void;
  closeOverlay: () => void;
  openSettings: () => void;
  inspect: (id: string) => void;
  discoverClue: (id: string) => boolean;
  interpretClue: (id: string) => boolean;
  setFlag: (flag: string, on?: boolean) => void;
  setFocused: (id: string | null) => void;
  setZone: (name: string, indoors: boolean) => void;
  setPointerLocked: (locked: boolean) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  saveGame: () => void;
}

let toastId = 1;
let teleportNonce = 1;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function progressOf(s: Pick<GameState, 'discovered' | 'flags'>): ProgressSnapshot {
  return { discovered: Object.values(s.discovered), flags: s.flags };
}

const initialSettings: Settings = { ...DEFAULT_SETTINGS, ...readSettings<Settings>() };
audio.setVolume(initialSettings.volume);

export const useGame = create<GameState>()((set, get) => {
  /** Runs after any progress change: objective toasts, chapter completion, autosave. */
  const afterProgress = (before: ProgressSnapshot) => {
    const after = progressOf(get());
    const was = new Set(computeCompletedObjectives(before));
    const now = computeCompletedObjectives(after);
    const newly = now.filter((id) => !was.has(id));
    for (const id of newly) {
      const obj = OBJECTIVES.find((o) => o.id === id);
      if (obj) get().pushToast({ kind: 'objective', title: 'Objective complete', body: obj.text });
    }
    const allDone = now.length === OBJECTIVES.length;
    if (allDone && newly.length && !after.flags.includes('prologue_complete_seen')) {
      setTimeout(() => {
        const s = get();
        if (s.screen === 'playing' && !s.flags.includes('prologue_complete_seen')) {
          s.setFlag('prologue_complete_seen');
          s.openOverlay('complete');
        }
      }, 1200);
    }
    get().saveGame();
  };

  return {
    screen: 'menu',
    overlay: null,
    settingsReturn: null,
    discovered: {},
    flags: [],
    focusedId: null,
    inspectingId: null,
    zoneName: '',
    indoors: false,
    pointerLocked: false,
    toasts: [],
    lastInteractAt: 0,
    teleport: null,
    settings: initialSettings,
    hasSave: !!readLocalSave(),
    lastSavedAt: readLocalSave()?.savedAt ?? null,
    serverStatus: 'unknown',

    newGame: () => {
      audio.unlock();
      const now = Date.now();
      set({
        screen: 'intro',
        overlay: null,
        discovered: { clue_reed_message: { id: 'clue_reed_message', discoveredAt: now, interpreted: false } },
        flags: ['prologue_started'],
        toasts: [],
        focusedId: null,
        inspectingId: null,
        teleport: { position: [...SPAWN.position], yaw: SPAWN.yaw, nonce: teleportNonce++ },
      });
    },

    beginPlay: () => {
      audio.unlock();
      set({ screen: 'playing', overlay: null });
      get().pushToast({ kind: 'objective', title: 'New objective', body: OBJECTIVES[0].text });
      get().saveGame();
    },

    continueGame: async () => {
      audio.unlock();
      let save = readLocalSave();
      const remote = await fetchServerSave();
      if (remote && (!save || remote.savedAt > save.savedAt)) save = remote;
      if (!save) return;
      const discovered: Record<string, DiscoveredClue> = {};
      for (const d of save.discovered) if (getClue(d.id)) discovered[d.id] = d;
      set({
        screen: 'playing',
        overlay: null,
        discovered,
        flags: save.flags,
        toasts: [],
        teleport: { position: save.position, yaw: save.yaw, nonce: teleportNonce++ },
      });
      get().pushToast({ kind: 'info', title: 'Investigation resumed' });
    },

    quitToMenu: () => {
      get().saveGame();
      if (document.pointerLockElement) document.exitPointerLock();
      set({ screen: 'menu', overlay: null, focusedId: null, inspectingId: null });
    },

    openOverlay: (o) => {
      set({ overlay: o });
      if (o && document.pointerLockElement) document.exitPointerLock();
      if (o === 'pause') get().saveGame();
    },

    closeOverlay: () => {
      const { overlay, settingsReturn } = get();
      if (overlay === 'settings' && settingsReturn) set({ overlay: settingsReturn, settingsReturn: null });
      else set({ overlay: null, inspectingId: null, settingsReturn: null });
    },

    openSettings: () => {
      set({ settingsReturn: get().overlay, overlay: 'settings' });
    },

    inspect: (id) => {
      set({ inspectingId: id, lastInteractAt: performance.now() });
      get().openOverlay('inspect');
    },

    discoverClue: (id) => {
      const s = get();
      const before = progressOf(s);
      if (s.discovered[id] || !canDiscover(id, before)) return false;
      const clue = getClue(id)!;
      set({ discovered: { ...s.discovered, [id]: { id, discoveredAt: Date.now(), interpreted: false } } });
      audio.evidence();
      get().pushToast({ kind: 'evidence', title: 'Added to case file', body: clue.name });
      const newContra = activeContradictions(progressOf(get())).filter((c) => !activeContradictions(before).includes(c));
      for (const c of newContra) get().pushToast({ kind: 'insight', title: 'Contradiction found', body: c.title });
      afterProgress(before);
      return true;
    },

    interpretClue: (id) => {
      const s = get();
      const d = s.discovered[id];
      const clue = getClue(id);
      if (!d || d.interpreted || !clue?.interpretation) return false;
      const before = progressOf(s);
      set({ discovered: { ...s.discovered, [id]: { ...d, interpreted: true } } });
      audio.insight();
      get().pushToast({ kind: 'insight', title: 'New insight', body: clue.name });
      const newContra = activeContradictions(progressOf(get())).filter((c) => !activeContradictions(before).includes(c));
      for (const c of newContra) get().pushToast({ kind: 'insight', title: 'Contradiction found', body: c.title });
      afterProgress(before);
      return true;
    },

    setFlag: (flag, on = true) => {
      const s = get();
      const has = s.flags.includes(flag);
      if (has === on) return;
      const before = progressOf(s);
      set({ flags: on ? [...s.flags, flag] : s.flags.filter((f) => f !== flag) });
      if (flag !== 'door_1c_open') afterProgress(before);
    },

    setFocused: (id) => {
      if (get().focusedId !== id) set({ focusedId: id });
    },

    setZone: (name, indoors) => {
      if (get().zoneName === name) return;
      const prev = get().zoneName;
      set({ zoneName: name, indoors });
      audio.setIndoors(indoors);
      if (prev && get().screen === 'playing') get().pushToast({ kind: 'location', title: name });
    },

    setPointerLocked: (locked) => set({ pointerLocked: locked }),

    pushToast: (t) => {
      const id = toastId++;
      set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
      setTimeout(() => get().dismissToast(id), t.kind === 'location' ? 2600 : 4800);
    },

    dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

    updateSettings: (patch) => {
      const settings = { ...get().settings, ...patch };
      set({ settings });
      writeSettings(settings);
      if (patch.volume !== undefined) audio.setVolume(patch.volume);
    },

    saveGame: () => {
      const s = get();
      if (s.screen === 'menu' && !s.flags.length) return;
      if (!s.flags.includes('prologue_started')) return;
      const progress = progressOf(s);
      const save: SaveGame = {
        version: SAVE_VERSION,
        savedAt: Date.now(),
        district: DISTRICT_ID,
        position: [...playerRuntime.position],
        yaw: playerRuntime.yaw,
        discovered: progress.discovered,
        flags: progress.flags,
        completedObjectives: computeCompletedObjectives(progress),
      };
      writeLocalSave(save);
      set({ hasSave: true, lastSavedAt: save.savedAt });
      // Debounce server sync so bursts of progress produce one request.
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(async () => {
        const result = await syncSaveToServer(save);
        set({ serverStatus: result.status });
        if (result.status === 'rejected') console.warn('[save] Server rejected save:', result.details);
      }, 600);
    },
  };
});

// Dev-only hook for automated testing and debugging in the browser console.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__mindtrace = {
    store: useGame,
    runtime: playerRuntime,
    teleport: (position: Vec3, yaw = 0) => useGame.setState({ teleport: { position, yaw, nonce: teleportNonce++ } }),
  };
}
