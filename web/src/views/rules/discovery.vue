<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'DiscoveryView' })
import { ruleService, type RuleSchema, type MediaItem } from '@/utils/ruleService'
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
const rule = ref<RuleSchema | null>(null)
const items = ref<MediaItem[]>([])
const loading = ref(true)
const executing = ref(false)
const errorMsg = ref('')

const activeIcon = computed(() => {
  if (!rule.value) return Compass
  if (rule.value.type === 'video') return Video
  if (rule.value.type === 'picture') return ImageIcon
  if (rule.value.type === 'novel') return BookOpen
  return Compass
})

const coverAspectClass = computed(() => {
  if (rule.value?.type === 'video') {
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
  if (!rule.value) return
  executing.value = true
  errorMsg.value = ''
  try {
    const res = await ruleService.runDiscovery(rule.value, { page: 1 })
    items.value = res.items || []
  } catch (error: any) {
    errorMsg.value = '规则执行失败: ' + (error.response?.data?.message || error.message || error)
  } finally {
    executing.value = false
  }
}

const goToDetail = (item: MediaItem) => {
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: ruleId.value,
      key: item.key,
      title: item.title,
      cover: item.cover
    }
  })
}

onMounted(() => {
  fetchRule()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
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
          <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate flex items-center gap-2">
            <span>{{ rule ? rule.name : '规则发现大厅' }}</span>
            <span v-if="rule" class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30">
              {{ rule.type === 'video' ? '视频' : rule.type === 'picture' ? '图片' : '小说' }}
            </span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400" v-if="rule?.description">
            {{ rule.description }}
          </p>
        </div>
      </div>

      <button
        @click="executeDiscovery"
        :disabled="executing"
        class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/10 transition-all cursor-pointer disabled:opacity-50"
        title="刷新流"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': executing }" />
      </button>
    </div>

    <!-- 状态反馈 -->
    <div>
      <div v-if="loading || executing" class="flex flex-col items-center justify-center py-28 gap-3">
        <n-spin size="large" />
        <span class="text-slate-400 text-sm">正在加载并解析发现流...</span>
      </div>

      <div
        v-else-if="errorMsg"
        class="glass-panel rounded-2xl p-8 max-w-md mx-auto my-12 text-center flex flex-col items-center justify-center space-y-3 border-rose-500/30 bg-rose-500/5"
      >
        <AlertCircle class="w-10 h-10 text-rose-500" />
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">发现流解析异常</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ errorMsg }}</p>
        <button
          @click="executeDiscovery"
          class="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
        >
          重新尝试
        </button>
      </div>

      <div
        v-else-if="items.length === 0"
        class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <Compass class="w-10 h-10 text-slate-400" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">没有发现任何内容</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">该规则解析返回了空列表，请检查规则脚本配置。</p>
      </div>

      <div
        v-else
        class="grid gap-3 sm:gap-4.5"
        :class="rule?.type === 'video'
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'"
      >
        <div
          v-for="(item, idx) in items"
          :key="item.key || idx"
          class="group relative flex flex-col rounded-2xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xl hover:shadow-indigo-500/10 active:scale-98"
          @click="goToDetail(item)"
        >
          <div class="w-full relative overflow-hidden bg-slate-200 dark:bg-slate-900" :class="coverAspectClass">
            <img
              v-if="item.cover"
              :src="item.cover"
              referrerpolicy="no-referrer"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
              <component :is="activeIcon" class="w-8 h-8" />
            </div>

            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
              <span class="text-white text-[11px] font-bold line-clamp-1">点击查看详情</span>
            </div>

            <span
              v-if="item.badge"
              class="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10"
            >
              {{ item.badge }}
            </span>
          </div>

          <div class="p-2.5 sm:p-3 flex flex-col justify-between flex-1 space-y-1">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
              {{ item.title }}
            </h3>
            <p v-if="item.desc" class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {{ item.desc }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
