export interface Rule {
  id: number;
  name: string;
  description: string;
  type: string;
  discovery_code: string;
  search_code: string;
  detail_code: string;
  base_url: string;
  author: string;
  version: string;
  enabled: number; // SQLite 中的 0 或 1
  created_at?: string;
  updated_at?: string;
}
