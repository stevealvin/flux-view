<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'RulesView' })
import { useMessage } from 'naive-ui'
import { ruleService, type RuleSchema } from '@/utils/ruleService'
import {
  RefreshCcw,
  Search as SearchIcon,
  Plus,
  Edit as EditIcon,
  Trash2,
  Download,
  Upload,
  Copy,
  Archive,
  Compass,
  Video,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
  ExternalLink,
  RotateCcw
} from '@lucide/vue'

const router = useRouter()
const message = useMessage()

const form = ref({
  name: '',
  type: ''
})
const list = ref<RuleSchema[]>([])
const loading = ref(false)

// 导入导出相关的状态
const showImportModal = ref(false)
const importText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const loadData = () => {
  loading.value = true
  try {
    let data = ruleService.getRules()

    if (form.value.name.trim()) {
      const searchName = form.value.name.toLowerCase().trim()
      data = data.filter((r) => r.name?.toLowerCase().includes(searchName))
    }
    if (form.value.type) {
      data = data.filter((r) => r.type === form.value.type)
    }

    list.value = data
  } catch (error) {
    console.error('Failed to load rules:', error)
    message.error('加载规则列表失败')
  } finally {
    loading.value = false
  }
}

const onReset = () => {
  form.value.name = ''
  form.value.type = ''
  loadData()
}

const onSearch = () => {
  loadData()
}

const onGoto = (row: RuleSchema) => {
  router.push(`/rules/edit?id=${row.id}`)
}

const toggleRule = (row: RuleSchema, val: boolean) => {
  try {
    const nextVal = val ? 1 : 0
    ruleService.toggleRuleEnabled(row.id, nextVal)
    row.enabled = nextVal
    message.success(val ? `已启用规则: ${row.name}` : `已禁用规则: ${row.name}`)
  } catch (error) {
    console.error('Failed to toggle rule state:', error)
    message.error('操作失败')
  }
}

const deleteRule = (row: RuleSchema) => {
  try {
    ruleService.deleteRule(row.id)
    message.success(`已成功删除规则: ${row.name}`)
    loadData()
  } catch (error) {
    console.error('Failed to delete rule:', error)
    message.error('删除规则失败')
  }
}

const resetDefaults = () => {
  try {
    ruleService.resetToSeedRules()
    message.success('已成功重置为官方预置规则')
    loadData()
  } catch (e: any) {
    message.error('重置失败: ' + e.message)
  }
}

// 导出/备份规则
const exportRules = (rulesToExport: RuleSchema[], filename: string) => {
  try {
    const cleaned = rulesToExport.map(({ id, created_at, updated_at, ...rest }) => rest)
    const jsonStr = JSON.stringify(cleaned, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('规则导出成功')
  } catch (error: any) {
    message.error('导出失败: ' + error.message)
  }
}

const exportSingleRule = (row: RuleSchema) => {
  const filename = `${row.name || 'rule'}_backup.json`
  exportRules([row], filename)
}

const copySingleRule = async (row: RuleSchema) => {
  try {
    const { id, created_at, updated_at, ...rest } = row
    const jsonStr = JSON.stringify(rest, null, 2)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonStr)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = jsonStr
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    message.success(`已复制规则 [${row.name}]`)
  } catch (error: any) {
    message.error('复制失败: ' + error.message)
  }
}

const exportAllRules = () => {
  if (list.value.length === 0) {
    message.warning('当前列表中没有可导出的规则')
    return
  }
  const dateStr = new Date().toISOString().slice(0, 10)
  exportRules(list.value, `flux_view_rules_all_${dateStr}.json`)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string
      processImportJson(content)
    } catch (err: any) {
      message.error('解析 JSON 文件失败: ' + err.message)
    } finally {
      if (fileInputRef.value) fileInputRef.value.value = ''
    }
  }
  reader.readAsText(file)
}

const processImportJson = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString)
    const ruleArray = Array.isArray(parsed) ? parsed : [parsed]

    if (ruleArray.length === 0) {
      message.warning('文件中未包含有效的规则数据')
      return
    }

    let successCount = 0
    ruleArray.forEach((item: any) => {
      if (item && item.name) {
        let mappedType: any = item.type || 'video'
        if (item.type === '视频') mappedType = 'video'
        if (item.type === '图片') mappedType = 'picture'
        if (item.type === '小说') mappedType = 'novel'

        ruleService.saveRule({
          name: item.name,
          type: mappedType,
          version: item.version || '1.0.0',
          author: item.author || '管理员',
          description: item.description || '',
          baseUrl: item.baseUrl || item.base_url || '',
          code: item.code || item.discovery_code || '',
          enabled: item.enabled !== undefined ? (item.enabled ? 1 : 0) : 1
        })
        successCount++
      }
    })

    message.success(`成功导入 ${successCount} 个规则`)
    showImportModal.value = false
    importText.value = ''
    loadData()
  } catch (error: any) {
    message.error('导入规则失败: ' + error.message)
  }
}

const submitTextImport = () => {
  if (!importText.value.trim()) {
    message.warning('请先粘贴规则 JSON 文本')
    return
  }
  processImportJson(importText.value)
}

const getCategoryIcon = (type: string) => {
  if (type === 'video' || type === '视频') return Video
  if (type === 'picture' || type === '图片') return ImageIcon
  if (type === 'novel' || type === '小说') return BookOpen
  return Compass
}

loadData()
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- 顶部操作栏与统计 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- 页面标题与统计 -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 flex-shrink-0">
            <Archive class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>规则引擎管理</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30">
                ENGINE HUB
              </span>
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              管理系统内置与自定义的 JavaScript 沙箱抓取与解析规则
            </p>
          </div>
        </div>

        <!-- 动作按钮组 (新建、导入、导出、重置预置) -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="resetDefaults"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
            title="重置回默认预置规则"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">重置预置</span>
          </button>

          <button
            @click="showImportModal = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
          >
            <Upload class="w-3.5 h-3.5" />
            <span>导入规则</span>
          </button>

          <button
            @click="exportAllRules"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>备份导出</span>
          </button>

          <button
            @click="router.push('/rules/edit')"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>新建规则</span>
          </button>
        </div>
      </div>

      <!-- 检索与筛选栏 -->
      <div class="pt-3 border-t border-slate-200/50 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <input
            v-model="form.name"
            type="text"
            placeholder="搜索规则名称..."
            @keyup.enter="onSearch"
            class="px-3 py-1.5 bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/50 dark:hover:bg-white/[0.07] focus:bg-white dark:focus:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all w-44"
          />

          <select
            v-model="form.type"
            @change="onSearch"
            class="px-3 py-1.5 bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 rounded-xl text-xs outline-none text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
          >
            <option value="">全部类型</option>
            <option value="video">视频 (Video)</option>
            <option value="picture">图片 (Picture)</option>
            <option value="novel">小说 (Novel)</option>
          </select>

          <button
            @click="onSearch"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
          >
            筛选
          </button>

          <button
            @click="onReset"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            重置
          </button>
        </div>

        <span class="text-xs text-slate-400">
          已加载 <strong class="text-indigo-600 dark:text-indigo-400">{{ list.length }}</strong> 条规则
        </span>
      </div>
    </div>

    <!-- 规则卡片网格列表 (mori-box 风格) -->
    <div class="space-y-4">
      <div v-if="list.length === 0" class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3">
        <Compass class="w-10 h-10 text-slate-400" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">没有找到规则</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">可以点击上方“新建规则”或“重置预置”导入规则。</p>
      </div>

      <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="rule in list"
          :key="rule.id"
          class="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between h-full group relative"
        >
          <!-- 上半部：图标、名称、开关、描述 -->
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <component :is="getCategoryIcon(rule.type)" class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {{ rule.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-mono text-slate-400">
                      v{{ rule.version || '1.0.0' }} • {{ rule.type === 'video' ? '视频' : rule.type === 'picture' ? '图片' : '小说' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 启用状态 Switch 开关 -->
              <n-switch
                :value="rule.enabled === 1 || (rule.enabled as any) === true"
                size="small"
                @update:value="(val: boolean) => toggleRule(rule, val)"
              />
            </div>

            <!-- 规则描述 -->
            <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {{ rule.description || '暂无详细描述信息' }}
            </p>

            <!-- 站点域名 -->
            <div v-if="rule.baseUrl" class="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1">
              <span class="opacity-60">源站:</span>
              <span class="truncate">{{ rule.baseUrl }}</span>
            </div>
          </div>

          <!-- 下半部：动作栏 (编辑、复制、导出、删除) -->
          <div class="pt-4 mt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <button
                @click="copySingleRule(rule)"
                class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="复制规则 JSON"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>

              <button
                @click="exportSingleRule(rule)"
                class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="导出规则文件"
              >
                <Download class="w-3.5 h-3.5" />
              </button>

              <n-popconfirm @positive-click="deleteRule(rule)">
                <template #trigger>
                  <button
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="删除规则"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </template>
                确定要删除规则「{{ rule.name }}」吗？
              </n-popconfirm>
            </div>

            <!-- 编辑配置主按钮 -->
            <button
              @click="onGoto(rule)"
              class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-800/30 transition-all cursor-pointer"
            >
              <EditIcon class="w-3.5 h-3.5" />
              <span>编辑配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入规则弹窗 Modal -->
    <n-modal v-model:show="showImportModal" preset="card" title="导入规则配置" class="max-w-xl">
      <div class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            方式一：从本地选择 JSON 文件
          </label>
          <input
            type="file"
            ref="fileInputRef"
            accept=".json"
            class="hidden"
            @change="handleFileChange"
          />
          <button
            @click="triggerFileInput"
            class="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-white/20 hover:border-indigo-500 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all cursor-pointer bg-slate-50/50 dark:bg-white/[0.02]"
          >
            <Upload class="w-4 h-4" />
            <span>点击选择本地规则 .json 备份文件</span>
          </button>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            方式二：粘贴规则 JSON 文本
          </label>
          <n-input
            v-model:value="importText"
            type="textarea"
            placeholder="在此粘贴包含单条或多条规则的 JSON 字符串..."
            :rows="6"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="showImportModal = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            取消
          </button>
          <button
            @click="submitTextImport"
            class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            导入所填规则
          </button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<style scoped>
</style>