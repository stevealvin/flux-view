<script setup lang="ts">
import { ref, useTemplateRef, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'EditView' })
import { useMessage } from 'naive-ui'
import http from '@/utils/http'
import { ruleService, type RuleSchema, type MediaType } from '@/utils/ruleService'
import { RefreshCcw, Save, ArrowLeft, Copy, Download, Play, Code, Sparkles } from '@lucide/vue'
import CodeEditor from '@/components/CodeEditor/index.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = useTemplateRef('formRef')
const form = ref<Partial<RuleSchema>>({
  name: '',
  description: '',
  type: 'video',
  author: '系统管理员',
  version: '1.0.0',
  baseUrl: '',
  code: `import axios from 'axios'
import * as cheerio from 'cheerio'

export default {
  // 1. 发现流
  async discovery({ category, page = 1 }) {
    return {
      categories: ['最新', '热门'],
      items: [
        {
          key: 'item_1',
          title: '示例项目',
          cover: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500',
          badge: '高清',
          desc: '示例描述'
        }
      ],
      hasMore: false
    }
  },

  // 2. 搜索
  async search({ keyword, page = 1 }) {
    return {
      items: [],
      hasMore: false
    }
  },

  // 3. 详情
  async detail({ key, item }) {
    return {
      title: item?.title || '详情标题',
      cover: item?.cover,
      desc: '正文介绍',
      tags: ['精选'],
      media: {
        type: 'video',
        url: ''
      }
    }
  },

  // 4. 解析
  async parse({ key }) {
    return {
      url: key
    }
  }
}`
})

const testAction = ref<'discovery' | 'search' | 'detail' | 'parse'>('discovery')
const testParam = ref('')
const submitLoading = ref(false)
const testing = ref(false)
const showDrawer = ref(false)
const runResult = ref('')

const loadData = () => {
  const id = route.query.id
  if (!id) return
  const result = ruleService.getRuleById(id as string)
  if (result) {
    form.value = { ...result }
  }
}

const onReset = () => {
  form.value = {
    name: '',
    description: '',
    type: 'video',
    author: '系统管理员',
    version: '1.0.0',
    baseUrl: '',
    code: `export default {\n  async discovery({ category, page = 1 }) {\n    return { items: [] }\n  }\n}`
  }
}

const onSubmit = async () => {
  let { warnings } = await formRef.value?.validate()
  if (warnings) return

  submitLoading.value = true
  try {
    const saved = ruleService.saveRule(form.value)
    message.success('保存规则成功')
    if (!route.query.id && saved.id) {
      router.replace(`/rules/edit?id=${saved.id}`)
    } else {
      loadData()
    }
  } catch (error: any) {
    message.error('保存失败: ' + error.message)
  }
  submitLoading.value = false
}

const onRunTest = async () => {
  if (!form.value.code) return
  showDrawer.value = true
  testing.value = true
  runResult.value = `沙箱正在执行 [action: ${testAction.value}] ...`

  try {
    let params: any = {}
    if (testAction.value === 'discovery') {
      params = { category: testParam.value || '', page: 1, baseUrl: form.value.baseUrl }
    } else if (testAction.value === 'search') {
      params = { keyword: testParam.value || 'test', page: 1, baseUrl: form.value.baseUrl }
    } else if (testAction.value === 'detail') {
      params = { key: testParam.value || 'test_key', baseUrl: form.value.baseUrl }
    } else if (testAction.value === 'parse') {
      params = { key: testParam.value || 'test_key', baseUrl: form.value.baseUrl }
    }

    const result = await http.post('/rules/execute', {
      code: form.value.code,
      action: testAction.value,
      params
    })
    runResult.value = JSON.stringify(result || {}, null, 2)
  } catch (error: any) {
    runResult.value = JSON.stringify(error?.response?.data || error?.message || error || {}, null, 2)
  } finally {
    testing.value = false
  }
}

const copyRule = async () => {
  try {
    const { id, created_at, updated_at, ...rest } = form.value
    const jsonStr = JSON.stringify(rest, null, 2)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonStr)
      message.success('已复制当前规则配置到剪贴板')
    }
  } catch (error: any) {
    message.error('复制失败: ' + error.message)
  }
}

const exportRule = () => {
  try {
    const { id, created_at, updated_at, ...rest } = form.value
    const jsonStr = JSON.stringify(rest, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.value.name || 'rule'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('已导出规则文件')
  } catch (error: any) {
    message.error('导出失败: ' + error.message)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-12">
    <!-- 顶部操作栏 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/10 transition-all cursor-pointer flex-shrink-0"
          title="返回"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{{ route.query.id ? '编辑规则配置' : '新建规则' }}</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400" v-if="form.name">
            {{ form.name }} • {{ form.type || '未指定' }} • v{{ form.version || '1.0.0' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2" v-if="route.query.id">
        <button
          @click="copyRule"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
        >
          <Copy class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">复制配置</span>
        </button>
        <button
          @click="exportRule"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-800/30 transition-all cursor-pointer"
        >
          <Download class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">导出文件</span>
        </button>
      </div>
    </div>

    <!-- 主表单面板 -->
    <div class="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
      <n-form ref="formRef" :model="form">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <n-form-item label="规则标识名称 *" path="name" :rule="{ required: true, message: '请输入规则名称' }">
            <n-input v-model:value="form.name" clearable placeholder="如: 全面屏超清壁纸, JAVMENU" />
          </n-form-item>
          <n-form-item label="媒体类型 *" path="type" :rule="{ required: true, message: '请选择规则媒体类型' }">
            <n-select
              v-model:value="form.type"
              :options="[
                { label: '视频 (Video)', value: 'video' },
                { label: '图片 (Picture)', value: 'picture' },
                { label: '小说 (Novel)', value: 'novel' },
              ]"
              clearable
            />
          </n-form-item>
        </div>

        <n-form-item label="规则描述">
          <n-input v-model:value="form.description" type="textarea" :autosize="{ minRows: 2 }" clearable placeholder="规则的详细说明及特性..." />
        </n-form-item>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <n-form-item label="作者" path="author">
            <n-input v-model:value="form.author" clearable />
          </n-form-item>
          <n-form-item label="版本号" path="version">
            <n-input v-model:value="form.version" clearable placeholder="1.0.0" />
          </n-form-item>
          <n-form-item label="目标站点根域名" path="baseUrl">
            <n-input v-model:value="form.baseUrl" clearable placeholder="https://example.com" />
          </n-form-item>
        </div>

        <!-- 脚本代码编辑器区 -->
        <div class="pt-2">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">
              标准 ESModule 沙箱脚本 (内置 axios & cheerio)
            </label>
            
            <!-- 快速测试调试栏 -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400">动作:</span>
              <select
                v-model="testAction"
                class="px-2 py-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 rounded-lg text-xs font-mono outline-none"
              >
                <option value="discovery">discovery()</option>
                <option value="search">search()</option>
                <option value="detail">detail()</option>
                <option value="parse">parse()</option>
              </select>

              <input
                v-model="testParam"
                type="text"
                placeholder="测试参数 (关键字/key/分类)..."
                class="px-2.5 py-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 rounded-lg text-xs outline-none w-36 sm:w-48"
              />

              <button
                type="button"
                @click="onRunTest"
                :disabled="testing"
                class="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Play class="w-3 h-3 fill-current" />
                <span>{{ testing ? '运行中...' : '测试运行' }}</span>
              </button>
            </div>
          </div>

          <div id="drawer-target" class="w-full border border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden relative">
            <code-editor v-model="form.code" model-id="rule_code" :height="480" />

            <!-- 运行结果抽屉 -->
            <n-drawer to="#drawer-target" v-model:show="showDrawer" width="55%" placement="right">
              <n-drawer-content title="沙箱执行返回值与结构" closable>
                <code-editor v-model="runResult" model-id="run_result" :height="420" />
              </n-drawer-content>
            </n-drawer>
          </div>
        </div>

        <!-- 底部提交/重置工具条 -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-slate-200/50 dark:border-white/5 mt-6">
          <button
            type="button"
            @click="onReset"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
          >
            <RefreshCcw class="w-3.5 h-3.5" />
            <span>重置</span>
          </button>
          <button
            type="button"
            :disabled="submitLoading"
            @click="onSubmit"
            class="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save class="w-3.5 h-3.5" />
            <span>{{ submitLoading ? '保存中...' : '保存规则配置' }}</span>
          </button>
        </div>
      </n-form>
    </div>
  </div>
</template>

<style scoped>
</style>