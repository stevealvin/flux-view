<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'SearchView' })
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import {
  ArrowLeft,
  Search,
  Compass,
  AlertCircle,
  Sparkles,
  Layers,
  Play
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const searchResults = ref<any[]>([])
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
    const enabledRules = allRules.filter((r: any) => {
      const isEnabled = r.enabled === 1 || r.enabled === true || r.enabled === '1' || r.enabled === 'true'
      if (!isEnabled) return false
      
      if (!r.search_code) return false
      const code = r.search_code.trim()
      const isEmptyPlaceholder = 
        code === 'export default async () => {\n  \n}' ||
        code === 'export default async () => {\n\n}' ||
        code === 'export default async () => {}' ||
        code === '(async () => {\n  \n})' ||
        code === '(async () => {\n\n})' ||
        code === '(async () => {})'
      
      return !isEmptyPlaceholder
    })

    if (enabledRules.length === 0) {
      errorMsg.value = '没有启用的且支持搜索的规则源。'
      loading.value = false
      return
    }

    totalRuleRequests.value = enabledRules.length
    activeRuleRequests.value = enabledRules.length

    enabledRules.forEach(async (rule: any) => {
      try {
        const searchRes = await http.post('/rules/run', {
          code: rule.search_code,
          context: { 
            keyword: query,
            baseUrl: rule.base_url
          }
        })
        
        if (Array.isArray(searchRes)) {
          const mapped = searchRes.map((item: any) => ({
            ...item,
            ruleId: rule.id,
            ruleName: rule.title || rule.name,
            ruleType: rule.type
          }))
          searchResults.value.push(...mapped)
        }
      } catch (err) {
        console.error(`Search failed for rule "${rule.name}":`, err)
      } finally {
        activeRuleRequests.value--
        if (activeRuleRequests.value === 0) {
          loading.value = false
        }
      }
    })
  } catch (error: any) {
    errorMsg.value = '搜索调度错误: ' + (error.message || error)
    loading.value = false
  }
}

const handleSearchInput = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
  }
}

const goToDetail = (item: any) => {
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: item.ruleId,
      href: item.href || item.url,
      title: item.title,
      cover: item.cover,
      item: JSON.stringify(item)
    }
  })
}

watch(() => route.query.q, () => {
  initSearch()
})

onMounted(() => {
  initSearch()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-10">
    <!-- 顶部聚合搜索控制台 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
      <div class="flex items-center gap-3 w-full">
        <button
          @click="router.push('/')"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/10 transition-all cursor-pointer flex-shrink-0"
          title="返回首页"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>

        <div class="flex-1 relative">
          <Search class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索全网视频、图片、小说资源..."
            class="w-full pl-10 pr-24 py-2 bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/50 dark:hover:bg-white/[0.07] focus:bg-white dark:focus:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs sm:text-sm outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all"
            @keyup.enter="handleSearchInput"
          />
          <button
            @click="handleSearchInput"
            class="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            搜索
          </button>
        </div>
      </div>

      <!-- 搜索状态指示条 -->
      <div v-if="loading && totalRuleRequests > 0" class="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
          <span>正在并行请求全网规则源 ({{ totalRuleRequests - activeRuleRequests }}/{{ totalRuleRequests }})...</span>
        </div>
        <span class="font-mono">{{ Math.round(((totalRuleRequests - activeRuleRequests) / totalRuleRequests) * 100) }}%</span>
      </div>
    </div>

    <!-- 搜索结果展示区 -->
    <div>
      <!-- 错误状态 -->
      <div
        v-if="errorMsg"
        class="glass-panel rounded-2xl p-8 max-w-md mx-auto my-12 text-center flex flex-col items-center justify-center space-y-3 border-rose-500/30 bg-rose-500/5"
      >
        <AlertCircle class="w-10 h-10 text-rose-500" />
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">搜索异常</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ errorMsg }}</p>
      </div>

      <!-- 未开始搜索状态 -->
      <div
        v-else-if="!searched"
        class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <Compass class="w-12 h-12 text-slate-400 dark:text-slate-600" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">聚合检索中心</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          在上方输入关键字，一键并行检索所有已启用的跨媒体规则源。
        </p>
      </div>

      <!-- 无结果状态 -->
      <div
        v-else-if="searched && !loading && searchResults.length === 0"
        class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <Sparkles class="w-10 h-10 text-slate-400" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">没有找到相关资源</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          尝试更换关键字，或进入“规则管理”启用更多规则源。
        </p>
      </div>

      <!-- 结果网格列表 -->
      <div v-else class="space-y-4">
        <!-- 结果标题条 -->
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-200/50 dark:border-white/5">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
            <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">
              检索结果
            </h2>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/30">
            共找到 {{ searchResults.length }} 条结果
          </span>
        </div>

        <!-- 结果卡片网格 (mori-box 风格) -->
        <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <div
            v-for="(item, index) in searchResults"
            :key="index"
            class="group relative flex flex-col rounded-2xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xl hover:shadow-indigo-500/10 active:scale-98"
            @click="goToDetail(item)"
          >
            <!-- 封面图 -->
            <div
              class="relative w-full overflow-hidden bg-slate-200 dark:bg-slate-900"
              :class="item.ruleType === '视频' ? 'aspect-[16/10]' : 'aspect-[3/4]'"
            >
              <img
                v-if="item.cover"
                :src="item.cover"
                referrerpolicy="no-referrer"
                :alt="item.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
                <Compass class="w-8 h-8" />
              </div>

              <!-- 顶部数据源徽章 -->
              <div class="absolute top-2 left-2 z-10">
                <span class="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-indigo-600/90 text-white shadow-2xs leading-none backdrop-blur-md border border-indigo-400/30">
                  {{ item.ruleName }}
                </span>
              </div>

              <!-- 底部阴影渐变 -->
              <div class="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>

              <!-- 悬浮播放指示 -->
              <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                <div class="w-9 h-9 rounded-full bg-white/90 dark:bg-indigo-600 text-slate-900 dark:text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play class="w-4 h-4 ml-0.5 fill-current" />
                </div>
              </div>
            </div>

            <!-- 卡片文本 -->
            <div class="p-2.5 flex flex-col justify-between flex-1 gap-1">
              <h3 class="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" :title="item.title">
                {{ item.title }}
              </h3>
              <p v-if="item.author || item.desc" class="text-[10px] text-slate-400 truncate">
                {{ item.author || item.desc }}
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
