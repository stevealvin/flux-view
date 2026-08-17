<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'SearchView' })
import { ruleService, type RuleSchema, type MediaItem } from '@/utils/ruleService'
import {
  ArrowLeft,
  Search,
  Compass,
  AlertCircle,
  Sparkles,
  Layers,
  Play,
  Video,
  Image as ImageIcon,
  BookOpen
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const searchResults = ref<(MediaItem & { ruleId: number; ruleName: string; ruleType: string })[]>([])
const loading = ref(false)
const searched = ref(false)
const errorMsg = ref('')
const activeRuleRequests = ref(0)
const totalRuleRequests = ref(0)

let lastSearchedQuery = ''

const initSearch = () => {
  const query = route.query.q as string
  if (query) {
    searchKeyword.value = query
    performSearch(query)
  } else {
    searchResults.value = []
    searched.value = false
    lastSearchedQuery = ''
  }
}

const performSearch = async (query: string) => {
  if (!query.trim()) return
  if (query === lastSearchedQuery && searchResults.value.length > 0) return
  
  lastSearchedQuery = query
  loading.value = true
  searched.value = true
  errorMsg.value = ''
  searchResults.value = []
  
  try {
    const allRules = ruleService.getRules()
    const enabledRules = allRules.filter((r) => r.enabled === 1 || (r.enabled as any) === true)

    if (enabledRules.length === 0) {
      errorMsg.value = '没有启用的规则源，请先前往「规则管理」启用规则。'
      loading.value = false
      return
    }

    totalRuleRequests.value = enabledRules.length
    activeRuleRequests.value = enabledRules.length

    let completedCount = 0

    enabledRules.forEach(async (rule: RuleSchema) => {
      try {
        const searchRes = await ruleService.runSearch(rule, { keyword: query })
        
        if (searchRes.items && searchRes.items.length > 0) {
          const mapped = searchRes.items.map((item) => ({
            ...item,
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type
          }))
          searchResults.value.push(...mapped)
        }
      } catch (err) {
        console.warn(`Search failed on rule "${rule.name}":`, err)
      } finally {
        completedCount++
        activeRuleRequests.value = totalRuleRequests.value - completedCount
        if (completedCount >= enabledRules.length) {
          loading.value = false
        }
      }
    })
  } catch (err: any) {
    errorMsg.value = '发起聚合搜索失败: ' + err.message
    loading.value = false
  }
}

const handleSearchSubmit = () => {
  if (!searchKeyword.value.trim()) return
  router.push({
    path: '/search',
    query: { q: searchKeyword.value.trim() }
  })
}

const goToDetail = (item: any) => {
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: item.ruleId,
      key: item.key || item.href || item.url,
      title: item.title,
      cover: item.cover
    }
  })
}

const getItemIcon = (ruleType: string) => {
  if (ruleType === 'video' || ruleType === '视频') return Video
  if (ruleType === 'picture' || ruleType === '图片') return ImageIcon
  if (ruleType === 'novel' || ruleType === '小说') return BookOpen
  return Compass
}

watch(
  () => route.query.q,
  () => {
    initSearch()
  }
)

onMounted(() => {
  initSearch()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- 顶部聚合搜索条 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            @click="router.back()"
            class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/10 transition-all cursor-pointer flex-shrink-0"
            title="返回"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <div>
            <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>全网聚合搜索</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30">
                MULTI-SOURCE SEARCH
              </span>
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              一键并发检索所有已启用的影视、画廊与小说规则源
            </p>
          </div>
        </div>

        <!-- 搜索输入框 -->
        <div class="w-full sm:w-80 relative">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="输入搜索关键词，回车发起检索..."
            @keyup.enter="handleSearchSubmit"
            class="w-full pl-9 pr-10 py-2.5 bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/50 dark:hover:bg-white/[0.07] focus:bg-white dark:focus:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all shadow-inner focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
          />
          <Search class="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <button
            @click="handleSearchSubmit"
            class="absolute right-2 top-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer shadow-sm shadow-indigo-600/30"
          >
            搜索
          </button>
        </div>
      </div>

      <!-- 搜索进度条 -->
      <div v-if="loading && totalRuleRequests > 0" class="pt-2">
        <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
          <span>正在并发检索各大规则源...</span>
          <span class="font-mono">{{ totalRuleRequests - activeRuleRequests }} / {{ totalRuleRequests }} 个源完成</span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div
            class="bg-gradient-to-r from-indigo-500 to-pink-500 h-full transition-all duration-300 rounded-full"
            :style="{ width: `${((totalRuleRequests - activeRuleRequests) / totalRuleRequests) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <!-- 结果主体展示区 -->
    <div>
      <!-- 异常状态 -->
      <div
        v-if="errorMsg"
        class="glass-panel rounded-2xl p-8 max-w-md mx-auto my-12 text-center flex flex-col items-center justify-center space-y-3 border-rose-500/30 bg-rose-500/5"
      >
        <AlertCircle class="w-10 h-10 text-rose-500" />
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">检索失败</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ errorMsg }}</p>
      </div>

      <!-- 未搜索状态 -->
      <div
        v-else-if="!searched"
        class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <Sparkles class="w-10 h-10 text-indigo-500" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">开始探索全网内容</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">在上方输入框中输入关键字，即可同时聚合多源检索结果。</p>
      </div>

      <!-- 搜索空状态 -->
      <div
        v-else-if="!loading && searchResults.length === 0"
        class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <Compass class="w-10 h-10 text-slate-400" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">未找到相关媒体内容</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">换个关键词试试，或前往「规则管理」检查相关规则源是否启用。</p>
      </div>

      <!-- 结果卡片网格 -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
          <span>共找到 <strong class="text-indigo-600 dark:text-indigo-400">{{ searchResults.length }}</strong> 条多媒体聚合结果</span>
        </div>

        <div class="grid gap-3 sm:gap-4.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <div
            v-for="(item, idx) in searchResults"
            :key="item.key || idx"
            class="group relative flex flex-col rounded-2xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xl hover:shadow-indigo-500/10 active:scale-98"
            @click="goToDetail(item)"
          >
            <!-- 封面图容器 -->
            <div
              class="w-full relative overflow-hidden bg-slate-200 dark:bg-slate-900"
              :class="item.ruleType === 'video' || item.ruleType === '视频' ? 'aspect-[16/10]' : 'aspect-[3/4]'"
            >
              <img
                v-if="item.cover"
                :src="item.cover"
                referrerpolicy="no-referrer"
                :alt="item.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                <component :is="getItemIcon(item.ruleType)" class="w-8 h-8" />
              </div>

              <!-- 悬浮蒙层 -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                <span class="text-white text-[11px] font-bold line-clamp-1">点击查看详情</span>
              </div>

              <!-- 规则来源 Badge -->
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-600/80 backdrop-blur-md text-white border border-white/10 shadow-xs">
                {{ item.ruleName }}
              </span>

              <!-- 角标 Tag -->
              <span
                v-if="item.badge"
                class="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10"
              >
                {{ item.badge }}
              </span>
            </div>

            <!-- 卡片文本信息 -->
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
  </div>
</template>

<style scoped>
</style>
