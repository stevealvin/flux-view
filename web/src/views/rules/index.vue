<script setup lang="ts">
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, NIcon } from 'naive-ui'
import { ruleService } from '@/utils/ruleService'
import { RefreshCcw, Search as SearchIcon, Plus, Edit as EditIcon, Trash2, Download, Upload, Copy, Archive } from '@lucide/vue'

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
      data = data.filter((r: any) => r.name?.toLowerCase().includes(searchName))
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
    message.success(val ? `已启用规则: ${row.name}` : `已禁用规则: ${row.name}`)
  } catch (error) {
    console.error('Failed to toggle rule state:', error)
    message.error('操作失败')
  }
}

const deleteRule = async (row: any) => {
  try {
    ruleService.deleteRule(row.id)
    message.success(`已成功删除规则: ${row.name}`)
    loadData()
  } catch (error) {
    console.error('Failed to delete rule:', error)
    message.error('删除规则失败')
  }
}

// 导出/备份规则
const exportRules = (rulesToExport: any[], filename: string) => {
  try {
    // 过滤掉本地生成的 id 和创建更新时间，使得导出的 JSON 规则文件更干净
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

const exportAllRules = () => {
  if (list.value.length === 0) {
    message.warning('当前列表中没有可导出的规则')
    return
  }
  exportRules(list.value, `nlview_rules_backup_${new Date().toISOString().slice(0, 10)}.json`)
}

// 复制规则 JSON 字符串到剪贴板
const copyRuleToClipboard = async (rule: any) => {
  try {
    const { id, created_at, updated_at, ...rest } = rule
    const jsonStr = JSON.stringify(rest, null, 2)
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonStr)
      message.success(`已成功复制规则 "${rule.name}" 的配置到剪贴板`)
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = jsonStr
      textArea.style.position = 'fixed'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      message.success(`已成功复制规则 "${rule.name}" 的配置到剪贴板`)
    }
  } catch (error: any) {
    message.error('复制到剪贴板失败: ' + error.message)
  }
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

// 处理导入的文件
const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    processImportJson(text)
  }
  reader.readAsText(file)
  target.value = '' // 清空以支持重复导入
}

// 解析和保存导入的规则
const processImportJson = (jsonStr: string) => {
  try {
    const data = JSON.parse(jsonStr)
    let importCount = 0

    const importSingle = (item: any) => {
      if (!item.name || !item.type) {
        throw new Error('解析失败，规则必须包含名称 (name) 和类型 (type)')
      }
      
      const ruleToSave = {
        name: item.name,
        description: item.description || '',
        type: item.type,
        discovery_code: item.discovery_code || 'export default async () => {\n  \n}',
        search_code: item.search_code || 'export default async () => {\n  \n}',
        detail_code: item.detail_code || 'export default async () => {\n  \n}',
        base_url: item.base_url || '',
        author: item.author || '未知',
        version: item.version || '1.0.0',
        enabled: item.enabled === undefined || item.enabled === null ? 1 : (item.enabled ? 1 : 0)
      }
      
      ruleService.saveRule(ruleToSave)
      importCount++
    }

    if (Array.isArray(data)) {
      data.forEach(item => importSingle(item))
    } else if (data && typeof data === 'object') {
      importSingle(data)
    } else {
      throw new Error('JSON 数据格式必须是对象或对象数组')
    }

    message.success(`成功导入 ${importCount} 个解析规则！`)
    showImportModal.value = false
    importText.value = ''
    loadData()
  } catch (error: any) {
    message.error('导入失败: ' + error.message)
  }
}

// 确认粘贴文本导入
const submitTextImport = () => {
  if (!importText.value.trim()) {
    message.warning('请先粘贴规则 JSON 文本')
    return
  }
  processImportJson(importText.value)
}

// 导入导出下拉菜单配置
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

// 一键复制所有规则到剪贴板
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
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = jsonStr
      textArea.style.position = 'fixed'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      message.success('已成功将所有规则配置复制到剪贴板')
    }
  } catch (error: any) {
    message.error('复制全部规则失败: ' + error.message)
  }
}

loadData()
</script>

<template>
  <div class="p-4 w-full flex flex-col gap-4">
    <!-- 现代头部与搜索面板 -->
    <div class="p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- 搜索输入控件 -->
        <div class="flex flex-wrap items-center gap-4 flex-grow max-w-4xl">
          <div class="w-64">
            <span class="text-xs text-neutral-400 dark:text-neutral-500 block mb-1.5 font-medium">名称搜索</span>
            <n-input v-model:value="form.name" placeholder="输入规则名称..." clearable @keyup.enter="onSearch" />
          </div>
          <div class="w-48">
            <span class="text-xs text-neutral-400 dark:text-neutral-500 block mb-1.5 font-medium">规则类型</span>
            <n-select
              v-model:value="form.type"
              placeholder="选择类型..."
              clearable
              :options="[
                { label: '视频', value: '视频' },
                { label: '图片', value: '图片' },
                { label: '小说', value: '小说' },
              ]"
              @update:value="onSearch"
            />
          </div>
          <div class="flex items-end self-end gap-2.5">
            <n-button secondary type="info" :loading="loading" @click="onSearch">
              <template #icon>
                <n-icon :component="SearchIcon" />
              </template>
              搜索
            </n-button>
            <n-button quaternary @click="onReset">
              <template #icon>
                <n-icon :component="RefreshCcw" />
              </template>
              重置
            </n-button>
          </div>
        </div>

        <!-- 批量操作与增加规则按钮 -->
        <div class="self-end flex items-center gap-2.5">
          <n-dropdown trigger="click" :options="dropdownOptions" @select="handleDropdownSelect">
            <n-button type="warning" secondary round class="px-4 hover:scale-105 transition-transform">
              <template #icon>
                <n-icon :component="Archive" />
              </template>
              导入/导出
            </n-button>
          </n-dropdown>
          <n-button type="info" secondary round class="px-4 hover:scale-105 transition-transform" @click="$router.push('/rules/edit')">
            <template #icon>
              <n-icon :component="Plus" />
            </template>
            增加规则
          </n-button>
        </div>
      </div>
    </div>

    <!-- 规则卡片网格 -->
    <div class="flex-grow flex flex-col min-h-[300px]">
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <n-spin size="large" />
        <span class="text-neutral-400 text-sm">正在加载规则数据源...</span>
      </div>

      <div v-else-if="list.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <n-empty description="暂无符合条件的规则" size="huge"></n-empty>
      </div>

      <div v-else class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="row in list"
          :key="row.id"
          class="group relative p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full"
        >
          <!-- 卡片顶部：信息和开关 -->
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-lg border border-sky-500/20">
                  {{ row.name ? row.name.charAt(0) : 'R' }}
                </div>
                <div>
                  <h3 class="font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-sky-500 transition-colors duration-200 text-sm line-clamp-1">
                    {{ row.name }}
                  </h3>
                  <span
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 dark:text-sky-400"
                  >
                    {{ row.type }}
                  </span>
                </div>
              </div>
              <n-switch
                :value="row.enabled === 1 || row.enabled === true"
                size="small"
                @update:value="(val) => toggleRule(row, val)"
                @click.stop
              />
            </div>

            <!-- 卡片中部：描述 -->
            <p class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed h-8">
              {{ row.description || '暂无规则描述。' }}
            </p>
          </div>

          <!-- 卡片底部：元数据和操作按钮 -->
          <div class="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between">
            <div class="text-[10px] text-neutral-400">
              <div>作者: {{ row.author || '未知' }}</div>
              <div>版本: v{{ row.version || '1.0.0' }}</div>
            </div>
            <div class="flex items-center gap-1">
              <n-tooltip trigger="hover" placement="top">
                <template #trigger>
                  <n-button quaternary circle size="medium" type="info" @click.stop="copyRuleToClipboard(row)">
                    <template #icon>
                      <n-icon :component="Copy" />
                    </template>
                  </n-button>
                </template>
                复制规则数据
              </n-tooltip>
              <n-button quaternary circle size="medium" type="info" @click="onGoto(row)">
                <template #icon>
                  <n-icon :component="EditIcon" />
                </template>
              </n-button>
              <n-popconfirm @positive-click="deleteRule(row)">
                <template #trigger>
                  <n-button quaternary circle size="medium" type="error" @click.stop>
                    <template #icon>
                      <n-icon :component="Trash2" />
                    </template>
                  </n-button>
                </template>
                确定要删除此规则吗？
              </n-popconfirm>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入规则弹窗 -->
    <n-modal
      v-model:show="showImportModal"
      preset="card"
      title="导入规则"
      style="width: 500px; max-width: 95vw;"
      :bordered="false"
      size="medium"
      class="rounded-2xl!"
    >
      <div class="flex flex-col gap-4">
        <!-- 文件上传选择 -->
        <div class="p-6 border border-dashed border-neutral-300 dark:border-neutral-700/80 rounded-2xl text-center bg-neutral-50/50 dark:bg-neutral-900/30">
          <Upload class="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto mb-2" />
          <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">选择 JSON 规则文件</p>
          <p class="text-xs text-neutral-400 mt-1 mb-4">导入备份的规则或第三方规则数据 (.json)</p>
          <n-button type="info" secondary round size="small" @click="triggerFileSelect">
            选择文件并导入
          </n-button>
          <input
            type="file"
            ref="fileInputRef"
            accept=".json"
            class="hidden"
            @change="handleFileImport"
          />
        </div>

        <!-- 分割线 -->
        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          <span class="flex-shrink mx-4 text-xs text-neutral-400 font-semibold">或者</span>
          <div class="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
        </div>

        <!-- 文本框粘贴 -->
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-400">粘贴 JSON 规则文本</span>
          <n-input
            v-model:value="importText"
            type="textarea"
            placeholder="在此处粘贴单个规则对象 {} 或规则数组 [...] 的 JSON 文本..."
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
          <n-button type="info" block round class="mt-2" @click="submitTextImport">
            确认解析并导入
          </n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<style scoped>
</style>