import { env } from './config/env';
import { createApp } from './app';
import { initSaveStore } from './services/saveStore';

await initSaveStore(env.MONGODB_URI);

createApp().listen(env.PORT, () => {
  console.log(`[mindtrace] API listening on http://localhost:${env.PORT}`);
});
