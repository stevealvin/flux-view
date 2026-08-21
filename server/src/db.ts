import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveDbPath(): string {
  const currentDir = process.cwd();
  // 检查根目录或 server 目录下的 resources
  const candidates = [
    resolve(__dirname, '../resources'),
    resolve(currentDir, 'server/resources'),
    resolve(currentDir, 'resources'),
    resolve('/tmp', 'flux-view-resources')
  ];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return resolve(dir, 'sqlite.db');
    } catch {
      continue;
    }
  }
  return ':memory:';
}

const dbPath = resolveDbPath();
export const db = new Database(dbPath);

// 初始化规则表并自动迁移新字段
db.exec(`
  CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    author TEXT DEFAULT '管理员',
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    base_url TEXT DEFAULT '',
    enabled INTEGER DEFAULT 1,
    headers TEXT DEFAULT '',
    code TEXT DEFAULT '',
    discovery_code TEXT DEFAULT '',
    search_code TEXT DEFAULT '',
    detail_code TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 检查并自动补充可能缺少的列
const tableInfo = db.prepare(`PRAGMA table_info(rules)`).all() as { name: string }[];
const existingCols = new Set(tableInfo.map((col) => col.name));

const checkAndAddColumn = (colName: string, colType: string) => {
  if (!existingCols.has(colName)) {
    try {
      db.exec(`ALTER TABLE rules ADD COLUMN ${colName} ${colType}`);
    } catch (e) {
      console.warn(`Could not add column ${colName}:`, e);
    }
  }
};

checkAndAddColumn('version', "TEXT DEFAULT '1.0.0'");
checkAndAddColumn('author', "TEXT DEFAULT '管理员'");
checkAndAddColumn('description', "TEXT DEFAULT ''");
checkAndAddColumn('icon', "TEXT DEFAULT ''");
checkAndAddColumn('base_url', "TEXT DEFAULT ''");
checkAndAddColumn('headers', "TEXT DEFAULT ''");
checkAndAddColumn('code', "TEXT DEFAULT ''");
checkAndAddColumn('discovery_code', "TEXT DEFAULT ''");
checkAndAddColumn('search_code', "TEXT DEFAULT ''");
checkAndAddColumn('detail_code', "TEXT DEFAULT ''");
