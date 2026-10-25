import mongoose from 'mongoose';
import type { SaveGame } from '../../../shared/src/index';
import { SaveModel } from '../models/Save';

export interface SaveStore {
  readonly kind: 'mongo' | 'memory';
  get(playerId: string): Promise<SaveGame | null>;
  put(playerId: string, save: SaveGame): Promise<void>;
}

class MemorySaveStore implements SaveStore {
  readonly kind = 'memory' as const;
  private saves = new Map<string, SaveGame>();
  async get(playerId: string) {
    return this.saves.get(playerId) ?? null;
  }
  async put(playerId: string, save: SaveGame) {
    this.saves.set(playerId, structuredClone(save));
  }
}

class MongoSaveStore implements SaveStore {
  readonly kind = 'mongo' as const;
  async get(playerId: string): Promise<SaveGame | null> {
    const doc = await SaveModel.findOne({ playerId }).lean<SaveGame & { playerId: string }>();
    if (!doc) return null;
    return {
      version: doc.version,
      savedAt: doc.savedAt,
      district: doc.district,
      position: doc.position,
      yaw: doc.yaw,
      discovered: doc.discovered.map((d) => ({ id: d.id, discoveredAt: d.discoveredAt, interpreted: d.interpreted })),
      flags: doc.flags,
      completedObjectives: doc.completedObjectives,
    };
  }
  async put(playerId: string, save: SaveGame) {
    await SaveModel.updateOne({ playerId }, { $set: { ...save, playerId } }, { upsert: true });
  }
}

let store: SaveStore = new MemorySaveStore();

export function getSaveStore(): SaveStore {
  return store;
}

/** Connects to MongoDB when a URI is configured; otherwise keeps the in-memory store. */
export async function initSaveStore(uri: string | undefined): Promise<void> {
  if (!uri) {
    console.warn('[saves] MONGODB_URI not set — using in-memory saves (lost on restart).');
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    store = new MongoSaveStore();
    console.log('[saves] Connected to MongoDB.');
  } catch (err) {
    console.warn(`[saves] Could not connect to MongoDB (${(err as Error).message}) — using in-memory saves.`);
  }
}

export function setSaveStoreForTests(s: SaveStore) {
  store = s;
}

export function createMemoryStore(): SaveStore {
  return new MemorySaveStore();
}
