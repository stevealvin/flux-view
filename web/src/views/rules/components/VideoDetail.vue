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

const getImageUrl = (img: any): string => {
  if (typeof img === 'string') return img
  return img?.url || img?.src || img?.cover || ''
}
</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <!-- 上半部分：分栏布局 (左播放器，右选集) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
      <!-- 左侧：播放器与标题介绍 -->
      <div :class="discovery.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'" class="flex flex-col gap-4">
        <div class="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl relative border border-slate-200/60 dark:border-white/10">
          <ArtPlayer
            v-if="videoUrl"
            :url="videoUrl"
            :title="title"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[300px]">
            <Play class="w-12 h-12 text-slate-500" />
            <span class="text-xs">未能获取有效的视频播放地址</span>
          </div>
        </div>

        <!-- 播放标题与介绍面板 (mori-box 风格) -->
        <div class="glass-panel rounded-2xl p-5 space-y-2 shadow-sm">
          <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
            {{ title }}
          </h2>
          <div v-if="desc" class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1" v-html="desc"></div>
        </div>
      </div>

      <!-- 右侧：相关选集推荐列表 -->
      <div v-if="discovery.length > 0" class="lg:col-span-4 xl:col-span-3 flex flex-col gap-3 h-full">
        <div class="flex items-center gap-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5">
          <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100">相关推荐</h3>
        </div>
        <div class="grid grid-cols-2 gap-3 pr-1">
          <div
            v-for="(item, idx) in discovery"
            :key="item.href || item.url || idx"
            class="group relative flex flex-col rounded-2xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xl hover:shadow-indigo-500/10 active:scale-98"
            @click="emit('select', item)"
          >
            <div class="aspect-[16/10] overflow-hidden relative bg-slate-200 dark:bg-slate-900">
              <img
                v-if="item.cover"
                :src="item.cover"
                referrerpolicy="no-referrer"
                :alt="item.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                <Play class="w-6 h-6" />
              </div>
            </div>
            <div class="p-2 flex flex-col justify-between flex-1">
              <h4 class="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {{ item.title || `第 ${idx + 1} 话` }}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下半部分：剧集列表与图片流 -->
    <div class="flex flex-col gap-6 w-full">
      <!-- 选集 / 分集列表 (list) -->
      <div v-if="list.length > 0" class="space-y-3">
        <div class="flex items-center gap-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5">
          <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100">选集播放</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(item, idx) in list"
            :key="item.href || item.url || idx"
            @click="emit('select', item)"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.04] hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 border border-slate-200/60 dark:border-white/5 transition-all cursor-pointer shadow-2xs"
          >
            {{ item.title || `第 ${idx + 1} 集` }}
          </button>
        </div>
      </div>

      <!-- 图片流 (images) -->
      <div v-if="images.length > 0" class="space-y-3">
        <div class="flex items-center gap-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5">
          <div class="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100">图集预览</h3>
        </div>
        <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <div
            v-for="(img, idx) in images"
            :key="idx"
            class="group rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 aspect-3/4 cursor-pointer"
          >
            <img
              :src="getImageUrl(img)"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
