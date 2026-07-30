<script setup lang="ts">
import { Image as ImageIcon } from '@lucide/vue'

type Props = {
  images: any[]
}

defineProps<Props>()

// Helper to normalize image sources (could be string URLs or objects)
const getImageUrl = (img: any): string => {
  if (typeof img === 'string') return img
  return img?.url || img?.src || img?.cover || ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 pb-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
      <ImageIcon class="w-5 h-5 text-sky-500" />
      <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200">
        图集列表
        <span class="text-xs text-neutral-400 font-normal ml-2">
          (共 {{ images.length }} 张，点击任何一张可开启幻灯片全屏预览)
        </span>
      </h2>
    </div>

    <n-image-group>
      <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="(img, index) in images"
          :key="index"
          class="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md p-1 shadow-sm hover:shadow-md transition-shadow duration-300 relative group aspect-3/4"
        >
          <n-image
            :src="getImageUrl(img)"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover rounded-lg overflow-hidden"
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
  transition: transform 0.3s ease;
}
:deep(.n-image:hover img) {
  transform: scale(1.03);
}
</style>
