import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { apiRouter } from './routes/index';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '64kb' }));
  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
