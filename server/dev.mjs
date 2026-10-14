import { createServer } from 'vite';
import { api } from './index.mjs';

const vite = await createServer();
try {
  await vite.listen();
  vite.printUrls();
} catch (error) {
  api.close();
  throw error;
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await vite.close(); api.close(() => process.exit()); });
}
