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
    <!-- 文字内容阅读器 -->
    <div v-if="textContent" class="p-8 md:p-12 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl prose dark:prose-invert">
      <!-- 阅读器设置工具栏 -->
      <div class="flex items-center justify-end gap-3 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
        <span class="text-xs text-neutral-400">字号:</span>
        <n-button-group size="tiny">
          <n-button round :secondary="fontSize !== 'small'" type="info" @click="fontSize = 'small'">小</n-button>
          <n-button :secondary="fontSize !== 'medium'" type="info" @click="fontSize = 'medium'">中</n-button>
          <n-button round :secondary="fontSize !== 'large'" type="info" @click="fontSize = 'large'">大</n-button>
        </n-button-group>
      </div>
      
      <h1 class="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 text-center">
        {{ title }}
      </h1>
      
      <div
        class="leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-sans transition-all duration-300"
        :class="{
          'text-sm': fontSize === 'small',
          'text-base': fontSize === 'medium',
          'text-lg': fontSize === 'large'
        }"
      >
        {{ textContent }}
      </div>
    </div>

    <!-- 目录/章节 列表 -->
    <div v-if="relatedList.length > 0" class="space-y-4">
      <div class="flex items-center gap-2 pb-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
        <BookOpen class="w-5 h-5 text-sky-500" />
        <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200">
          章节目录
        </h2>
      </div>
      
      <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div
          v-for="item in relatedList"
          :key="item.href || item.url"
          class="p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-800/10 hover:bg-sky-500/5 dark:hover:bg-sky-500/10 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          @click="emit('select', item)"
        >
          <span class="text-xs font-semibold text-neutral-750 dark:text-neutral-300 hover:text-sky-500 dark:hover:text-sky-400">
            {{ item.title }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
