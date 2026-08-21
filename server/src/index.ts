import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import rulesRouter from './routes/rules.js';

// 1. 创建全局统一带有 /api 前缀的 Hono 实例
const app = new Hono().basePath('/api');

// 2. 中间件：日志与跨域支持
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 3. 健康检查与状态端点 (自动位于 /api/health 与 /api)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'flux-view-api',
    time: new Date().toISOString(),
  });
});

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'FluxView Rules Engine API is running',
  });
});

// 4. 挂载规则引擎业务路由 (自动处于 /api/rules/*)
app.route('/rules', rulesRouter);

// 导出 app 实例供 Vite 一体化开发服务器 (@hono/vite-dev-server) 与 Vercel 挂载使用
export default app;
export { app };
