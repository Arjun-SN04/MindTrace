import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getSave, putSave } from '../controllers/saveController';
import { getSaveStore } from '../services/saveStore';
import { env } from '../config/env';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, saves: getSaveStore().kind, ai: env.LLM_PROVIDER !== 'none' && !!env.LLM_API_KEY });
});

const saveLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false });

apiRouter.get('/saves/:playerId', saveLimiter, getSave);
apiRouter.put('/saves/:playerId', saveLimiter, putSave);
