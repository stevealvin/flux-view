<script setup lang="ts">
import http from '@/utils/http'
import { ruleService, type Rule } from '@/utils/ruleService'
import { RefreshCcw, Save, ArrowLeft, Copy, Download } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = useTemplateRef('formRef')
const form = ref<Partial<Rule>>({
  name: '',
  description: '',
  type: '',
  discovery_code: `export default async () => {\n  \n}`,
  search_code: `export default async () => {\n  \n}`,
  detail_code: `export default async () => {\n  \n}`,
  author: '管理员',
  version: '',
  base_url: '',
})
const submitLoading = ref(false)
const showDrawer = ref(false)
const runResult = ref()

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
    type: '',
    discovery_code: 'export default async () => {\n  \n}',
    search_code: 'export default async () => {\n  \n}',
    detail_code: 'export default async () => {\n  \n}',
    author: '管理员',
    version: '',
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
    message.success('保存成功')
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

const onRun = async (code) => { 
  showDrawer.value = true
  runResult.value = '正在运行...'
  try {
    let result = await http.post('/rules/run', { code })
    runResult.value = JSON.stringify(result || {}, null, 2)
  } catch (error) {
    runResult.value = JSON.stringify(error || {}, null, 2)
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
      textArea.style.position = 'fixed'
      document.body.appendChild(textArea)
      textArea.focus()
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
    const jsonStr = JSON.stringify([rest], null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.value.name || 'rule'}_v${form.value.version || '1.0.0'}_rule.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch (error: any) {
    message.error('导出失败: ' + error.message)
  }
}

loadData()
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-50/30 dark:bg-neutral-900/10">
    <!-- 顶部操作栏 -->
    <div class="bg-white/40 dark:bg-neutral-800/20 border-b border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md sticky top-0 z-30 w-full">
      <div class="px-4 py-3 flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <n-button quaternary circle size="medium" @click="router.back()">
            <template #icon>
              <ArrowLeft class="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </template>
          </n-button>
          <div>
            <h1 class="text-sm font-bold text-neutral-800 dark:text-neutral-100 max-w-lg line-clamp-1">
              规则编辑
            </h1>
            <p class="text-[10px] text-neutral-400" v-if="form.name">{{ form.name }} • {{ form.type || '未指定' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2" v-if="route.query.id">
          <n-button secondary size="small" type="info" round @click="copyRule">
            <template #icon>
              <n-icon :component="Copy" />
            </template>
            复制配置
          </n-button>
          <n-button secondary size="small" type="success" round @click="exportRule">
            <template #icon>
              <n-icon :component="Download" />
            </template>
            导出文件
          </n-button>
        </div>
      </div>
    </div>

    <!-- 主内容面板 -->
    <div class="flex-1 overflow-auto px-4 py-4">
      <n-card class="rounded-md!">
        <n-form ref="formRef" :model="form">
          <n-form-item label="名称" path="name" :rule="{ required: true, message: '请输入' }">
            <n-input v-model:value="form.name" clearable />
          </n-form-item>
          <n-form-item label="描述" path="description">
            <n-input v-model:value="form.description" type="textarea" :autosize="{ minRows: 2 }" clearable />
          </n-form-item>
          <div class="grid grid-cols-4 gap-4">
            <n-form-item label="类型" path="type" :rule="{ required: true, message: '请输入' }">
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
          <div class="grid grid-cols-4 gap-4">
            <n-form-item label="作者" path="author" :rule="{ required: true, message: '请输入' }">
              <n-input v-model:value="form.author" clearable />
            </n-form-item>
            <n-form-item label="版本号" path="version" :rule="{ required: true, message: '请输入' }">
              <n-input v-model:value="form.version" clearable placeholder="1.0.0" />
            </n-form-item>
          </div>
          <n-form-item label="基础地址" path="base_url">
            <n-input v-model:value="form.base_url" clearable />
          </n-form-item>
          
          <n-form-item label="脚本内容（javascript代码, 支持ES6语法, 内置axios, cheerio库）" :show-feedback="false">
            <div id="drawer-target" class="w-full">
              <n-tabs type="card" size="small">
                <n-tab-pane name="1" tab="发现页" display-directive="show">
                  <code-editor v-model="form.discovery_code" model-id="discovery_code" />
                  <div class="absolute right-5 top-13 z-10">
                    <n-button type="info" size="small" @click="onRun(form.discovery_code)">运行</n-button>
                  </div>
                </n-tab-pane>
                <n-tab-pane name="2" tab="搜索页" display-directive="show">
                  <code-editor v-model="form.search_code" model-id="search_code" />
                  <div class="absolute right-5 top-13 z-10">
                    <n-button type="info" size="small" @click="onRun(form.search_code)">运行</n-button>
                  </div>
                </n-tab-pane>
                <n-tab-pane name="3" tab="详情页" display-directive="show">
                  <code-editor v-model="form.detail_code" model-id="detail_code" />
                  <div class="absolute right-5 top-13 z-10">
                    <n-button type="info" size="small" @click="onRun(form.detail_code)">运行</n-button>
                  </div>
                </n-tab-pane>
              </n-tabs>
              <n-drawer to="#drawer-target" v-model:show="showDrawer" width="45%" placement="right">
                <n-drawer-content title="运行结果" closable>
                  <code-editor v-model="runResult" model-id="run_result" :height="460" />
                </n-drawer-content>
              </n-drawer>
            </div>
          </n-form-item>
          <n-form-item>
            <div class="flex gap-4">
              <n-button block @click="onReset">
                <template #icon>
                  <n-icon :component="RefreshCcw" />
                </template>
                重置
              </n-button>
              <n-button block type="primary" :loading="submitLoading" @click="onSubmit">
                <template #icon>
                  <n-icon :component="Save" />
                </template>
                提交
              </n-button>
            </div>
          </n-form-item>
        </n-form>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.rule-card {
  background: radial-gradient(26% 84% at 4% 4%, #dddce54d 0%, #f5f4f700 94%), #fff;
  cursor: pointer;
}
</style>