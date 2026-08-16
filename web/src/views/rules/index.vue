<script setup lang="ts">
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'RulesView' })
import { useMessage, NIcon } from 'naive-ui'
import { ruleService } from '@/utils/ruleService'
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
  ExternalLink
} from '@lucide/vue'

const router = useRouter()
const message = useMessage()

const form = ref({
  name: '',
  type: ''
})
const list = ref<any[]>([])
const loading = ref(false)

// 导入导出相关的状态
const showImportModal = ref(false)
const importText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const loadData = async () => {
  loading.value = true
  try {
    let data = ruleService.getRules()
    
    // 客户端本地过滤
    if (form.value.name.trim()) {
      const searchName = form.value.name.toLowerCase().trim()
      data = data.filter((r: any) => r.name?.toLowerCase().includes(searchName) || r.title?.toLowerCase().includes(searchName))
    }
    if (form.value.type) {
      data = data.filter((r: any) => r.type === form.value.type)
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

const onGoto = (row: any) => {
  router.push(`/rules/edit?id=${row.id}`)
}

const toggleRule = async (row: any, val: boolean) => {
  try {
    const nextVal = val ? 1 : 0
    ruleService.toggleRuleEnabled(row.id, nextVal)
    row.enabled = nextVal
    message.success(val ? `已启用规则: ${row.title || row.name}` : `已禁用规则: ${row.title || row.name}`)
  } catch (error) {
    console.error('Failed to toggle rule state:', error)
    message.error('操作失败')
  }
}

const deleteRule = async (row: any) => {
  try {
    ruleService.deleteRule(row.id)
    message.success(`已成功删除规则: ${row.title || row.name}`)
    loadData()
  } catch (error) {
    console.error('Failed to delete rule:', error)
    message.error('删除规则失败')
  }
}

// 导出/备份规则
const exportRules = (rulesToExport: any[], filename: string) => {
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

// 单个规则导出
const exportSingleRule = (row: any) => {
  const filename = `${row.name || 'rule'}_backup.json`
  exportRules([row], filename)
}

// 复制单个规则到剪贴板
const copySingleRule = async (row: any) => {
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
    message.success(`已复制规则 [${row.title || row.name}]`)
  } catch (error: any) {
    message.error('复制失败: ' + error.message)
  }
}

// 全部导出
const exportAllRules = () => {
  if (list.value.length === 0) {
    message.warning('当前列表中没有可导出的规则')
    return
  }
  const dateStr = new Date().toISOString().slice(0, 10)
  exportRules(list.value, `flux_view_rules_all_${dateStr}.json`)
}

// 导入 JSON 文件触发
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理导入文件
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

// 解析导入内容并写入
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
        ruleService.saveRule({
          name: item.name,
          title: item.title || item.name,
          type: item.type || '视频',
          version: item.version || '1.0.0',
          author: item.author || '',
          description: item.description || '',
          base_url: item.base_url || '',
          discovery_code: item.discovery_code || '',
          search_code: item.search_code || '',
          detail_code: item.detail_code || '',
          ext: item.ext || '',
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

const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const dropdownOptions = [
  {
    label: '导入规则 (文件/文本)',
    key: 'import',
    icon: renderIcon(Upload)
  },
  {
    label: '复制全部规则 (剪贴板)',
    key: 'copy_all',
    icon: renderIcon(Copy)
  },
  {
    label: '导出全部规则 (JSON文件)',
    key: 'export_all',
    icon: renderIcon(Download)
  }
]

const handleDropdownSelect = (key: string) => {
  if (key === 'import') {
    showImportModal.value = true
  } else if (key === 'copy_all') {
    copyAllRulesToClipboard()
  } else if (key === 'export_all') {
    exportAllRules()
  }
}

const copyAllRulesToClipboard = async () => {
  try {
    if (list.value.length === 0) {
      message.warning('当前列表中没有可复制的规则')
      return
    }
    const cleaned = list.value.map(({ id, created_at, updated_at, ...rest }) => rest)
    const jsonStr = JSON.stringify(cleaned, null, 2)
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonStr)
      message.success('已成功将所有规则配置复制到剪贴板')
    }
  } catch (error: any) {
    message.error('复制全部规则失败: ' + error.message)
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case '视频': return Video
    case '图片': return ImageIcon
    case '小说': return BookOpen
    default: return Compass
  }
}

loadData()
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-10">
    <!-- 现代头部与过滤控制面板 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-5 space-y-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- 搜索与类型过滤 -->
        <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div class="w-full sm:w-60">
            <n-input v-model:value="form.name" placeholder="搜索规则名称..." clearable @keyup.enter="onSearch" />
          </div>
          <div class="w-full sm:w-40">
            <n-select
              v-model:value="form.type"
              placeholder="所有媒体类型"
              clearable
              :options="[
                { label: '视频', value: '视频' },
                { label: '图片', value: '图片' },
                { label: '小说', value: '小说' },
              ]"
              @update:value="onSearch"
            />
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="onSearch"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <SearchIcon class="w-3.5 h-3.5" />
              <span>查询</span>
            </button>
            <button
              @click="onReset"
              class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
            >
              <RefreshCcw class="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>

        <!-- 批量操作与增加规则按钮 -->
        <div class="flex items-center gap-2.5">
          <n-dropdown trigger="click" :options="dropdownOptions" @select="handleDropdownSelect">
            <button class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-800/30 transition-all cursor-pointer">
              <Archive class="w-3.5 h-3.5" />
              <span>导入/导出</span>
            </button>
          </n-dropdown>

          <button
            @click="$router.push('/rules/edit')"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>新建规则</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 规则卡片列表 -->
    <div class="space-y-4">
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-3">
        <n-spin size="large" />
        <span class="text-slate-400 text-sm">正在加载规则源...</span>
      </div>

      <div
        v-else-if="list.length === 0"
        class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <Sparkles class="w-10 h-10 text-slate-400" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">暂无符合条件的规则</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">请尝试更换筛选条件或点击右上角“新建规则”。</p>
      </div>

      <!-- 规则卡片网格 (mori-box 风格) -->
      <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="row in list"
          :key="row.id"
          class="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between h-full group"
        >
          <!-- 卡片上部分：名称、开关、作者与描述 -->
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <component :is="getTypeIcon(row.type)" class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" :title="row.title || row.name">
                    {{ row.title || row.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">v{{ row.version || '1.0.0' }}</span>
                    <span class="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                      {{ row.type }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 启用状态 Switch 开关 -->
              <n-switch
                :value="row.enabled === 1 || row.enabled === true"
                size="medium"
                @update:value="(val) => toggleRule(row, val)"
              />
            </div>

            <!-- 描述 -->
            <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {{ row.description || '暂无描述信息' }}
            </p>
          </div>

          <!-- 卡片下部分：操作动作工具条 -->
          <div class="pt-3 mt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-xs">
            <div class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
              <span>{{ row.author || '系统' }}</span>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex items-center gap-1">
              <button
                @click="onGoto(row)"
                class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="编辑规则"
              >
                <EditIcon class="w-3.5 h-3.5" />
              </button>
              <button
                @click="copySingleRule(row)"
                class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="复制 JSON"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
              <button
                @click="exportSingleRule(row)"
                class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="导出规则文件"
              >
                <Download class="w-3.5 h-3.5" />
              </button>
              <n-popconfirm @positive-click="deleteRule(row)">
                <template #trigger>
                  <button
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="删除规则"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </template>
                确定要删除规则 "{{ row.title || row.name }}" 吗？
              </n-popconfirm>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入规则 Modal 弹窗 -->
    <n-modal v-model:show="showImportModal" preset="card" title="导入规则 (JSON)" class="max-w-xl">
      <div class="space-y-4">
        <div>
          <button
            @click="triggerFileInput"
            class="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/40 hover:bg-indigo-50/20 transition-colors cursor-pointer"
          >
            <Upload class="w-8 h-8 text-indigo-500" />
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">点击选择本地 JSON 规则文件</span>
            <span class="text-[10px] text-slate-400">支持单个规则或批量规则数组文件</span>
          </button>
          <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileChange" />
        </div>

        <div class="relative flex items-center justify-center">
          <div class="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          <span class="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 absolute">或者直接粘贴 JSON</span>
        </div>

        <n-input
          v-model:value="importText"
          type="textarea"
          placeholder="在此粘贴规则 JSON 内容..."
          :rows="6"
        />

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
            确认导入
          </button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<style scoped>
</style>