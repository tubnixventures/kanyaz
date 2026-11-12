import { serve } from '@hono/node-server';
import { app } from './src/app.ts';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

console.log(`[lively-backend] Initializing server on http://${HOST}:${PORT}`);

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log(`[lively-backend] Pure API server listening on http://${info.address}:${info.port}`);
  }
);
