<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'DetailView' })
import { ruleService, type RuleSchema, type MediaDetail, type MediaItem } from '@/utils/ruleService'
import { ArrowLeft, AlertCircle, RefreshCw, Compass } from '@lucide/vue'
import VideoDetail from './components/VideoDetail.vue'
import ImageDetail from './components/ImageDetail.vue'
import TextDetail from './components/TextDetail.vue'

const route = useRoute()
const router = useRouter()

const rule = ref<RuleSchema | null>(null)
const detail = ref<MediaDetail | null>(null)
const loading = ref(true)
const executing = ref(false)
const errorMsg = ref('')

const loadDetail = async () => {
  loading.value = true
  executing.value = true
  errorMsg.value = ''
  detail.value = null

  const ruleId = Number(route.query.ruleId)
  const key = (route.query.key as string) || (route.query.href as string) || (route.query.url as string)

  if (!ruleId || !key) {
    errorMsg.value = '缺少必要的请求参数 (ruleId 或 key)'
    loading.value = false
    executing.value = false
    return
  }

  try {
    const ruleRes = ruleService.getRuleById(ruleId)
    rule.value = ruleRes

    if (!rule.value) {
      errorMsg.value = '对应的解析规则未找到，可能已被删除'
      loading.value = false
      executing.value = false
      return
    }

    const itemContext: Partial<MediaItem> = {
      key,
      title: route.query.title as string,
      cover: route.query.cover as string
    }

    const res = await ruleService.runDetail(rule.value, {
      key,
      item: itemContext
    })

    detail.value = res
  } catch (error: any) {
    errorMsg.value = '抓取媒体详情失败: ' + (error.response?.data?.message || error.message || error)
  } finally {
    loading.value = false
    executing.value = false
  }
}

const goToRelated = (item: MediaItem) => {
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: route.query.ruleId,
      key: item.key,
      title: item.title,
      cover: item.cover
    }
  })
}

watch([() => route.query.key, () => route.query.href, () => route.query.ruleId], () => {
  loadDetail()
})

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- 顶部操作栏 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3 min-w-0">
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
        <div class="min-w-0">
          <h1 class="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white truncate">
            {{ detail?.title || (route.query.title as string) || '媒体详情播放' }}
          </h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400" v-if="rule">
            来源: {{ rule.name }} • {{ rule.type === 'video' ? '视频' : rule.type === 'picture' ? '图片' : '小说' }}
          </p>
        </div>
      </div>

      <!-- 刷新按钮 -->
      <n-button
        size="small"
        secondary
        class="!rounded-xl"
        :loading="executing"
        @click="loadDetail"
        title="重新解析"
      >
        <template #icon>
          <RefreshCw class="w-3.5 h-3.5" />
        </template>
      </n-button>
    </div>

    <!-- 主展示面板 -->
    <div>
      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-28 gap-3">
        <n-spin size="large" />
        <span class="text-zinc-400 text-sm">沙箱正在解析媒体播放与正文数据...</span>
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="errorMsg"
        class="glass-panel rounded-2xl p-8 max-w-md mx-auto my-12 text-center flex flex-col items-center justify-center space-y-3 border-rose-500/30 bg-rose-500/5"
      >
        <AlertCircle class="w-10 h-10 text-rose-500" />
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">解析异常</h3>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ errorMsg }}</p>
        <n-button
          type="error"
          ghost
          class="!rounded-xl !font-bold mt-3"
          @click="loadDetail"
        >
          重新尝试
        </n-button>
      </div>

      <!-- 媒体内容面板 (多态分发) -->
      <div v-else-if="detail" class="w-full">
        <!-- 1. 视频播放器与选集 -->
        <VideoDetail
          v-if="detail.media?.type === 'video' || rule?.type === 'video'"
          :detail="detail"
          :rule="rule || undefined"
          @select="goToRelated"
        />

        <!-- 2. 图集画廊 -->
        <ImageDetail
          v-else-if="detail.media?.type === 'picture' || rule?.type === 'picture'"
          :images="detail.media?.images || []"
          :title="detail.title"
          :desc="detail.desc"
        />

        <!-- 3. 小说阅读器与章节 -->
        <TextDetail
          v-else-if="detail.media?.type === 'novel' || rule?.type === 'novel'"
          :detail="detail"
          :rule="rule || undefined"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
