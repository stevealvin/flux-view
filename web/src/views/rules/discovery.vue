<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'DiscoveryView' })
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import {
  ArrowLeft,
  Compass,
  AlertCircle,
  RefreshCw,
  Play,
  Video,
  Image as ImageIcon,
  BookOpen
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const ruleId = ref<number | null>(null)
const rule = ref<any>(null)
const categories = ref<any[]>([])
const loading = ref(true)
const executing = ref(false)
const errorMsg = ref('')

const activeIcon = computed(() => {
  if (!rule.value) return Compass
  switch (rule.value.type) {
    case '视频': return Video
    case '图片': return ImageIcon
    case '小说': return BookOpen
    default: return Compass
  }
})

const coverAspectClass = computed(() => {
  if (rule.value?.type === '视频') {
    return 'aspect-[16/10]'
  }
  return 'aspect-[3/4]'
})

const fetchRule = async () => {
  const id = Number(route.query.id)
  if (!id) {
    errorMsg.value = '无效的规则ID'
    loading.value = false
    return
  }
  ruleId.value = id

  try {
    const res = ruleService.getRuleById(id)
    rule.value = res
    if (rule.value) {
      await executeDiscovery()
    } else {
      errorMsg.value = '规则未找到'
    }
  } catch (error: any) {
    errorMsg.value = '获取规则失败: ' + (error.message || error)
  } finally {
    loading.value = false
  }
}

const executeDiscovery = async () => {
  executing.value = true
  errorMsg.value = ''
  try {
    const res = await http.post('/rules/run', {
      code: rule.value.discovery_code
    })
    
    if (Array.isArray(res)) {
      categories.value = res
    } else if (res && typeof res === 'object') {
      categories.value = res.data || res.list || []
    } else {
      categories.value = []
      errorMsg.value = '解析器返回了不支持的数据格式'
    }
  } catch (error: any) {
    errorMsg.value = '规则执行失败: ' + (error.response?.data?.message || error.message || error)
  } finally {
    executing.value = false
  }
}

const goToDetail = (item: any) => {
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: ruleId.value,
      href: item.href || item.url,
      title: item.title,
      cover: item.cover,
      item: JSON.stringify(item)
    }
  })
}

onMounted(() => {
  fetchRule()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-10">
    <!-- 顶部操作控制栏 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/10 transition-all cursor-pointer flex-shrink-0"
          title="返回"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
            <component :is="activeIcon" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{{ rule ? (rule.title || rule.name) : '规则加载中...' }}</span>
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400" v-if="rule">
              {{ rule.type }} • v{{ rule.version || '1.0.0' }} • 作者: {{ rule.author || '系统' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 刷新抓取按键 -->
      <button
        :disabled="executing"
        @click="executeDiscovery"
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98 disabled:opacity-50"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': executing }" />
        <span>{{ executing ? '抓取中...' : '刷新发现' }}</span>
      </button>
    </div>

    <!-- 主展示面板 -->
    <div>
      <!-- 加载中 -->
      <div v-if="loading || (executing && categories.length === 0)" class="flex flex-col items-center justify-center py-28 gap-3">
        <n-spin size="large" />
        <span class="text-slate-400 text-sm">正在沙箱解析远程内容...</span>
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
          @click="executeDiscovery"
          class="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
        >
          重试
        </button>
      </div>

      <!-- 发现列表网格 -->
      <div v-else class="space-y-8">
        <div v-if="categories.length === 0" class="glass-panel rounded-2xl p-16 text-center">
          <n-empty description="暂无发现数据" size="large" />
        </div>

        <div v-else v-for="category in categories" :key="category.title" class="space-y-3">
          <!-- 分类标题条 -->
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-200/50 dark:border-white/5">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
              <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ category.title }}</h2>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/30">
              {{ category.items?.length || 0 }} 资源
            </span>
          </div>

          <!-- 卡片网格 (mori-box 风格) -->
          <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div
              v-for="item in category.items"
              :key="item.href || item.url"
              class="group relative flex flex-col rounded-2xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xl hover:shadow-indigo-500/10 active:scale-98"
              @click="goToDetail(item)"
            >
              <!-- 封面图 -->
              <div :class="coverAspectClass" class="relative w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
                <img
                  v-if="item.cover"
                  :src="item.cover"
                  referrerpolicy="no-referrer"
                  :alt="item.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div v-else class="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
                  <component :is="activeIcon" class="w-8 h-8" />
                </div>

                <!-- 底部阴影渐变 -->
                <div class="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>

                <!-- 磨砂角标 -->
                <div class="absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-1rem)] pointer-events-none">
                  <span v-if="item.status || item.episodes" class="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-indigo-600/85 text-white shadow-2xs leading-none backdrop-blur-md border border-indigo-400/30">
                    {{ item.status || item.episodes }}
                  </span>
                </div>

                <!-- 悬浮播放指示 -->
                <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                  <div class="w-9 h-9 rounded-full bg-white/90 dark:bg-indigo-600 text-slate-900 dark:text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play class="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                </div>
              </div>

              <!-- 卡片信息区 -->
              <div class="p-2.5 flex flex-col justify-between flex-1 gap-1">
                <h3 class="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" :title="item.title">
                  {{ item.title }}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
