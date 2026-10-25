import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import {
  activeContradictions,
  computeCompletedObjectives,
  currentObjective,
  validateProgress,
  type SaveGame,
} from '../../shared/src/index';

process.env.MONGODB_URI = '';
const { createApp } = await import('../src/app');

const t0 = 1_700_000_000_000;
const d = (id: string, offset: number, interpreted = false) => ({ id, discoveredAt: t0 + offset, interpreted });

test('a fresh game is valid and points at the first objective', () => {
  const p = { discovered: [d('clue_reed_message', 0)], flags: ['prologue_started'] };
  assert.equal(validateProgress(p).ok, true);
  assert.equal(currentObjective(p)?.id, 'obj_enter_building');
});

test('rejects unknown clues, unknown flags and impossible interpretations', () => {
  const r = validateProgress({
    discovered: [d('clue_fake', 0), d('clue_smartlock_log', 1, true)],
    flags: ['god_mode'],
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('clue_fake')));
  assert.ok(r.errors.some((e) => e.includes('god_mode')));
  assert.ok(r.errors.some((e) => e.includes('no interpretation')));
});

test('rejects the laptop without its prerequisite', () => {
  const r = validateProgress({ discovered: [d('clue_laptop_messages', 0)], flags: [] });
  assert.equal(r.ok, false);
});

test('reviewing a contradiction requires one to exist', () => {
  const flags = ['reviewed_contradiction'];
  assert.equal(validateProgress({ discovered: [d('clue_smartlock_log', 0)], flags }).ok, false);
  const ok = { discovered: [d('clue_smartlock_log', 0), d('clue_cctv_footage', 1, true)], flags };
  assert.equal(activeContradictions(ok).length, 1);
  assert.equal(validateProgress(ok).ok, true);
});

test('objectives complete from evidence, not from client claims', () => {
  const p = {
    discovered: [d('clue_reed_message', 0), d('clue_glass_print', 1), d('clue_photograph', 2), d('clue_handwritten_note', 3)],
    flags: ['prologue_started', 'entered_building'],
  };
  assert.deepEqual(computeCompletedObjectives(p), ['obj_enter_building', 'obj_search_apartment']);
});

test('save API validates, recomputes objectives and round-trips', async () => {
  const server = createApp().listen(0);
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}/api/saves/test_player_01`;
  try {
    const save: SaveGame = {
      version: 1,
      savedAt: t0,
      district: 'old_town',
      position: [1, 1, 1],
      yaw: 0,
      discovered: [d('clue_reed_message', 0)],
      flags: ['prologue_started', 'entered_building'],
      completedObjectives: ['obj_review_case'], // lie: should be replaced
    };
    const put = await fetch(base, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(save) });
    assert.equal(put.status, 200);
    const got = await (await fetch(base)).json();
    assert.deepEqual(got.save.completedObjectives, ['obj_enter_building']);

    const cheat = { ...save, discovered: [d('clue_laptop_messages', 0)] };
    const bad = await fetch(base, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cheat) });
    assert.equal(bad.status, 422);

    const malformed = await fetch(base, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{"version":1}' });
    assert.equal(malformed.status, 400);
  } finally {
    server.close();
  }
});
