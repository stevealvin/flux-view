import { Hono } from 'hono';
import { db } from '../db.js';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rules = new Hono();

// 更新/插入 (upsert) 辅助函数
function saveRule(data: any) {
  const fields = [
    'name', 'description', 'type', 'discovery_code', 'search_code',
    'detail_code', 'base_url', 'author', 'version', 'enabled'
  ];
  
  let enabled = 1;
  if (data.enabled !== undefined) {
    enabled = (data.enabled === true || data.enabled === 1 || data.enabled === '1') ? 1 : 0;
  }

  if (data.id) {
    const id = Number(data.id);
    const updateFields: string[] = [];
    const values: any[] = [];
    
    for (const field of fields) {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(field === 'enabled' ? enabled : data[field]);
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
        values.push(field === 'enabled' ? enabled : data[field]);
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

// POST /edit/:id -> 通过路径中的 id 编辑规则
rules.post('/edit/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const result = saveRule({ ...body, id });
    return c.json(result);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
});

// DELETE / -> 通过请求体或 query 中的 id 删除规则
rules.delete('/', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const id = c.req.query('id') || body.id;
    if (!id) {
      return c.json({ message: 'Missing id' }, 400);
    }
    db.prepare('DELETE FROM rules WHERE id = ?').run(Number(id));
    return c.json({ success: true });
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

// POST /run -> 在 node:vm 沙箱中执行 JS 代码
rules.post('/run', async (c) => {
  try {
    const { code, context: reqContext } = await c.req.json();
    if (!code) {
      return c.json({ message: 'Missing code' }, 400);
    }

    // 将 ESModule 代码转换为适用于 VM 的 CommonJS 兼容结构
    let runCode = code.trim();
    
    // 先提取顶层 import 语句，以避免它们被包裹在 module.exports 中
    const importRegex = /^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm;
    const imports: string[] = [];
    let cleanCode = runCode.replace(importRegex, (match: string) => {
      imports.push(match.trim());
      return '';
    }).trim();

    // 处理并转换 import 语句为 require 语句
    const processedImports = imports.map(imp => {
      let converted = imp;
      
      // 模式 1: import * as cheerio from 'cheerio'
      if (/import\s+\*\s+as\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/.test(converted)) {
        converted = converted.replace(
          /import\s+\*\s+as\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/g,
          'const $1 = require("$2")'
        );
      }
      // 模式 2: import { load } from 'cheerio'
      else if (/import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]([^'"]+)['"]/.test(converted)) {
        converted = converted.replace(
          /import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g,
          'const { $1 } = require("$2")'
        );
      }
      // 模式 3: import axios from 'axios'
      else if (/import\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/.test(converted)) {
        converted = converted.replace(
          /import\s+([\w]+)\s+from\s+['"]([^'"]+)['"]/g,
          'const $1 = require("$2")'
        );
      }
      
      return converted;
    });

    // 处理剩余 cleanCode 中的 export 导出语句
    if (cleanCode.includes('export default')) {
      cleanCode = cleanCode
        // 具名 / 匿名 异步函数
        .replace(
          /export\s+default\s+async\s+function\s*([\w]+)?\s*\(\s*([\w\s,]*)\s*\)/g,
          'module.exports = async function $1 ($2)'
        )
        // 具名 / 匿名 普通函数
        .replace(
          /export\s+default\s+function\s*([\w]+)?\s*\(\s*([\w\s,]*)\s*\)/g,
          'module.exports = function $1 ($2)'
        )
        // 带参数的箭头函数 (异步)，例如 export default async (ctx) =>
        .replace(
          /export\s+default\s+async\s*\(?\s*([\w\s,]*)\s*\)?\s*=>/g,
          'module.exports = async ($1) =>'
        )
        // 带参数的箭头函数 (同步)
        .replace(
          /export\s+default\s*\(?\s*([\w\s,]*)\s*\)?\s*=>/g,
          'module.exports = ($1) =>'
        );
    } else if (!cleanCode.includes('module.exports') && !cleanCode.includes('exports.')) {
      // 如果既没有 module.exports 也没有 exports，说明它是原始函数表达式，需要对其进行包裹
      cleanCode = `module.exports = ${cleanCode}`;
    }

    // 合并 imports 语句和函数体
    runCode = (processedImports.length > 0 ? processedImports.join('\n') + '\n\n' : '') + cleanCode;

    const createSandboxRequire = (allowList: string[]) => {
      return function (name: string) {
        if (!allowList.includes(name)) {
          throw new Error(`Module "${name}" is not found`);
        }
        return require(name);
      };
    };

    const vmContext = {
      require: createSandboxRequire(['axios', 'cheerio']),
      console,
      module: { exports: {} as any },
      exports: {} as any,
    };

    const result = await vm.runInNewContext(
      `(async () => {
        ${runCode}

        const ctx = ${JSON.stringify(reqContext || {})};

        if (typeof module.exports === 'function') {
          return await module.exports(ctx)
        }

        if (typeof exports.default === 'function') {
          return await exports.default(ctx)
        }

        if (typeof module.exports.default === 'function') {
          return await module.exports.default(ctx)
        }

        return undefined
      })()
      `,
      vmContext,
      {
        timeout: 90000 // 90秒超时
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
});

export default rules;
