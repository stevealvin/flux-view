<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'EditView' })
import { useMessage } from 'naive-ui'
import http from '@/utils/http'
import { ruleService, type Rule } from '@/utils/ruleService'
import { RefreshCcw, Save, ArrowLeft, Copy, Download, Play, Code } from '@lucide/vue'
import CodeEditor from '@/components/CodeEditor/index.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = useTemplateRef('formRef')
const form = ref<Partial<Rule>>({
  name: '',
  description: '',
  type: '视频',
  discovery_code: `export default async () => {\n  \n}`,
  search_code: `export default async () => {\n  \n}`,
  detail_code: `export default async () => {\n  \n}`,
  author: '系统管理员',
  version: '1.0.0',
  base_url: '',
})
const submitLoading = ref(false)
const showDrawer = ref(false)
const runResult = ref('')

const loadData = async () => {
  let id = route.query.id
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
    type: '视频',
    discovery_code: 'export default async () => {\n  \n}',
    search_code: 'export default async () => {\n  \n}',
    detail_code: 'export default async () => {\n  \n}',
    author: '系统管理员',
    version: '1.0.0',
    base_url: '',
  }
  formRef.value?.restoreValidation()
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

const onRun = async (code: string | undefined) => { 
  if (!code) return
  showDrawer.value = true
  runResult.value = '正在沙箱中执行规则...'
  try {
    let result = await http.post('/rules/run', { code })
    runResult.value = JSON.stringify(result || {}, null, 2)
  } catch (error: any) {
    runResult.value = JSON.stringify(error?.response?.data || error?.message || error || {}, null, 2)
  }
}

const copyRule = async () => {
  try {
    const { id, created_at, updated_at, ...rest } = form.value
    const jsonStr = JSON.stringify(rest, null, 2)
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonStr)
      message.success('已复制当前规则配置到剪贴板')
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = jsonStr
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
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

loadData()
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-10">
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
          <n-form-item label="规则标识名称" path="name" :rule="{ required: true, message: '请输入唯一英文或拼音标识' }">
            <n-input v-model:value="form.name" clearable placeholder="如: b चरणों, javdb, bilibili" />
          </n-form-item>
          <n-form-item label="媒体类型" path="type" :rule="{ required: true, message: '请选择规则媒体类型' }">
            <n-select
              v-model:value="form.type"
              :options="[
                { label: '视频', value: '视频' },
                { label: '图片', value: '图片' },
                { label: '小说', value: '小说' },
              ]"
              clearable
            />
          </n-form-item>
        </div>

        <n-form-item label="规则描述">
          <n-input v-model:value="form.description" type="textarea" :autosize="{ minRows: 2 }" clearable placeholder="规则的详细说明及特性..." />
        </n-form-item>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <n-form-item label="作者" path="author" :rule="{ required: true, message: '请输入作者名称' }">
            <n-input v-model:value="form.author" clearable />
          </n-form-item>
          <n-form-item label="版本号" path="version" :rule="{ required: true, message: '请输入版本号' }">
            <n-input v-model:value="form.version" clearable placeholder="1.0.0" />
          </n-form-item>
          <n-form-item label="基础地址" path="base_url">
            <n-input v-model:value="form.base_url" clearable placeholder="https://example.com" />
          </n-form-item>
        </div>

        <!-- 脚本代码编辑器区 -->
        <div class="pt-2">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
            沙箱解析脚本 (JavaScript ES6, 内置 axios & cheerio)
          </label>
          <div id="drawer-target" class="w-full border border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden relative">
            <n-tabs type="line" size="small" class="p-3 bg-slate-50/50 dark:bg-white/[0.02]">
              <n-tab-pane name="1" tab="1. 发现页 (Discovery)" display-directive="show">
                <div class="relative pt-2">
                  <div class="absolute right-2 top-0 z-10">
                    <button
                      type="button"
                      @click="onRun(form.discovery_code)"
                      class="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                    >
                      <Play class="w-3 h-3 fill-current" />
                      <span>测试运行</span>
                    </button>
                  </div>
                  <code-editor v-model="form.discovery_code" model-id="discovery_code" :height="380" />
                </div>
              </n-tab-pane>

              <n-tab-pane name="2" tab="2. 搜索页 (Search)" display-directive="show">
                <div class="relative pt-2">
                  <div class="absolute right-2 top-0 z-10">
                    <button
                      type="button"
                      @click="onRun(form.search_code)"
                      class="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                    >
                      <Play class="w-3 h-3 fill-current" />
                      <span>测试运行</span>
                    </button>
                  </div>
                  <code-editor v-model="form.search_code" model-id="search_code" :height="380" />
                </div>
              </n-tab-pane>

              <n-tab-pane name="3" tab="3. 详情页 (Detail)" display-directive="show">
                <div class="relative pt-2">
                  <div class="absolute right-2 top-0 z-10">
                    <button
                      type="button"
                      @click="onRun(form.detail_code)"
                      class="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                    >
                      <Play class="w-3 h-3 fill-current" />
                      <span>测试运行</span>
                    </button>
                  </div>
                  <code-editor v-model="form.detail_code" model-id="detail_code" :height="380" />
                </div>
              </n-tab-pane>
            </n-tabs>

            <!-- 运行结果抽屉 -->
            <n-drawer to="#drawer-target" v-model:show="showDrawer" width="50%" placement="right">
              <n-drawer-content title="沙箱执行日志与返回数据" closable>
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