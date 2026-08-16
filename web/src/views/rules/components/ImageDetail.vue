<script setup lang="ts">
import { Image as ImageIcon } from '@lucide/vue'

type Props = {
  images: any[]
}

defineProps<Props>()

const getImageUrl = (img: any): string => {
  if (typeof img === 'string') return img
  return img?.url || img?.src || img?.cover || ''
}
</script>

<template>
  <div class="space-y-4 max-w-7xl mx-auto">
    <div class="flex items-center justify-between pb-1.5 border-b border-slate-200/50 dark:border-white/5">
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">
          图集画廊
        </h2>
      </div>
      <span class="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/30">
        共 {{ images.length }} 张（点击开启全屏预览）
      </span>
    </div>

    <n-image-group>
      <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <div
          v-for="(img, index) in images"
          :key="index"
          class="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-100 dark:bg-slate-900 shadow-2xs hover:shadow-lg transition-all duration-300 relative group aspect-3/4 cursor-pointer"
        >
          <n-image
            :src="getImageUrl(img)"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover rounded-2xl overflow-hidden"
            lazy
            show-toolbar-tooltip
          />
        </div>
      </div>
    </n-image-group>
  </div>
</template>

<style scoped>
:deep(.n-image) {
  width: 100%;
  height: 100%;
}
:deep(.n-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
:deep(.n-image:hover img) {
  transform: scale(1.05);
}
</style>
