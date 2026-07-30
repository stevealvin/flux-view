<script setup lang="ts">
import { motion } from 'motion-v';
import collect from './collect.json'

// let res = await fetch('https://www.06se.com/120414.html')
// console.log(res.text());

</script>

<template>
  <div class="h-full overflow-auto px-4 py-4">
    <div class="grid gap-6 gap-y-4 grid-cols-auto md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 max-sm:grid-cols-1">
      <template v-for="item in collect">
        <div class="overflow-clip rounded-xl">
          <div class=" overflow-clip aspect-3/2">
            <motion.div :while-hover="{ scale: 1.2, transition: { duration: 0.3 } }" class="h-full">
              <n-image lazy :src="item.cover" />
            </motion.div>
            <!-- <motion.img
              :src="item.cover"
              :while-hover="{ scale: 1.2, transition: { duration: 0.3 } }"
              class="overflow-hidden object-cover h-full"
            /> -->
          </div>

          <div class="p-1">
            <div class="line-clamp-2">{{ item.video_code }} {{ item.title }}</div>
            <div class="mt-2 flex gap-2 flex-wrap">
              <n-tag type="primary" v-for="tag in item.tags" size="tiny" :bordered="false">{{ tag.name }}</n-tag>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>