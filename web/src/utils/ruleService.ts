import seedRules from './rules_seed.json'
import http from './http'
import type {
  RuleSchema,
  DiscoveryResult,
  SearchResult,
  MediaDetail,
  ParseResult,
  MediaItem,
  MediaType
} from '@/types/rule'

export type { RuleSchema, DiscoveryResult, SearchResult, MediaDetail, ParseResult, MediaItem, MediaType }
export type Rule = RuleSchema

const STORAGE_KEY = 'flux-view-rules-v2'
const LEGACY_STORAGE_KEY = 'nl-view-rules'

export const ruleService = {
  /**
   * 初始化规则库 (支持从旧版本平滑升级及种子数据写入)
   */
  initRules(): void {
    if (!localStorage.getItem(STORAGE_KEY)) {
      let initialList: RuleSchema[] = []

      // 检查是否有旧版本规则
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacyRaw) {
        try {
          const legacyRules = JSON.parse(legacyRaw)
          initialList = legacyRules.map((r: any) => {
            const mappedType: MediaType = r.type === '视频' ? 'video' : r.type === '图片' ? 'picture' : 'novel'
            return {
              id: Number(r.id) || Date.now(),
              name: r.name || r.title || '自定义规则',
              type: mappedType,
              version: r.version || '1.0.0',
              author: r.author || '管理员',
              description: r.description || '',
              baseUrl: r.base_url || r.baseUrl || '',
              enabled: r.enabled === null || r.enabled === undefined ? 1 : Number(r.enabled),
              code: r.code || r.discovery_code || ''
            } as RuleSchema
          })
        } catch (e) {
          console.warn('Failed to migrate legacy rules:', e)
        }
      }

      // 如果没有旧规则或迁移为空，使用全新的 seedRules
      if (initialList.length === 0) {
        initialList = (seedRules as any[]).map((rule: any) => ({
          ...rule,
          id: Number(rule.id),
          enabled: rule.enabled === null || rule.enabled === undefined ? 1 : Number(rule.enabled)
        }))
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialList))
    }
  },

  /**
   * 获取所有规则
   */
  getRules(): RuleSchema[] {
    this.initRules()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as RuleSchema[]
    } catch (e) {
      console.error('Failed to parse local rules:', e)
      return []
    }
  },

  /**
   * 根据 ID 查询单条规则
   */
  getRuleById(id: number | string): RuleSchema | null {
    const rules = this.getRules()
    const found = rules.find((r) => String(r.id) === String(id))
    return found || null
  },

  /**
   * 根据类型筛选启用的规则
   */
  getEnabledRulesByType(type: MediaType | string): RuleSchema[] {
    const rules = this.getRules()
    return rules.filter((r) => {
      const matchType = r.type === type || (type === '视频' && r.type === 'video') || (type === '图片' && r.type === 'picture') || (type === '小说' && r.type === 'novel')
      return matchType && (r.enabled === 1 || (r.enabled as any) === true)
    })
  },

  /**
   * 保存规则 (新增 / 更新)
   */
  saveRule(data: Partial<RuleSchema> & { id?: number | string }): RuleSchema {
    const rules = this.getRules()
    const enabledVal = (data.enabled as any) === true || data.enabled === 1 ? 1 : 0
    const now = new Date().toISOString()

    if (data.id) {
      const idToFind = String(data.id)
      const index = rules.findIndex((r) => String(r.id) === idToFind)

      if (index !== -1) {
        const existing = rules[index]
        const updated: RuleSchema = {
          ...existing,
          ...data,
          id: Number(data.id),
          enabled: enabledVal,
          updated_at: now
        }
        rules[index] = updated
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
        return updated
      }
      throw new Error(`Rule with ID ${data.id} not found to update.`)
    } else {
      const nextId = rules.length > 0 ? Math.max(...rules.map((r) => Number(r.id) || 0)) + 1 : 1
      const newRule: RuleSchema = {
        id: nextId,
        name: data.name || '新建规则',
        type: data.type || 'video',
        version: data.version || '1.0.0',
        author: data.author || '管理员',
        description: data.description || '',
        icon: data.icon || '',
        baseUrl: data.baseUrl || '',
        enabled: enabledVal,
        code: data.code || `export default {\n  async discovery({ category, page = 1 }) {\n    return { items: [] }\n  },\n  async search({ keyword, page = 1 }) {\n    return { items: [] }\n  },\n  async detail({ key, item }) {\n    return { title: '', media: {} }\n  }\n}`,
        created_at: now,
        updated_at: now
      }
      rules.push(newRule)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
      return newRule
    }
  },

  /**
   * 删除规则
   */
  deleteRule(id: number | string): boolean {
    const rules = this.getRules()
    const idToFind = String(id)
    const initialLength = rules.length
    const filtered = rules.filter((r) => String(r.id) !== idToFind)

    if (filtered.length < initialLength) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      return true
    }
    return false
  },

  /**
   * 切换启用状态
   */
  toggleRuleEnabled(id: number | string, enabled: boolean | number): RuleSchema | null {
    const rules = this.getRules()
    const idToFind = String(id)
    const rule = rules.find((r) => String(r.id) === idToFind)

    if (rule) {
      rule.enabled = enabled ? 1 : 0
      rule.updated_at = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
      return rule
    }
    return null
  },

  /**
   * 重置回官方默认预置规则
   */
  resetToSeedRules(): RuleSchema[] {
    const list: RuleSchema[] = (seedRules as any[]).map((rule: any) => ({
      ...rule,
      id: Number(rule.id),
      enabled: rule.enabled === null || rule.enabled === undefined ? 1 : Number(rule.enabled)
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return list
  },

  // ==========================================
  // 规则标准沙箱代理执行接口
  // ==========================================

  /**
   * 执行 discovery (发现/分类列表)
   */
  async runDiscovery(rule: RuleSchema, params: { category?: string; page?: number } = {}): Promise<DiscoveryResult> {
    const res = await http.post('/rules/execute', {
      code: rule.code,
      action: 'discovery',
      params: {
        category: params.category || '',
        page: params.page || 1,
        baseUrl: rule.baseUrl
      }
    })

    // 格式标准化兼容
    if (Array.isArray(res)) {
      // 若直接返回了分组数组 [{ title: '最新', items: [...] }]
      if (res.length > 0 && res[0].items) {
        const categories = res.map((s: any) => s.title || '默认')
        const items = res.flatMap((s: any) => s.items || [])
        return { categories, items, hasMore: true }
      }
      // 若直接返回了普通数组 [{ title, cover, key }]
      return { items: res, hasMore: true }
    } else if (res && typeof res === 'object') {
      return {
        categories: res.categories || [],
        items: res.items || res.list || [],
        hasMore: res.hasMore !== undefined ? res.hasMore : true,
        page: res.page || params.page || 1
      }
    }
    return { items: [], hasMore: false }
  },

  /**
   * 执行 search (全网与站内搜索)
   */
  async runSearch(rule: RuleSchema, params: { keyword: string; page?: number }): Promise<SearchResult> {
    const res = await http.post('/rules/execute', {
      code: rule.code,
      action: 'search',
      params: {
        keyword: params.keyword,
        page: params.page || 1,
        baseUrl: rule.baseUrl
      }
    })

    if (Array.isArray(res)) {
      return { items: res, hasMore: false }
    } else if (res && typeof res === 'object') {
      return {
        items: res.items || res.list || res.data || [],
        hasMore: res.hasMore || false
      }
    }
    return { items: [], hasMore: false }
  },

  /**
   * 执行 detail (获取媒体完整详情)
   */
  async runDetail(rule: RuleSchema, params: { key: string; item?: Partial<MediaItem> }): Promise<MediaDetail> {
    const res = await http.post('/rules/execute', {
      code: rule.code,
      action: 'detail',
      params: {
        key: params.key,
        item: params.item || {},
        baseUrl: rule.baseUrl
      }
    })

    if (!res || typeof res !== 'object') {
      throw new Error('规则未返回有效的详情数据')
    }

    // 格式归一化转换
    let media = res.media
    if (!media) {
      if (res.videoUrl) {
        media = { type: 'video', url: res.videoUrl, images: res.images }
      } else if (res.images && res.images.length > 0) {
        media = { type: 'picture', images: res.images }
      } else if (res.content || res.text) {
        media = { type: 'novel', content: res.content || res.text }
      }
    }

    return {
      title: res.title || params.item?.title || '媒体详情',
      cover: res.cover || params.item?.cover || '',
      desc: res.desc || res.description || '',
      tags: res.tags || [],
      author: res.author || '',
      rating: res.rating || '',
      groups: res.groups || (res.list && res.list.length > 0 ? [{ name: '选集', items: res.list }] : []),
      media: media || (rule.type === 'video' ? { type: 'video' } : rule.type === 'picture' ? { type: 'picture' } : { type: 'novel' }),
      recommendations: res.recommendations || res.discovery || []
    }
  },

  /**
   * 执行 parse (解析指定章节或分集的直链/正文)
   */
  async runParse(rule: RuleSchema, params: { key: string; groupName?: string }): Promise<ParseResult> {
    const res = await http.post('/rules/execute', {
      code: rule.code,
      action: 'parse',
      params: {
        key: params.key,
        groupName: params.groupName || '',
        baseUrl: rule.baseUrl
      }
    })

    if (typeof res === 'string') {
      return { url: res, content: res, success: true }
    } else if (res && typeof res === 'object') {
      return { ...res, success: true }
    }
    return { success: false, error: '解析返回空数据' }
  }
}
