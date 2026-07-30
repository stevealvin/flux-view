<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import { ArrowLeft, Search, Compass, AlertCircle, Sparkles } from '@lucide/vue'

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
    // 1. 获取所有规则
    const allRules = ruleService.getRules()
    const enabledRules = allRules.filter((r: any) => {
      // Robust enabled state check supporting number, boolean, and string formats
      const isEnabled = r.enabled === 1 || r.enabled === true || r.enabled === '1' || r.enabled === 'true';
      if (!isEnabled) return false;
      
      if (!r.search_code) return false;
      const code = r.search_code.trim();
      // Exclude empty default placeholders
      const isEmptyPlaceholder = 
        code === 'export default async () => {\n  \n}' ||
        code === 'export default async () => {\n\n}' ||
        code === 'export default async () => {}' ||
        code === '(async () => {\n  \n})' ||
        code === '(async () => {\n\n})' ||
        code === '(async () => {})';
      
      return !isEmptyPlaceholder;
    })

    if (enabledRules.length === 0) {
      errorMsg.value = '没有启用的且支持搜索的规则源。'
      loading.value = false
      return
    }

    totalRuleRequests.value = enabledRules.length
    activeRuleRequests.value = enabledRules.length

    // 2. 通过 Hono 后端发起并行搜索
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
          // 映射每项结果以包含规则元数据
          const mapped = searchRes.map((item: any) => ({
            ...item,
            ruleId: rule.id,
            ruleName: rule.name,
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
    errorMsg.value = '搜索发起失败: ' + (error.message || error)
    loading.value = false
  }
}

const handleSearchInput = () => {
  const query = searchKeyword.value.trim()
  if (query) {
    router.replace({ query: { q: query } })
    performSearch(query)
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

// 监听 query 关键字以适配浏览器的前进/后退按钮
watch(() => route.query.q, () => {
  initSearch()
})

onMounted(() => {
  initSearch()
})
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-50/30 dark:bg-neutral-900/10">
    <!-- Top Search Header -->
    <div class="bg-white/40 dark:bg-neutral-800/20 border-b border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md sticky top-0 z-30 w-full">
      <div class="px-4 py-3 flex items-center gap-3 w-full">
        <n-button quaternary circle size="medium" @click="router.push('/')">
          <template #icon>
            <ArrowLeft class="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </template>
        </n-button>
        
        <!-- 输入框栏 -->
        <div class="flex-1 max-w-xl">
          <div class="relative flex items-center bg-white/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 backdrop-blur-xl rounded-xl shadow-sm px-3 py-1.5 focus-within:border-sky-500/50 transition-colors">
            <Search class="w-4 h-4 text-neutral-400 shrink-0 mr-2" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索视频、图片、资讯..."
              class="w-full bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 text-sm py-1"
              @keyup.enter="handleSearchInput"
            />
            <n-button type="info" secondary size="small" round @click="handleSearchInput">
              搜索
            </n-button>
          </div>
        </div>

        <!-- 渐进式搜索状态条 -->
        <div class="text-xs text-neutral-400 hidden sm:block" v-if="loading && totalRuleRequests > 0">
          已搜索 ({{ totalRuleRequests - activeRuleRequests }}/{{ totalRuleRequests }}) 个规则源
        </div>
      </div>
    </div>

    <!-- 搜索进度线 -->
    <div v-if="loading" class="h-0.5 w-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0">
      <div class="h-full bg-sky-500 animate-pulse w-2/3 rounded-full"></div>
    </div>

    <!-- 主结果容器 -->
    <div class="flex-1 overflow-auto px-4 py-4">
      <div class="w-full">
        <!-- 错误状态 -->
        <div v-if="errorMsg" class="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 text-center">
          <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 class="text-lg font-bold text-red-600 dark:text-red-400">搜索异常</h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{{ errorMsg }}</p>
        </div>

        <!-- 无结果/空状态 -->
        <div v-else-if="searched && !loading && searchResults.length === 0" class="flex flex-col items-center justify-center py-32 text-center">
          <Sparkles class="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
          <p class="text-neutral-600 dark:text-neutral-400 font-medium">没有找到相关资源</p>
          <p class="text-neutral-400 text-xs mt-1">请尝试更换其他关键词，或者检查是否启用了更多的规则解析源。</p>
        </div>

        <!-- 初始未搜索状态 -->
        <div v-else-if="!searched" class="flex flex-col items-center justify-center py-32 text-neutral-400 text-center gap-2">
          <Compass class="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
          <span>在上方搜索框内输入关键字，按回车开始聚合检索</span>
        </div>

        <!-- 结果网格 -->
        <div v-else class="space-y-6">
          <div class="flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800/80 pb-3">
            <h2 class="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              搜索结果
              <span class="text-xs text-neutral-400 font-normal ml-2">(共找到 {{ searchResults.length }} 条结果)</span>
            </h2>
          </div>

          <div class="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div
              v-for="(item, index) in searchResults"
              :key="index"
              class="group relative cursor-pointer"
              @click="goToDetail(item)"
            >
              <!-- 卡片包装器 -->
              <div class="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col h-full">
                <!-- 带有 Referrer 策略的封面图 -->
                <div class="aspect-3/4 overflow-hidden relative bg-neutral-200 dark:bg-neutral-800">
                  <img
                    :src="item.cover"
                    referrerpolicy="no-referrer"
                    alt="cover"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <!-- 数据源标签图层 -->
                  <div class="absolute top-2 left-2 z-10">
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500 text-white shadow-sm">
                      {{ item.ruleName }}
                    </span>
                  </div>
                </div>

                <!-- 标题 -->
                <div class="p-3 flex-1 flex flex-col justify-between">
                  <h3 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors duration-200">
                    {{ item.title }}
                  </h3>
                </div>
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
