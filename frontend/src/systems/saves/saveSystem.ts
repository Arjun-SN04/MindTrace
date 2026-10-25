// Local saves (always) plus best-effort sync to the backend.

import { SAVE_VERSION, type SaveGame } from '@shared';

const SAVE_KEY = 'mindtrace.save.v1';
const PLAYER_KEY = 'mindtrace.playerId';
const SETTINGS_KEY = 'mindtrace.settings.v1';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getPlayerId(): string {
  let id = safeGet(PLAYER_KEY);
  if (!id || !/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
    id = `p_${crypto.randomUUID().replace(/-/g, '')}`;
    safeSet(PLAYER_KEY, id);
  }
  return id;
}

export function readLocalSave(): SaveGame | null {
  const raw = safeGet(SAVE_KEY);
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as SaveGame;
    return save.version === SAVE_VERSION ? save : null;
  } catch {
    return null;
  }
}

export function writeLocalSave(save: SaveGame): boolean {
  return safeSet(SAVE_KEY, JSON.stringify(save));
}

export function readSettings<T>(): Partial<T> {
  try {
    return JSON.parse(safeGet(SETTINGS_KEY) ?? '{}') as Partial<T>;
  } catch {
    return {};
  }
}

export function writeSettings<T>(settings: T) {
  safeSet(SETTINGS_KEY, JSON.stringify(settings));
}

async function request(path: string, init?: RequestInit, timeoutMs = 4000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(path, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type SyncResult = { status: 'synced' } | { status: 'offline' } | { status: 'rejected'; details: string[] };

export async function syncSaveToServer(save: SaveGame): Promise<SyncResult> {
  try {
    const res = await request(`/api/saves/${getPlayerId()}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(save),
    });
    if (res.ok) return { status: 'synced' };
    if (res.status === 400 || res.status === 422) {
      const body = (await res.json().catch(() => ({}))) as { details?: string[] };
      return { status: 'rejected', details: body.details ?? [] };
    }
    return { status: 'offline' };
  } catch {
    return { status: 'offline' };
  }
}

export async function fetchServerSave(): Promise<SaveGame | null> {
  try {
    const res = await request(`/api/saves/${getPlayerId()}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { save?: SaveGame };
    return body.save?.version === SAVE_VERSION ? body.save : null;
  } catch {
    return null;
  }
}

export async function checkServer(): Promise<boolean> {
  try {
    const res = await request('/api/health', undefined, 2500);
    return res.ok;
  } catch {
    return false;
  }
}
