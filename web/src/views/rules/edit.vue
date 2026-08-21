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
const testActionOptions = [
  { label: 'discovery()', value: 'discovery' },
  { label: 'search()', value: 'search' },
  { label: 'detail()', value: 'detail' },
  { label: 'parse()', value: 'parse' }
]
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
        <n-button
          quaternary
          size="small"
          class="!p-2 !rounded-xl"
          @click="router.back()"
          title="返回"
        >
          <template #icon>
            <ArrowLeft class="w-4 h-4" />
          </template>
        </n-button>
        <div>
          <h1 class="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span>{{ route.query.id ? '编辑规则配置' : '新建规则' }}</span>
          </h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400" v-if="form.name">
            {{ form.name }} • {{ form.type || '未指定' }} • v{{ form.version || '1.0.0' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2" v-if="route.query.id">
        <n-button
          size="small"
          secondary
          class="!rounded-xl !font-bold"
          @click="copyRule"
        >
          <template #icon>
            <Copy class="w-3.5 h-3.5" />
          </template>
          <span class="hidden sm:inline">复制配置</span>
        </n-button>
        <n-button
          size="small"
          type="primary"
          secondary
          class="!rounded-xl !font-bold"
          @click="exportRule"
        >
          <template #icon>
            <Download class="w-3.5 h-3.5" />
          </template>
          <span class="hidden sm:inline">导出文件</span>
        </n-button>
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
            <label class="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              标准 ESModule 沙箱脚本 (内置 axios & cheerio)
            </label>
            
            <!-- 快速测试调试栏 (Naive UI 组件) -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-zinc-400">动作:</span>
              <n-select
                v-model:value="testAction"
                size="small"
                :options="testActionOptions"
                class="w-32 !rounded-lg text-xs"
              />

              <n-input
                v-model:value="testParam"
                size="small"
                placeholder="测试参数 (关键字/key/分类)..."
                clearable
                class="w-36 sm:w-48 !rounded-lg text-xs"
                @keyup.enter="onRunTest"
              />

              <n-button
                size="small"
                type="primary"
                class="!rounded-lg !font-bold"
                :loading="testing"
                @click="onRunTest"
              >
                <template #icon>
                  <Play class="w-3 h-3 fill-current" />
                </template>
                {{ testing ? '运行中...' : '测试运行' }}
              </n-button>
            </div>
          </div>

          <div id="drawer-target" class="w-full border border-emerald-100/60 dark:border-white/10 rounded-2xl overflow-hidden relative">
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
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-emerald-100/50 dark:border-white/5 mt-6">
          <n-button
            size="medium"
            secondary
            class="!rounded-xl !font-bold"
            @click="onReset"
          >
            <template #icon>
              <RefreshCcw class="w-3.5 h-3.5" />
            </template>
            重置
          </n-button>
          <n-button
            size="medium"
            type="primary"
            class="!rounded-xl !font-bold"
            :loading="submitLoading"
            @click="onSubmit"
          >
            <template #icon>
              <Save class="w-3.5 h-3.5" />
            </template>
            {{ submitLoading ? '保存中...' : '保存规则配置' }}
          </n-button>
        </div>
      </n-form>
    </div>
  </div>
</template>

<style scoped>
</style>