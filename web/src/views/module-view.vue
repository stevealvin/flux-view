<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import { Compass, AlertCircle, RefreshCw, Search, FileBraces, BookOpen, Video, Image as ImageIcon } from '@lucide/vue'

const props = defineProps<{
  type: string
}>()

const router = useRouter()

const rules = ref<any[]>([])
const activeRuleId = ref<number | null>(null)
const activeRule = ref<any>(null)
const categories = ref<any[]>([])
const loading = ref(true)
const executing = ref(false)
const errorMsg = ref('')
const searchQuery = ref('')

const activeIcon = computed(() => {
  switch (props.type) {
    case '视频': return Video
    case '图片': return ImageIcon
    case '小说': return BookOpen
    default: return Compass
  }
})

const coverAspectClass = computed(() => {
  if (props.type === '视频') {
    return 'aspect-video'
  }
  return 'aspect-[3/4]'
})

const loadRules = async () => {
  loading.value = true
  errorMsg.value = ''
  categories.value = []
  searchQuery.value = ''
  
  try {
    const allRules = ruleService.getRules()
    
    // Filter active rules of current type
    rules.value = allRules.filter(
      (r: any) => r.type === props.type && (r.enabled === 1 || r.enabled === true)
    )
    
    if (rules.value.length > 0) {
      // Pick the first rule by default
      activeRuleId.value = rules.value[0].id
      activeRule.value = rules.value[0]
      await executeDiscovery()
    } else {
      activeRuleId.value = null
      activeRule.value = null
    }
  } catch (error: any) {
    errorMsg.value = '获取规则失败: ' + (error.message || error)
  } finally {
    loading.value = false
  }
}

const handleRuleChange = async (id: number) => {
  const selected = rules.value.find(r => r.id === id)
  if (selected) {
    activeRuleId.value = id
    activeRule.value = selected
    searchQuery.value = ''
    await executeDiscovery()
  }
}

const executeDiscovery = async () => {
  if (!activeRule.value) return
  
  executing.value = true
  errorMsg.value = ''
  categories.value = []
  
  try {
    const res = await http.post('/rules/run', {
      code: activeRule.value.discovery_code
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
  if (!activeRuleId.value) return
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: activeRuleId.value,
      href: item.href || item.url,
      title: item.title,
      cover: item.cover,
      item: JSON.stringify(item)
    }
  })
}

// Local search filter
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value
  const query = searchQuery.value.toLowerCase().trim()
  return categories.value.map(cat => {
    return {
      ...cat,
      items: (cat.items || []).filter((item: any) => 
        item.title?.toLowerCase().includes(query)
      )
    }
  }).filter(cat => cat.items.length > 0)
})

// Reload when props.type changes
watch(() => props.type, () => {
  loadRules()
}, { immediate: true })

onMounted(() => {
  loadRules()
})
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-50/30 dark:bg-neutral-900/10">
    <!-- 顶部操作与筛选栏 -->
    <div class="bg-white/40 dark:bg-neutral-800/20 border-b border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md sticky top-0 z-30 w-full px-6 py-4 flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- 模块标题 -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 shadow-sm">
            <n-icon :component="activeIcon" :size="20" />
          </div>
          <div>
            <h1 class="text-lg font-black tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              {{ type }}资源发现
            </h1>
            <p class="text-xs text-neutral-400">直接查看和聚合已启用 rules 的即时爬取结果。</p>
          </div>
        </div>

        <!-- 聚合搜索与刷新 -->
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <!-- 搜索输入框 -->
          <div v-if="rules.length > 0 && categories.length > 0" class="relative w-full sm:w-60">
            <Search class="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="在此分类结果中筛选..."
              class="w-full pl-9 pr-4 py-1.5 bg-neutral-100/50 dark:bg-neutral-850/40 hover:bg-neutral-250/20 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-200/40 dark:border-neutral-700/40 rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 transition-all duration-300"
            />
          </div>
          <n-button
            v-if="activeRule"
            secondary
            round
            size="small"
            type="info"
            :loading="executing"
            @click="executeDiscovery"
          >
            <template #icon>
              <RefreshCw class="w-4 h-4" />
            </template>
            刷新抓取
          </n-button>
        </div>
      </div>

      <!-- 规则源 Tabs (仅在有可用规则时展示) -->
      <div v-if="rules.length > 0" class="w-full overflow-x-auto no-scrollbar border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
        <n-tabs
          :value="activeRuleId"
          type="bar"
          size="small"
          @update:value="handleRuleChange"
        >
          <n-tab
            v-for="rule in rules"
            :key="rule.id"
            :name="rule.id"
          >
            {{ rule.name }}
          </n-tab>
        </n-tabs>
      </div>
    </div>

    <!-- 主内容面板 -->
    <div class="flex-grow overflow-auto px-6 py-8">
      <!-- 1. 全局初始化加载中 -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-3">
        <n-spin size="large" />
        <span class="text-neutral-400 text-sm">正在加载{{ type }}解析规则...</span>
      </div>

      <!-- 2. 没有可用的规则源 -->
      <div v-else-if="rules.length === 0" class="max-w-md mx-auto my-16 p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-750 bg-white/40 dark:bg-neutral-800/10 text-center">
        <FileBraces class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h3 class="text-base font-bold text-neutral-800 dark:text-neutral-200">没有启用的规则</h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-450 mt-2">
          当前没有启用任何类型为 “{{ type }}” 的规则。请前往规则管理添加并启用解析规则。
        </p>
        <n-button type="info" secondary round class="mt-6 px-6" @click="router.push('/rules')">
          去管理规则
        </n-button>
      </div>

      <!-- 3. 执行中（在第一次加载数据时） -->
      <div v-else-if="executing && categories.length === 0" class="flex flex-col items-center justify-center py-32 gap-3">
        <n-spin size="large" />
        <span class="text-neutral-400 text-sm">正在爬取 "{{ activeRule?.name }}" 的即时数据...</span>
      </div>

      <!-- 4. 爬取遇到错误 -->
      <div v-else-if="errorMsg" class="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 text-center">
        <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 class="text-base font-bold text-red-600 dark:text-red-400">抓取失败</h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{{ errorMsg }}</p>
        <n-button type="error" ghost round class="mt-5" @click="executeDiscovery">
          重试
        </n-button>
      </div>

      <!-- 5. 抓取成功，展示内容 -->
      <div v-else class="space-y-10">
        <!-- 过滤后无内容 -->
        <div v-if="filteredCategories.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
          <n-empty description="没有找到匹配的内容" size="large"></n-empty>
        </div>

        <div v-else v-for="category in filteredCategories" :key="category.title" class="space-y-4">
          <!-- 分类标题 -->
          <div class="flex items-center gap-2 pb-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
            <div class="w-1 h-5 bg-sky-500 rounded-full"></div>
            <h2 class="text-sm font-bold text-neutral-800 dark:text-neutral-200">{{ category.title }}</h2>
            <span class="text-[10px] text-neutral-400 dark:text-neutral-500">({{ category.items?.length || 0 }}个内容)</span>
          </div>

          <!-- 卡片网格 -->
          <div class="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div
              v-for="item in category.items"
              :key="item.href"
              class="group relative cursor-pointer"
              @click="goToDetail(item)"
            >
              <!-- 卡片悬停底影 -->
              <div class="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-10 blur transition duration-350"></div>
              
              <!-- 卡片 -->
              <div class="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col h-full">
                <!-- 封面图 -->
                <div :class="coverAspectClass" class="overflow-hidden relative bg-neutral-200 dark:bg-neutral-800">
                  <img
                    v-if="item.cover"
                    :src="item.cover"
                    referrerpolicy="no-referrer"
                    alt="cover"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-neutral-350 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-900">
                    <n-icon :component="activeIcon" :size="32" />
                  </div>
                  <!-- 悬停指示器 -->
                  <div class="absolute inset-0 bg-neutral-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Compass class="w-7 h-7 text-white drop-shadow-md" />
                  </div>
                </div>

                <!-- 标题 -->
                <div class="p-3 flex-grow flex flex-col justify-between">
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
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
