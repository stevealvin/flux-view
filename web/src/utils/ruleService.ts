import seedRules from './rules_seed.json'

const STORAGE_KEY = 'nl-view-rules'

export interface Rule {
  id: number
  name: string
  description: string
  type: string
  discovery_code: string
  search_code: string
  detail_code: string
  base_url: string
  author: string
  version: string
  enabled: number // 0 or 1
  created_at?: string
  updated_at?: string
}

export const ruleService = {
  // Initialize rules in localStorage with seed data if they do not exist
  initRules(): void {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Clean up/ensure correct datatypes for the seed rules
      const cleanedRules = seedRules.map((rule: any) => ({
        ...rule,
        id: Number(rule.id),
        enabled: rule.enabled === null || rule.enabled === undefined ? 1 : Number(rule.enabled)
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedRules))
      console.log('Initialized localStorage with seed rules:', cleanedRules.length)
    }
  },

  // Fetch all rules
  getRules(): Rule[] {
    this.initRules()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as Rule[]
    } catch (e) {
      console.error('Failed to parse local rules:', e)
      return []
    }
  },

  // Fetch a single rule by ID
  getRuleById(id: number | string): Rule | null {
    const rules = this.getRules()
    const found = rules.find(r => String(r.id) === String(id))
    return found || null
  },

  // Insert or Update a rule
  saveRule(data: Partial<Rule> & { id?: number | string }): Rule {
    const rules = this.getRules()
    
    // Normalize properties
    const enabledVal = (data.enabled as any) === true || data.enabled === 1 ? 1 : 0
    const now = new Date().toISOString()

    if (data.id) {
      // Update
      const idToFind = String(data.id)
      const index = rules.findIndex(r => String(r.id) === idToFind)
      
      if (index !== -1) {
        const existingRule = rules[index]
        const updatedRule: Rule = {
          ...existingRule,
          ...data,
          id: Number(data.id),
          enabled: enabledVal,
          updated_at: now
        }
        rules[index] = updatedRule
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
        return updatedRule
      } else {
        throw new Error(`Rule with ID ${data.id} not found to update.`)
      }
    } else {
      // Insert
      const nextId = rules.length > 0 ? Math.max(...rules.map(r => Number(r.id) || 0)) + 1 : 1
      const newRule: Rule = {
        id: nextId,
        name: data.name || '',
        description: data.description || '',
        type: data.type || '',
        discovery_code: data.discovery_code || 'export default async () => {\n  \n}',
        search_code: data.search_code || 'export default async () => {\n  \n}',
        detail_code: data.detail_code || 'export default async () => {\n  \n}',
        base_url: data.base_url || '',
        author: data.author || '管理员',
        version: data.version || '1.0.0',
        enabled: enabledVal,
        created_at: now,
        updated_at: now
      }
      rules.push(newRule)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
      return newRule
    }
  },

  // Delete a rule
  deleteRule(id: number | string): boolean {
    const rules = this.getRules()
    const idToFind = String(id)
    const initialLength = rules.length
    const filtered = rules.filter(r => String(r.id) !== idToFind)
    
    if (filtered.length < initialLength) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      return true
    }
    return false
  },

  // Toggle rule enabled state
  toggleRuleEnabled(id: number | string, enabled: boolean | number): Rule | null {
    const rules = this.getRules()
    const idToFind = String(id)
    const rule = rules.find(r => String(r.id) === idToFind)
    
    if (rule) {
      rule.enabled = enabled ? 1 : 0
      rule.updated_at = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
      return rule
    }
    return null
  }
}
