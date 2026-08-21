<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'ModuleView' })
import { ruleService, type RuleSchema, type MediaItem } from '@/utils/ruleService'
import {
  Compass,
  AlertCircle,
  RefreshCw,
  Search,
  BookOpen,
  Video,
  Image as ImageIcon,
  Play,
  Layers,
  ChevronRight
} from '@lucide/vue'

const props = defineProps<{
  type: string
}>()

const router = useRouter()

const rules = ref<RuleSchema[]>([])
const activeRuleId = ref<number | null>(null)
const activeRule = ref<RuleSchema | null>(null)
const subCategories = ref<string[]>([])
const activeCategory = ref<string>('')
const items = ref<MediaItem[]>([])
const currentPage = ref(1)
const hasMore = ref(false)

const loading = ref(true)
const executing = ref(false)
const errorMsg = ref('')
const searchQuery = ref('')

const activeIcon = computed(() => {
  if (props.type === '视频' || props.type === 'video') return Video
  if (props.type === '图片' || props.type === 'picture') return ImageIcon
  if (props.type === '小说' || props.type === 'novel') return BookOpen
  return Compass
})

const coverAspectClass = computed(() => {
  if (props.type === '视频' || props.type === 'video') {
    return 'aspect-[16/10]'
  }
  return 'aspect-[3/4]'
})

const loadRules = async () => {
  loading.value = true
  errorMsg.value = ''
  subCategories.value = []
  activeCategory.value = ''
  items.value = []
  searchQuery.value = ''
  currentPage.value = 1
  
  try {
    const matchedRules = ruleService.getEnabledRulesByType(props.type)
    rules.value = matchedRules
    
    if (rules.value.length > 0) {
      activeRuleId.value = rules.value[0].id
      activeRule.value = rules.value[0]
      await fetchDiscovery(1)
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
  const selected = rules.value.find((r) => r.id === id)
  if (selected) {
    activeRuleId.value = id
    activeRule.value = selected
    subCategories.value = []
    activeCategory.value = ''
    searchQuery.value = ''
    currentPage.value = 1
    await fetchDiscovery(1)
  }
}

const handleCategoryChange = async (cat: string) => {
  if (activeCategory.value === cat) return
  activeCategory.value = cat
  currentPage.value = 1
  await fetchDiscovery(1)
}

const fetchDiscovery = async (page = 1) => {
  if (!activeRule.value) return
  
  executing.value = true
  errorMsg.value = ''
  
  try {
    const res = await ruleService.runDiscovery(activeRule.value, {
      category: activeCategory.value,
      page
    })

    if (res.categories && res.categories.length > 0) {
      subCategories.value = res.categories
      if (!activeCategory.value && subCategories.value.length > 0) {
        activeCategory.value = subCategories.value[0]
      }
    }

    if (page === 1) {
      items.value = res.items || []
    } else {
      items.value = [...items.value, ...(res.items || [])]
    }

    currentPage.value = page
    hasMore.value = !!res.hasMore
  } catch (error: any) {
    errorMsg.value = '解析媒体发现流失败: ' + (error.message || error)
  } finally {
    executing.value = false
  }
}

const loadNextPage = () => {
  if (executing.value || !hasMore.value) return
  fetchDiscovery(currentPage.value + 1)
}

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return items.value
  const query = searchQuery.value.toLowerCase().trim()
  return items.value.filter(
    (item) =>
      item.title?.toLowerCase().includes(query) ||
      item.desc?.toLowerCase().includes(query) ||
      item.badge?.toLowerCase().includes(query)
  )
})

const goToDetail = (item: MediaItem) => {
  if (!activeRule.value) return
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: activeRule.value.id,
      key: item.key,
      title: item.title,
      cover: item.cover
    }
  })
}

watch(
  () => props.type,
  () => {
    loadRules()
  }
)

onMounted(() => {
  loadRules()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- 顶部控制台 (mori-box 风格) -->
    <div class="glass-panel rounded-2xl p-5 space-y-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- 页面标题与图标 -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 flex-shrink-0">
            <component :is="activeIcon" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <span>{{ props.type }}发现</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                DISCOVERY
              </span>
            </h1>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              当前共接入 {{ rules.length }} 个已启用{{ props.type }}规则源
            </p>
          </div>
        </div>

        <!-- 页面内即时检索框与刷新 -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-60">
            <Search class="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="在当前页面流中快速筛选..."
              class="w-full pl-8 pr-3 py-1.5 bg-emerald-50/60 dark:bg-white/[0.04] hover:bg-emerald-100/50 dark:hover:bg-white/[0.07] focus:bg-white dark:focus:bg-zinc-900 border border-emerald-200/60 dark:border-white/10 rounded-xl text-xs outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 transition-all"
            />
          </div>

          <n-button
            size="small"
            secondary
            class="!rounded-xl"
            :loading="executing"
            @click="fetchDiscovery(1)"
            title="刷新当前流"
          >
            <template #icon>
              <RefreshCw class="w-3.5 h-3.5" />
            </template>
          </n-button>
        </div>
      </div>

      <!-- 规则切换标签栏 (Segmented Pill Tabs) -->
      <div v-if="rules.length > 0" class="pt-3 border-t border-emerald-100/50 dark:border-white/5 space-y-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <n-button
            v-for="rule in rules"
            :key="rule.id"
            size="small"
            :type="activeRuleId === rule.id ? 'primary' : 'default'"
            :secondary="activeRuleId !== rule.id"
            class="!rounded-xl !font-bold flex-shrink-0"
            @click="handleRuleChange(rule.id)"
          >
            {{ rule.name }}
          </n-button>
        </div>

        <!-- 子分类切换标签 (如果有) -->
        <div v-if="subCategories.length > 0" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <n-button
            v-for="cat in subCategories"
            :key="cat"
            size="tiny"
            :type="activeCategory === cat ? 'primary' : 'default'"
            :secondary="activeCategory !== cat"
            :quaternary="activeCategory !== cat"
            class="!rounded-lg flex-shrink-0"
            @click="handleCategoryChange(cat)"
          >
            {{ cat }}
          </n-button>
        </div>
      </div>
    </div>

    <!-- 主体流式展示区 -->
    <div>
      <!-- 初始加载状态 -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-3">
        <n-spin size="large" />
        <span class="text-zinc-400 text-sm">正在加载规则列表...</span>
      </div>

      <!-- 空规则提示 -->
      <div
        v-else-if="rules.length === 0"
        class="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-3"
      >
        <AlertCircle class="w-10 h-10 text-amber-500" />
        <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200">暂无已启用的{{ props.type }}规则</h3>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">请前往「规则管理」创建或启用对应的媒体规则。</p>
        <n-button
          type="primary"
          class="!rounded-xl !font-bold mt-2"
          @click="router.push('/rules')"
        >
          前往规则管理
        </n-button>
      </div>

      <!-- 解析执行中（首次骨架屏） -->
      <div v-else-if="executing && items.length === 0" class="flex flex-col items-center justify-center py-24 gap-3">
        <n-spin size="large" />
        <span class="text-zinc-400 text-sm">沙箱正在解析媒体流数据...</span>
      </div>

      <!-- 解析错误 -->
      <div
        v-else-if="errorMsg"
        class="glass-panel rounded-2xl p-8 max-w-md mx-auto my-12 text-center flex flex-col items-center justify-center space-y-3 border-rose-500/30 bg-rose-500/5"
      >
        <AlertCircle class="w-10 h-10 text-rose-500" />
        <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400">媒体流解析异常</h3>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ errorMsg }}</p>
        <n-button
          type="error"
          ghost
          class="!rounded-xl !font-bold mt-3"
          @click="fetchDiscovery(1)"
        >
          重新尝试
        </n-button>
      </div>

      <!-- 媒体内容卡片网格 (Netflix / Apple 质感) -->
      <div v-else class="space-y-6">
        <div
          v-if="filteredItems.length === 0"
          class="glass-panel rounded-2xl p-12 text-center max-w-sm mx-auto my-8 space-y-2"
        >
          <p class="text-xs text-zinc-500 dark:text-zinc-400">未找到符合搜索条件的卡片</p>
        </div>

        <div
          v-else
          class="grid gap-3 sm:gap-4.5"
          :class="props.type === '视频' || props.type === 'video'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'"
        >
          <div
            v-for="(item, idx) in filteredItems"
            :key="item.key || idx"
            class="group relative flex flex-col rounded-2xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-emerald-100/60 dark:border-white/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xl hover:shadow-emerald-500/10 active:scale-98"
            @click="goToDetail(item)"
          >
            <!-- 封面图容器 -->
            <div class="w-full relative overflow-hidden bg-zinc-200 dark:bg-zinc-900" :class="coverAspectClass">
              <img
                v-if="item.cover"
                :src="item.cover"
                referrerpolicy="no-referrer"
                :alt="item.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
                <component :is="activeIcon" class="w-8 h-8" />
              </div>

              <!-- 悬浮阴影渐变 -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                <span class="text-white text-[11px] font-bold line-clamp-1">点击查看详情</span>
              </div>

              <!-- 角标 Tag (如 4K, 连载, 更新至第X集) -->
              <span
                v-if="item.badge"
                class="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10"
              >
                {{ item.badge }}
              </span>

              <!-- 播放指示图标 (视频类) -->
              <div
                v-if="props.type === '视频' || props.type === 'video'"
                class="absolute right-2 bottom-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play class="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </div>

            <!-- 卡片文本信息 -->
            <div class="p-2.5 sm:p-3 flex flex-col justify-between flex-1 space-y-1">
              <h3 class="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                {{ item.title }}
              </h3>
              <p v-if="item.desc" class="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>

        <!-- 加载更多按钮 (若有下一页) -->
        <div v-if="hasMore" class="flex justify-center pt-6">
          <n-button
            secondary
            class="!rounded-xl !font-bold px-6"
            :loading="executing"
            @click="loadNextPage"
          >
            {{ executing ? '正在加载下一页...' : '加载更多内容' }}
          </n-button>
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
