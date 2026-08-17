import { Hono } from 'hono';
import { db } from '../db.js';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const rules = new Hono();

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

// 更新/插入 (upsert) 辅助函数
function saveRule(data: any) {
  const fields = [
    'name',
    'type',
    'version',
    'author',
    'description',
    'icon',
    'base_url',
    'enabled',
    'headers',
    'code',
    'discovery_code',
    'search_code',
    'detail_code',
  ];

  let enabled = 1;
  if (data.enabled !== undefined) {
    enabled = data.enabled === true || data.enabled === 1 || data.enabled === '1' ? 1 : 0;
  }

  let headersStr = '';
  if (data.headers) {
    headersStr = typeof data.headers === 'string' ? data.headers : JSON.stringify(data.headers);
  }

  if (data.id) {
    const id = Number(data.id);
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        if (field === 'enabled') {
          values.push(enabled);
        } else if (field === 'headers') {
          values.push(headersStr);
        } else {
          values.push(data[field]);
        }
      }
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `UPDATE rules SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
    return db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
  } else {
    const insertFields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];

    for (const field of fields) {
      if (data[field] !== undefined) {
        insertFields.push(field);
        placeholders.push('?');
        if (field === 'enabled') {
          values.push(enabled);
        } else if (field === 'headers') {
          values.push(headersStr);
        } else {
          values.push(data[field]);
        }
      }
    }

    const sql = `INSERT INTO rules (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const result = db.prepare(sql).run(...values);
    return db.prepare('SELECT * FROM rules WHERE id = ?').get(result.lastInsertRowid);
  }
}

// GET / -> 获取所有规则列表
rules.get('/', (c) => {
  try {
    const data = db.prepare('SELECT * FROM rules ORDER BY id DESC').all();
    return c.json({ data, total: data.length });
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
});

// GET /:id -> 获取单条规则详情
rules.get('/:id', (c) => {
  try {
    const id = Number(c.req.param('id'));
    const rule = db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
    if (!rule) {
      return c.json({ message: 'Rule not found' }, 404);
    }
    return c.json(rule);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
});

// POST / -> 保存规则 (更新/插入)
rules.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = saveRule(body);
    return c.json(result);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
});

// POST /edit -> 通过请求体或 query 中的 id 编辑规则
rules.post('/edit', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || c.req.query('id');
    if (!id) {
      return c.json({ message: 'Missing id' }, 400);
    }
    const result = saveRule({ ...body, id });
    return c.json(result);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
});

// DELETE /:id -> 通过路径中的 id 删除规则
rules.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    db.prepare('DELETE FROM rules WHERE id = ?').run(id);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
});

/**
 * 转换 ESModule 语法为适用于 Node.js VM 的 CommonJS 语法
 */
function transformESMToCJS(code: string): string {
  let runCode = code.trim();

  // 1. 提取并转换顶层 import 语句
  const importRegex = /^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm;
  const imports: string[] = [];
  let cleanCode = runCode.replace(importRegex, (match: string) => {
    imports.push(match.trim());
    return '';
  }).trim();

  const processedImports = imports.map((imp) => {
    let converted = imp;
    if (/import\s+\*\s+as\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/.test(converted)) {
      converted = converted.replace(
        /import\s+\*\s+as\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/g,
        'const $1 = require("$2")'
      );
    } else if (/import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]([^'"]+)['"]/.test(converted)) {
      converted = converted.replace(
        /import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g,
        'const { $1 } = require("$2")'
      );
    } else if (/import\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/.test(converted)) {
      converted = converted.replace(
        /import\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/g,
        'const $1 = require("$2")'
      );
    }
    return converted;
  });

  // 2. 转换 export default 语法
  if (cleanCode.includes('export default')) {
    cleanCode = cleanCode
      // 具名 / 匿名 异步函数 export default async function
      .replace(
        /export\s+default\s+async\s+function\s*([\w]+)?\s*\(\s*([\w\s,]*)\s*\)/g,
        'module.exports = async function $1 ($2)'
      )
      // 具名 / 匿名 普通函数 export default function
      .replace(
        /export\s+default\s+function\s*([\w]+)?\s*\(\s*([\w\s,]*)\s*\)/g,
        'module.exports = function $1 ($2)'
      )
      // 箭头函数 export default async (...) =>
      .replace(
        /export\s+default\s+async\s*\(?\s*([\w\s,]*)\s*\)?\s*=>/g,
        'module.exports = async ($1) =>'
      )
      // 箭头函数 export default (...) =>
      .replace(
        /export\s+default\s*\(?\s*([\w\s,]*)\s*\)?\s*=>/g,
        'module.exports = ($1) =>'
      )
      // 对象导出 export default { ... }
      .replace(/export\s+default\s+/g, 'module.exports = ');
  } else if (!cleanCode.includes('module.exports') && !cleanCode.includes('exports.')) {
    // 原始自执行函数或对象表达式
    cleanCode = `module.exports = ${cleanCode}`;
  }

  return (
    (processedImports.length > 0 ? processedImports.join('\n') + '\n\n' : '') + cleanCode
  );
}

/**
 * 统一执行沙箱 (POST /run 及 POST /execute)
 */
async function executeSandbox(c: any) {
  try {
    const reqBody = await c.req.json();
    let { code, action, params, context } = reqBody;

    if (!code) {
      return c.json({ message: 'Missing rule code' }, 400);
    }

    const targetAction: string = action || 'discovery';
    const targetParams = params || context || {};

    const runCode = transformESMToCJS(code);

    const allowModules = ['axios', 'cheerio', 'crypto', 'buffer', 'url', 'querystring'];
    const sandboxRequire = (name: string) => {
      if (!allowModules.includes(name)) {
        throw new Error(`Module "${name}" is not permitted in rule sandbox`);
      }
      return require(name);
    };

    const vmContext = {
      require: sandboxRequire,
      axios,
      cheerio,
      crypto,
      Buffer,
      URL,
      URLSearchParams,
      console,
      ua: DEFAULT_USER_AGENT,
      userAgent: DEFAULT_USER_AGENT,
      module: { exports: {} as any },
      exports: {} as any,
    };

    const result = await vm.runInNewContext(
      `(async () => {
        ${runCode}

        const actionName = ${JSON.stringify(targetAction)};
        const ctx = ${JSON.stringify(targetParams)};

        let exp = module.exports;
        if (exp && exp.default) {
          exp = exp.default;
        }

        // 1. 标准模式：导出包含具体方法（discovery, search, detail, parse）的对象
        if (exp && typeof exp === 'object') {
          if (typeof exp[actionName] === 'function') {
            return await exp[actionName](ctx);
          }
          // 兜底：若请求特定 action 不存在但有通用 run 方法
          if (typeof exp['run'] === 'function') {
            return await exp['run'](ctx);
          }
        }

        // 2. 兼容模式：直接导出了单个执行函数
        if (typeof exp === 'function') {
          return await exp(ctx);
        }

        // 3. 直接返回了静态对象
        if (exp !== undefined && exp !== null) {
          return exp;
        }

        return null;
      })()`,
      vmContext,
      {
        timeout: 90000, // 90秒安全超时
      }
    );

    return c.json(result);
  } catch (error: any) {
    const stack = error.stack
      ?.split('\n')
      .filter((line: string) => !line.includes('vm.js') && !line.includes('node:vm'))
      .join('\n');
    return c.json({ message: error.message, stack }, 500);
  }
}

rules.post('/run', executeSandbox);
rules.post('/execute', executeSandbox);

export default rules;
