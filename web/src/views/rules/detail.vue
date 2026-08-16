<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'DetailView' })
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import { ArrowLeft, AlertCircle, Compass } from '@lucide/vue'
import VideoDetail from './components/VideoDetail.vue'
import ImageDetail from './components/ImageDetail.vue'
import TextDetail from './components/TextDetail.vue'

const route = useRoute()
const router = useRouter()

const rule = ref<any>(null)
const mediaType = ref<'video' | 'images' | 'text' | null>(null)
const videoUrl = ref('')
const images = ref<any[]>([])
const textContent = ref('')
const relatedList = ref<any[]>([])
const discoveryList = ref<any[]>([])
const desc = ref('')
const loading = ref(true)
const executing = ref(false)
const errorMsg = ref('')

const loadDetail = async () => {
  loading.value = true
  errorMsg.value = ''
  videoUrl.value = ''
  images.value = []
  textContent.value = ''
  relatedList.value = []
  discoveryList.value = []
  desc.value = ''
  
  const ruleId = Number(route.query.ruleId)
  const href = route.query.href as string
  
  if (!ruleId || !href) {
    errorMsg.value = '无效的参数'
    loading.value = false
    return
  }

  try {
    const ruleRes = ruleService.getRuleById(ruleId)
    rule.value = ruleRes
    
    if (!rule.value) {
      errorMsg.value = '解析规则未找到'
      loading.value = false
      return
    }

    let itemContext = null
    if (route.query.item) {
      try {
        itemContext = JSON.parse(route.query.item as string)
      } catch (e) {
        console.error('Failed to parse item query context:', e)
      }
    }
    if (!itemContext) {
      itemContext = {
        href,
        title: route.query.title,
        cover: route.query.cover
      }
    }

    executing.value = true
    const res = await http.post('/rules/run', {
      code: rule.value.detail_code,
      context: { 
        href,
        title: route.query.title,
        cover: route.query.cover,
        item: itemContext
      }
    })

    if (rule.value.type === '视频' || (res && res.videoUrl)) {
      mediaType.value = 'video'
      videoUrl.value = res.videoUrl || ''
      relatedList.value = res.list || []
      discoveryList.value = res.discovery || []
      images.value = res.images || []
      desc.value = res.desc || res.description || ''
    } else if (rule.value.type === '图片' || Array.isArray(res)) {
      mediaType.value = 'images'
      if (Array.isArray(res)) {
        images.value = res
      } else if (res && typeof res === 'object') {
        images.value = res.images || res.list || []
      }
    } else if (rule.value.type === '小说' || (res && (res.content || res.text))) {
      mediaType.value = 'text'
      textContent.value = res.content || res.text || ''
      relatedList.value = res.list || res.chapters || []
    } else {
      if (res && res.videoUrl) {
        mediaType.value = 'video'
        videoUrl.value = res.videoUrl
        relatedList.value = res.list || []
        discoveryList.value = res.discovery || []
        images.value = res.images || []
        desc.value = res.desc || res.description || ''
      } else if (Array.isArray(res)) {
        mediaType.value = 'images'
        images.value = res
      } else if (res && (res.content || res.text)) {
        mediaType.value = 'text'
        textContent.value = res.content || res.text
        relatedList.value = res.list || res.chapters || []
      } else {
        errorMsg.value = '不支持的媒体格式或规则解析返回数据为空'
      }
    }
  } catch (error: any) {
    errorMsg.value = '抓取媒体详情失败: ' + (error.response?.data?.message || error.message || error)
  } finally {
    loading.value = false
    executing.value = false
  }
}

const goToRelated = (item: any) => {
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: route.query.ruleId,
      href: item.href || item.url,
      title: item.title,
      cover: item.cover,
      item: JSON.stringify(item)
    }
  })
}

watch([() => route.query.href, () => route.query.ruleId], () => {
  loadDetail()
})

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-10">
    <!-- 顶部操作栏 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3 min-w-0">
        <button
          @click="router.back()"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/10 transition-all cursor-pointer flex-shrink-0"
          title="返回"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div class="min-w-0">
          <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
            {{ route.query.title || '媒体详情播放' }}
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400" v-if="rule">
            来源: {{ rule.title || rule.name }} • {{ rule.type }}
          </p>
        </div>
      </div>
    </div>

    <!-- 主展示面板 -->
    <div>
      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-28 gap-3">
        <n-spin size="large" />
        <span class="text-slate-400 text-sm">正在加载并解析媒体播放地址...</span>
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="errorMsg"
        class="glass-panel rounded-2xl p-8 max-w-md mx-auto my-12 text-center flex flex-col items-center justify-center space-y-3 border-rose-500/30 bg-rose-500/5"
      >
        <AlertCircle class="w-10 h-10 text-rose-500" />
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">解析异常</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ errorMsg }}</p>
        <button
          @click="loadDetail"
          class="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
        >
          重试
        </button>
      </div>

      <!-- 媒体内容面板 -->
      <div v-else class="w-full">
        <VideoDetail
          v-if="mediaType === 'video'"
          :video-url="videoUrl"
          :title="route.query.title as string"
          :desc="desc"
          :images="images"
          :discovery="discoveryList"
          :list="relatedList"
          @select="goToRelated"
        />

        <ImageDetail
          v-else-if="mediaType === 'images'"
          :images="images"
        />

        <TextDetail
          v-else-if="mediaType === 'text'"
          :title="route.query.title as string"
          :text-content="textContent"
          :related-list="relatedList"
          @select="goToRelated"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
