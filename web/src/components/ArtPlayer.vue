<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import Artplayer from 'artplayer'

const props = defineProps<{
  url: string
  title?: string
}>()

const artRef = ref<HTMLDivElement | null>(null)
let art: Artplayer | null = null

const initPlayer = () => {
  if (!artRef.value) return

  // Destroy previous instance if any
  if (art) {
    art.destroy(false)
  }

  art = new Artplayer({
    container: artRef.value,
    url: props.url,
    volume: 0.7,
    isLive: false,
    muted: false,
    autoplay: true,
    pip: true,
    autoSize: false, // Auto fit container to video ratio
    autoMini: true,
    screenshot: true,
    setting: true,
    loop: false,
    flip: true,
    playbackRate: true,
    aspectRatio: true, // Let user toggle custom aspect ratios (Default, 16:9, 4:3)
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    theme: '#0ea5e9', // Sky-500 premium color
  })
}

onMounted(() => {
  initPlayer()
})

onBeforeUnmount(() => {
  if (art) {
    art.destroy(false)
  }
})

// Reactively switch source when URL updates
watch(() => props.url, (newUrl) => {
  if (art && newUrl) {
    ;(art as any).switch(newUrl)
  } else {
    initPlayer()
  }
})
</script>

<template>
  <div ref="artRef" class="w-full h-full bg-transparent"></div>
</template>

<style scoped>
</style>
