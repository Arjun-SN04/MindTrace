import type { Request, Response } from 'express';
import { computeCompletedObjectives, validateProgress, type SaveGame } from '../../../shared/src/index';
import { PlayerIdSchema, SaveGameSchema } from '../schemas/save';
import { getSaveStore } from '../services/saveStore';

export async function getSave(req: Request, res: Response) {
  const playerId = PlayerIdSchema.safeParse(req.params.playerId);
  if (!playerId.success) return res.status(400).json({ error: 'Invalid player id' });

  const save = await getSaveStore().get(playerId.data);
  if (!save) return res.status(404).json({ error: 'No save found' });
  return res.json({ save });
}

export async function putSave(req: Request, res: Response) {
  const playerId = PlayerIdSchema.safeParse(req.params.playerId);
  if (!playerId.success) return res.status(400).json({ error: 'Invalid player id' });

  const parsed = SaveGameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid save format', details: parsed.error.issues.map((i) => i.message) });
  }

  const input = parsed.data;
  const progress = { discovered: input.discovered, flags: input.flags };
  const check = validateProgress(progress);
  if (!check.ok) {
    return res.status(422).json({ error: 'Save rejected: progress is not consistent with the case', details: check.errors });
  }

  // Objectives are derived on the server; the client's list is ignored.
  const save: SaveGame = { ...input, completedObjectives: computeCompletedObjectives(progress) };
  await getSaveStore().put(playerId.data, save);
  return res.json({ ok: true, save });
}
