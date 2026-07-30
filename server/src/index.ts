import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import rulesRouter from './routes/rules.js';

export const app = new Hono();

// 全局日志和跨域中间件
app.use('*', logger());
app.use('*', cors());

// 健康检查
app.get('/api', (c) => {
  return c.text('Hello Hono!');
});

// 挂载模块化子路由
app.route('/api/rules', rulesRouter);
