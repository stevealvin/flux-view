<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useColorMode } from '@vueuse/core'
import { useTabsStore } from '@/stores/tabs'
import {
  Sun,
  Moon,
  Home,
  Image,
  Search,
  FileBraces,
  ChevronsLeft,
  ChevronsRight,
  Video,
  BookOpen,
  Compass,
  Store,
  X,
  MoreHorizontal
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const colorMode = useColorMode()
const isCollapsed = ref(false)
const tabsStore = useTabsStore()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 监听路由变化，自动新增或激活标签
watch(
  () => route.fullPath,
  () => {
    tabsStore.addTab(route)
  },
  { immediate: true }
)

const handleTabClick = (fullPath: string) => {
  if (route.fullPath !== fullPath) {
    router.push(fullPath)
  }
}

const handleCloseTab = (fullPath: string) => {
  const nextPath = tabsStore.closeTab(fullPath)
  if (nextPath) {
    router.push(nextPath)
  }
}

const handleSelectTabOption = (key: string) => {
  if (key === 'close-others') {
    tabsStore.closeOtherTabs(route.fullPath)
  } else if (key === 'close-all') {
    const nextPath = tabsStore.closeAllTabs()
    router.push(nextPath)
  }
}

// 分组导航项定义
const navMain = [
  { label: '首页', icon: Home, path: '/' },
  { label: '聚合搜索', icon: Search, path: '/search' },
]

const navMedia = [
  { label: '视频流', icon: Video, path: '/video' },
  { label: '图集画廊', icon: Image, path: '/picture' },
  { label: '小说阅读', icon: BookOpen, path: '/novel' },
]

const navRules = [
  { label: '规则管理', icon: FileBraces, path: '/rules' },
  { label: '规则集市', icon: Store, path: '/rules/market' },
]

const currentRouteTitle = computed(() => {
  const p = route.path
  if (p === '/') return '首页探索'
  if (p === '/search') return '聚合全网搜索'
  if (p === '/video') return '视频发现'
  if (p === '/picture') return '图集画廊'
  if (p === '/novel') return '小说书库'
  if (p === '/rules/market') return '规则集市 · 源生态'
  if (p.startsWith('/rules')) return '规则引擎管理'
  return '视界空间'
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-300 flex font-sans selection:bg-indigo-600 selection:text-white relative">
    <!-- 全局星轨极光背景，仅在暗色模式下激活 -->
    <div class="ambient-glow" />

    <!-- Desktop Left Sidebar (mori-box 风格侧边栏) -->
    <aside
      class="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen app-header p-3 justify-between z-30 overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out select-none border-r border-slate-200/60 dark:border-white/5"
      :class="isCollapsed ? 'w-16' : 'w-52'"
    >
      <div class="space-y-5">
        <!-- 品牌 Logo 头部 -->
        <div class="flex items-center py-1 px-1 overflow-hidden">
          <n-tooltip :disabled="!isCollapsed" trigger="hover" placement="right">
            <template #trigger>
              <router-link to="/" class="flex items-center space-x-2.5 group min-w-0 overflow-hidden">
                <img
                  src="/icon.svg"
                  alt="FluxView Logo"
                  class="w-9 h-9 rounded-xl group-hover:scale-105 transition-transform duration-300 flex-shrink-0 object-cover"
                />
                <div class="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 to-pink-500 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent font-['Outfit'] whitespace-nowrap">
                  FluxView
                </div>
              </router-link>
            </template>
            FluxView 首页
          </n-tooltip>
        </div>

        <!-- 导航组 1：发现检索 -->
        <div class="space-y-1">
          <div
            class="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 whitespace-nowrap overflow-hidden transition-all duration-300"
            :class="isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-6 opacity-100 mb-1'"
          >
            发现检索
          </div>
          <n-tooltip v-for="item in navMain" :key="item.path" :disabled="!isCollapsed" placement="right">
            <template #trigger>
              <router-link
                :to="item.path"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group overflow-hidden whitespace-nowrap"
                :class="[
                  $route.path === item.path
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                ]"
              >
                <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                <span class="whitespace-nowrap">{{ item.label }}</span>
              </router-link>
            </template>
            {{ item.label }}
          </n-tooltip>
        </div>

        <!-- 导航组 2：媒体分类 -->
        <div class="space-y-1">
          <div
            class="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 whitespace-nowrap overflow-hidden transition-all duration-300"
            :class="isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-6 opacity-100 mb-1'"
          >
            媒体流
          </div>
          <n-tooltip v-for="item in navMedia" :key="item.path" :disabled="!isCollapsed" placement="right">
            <template #trigger>
              <router-link
                :to="item.path"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group overflow-hidden whitespace-nowrap"
                :class="[
                  $route.path === item.path
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                ]"
              >
                <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                <span class="whitespace-nowrap">{{ item.label }}</span>
              </router-link>
            </template>
            {{ item.label }}
          </n-tooltip>
        </div>

        <!-- 导航组 3：规则引擎 -->
        <div class="space-y-1">
          <div
            class="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 whitespace-nowrap overflow-hidden transition-all duration-300"
            :class="isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-6 opacity-100 mb-1'"
          >
            规则引擎
          </div>
          <n-tooltip v-for="item in navRules" :key="item.path" :disabled="!isCollapsed" placement="right">
            <template #trigger>
              <router-link
                :to="item.path"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group overflow-hidden whitespace-nowrap"
                :class="[
                  (item.path === '/rules' ? ($route.path === '/rules' || $route.path.startsWith('/rules/edit') || $route.path.startsWith('/rules/discovery') || $route.path.startsWith('/rules/detail')) : $route.path === item.path)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                ]"
              >
                <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                <span class="whitespace-nowrap">{{ item.label }}</span>
              </router-link>
            </template>
            {{ item.label }}
          </n-tooltip>
        </div>
      </div>

      <!-- 底部控制区（主题切换 & 折叠控制） -->
      <div class="space-y-1 pt-2 border-t border-slate-200/50 dark:border-white/5">
        <!-- 主题切换行 -->
        <n-tooltip :disabled="!isCollapsed" trigger="hover" placement="right">
          <template #trigger>
            <div
              @click="toggleTheme"
              class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer overflow-hidden whitespace-nowrap transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5"
            >
              <Sun v-if="isDark" class="w-4 h-4 text-amber-400 flex-shrink-0" />
              <Moon v-else class="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span class="whitespace-nowrap">{{ isDark ? '浅色模式' : '深色模式' }}</span>
            </div>
          </template>
          切换主题
        </n-tooltip>

        <!-- 折叠/展开侧边栏 -->
        <n-tooltip :disabled="!isCollapsed" trigger="hover" placement="right">
          <template #trigger>
            <div
              @click="toggleCollapse"
              class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer overflow-hidden whitespace-nowrap transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5"
            >
              <ChevronsRight v-if="isCollapsed" class="w-4 h-4 flex-shrink-0" />
              <ChevronsLeft v-else class="w-4 h-4 flex-shrink-0" />
              <span class="whitespace-nowrap">{{ isCollapsed ? '展开侧边栏' : '收起侧边栏' }}</span>
            </div>
          </template>
          {{ isCollapsed ? '展开侧边栏' : '收起侧边栏' }}
        </n-tooltip>
      </div>
    </aside>

    <!-- Right Main Container -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
      <!-- 顶部固定 Header (mori-box 风格 Apple Segmented 多标签栏) -->
      <header class="sticky top-0 z-20 h-9 sm:h-9.5 app-header border-b border-slate-200/60 dark:border-white/10 px-2 sm:px-3 flex items-center justify-between min-w-0 select-none backdrop-blur-xl">
        <!-- 移动端 Logo / 站点标识 -->
        <div class="flex items-center gap-1 lg:hidden flex-shrink-0 mr-1">
          <router-link to="/" class="flex items-center space-x-1">
            <img src="/icon.svg" alt="FluxView Logo" class="w-5.5 h-5.5 rounded-md object-cover" />
          </router-link>
        </div>

        <!-- 中间可滑动多标签栏 (Apple Segmented Glass Tab 风格) -->
        <div class="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5 min-w-0">
          <div
            v-for="tab in tabsStore.tabs.value"
            :key="tab.fullPath"
            @click="handleTabClick(tab.fullPath)"
            class="group relative flex items-center gap-1.5 h-6.5 px-2.5 rounded-lg text-[11px] font-medium shrink-0 cursor-pointer transition-all duration-150 select-none border"
            :class="tab.fullPath === tabsStore.activeFullPath.value
              ? 'bg-indigo-600 dark:bg-indigo-500/90 text-white border-indigo-500/40 shadow-xs font-bold'
              : 'bg-slate-100/70 dark:bg-white/[0.03] hover:bg-slate-200/60 dark:hover:bg-white/[0.07] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-slate-200/40 dark:border-white/5'"
          >
            <!-- 激活指示微型高亮圆点 -->
            <span v-if="tab.fullPath === tabsStore.activeFullPath.value" class="w-1.5 h-1.5 rounded-full bg-white/95 flex-shrink-0"></span>

            <span class="truncate max-w-[100px] sm:max-w-[140px] inline-block leading-none">
              {{ tab.title }}
            </span>

            <!-- 可关闭 Close 图标按键 -->
            <button
              v-if="tab.closable"
              @click.stop="handleCloseTab(tab.fullPath)"
              class="rounded p-0.5 transition-colors text-slate-400 hover:text-white hover:bg-white/25 active:scale-90 cursor-pointer opacity-60 group-hover:opacity-100"
              title="关闭当前标签"
            >
              <X class="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        <!-- 右侧动作快捷区 (多标签下拉、快捷搜索、主题切换) -->
        <div class="flex items-center gap-1 flex-shrink-0 ml-1.5">
          <!-- 标签页操作下拉菜单 -->
          <n-dropdown
            trigger="click"
            :options="[
              { label: '关闭其他标签页', key: 'close-others' },
              { label: '关闭全部标签页', key: 'close-all' }
            ]"
            @select="handleSelectTabOption"
          >
            <button
              class="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-all cursor-pointer"
              title="标签页更多选项"
            >
              <MoreHorizontal class="w-3.5 h-3.5" />
            </button>
          </n-dropdown>

          <!-- 快捷搜索框/按钮 -->
          <router-link
            to="/search"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100/80 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/5 transition-all shadow-2xs hover:scale-102 active:scale-98"
          >
            <Search class="w-3 h-3 text-indigo-500" />
            <span class="hidden md:inline">搜索</span>
          </router-link>

          <!-- 移动端主题切换 -->
          <button
            @click="toggleTheme"
            class="lg:hidden p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            title="切换主题"
          >
            <Sun v-if="isDark" class="w-3.5 h-3.5 text-amber-400" />
            <Moon v-else class="w-3.5 h-3.5 text-indigo-500" />
          </button>
        </div>
      </header>

      <!-- 主视图渲染区 (KeepAlive 缓存容器) -->
      <main class="flex-1 overflow-y-auto overflow-x-hidden relative p-4 sm:p-6">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide" mode="out-in">
            <keep-alive :include="tabsStore.cachedTabNames.value">
              <component
                :is="Component"
                :key="tabsStore.openFullPaths.value.includes(route.fullPath) ? route.fullPath : route.fullPath + '_fresh'"
              />
            </keep-alive>
          </transition>
        </router-view>
      </main>

      <!-- 移动端底部 Tabbar (小屏手机适配) -->
      <nav class="lg:hidden sticky bottom-0 z-20 h-14 app-header border-t border-slate-200/60 dark:border-white/10 px-2 flex items-center justify-around select-none backdrop-blur-xl">
        <router-link
          v-for="item in [...navMain, ...navMedia.slice(0, 2), ...navRules]"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all"
          :class="[
            $route.path === item.path
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
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

/* 页面过渡效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>