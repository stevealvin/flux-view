<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'ModuleView' })
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import {
  Compass,
  AlertCircle,
  RefreshCw,
  Search,
  FileBraces,
  BookOpen,
  Video,
  Image as ImageIcon,
  Play,
  Layers
} from '@lucide/vue'

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
    return 'aspect-[16/10]'
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
    
    rules.value = allRules.filter(
      (r: any) => r.type === props.type && (r.enabled === 1 || r.enabled === true)
    )
    
    if (rules.value.length > 0) {
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

// 本地分类结果搜索过滤
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

watch(() => props.type, () => {
  loadRules()
}, { immediate: true })

onMounted(() => {
  loadRules()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-10">
    <!-- 顶部操作与规则切换面板 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- 模块标题与图标 -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
            <component :is="activeIcon" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{{ type }}聚合发现</span>
              <span class="hidden sm:inline text-xs font-mono font-normal text-slate-400 uppercase tracking-wider">DISCOVERY</span>
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">实时调度已启用的 {{ type }} 数据源，聚合多维分类内容。</p>
          </div>
        </div>

        <!-- 聚合搜索与刷新抓取按钮 -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <div v-if="rules.length > 0 && categories.length > 0" class="relative flex-1 sm:w-56">
            <Search class="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="在当前分类中过滤..."
              class="w-full pl-8 pr-3 py-1.5 bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/50 dark:hover:bg-white/[0.07] focus:bg-white dark:focus:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all"
            />
          </div>

          <button
            v-if="activeRule"
            :disabled="executing"
            @click="executeDiscovery"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98 disabled:opacity-50"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': executing }" />
            <span>{{ executing ? '解析中...' : '刷新抓取' }}</span>
          </button>
        </div>
      </div>

      <!-- 规则选择胶囊横向滚动条 (Segmented Pill Tabs) -->
      <div v-if="rules.length > 0" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-200/50 dark:border-white/5">
        <button
          v-for="rule in rules"
          :key="rule.id"
          @click="handleRuleChange(rule.id)"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none border"
          :class="activeRuleId === rule.id
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
            : 'bg-slate-100/80 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200/50 dark:border-white/5 hover:bg-slate-200/60 dark:hover:bg-white/5'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="activeRuleId === rule.id ? 'bg-white' : 'bg-indigo-500'"></span>
          <span>{{ rule.title || rule.name }}</span>
        </button>
      </div>
    </div>

    <!-- 主展示区 -->
    <div>
      <!-- 1. 全局初始化加载中 -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-28 gap-3">
        <n-spin size="large" />
        <span class="text-slate-400 text-sm">正在加载{{ type }}解析规则...</span>
      </div>

      <!-- 2. 没有可用的规则源 -->
      <div
        v-else-if="rules.length === 0"
        class="glass-panel rounded-2xl p-12 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
          <FileBraces class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">没有启用的 {{ type }} 规则</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          当前没有启用任何类型为 “{{ type }}” 的规则源。请前往规则管理开启。
        </p>
        <button
          @click="router.push('/rules')"
          class="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          前往配置规则
        </button>
      </div>

      <!-- 3. 执行中（第一次加载即时数据） -->
      <div v-else-if="executing && categories.length === 0" class="flex flex-col items-center justify-center py-28 gap-3">
        <n-spin size="large" />
        <span class="text-slate-400 text-sm">正在实时解析 "{{ activeRule?.title || activeRule?.name }}" 数据...</span>
      </div>

      <!-- 4. 抓取遇到错误 -->
      <div
        v-else-if="errorMsg"
        class="glass-panel rounded-2xl p-8 max-w-md mx-auto my-12 text-center flex flex-col items-center justify-center space-y-3 border-rose-500/30 bg-rose-500/5"
      >
        <AlertCircle class="w-10 h-10 text-rose-500" />
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">解析失败</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ errorMsg }}</p>
        <button
          @click="executeDiscovery"
          class="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
        >
          重试
        </button>
      </div>

      <!-- 5. 抓取成功，分类媒体网格展示 -->
      <div v-else class="space-y-8">
        <div v-if="filteredCategories.length === 0" class="glass-panel rounded-2xl p-16 text-center">
          <n-empty description="没有找到匹配的内容" size="large" />
        </div>

        <div v-else v-for="category in filteredCategories" :key="category.title" class="space-y-3">
          <!-- 分类标题与数量指示条 -->
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
              <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ category.title }}</h2>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/30">
              {{ category.items?.length || 0 }} 资源
            </span>
          </div>

          <!-- 媒体卡片网格 (mori-box 风格 Apple/Netflix 悬浮卡片) -->
          <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div
              v-for="item in category.items"
              :key="item.href || item.url"
              class="group relative flex flex-col rounded-2xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xl hover:shadow-indigo-500/10 active:scale-98"
              @click="goToDetail(item)"
            >
              <!-- 封面与浮层区域 -->
              <div :class="coverAspectClass" class="relative w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
                <img
                  v-if="item.cover"
                  :src="item.cover"
                  :alt="item.title"
                  referrerpolicy="no-referrer"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div v-else class="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
                  <component :is="activeIcon" class="w-8 h-8" />
                </div>

                <!-- 底部阴影渐变 -->
                <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>

                <!-- 磨砂玻璃角标区 -->
                <div class="absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-1rem)] pointer-events-none">
                  <span v-if="item.status || item.episodes" class="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-indigo-600/85 text-white shadow-2xs leading-none backdrop-blur-md border border-indigo-400/30">
                    {{ item.status || item.episodes }}
                  </span>
                  <span v-if="item.tag" class="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-pink-600/85 text-white shadow-2xs leading-none backdrop-blur-md border border-pink-400/30">
                    {{ item.tag }}
                  </span>
                </div>

                <!-- 播放悬浮指示遮罩 -->
                <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                  <div class="w-9 h-9 rounded-full bg-white/90 dark:bg-indigo-600 text-slate-900 dark:text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play class="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                </div>
              </div>

              <!-- 底部元数据卡片区 -->
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
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
