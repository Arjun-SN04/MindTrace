import type { NextFunction, Request, Response } from 'express';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e = err as { status?: number; type?: string; message?: string };
  if (e.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (e.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
  console.error('[error]', err);
  return res.status(e.status ?? 500).json({ error: 'Internal server error' });
}
