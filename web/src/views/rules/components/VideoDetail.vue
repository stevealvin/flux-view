<script setup lang="ts">
import { Play, Image as ImageIcon, ListVideo } from '@lucide/vue'
import ArtPlayer from '@/components/ArtPlayer.vue'

type Props = {
  videoUrl: string
  title: string
  desc?: string
  images?: any[]
  discovery?: any[]
  list?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  desc: '',
  images: () => [],
  discovery: () => [],
  list: () => []
})

const emit = defineEmits<{
  (e: 'select', item: any): void
}>()

// Helper to normalize image sources
const getImageUrl = (img: any): string => {
  if (typeof img === 'string') return img
  return img?.url || img?.src || img?.cover || ''
}
</script>

<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- 上半部分：分栏布局 (左播放器，右选集) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
      <!-- 左侧：播放器 -->
      <div :class="discovery.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'" class="flex flex-col gap-4">
        <div class="aspect-video w-full rounded-lg overflow-hidden bg-neutral-100/50 dark:bg-neutral-900/50 shadow-2xl relative border border-neutral-200/10 dark:border-neutral-800/50">
          <ArtPlayer
            v-if="videoUrl"
            :url="videoUrl"
            :title="title"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-2 min-h-[300px]">
            <Play class="w-12 h-12 text-neutral-500" />
            <span>未能获取有效的视频播放地址</span>
          </div>
        </div>
        <!-- 播放标题 -->
        <div class="p-4 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/40 bg-white/40 dark:bg-neutral-800/10 backdrop-blur-md flex flex-col gap-2">
          <h2 class="text-lg font-black text-neutral-800 dark:text-neutral-100 leading-snug">
            {{ title }}
          </h2>
          <div v-if="desc" class="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed mt-1.5" v-html="desc"></div>
        </div>
      </div>

      <!-- 右侧：选集列表 (discovery) -->
      <div v-if="discovery.length > 0" class="lg:col-span-4 xl:col-span-3 flex flex-col gap-3 h-full">
        <div class="flex items-center gap-2 pb-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
          <ListVideo class="w-4 h-4 text-sky-500" />
          <h3 class="text-xs font-bold text-neutral-800 dark:text-neutral-200">相关推荐</h3>
        </div>
        <div class="grid grid-cols-2 gap-3 pr-1">
          <div
            v-for="(item, idx) in discovery"
            :key="item.href || item.url || idx"
            class="group relative cursor-pointer"
            @click="emit('select', item)"
          >
            <div class="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col h-full">
              <div class="aspect-video overflow-hidden relative bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200/10 dark:border-neutral-700/10">
                <img
                  v-if="item.cover"
                  :src="item.cover"
                  referrerpolicy="no-referrer"
                  alt="cover"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-neutral-400">
                  <Play class="w-6 h-6" />
                </div>
              </div>
              <div class="p-1.5 flex-grow flex flex-col justify-between">
                <h3 class="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-snug group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors duration-200">
                  {{ item.title || `第 ${idx + 1} 集` }}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下半部分：平铺展示 (images 和 list) -->
    <div class="flex flex-col gap-8 w-full">
      <!-- 1. 图片列表 (images) -->
      <div v-if="images.length > 0" class="space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
          <ImageIcon class="w-5 h-5 text-sky-500" />
          <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200">
            图集列表
            <span class="text-xs text-neutral-400 font-normal ml-2">(共 {{ images.length }} 张)</span>
          </h2>
        </div>
        <n-image-group>
          <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div
              v-for="(img, idx) in images"
              :key="idx"
              class="aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md p-1 shadow-sm hover:shadow-md transition-all duration-300 group"
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

      <!-- 2. 推荐列表 (list) -->
      <div v-if="list.length > 0" class="space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
          <ListVideo class="w-5 h-5 text-emerald-500" />
          <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200">推荐播放</h2>
        </div>
        <div class="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <div
            v-for="item in list"
            :key="item.href || item.url"
            class="group relative cursor-pointer"
            @click="emit('select', item)"
          >
            <div class="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col h-full">
              <div class="aspect-video overflow-hidden relative bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200/10 dark:border-neutral-700/10">
                <img
                  v-if="item.cover"
                  :src="item.cover"
                  referrerpolicy="no-referrer"
                  alt="cover"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-neutral-400">
                  <Play class="w-6 h-6" />
                </div>
              </div>
              <div class="p-3 flex-grow flex flex-col justify-between">
                <h3 class="text-xs font-bold text-neutral-850 dark:text-neutral-200 line-clamp-2 leading-snug group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">
                  {{ item.title }}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
