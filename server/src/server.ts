import { serve } from '@hono/node-server';
import { app } from './index.js';

const port = parseInt(process.env.PORT || '7300', 10);
console.log(`🚀 FluxView Standalone Hono Server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
