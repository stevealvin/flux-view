<script setup lang="ts">
import { ref } from 'vue'
import { useColorMode } from '@vueuse/core'
import { Sun, Moon, Home, Image, ArrowLeft, Table, FileBraces, ChevronLeft, ChevronRight, Video, BookOpen } from '@lucide/vue'

const colorMode = useColorMode()
const isCollapsed = ref(false)

const isDark = computed(() => colorMode.value == 'dark')

const switchTheme = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}

const startViewTransition = (event: MouseEvent) => {
  if (!document.startViewTransition) {
    switchTheme()
    return
  }

  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = document.startViewTransition(() => {
    switchTheme()
  })

  transition.ready.then(() => {
    const duration = 600
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: duration,
        easing: 'cubic-bezier(.76,.32,.29,.99)',
        pseudoElement: '::view-transition-new(root)'
      }
    )
  })
}

const navs = [
  {
    name: '首页',
    icon: Home,
    path: '/'
  },
  {
    name: '视频',
    icon: Video,
    path: '/video'
  },
  {
    name: '图片',
    icon: Image,
    path: '/picture'
  },
  {
    name: '小说',
    icon: BookOpen,
    path: '/novel'
  },
  {
    name: '规则管理',
    icon: FileBraces,
    path: '/rules'
  },
]
</script>

<template>
  <div class="h-screen w-screen flex bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 overflow-hidden relative">
    <!-- 沉浸式背景粒子 -->
    <ParticlesBg
      class="absolute inset-0 pointer-events-none z-0"
      :quantity="30"
      :ease="80"
      :color="isDark ? '#FFF' : '#3b82f6'"
      :staticity="12"
      refresh
    />

    <!-- 侧边栏导航 (全高可折叠设计) -->
    <div
      class="h-full shrink-0 flex flex-col py-6 border-r border-neutral-200/40 dark:border-neutral-800/40 backdrop-blur-xl bg-white/40 dark:bg-neutral-900/40 z-10 relative transition-all duration-300 ease-in-out"
      :class="isCollapsed ? 'w-16' : 'w-[200px]'"
    >
      <!-- 标志及品牌头部 -->
      <div
        class="flex items-center mb-8 w-full group cursor-pointer transition-all duration-300"
        :class="isCollapsed ? 'pl-[14px]' : 'pl-5'"
      >
        <div class="relative w-9 h-9 shrink-0">
          <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-70 blur transition duration-500 group-hover:duration-200"></div>
          <img src="/icon.svg" class="relative w-9 h-9 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-12" />
        </div>
        <span
          :class="isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[110px] opacity-100 ml-2.5'"
          class="inline-block whitespace-nowrap font-black text-lg tracking-tight text-neutral-800 dark:text-neutral-100 group-hover:text-sky-500 transition-all duration-300 ease-in-out overflow-hidden"
        >
          魔方视界
        </span>
      </div>

      <!-- 导航栏菜单列表 -->
      <div class="flex-grow w-full flex flex-col gap-2 px-2">
        <template v-for="nav in navs" :key="nav.name">
          <n-tooltip trigger="hover" placement="right" :disabled="!isCollapsed">
            <template #trigger>
              <button
                class="w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                :class="[
                  $route.path == nav.path
                    ? 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 dark:text-sky-400 font-bold shadow-sm shadow-sky-500/5'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 hover:text-neutral-800 dark:hover:text-neutral-200',
                  isCollapsed ? 'pl-[10px] pr-0 py-3' : 'pl-4 pr-3 py-2.5'
                ]"
                @click="$router.push(nav.path)"
              >
                <n-icon :component="nav.icon" :size="20" class="shrink-0" />
                <span
                  :class="isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[110px] opacity-100 ml-2.5'"
                  class="inline-block whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden"
                >
                  {{ nav.name }}
                </span>
              </button>
            </template>
            {{ nav.name }}
          </n-tooltip>
        </template>
      </div>

      <!-- 主题切换和侧栏收起切换 -->
      <div class="w-full px-2 pt-4 border-t border-neutral-200/20 dark:border-neutral-800/20 flex flex-col gap-2">
        <n-tooltip trigger="hover" placement="right" :disabled="!isCollapsed">
          <template #trigger>
            <button
              class="w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-300 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 hover:text-neutral-800 dark:hover:text-neutral-200"
              :class="isCollapsed ? 'pl-[10px] pr-0 py-3' : 'pl-4 pr-3 py-2.5'"
              @click="startViewTransition"
            >
              <n-icon :component="isDark ? Moon : Sun" :size="20" class="shrink-0" />
              <span
                :class="isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[110px] opacity-100 ml-2.5'"
                class="inline-block whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden"
              >
                {{ isDark ? '亮色模式' : '暗色模式' }}
              </span>
            </button>
          </template>
          {{ isDark ? '亮色模式' : '暗色模式' }}
        </n-tooltip>

        <n-tooltip trigger="hover" placement="right" :disabled="!isCollapsed">
          <template #trigger>
            <button
              class="w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-300 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 hover:text-neutral-800 dark:hover:text-neutral-200"
              :class="isCollapsed ? 'pl-[10px] pr-0 py-3' : 'pl-4 pr-3 py-2.5'"
              @click="isCollapsed = !isCollapsed"
            >
              <n-icon :component="isCollapsed ? ChevronRight : ChevronLeft" :size="20" class="shrink-0" />
              <span
                :class="isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[110px] opacity-100 ml-2.5'"
                class="inline-block whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden"
              >
                收起侧栏
              </span>
            </button>
          </template>
          {{ isCollapsed ? '展开侧栏' : '收起侧栏' }}
        </n-tooltip>
      </div>
    </div>

    <!-- 主内容面板 (扁平全高布局) -->
    <div class="flex-1 h-full relative bg-neutral-100/10 dark:bg-neutral-950/10 backdrop-blur-sm z-10 overflow-hidden">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" class="h-full overflow-auto" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
/* 页面切换过渡效果 */
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