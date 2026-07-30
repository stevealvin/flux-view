-- ----------------------------
-- 规则
-- ----------------------------
CREATE TABLE rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  type TEXT,                   -- 可选：如 "book_source" / "parser" / "detail" ...
  discovery_code TEXT,        -- 发现 JS 代码（完整脚本）
  search_code TEXT,          -- 搜索 JS 代码（完整脚本）
  detail_code TEXT,          -- 详情 JS 代码（完整脚本）
  version TEXT,    -- 用于更新比较
  enabled INTEGER DEFAULT 1,   -- 是否生效
  author TEXT,
  author TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
