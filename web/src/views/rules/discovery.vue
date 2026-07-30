<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/utils/http'
import { ruleService } from '@/utils/ruleService'
import { ArrowLeft, Compass, AlertCircle, RefreshCw } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const ruleId = ref<number | null>(null)
const rule = ref<any>(null)
const categories = ref<any[]>([])
const loading = ref(true)
const executing = ref(false)
const errorMsg = ref('')

const fetchRule = async () => {
  const id = Number(route.query.id)
  if (!id) {
    errorMsg.value = '无效的规则ID'
    loading.value = false
    return
  }
  ruleId.value = id

  try {
    const res = ruleService.getRuleById(id)
    rule.value = res
    if (rule.value) {
      await executeDiscovery()
    } else {
      errorMsg.value = '规则未找到'
    }
  } catch (error: any) {
    errorMsg.value = '获取规则失败: ' + (error.message || error)
  } finally {
    loading.value = false
  }
}

const executeDiscovery = async () => {
  executing.value = true
  errorMsg.value = ''
  try {
    const res = await http.post('/rules/run', {
      code: rule.value.discovery_code
    })
    
    // 如果沙箱返回一个数组，直接赋值
    if (Array.isArray(res)) {
      categories.value = res
    } else if (res && typeof res === 'object') {
      // 处理备用数据结构
      categories.value = res.data || res.list || []
    } else {
      categories.value = []
      errorMsg.value = '解析器返回了不支持的数据格式'
    }
  } catch (error: any) {
    errorMsg.value = '规则执行失败: ' + (error.response?.data?.message || error.message || error)
  } finally {
    executing.value = false
  }
}

const goToDetail = (item: any) => {
  router.push({
    path: '/rules/detail',
    query: {
      ruleId: ruleId.value,
      href: item.href || item.url,
      title: item.title,
      cover: item.cover,
      item: JSON.stringify(item)
    }
  })
}

onMounted(() => {
  fetchRule()
})
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-50/30 dark:bg-neutral-900/10">
    <!-- 顶部操作栏 -->
    <div class="bg-white/40 dark:bg-neutral-800/20 border-b border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md sticky top-0 z-30 w-full">
      <div class="px-4 py-3 flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <n-button quaternary circle size="medium" @click="router.back()">
            <template #icon>
              <ArrowLeft class="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </template>
          </n-button>
          <div>
            <h1 class="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              {{ rule ? rule.name : '加载中...' }}
            </h1>
            <p class="text-xs text-neutral-400" v-if="rule">{{ rule.type }} • v{{ rule.version }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <n-button secondary round size="small" type="info" :loading="executing" @click="executeDiscovery">
            <template #icon>
              <RefreshCw class="w-4 h-4" />
            </template>
            刷新抓取
          </n-button>
        </div>
      </div>
    </div>

    <!-- 主内容面板 -->
    <div class="flex-1 overflow-auto px-4 py-4">
      <div class="w-full">
        <!-- 正在加载规则 -->
        <div v-if="loading || (executing && categories.length === 0)" class="flex flex-col items-center justify-center py-32 gap-3">
          <n-spin size="large" />
          <span class="text-neutral-400 text-sm">正在远程抓取解析网站内容...</span>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="errorMsg" class="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 text-center">
          <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 class="text-lg font-bold text-red-600 dark:text-red-400">出错了</h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{{ errorMsg }}</p>
          <n-button type="error" ghost round class="mt-5" @click="executeDiscovery">
            重试
          </n-button>
        </div>

        <!-- 发现内容分类列表 -->
        <div v-else class="space-y-10">
          <div v-for="category in categories" :key="category.title" class="space-y-4">
            <!-- 分类标题头部 -->
            <div class="flex items-center gap-2 pb-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
              <div class="w-1 h-5 bg-sky-500 rounded-full"></div>
              <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200">{{ category.title }}</h2>
              <span class="text-[10px] text-neutral-400 dark:text-neutral-500">({{ category.items?.length || 0 }}个内容)</span>
            </div>

            <!-- 卡片网格 -->
            <div class="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              <div
                v-for="item in category.items"
                :key="item.href"
                class="group relative cursor-pointer"
                @click="goToDetail(item)"
              >
                <!-- 卡片容器 -->
                <div class="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-800/20 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col h-full">
                  <!-- 封面图片 -->
                  <div class="aspect-3/4 overflow-hidden relative bg-neutral-200 dark:bg-neutral-800">
                    <img
                      :src="item.cover"
                      referrerpolicy="no-referrer"
                      alt="cover"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <!-- 悬停遮罩层 -->
                    <div class="absolute inset-0 bg-neutral-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Compass class="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                  </div>

                  <!-- 卡片详细信息 -->
                  <div class="p-3 flex-1 flex flex-col justify-between">
                    <h3 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors duration-200">
                      {{ item.title }}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
