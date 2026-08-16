<script setup lang="ts">
import { ref } from 'vue'
import { BookOpen } from '@lucide/vue'

type Props = {
  title: string
  textContent: string
  relatedList?: any[]
}

withDefaults(defineProps<Props>(), {
  relatedList: () => []
})

const emit = defineEmits<{
  (e: 'select', item: any): void
}>()

const fontSize = ref<'small' | 'medium' | 'large'>('medium')
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto pb-12">
    <!-- 文字内容阅读器 (mori-box 风格) -->
    <div v-if="textContent" class="glass-panel rounded-2xl p-6 sm:p-10 space-y-6 shadow-sm">
      <!-- 阅读器设置工具栏 -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/5">
        <span class="text-xs text-slate-400 font-medium">正文阅读</span>
        <div class="flex items-center gap-1.5 text-xs text-slate-400">
          <span>字号:</span>
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200/60 dark:border-white/5">
            <button
              @click="fontSize = 'small'"
              class="px-2.5 py-0.5 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              :class="fontSize === 'small' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            >
              小
            </button>
            <button
              @click="fontSize = 'medium'"
              class="px-2.5 py-0.5 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              :class="fontSize === 'medium' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            >
              中
            </button>
            <button
              @click="fontSize = 'large'"
              class="px-2.5 py-0.5 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              :class="fontSize === 'large' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            >
              大
            </button>
          </div>
        </div>
      </div>
      
      <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white text-center leading-tight">
        {{ title }}
      </h1>
      
      <div
        class="leading-loose text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans transition-all duration-300"
        :class="{
          'text-xs sm:text-sm': fontSize === 'small',
          'text-sm sm:text-base': fontSize === 'medium',
          'text-base sm:text-lg': fontSize === 'large'
        }"
      >
        {{ textContent }}
      </div>
    </div>

    <!-- 目录/章节 列表 -->
    <div v-if="relatedList.length > 0" class="space-y-3">
      <div class="flex items-center gap-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5">
        <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">
          章节目录
        </h2>
      </div>
      
      <div class="grid gap-2.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div
          v-for="item in relatedList"
          :key="item.href || item.url"
          class="glass-panel glass-panel-hover rounded-xl p-3.5 cursor-pointer"
          @click="emit('select', item)"
        >
          <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1">
            {{ item.title }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
