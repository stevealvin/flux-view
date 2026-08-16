<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'HomeView' })
import { ruleService } from '@/utils/ruleService'
import {
  Search,
  Compass,
  ArrowRight,
  ShieldAlert,
  Video,
  Image as ImageIcon,
  BookOpen,
  Layers,
  Sparkles,
  SlidersHorizontal
} from '@lucide/vue'

const router = useRouter()
const searchKeyword = ref('')
const rules = ref<any[]>([])
const loading = ref(true)

const loadRules = async () => {
  loading.value = true
  try {
    const allRules = ruleService.getRules()
    rules.value = allRules.filter((r: any) => r.enabled === 1 || r.enabled === true)
  } catch (error) {
    console.error('Failed to load rules:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
  }
}

const goToSource = (id: number) => {
  router.push({ path: '/rules/discovery', query: { id } })
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case '视频': return Video
    case '图片': return ImageIcon
    case '小说': return BookOpen
    default: return Compass
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case '视频': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    case '图片': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
    case '小说': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    default: return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  }
}

onMounted(() => {
  loadRules()
})
</script>

<template>
  <div class="space-y-8 max-w-6xl mx-auto pb-10">
    <!-- 顶部 Hero 区域 -->
    <div class="text-center pt-8 sm:pt-14 space-y-4">
      <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30 shadow-2xs">
        <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
        <span>沙箱规则驱动 · 全网多媒体聚合</span>
      </div>

      <h1 class="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-100 dark:to-slate-300 bg-clip-text text-transparent">
        魔方视界 · <span class="bg-gradient-to-r from-indigo-600 to-pink-500 dark:from-indigo-400 dark:to-pink-400 bg-clip-text text-transparent font-['Outfit']">FluxView</span>
      </h1>

      <p class="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-normal">
        轻量高效的多源聚合视界，将跨站视频、图集画廊与小说源集中呈现在纯净空间。
      </p>

      <!-- 聚合全局搜索框 (mori-box 风格) -->
      <div class="max-w-2xl w-full mx-auto pt-4">
        <div class="glass-panel rounded-2xl p-2 shadow-xl shadow-indigo-600/5 focus-within:shadow-indigo-600/15 focus-within:border-indigo-500/50 transition-all">
          <div class="flex items-center gap-2">
            <Search class="w-5 h-5 text-slate-400 dark:text-slate-500 ml-2.5 flex-shrink-0" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索全网视频、图片、小说资源..."
              class="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm py-2 px-1"
              @keyup.enter="handleSearch"
            />
            <button
              @click="handleSearch"
              class="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex-shrink-0"
            >
              <span>聚合搜索</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源与规则轨卡片区 -->
    <div class="space-y-4 pt-4">
      <!-- 栏目标题区 -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <div class="w-1.5 h-5 rounded-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 flex-shrink-0"></div>
          <h2 class="text-base sm:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>已启用的数据源</span>
            <span class="hidden sm:inline text-xs font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">ACTIVE SOURCES</span>
          </h2>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/20 shadow-2xs">
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
            <span>已接入 <strong class="font-bold font-mono">{{ rules.length }}</strong> 个规则源</span>
          </div>

          <button
            @click="router.push('/rules')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
          >
            <SlidersHorizontal class="w-3.5 h-3.5" />
            <span>规则管理</span>
          </button>
        </div>
      </div>

      <!-- 加载中骨架 -->
      <div v-if="loading" class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div v-for="n in 6" :key="n" class="glass-panel rounded-2xl p-5 space-y-3 animate-shimmer">
          <div class="h-5 w-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-lg"></div>
          <div class="h-4 w-full bg-slate-200/40 dark:bg-slate-700/20 rounded-md"></div>
          <div class="h-4 w-2/3 bg-slate-200/40 dark:bg-slate-700/20 rounded-md"></div>
        </div>
      </div>

      <!-- 空白无数据源提示 -->
      <div
        v-else-if="rules.length === 0"
        class="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3"
      >
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
          <ShieldAlert class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">暂无启用的规则源</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          尚未启用任何规则。请前往规则管理中心导入或开启解析规则。
        </p>
        <button
          @click="router.push('/rules')"
          class="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all"
        >
          前往配置规则
        </button>
      </div>

      <!-- 数据源卡片网格 (mori-box 风格 Apple/Netflix 物理质感卡片) -->
      <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="rule in rules"
          :key="rule.id"
          @click="goToSource(rule.id)"
          class="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
        >
          <div class="space-y-3">
            <!-- 卡片顶部：图标、规则名与分类 Tag -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <component :is="getTypeIcon(rule.type)" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {{ rule.title }}
                  </h3>
                  <p class="text-[11px] font-mono text-slate-400 dark:text-slate-500">v{{ rule.version || '1.0.0' }}</p>
                </div>
              </div>

              <!-- 类型角标 -->
              <span
                class="px-2.5 py-0.5 text-[10px] font-bold rounded-full border"
                :class="getTypeBadgeColor(rule.type)"
              >
                {{ rule.type }}
              </span>
            </div>

            <!-- 规则描述 -->
            <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {{ rule.description || '高效沙箱解析规则，支持多维分类发现与详情检索。' }}
            </p>
          </div>

          <!-- 卡片底部作者与动作进入按键 -->
          <div class="pt-4 mt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-xs">
            <span class="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
              作者: {{ rule.author || '官方预置' }}
            </span>
            <div class="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>探索发现</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>