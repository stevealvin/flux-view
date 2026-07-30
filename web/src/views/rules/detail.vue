<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import { ArrowLeft, AlertCircle } from '@lucide/vue'
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
    // 1. 获取规则信息
    const ruleRes = ruleService.getRuleById(ruleId)
    rule.value = ruleRes
    
    if (!rule.value) {
      errorMsg.value = '解析规则未找到'
      loading.value = false
      return
    }

    // Parse item context
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

    // 2. 执行详情页解析代码
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

    // 3. 确定媒体类型并填充数值
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
      // 自动备用检查
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
        errorMsg.value = '不支持的媒体格式或规则解析返回数据空'
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

// 监听 query 变化以重新加载详情页
watch([() => route.query.href, () => route.query.ruleId], () => {
  loadDetail()
})

onMounted(() => {
  loadDetail()
})
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
              {{ route.query.title || '媒体详情' }}
            </h1>
            <p class="text-[10px] text-neutral-400" v-if="rule">来源: {{ rule.name }} • {{ rule.type }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容面板 -->
    <div class="flex-1 overflow-auto px-4 py-4">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-3">
        <n-spin size="large" />
        <span class="text-neutral-400 text-sm">正在加载并解析媒体播放地址...</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="errorMsg" class="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 text-center">
        <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 class="text-lg font-bold text-red-600 dark:text-red-400">解析失败</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{{ errorMsg }}</p>
        <n-button type="error" ghost round class="mt-5" @click="loadDetail">
          重试
        </n-button>
      </div>

      <!-- 内容视图 -->
      <div v-else class="w-full h-full">
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
