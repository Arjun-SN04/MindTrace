import { z } from 'zod';
import { SAVE_VERSION } from '../../../shared/src/index';

const finite = z.number().finite();

export const PlayerIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{8,64}$/, 'Invalid player id');

export const SaveGameSchema = z
  .object({
    version: z.literal(SAVE_VERSION),
    savedAt: z.number().int().nonnegative(),
    district: z.string().min(1).max(64),
    position: z.tuple([finite.min(-500).max(500), finite.min(-50).max(100), finite.min(-500).max(500)]),
    yaw: finite,
    discovered: z
      .array(
        z.object({
          id: z.string().min(1).max(64),
          discoveredAt: z.number().int().nonnegative(),
          interpreted: z.boolean(),
        }),
      )
      .max(200),
    flags: z.array(z.string().min(1).max(64)).max(200),
    completedObjectives: z.array(z.string().max(64)).max(200),
  })
  .strict();

export type SaveGameInput = z.infer<typeof SaveGameSchema>;
