<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ruleService } from '@/utils/ruleService'
import { Search, Compass, Eye, ShieldAlert } from '@lucide/vue'

const router = useRouter()
const searchKeyword = ref('')
const rules = ref<any[]>([])
const loading = ref(true)

const loadRules = async () => {
  loading.value = true
  try {
    const allRules = ruleService.getRules()
    rules.value = allRules.filter((r: any) => r.enabled === 1 || r.enabled === true)
  } catch (error) {
    console.error('Failed to load rules:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
  }
}

const goToSource = (id: number) => {
  router.push({ path: '/rules/discovery', query: { id } })
}

onMounted(() => {
  loadRules()
})
</script>

<template>
  <div class="min-h-full w-full py-8 px-4 relative flex flex-col justify-center items-center">
    <div class="w-full max-w-5xl flex flex-col justify-center">
      <!-- 中心主屏区域 -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-black tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center justify-center gap-3">
          <Compass class="w-10 h-10 text-sky-500 animate-spin-slow" />
          魔方视界
        </h1>
        <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
          聚合网络规则引擎，将不同的视频、图片、资讯源集中展现在一个纯净的空间中。
        </p>
      </div>

      <!-- 聚合搜索框 -->
      <div class="max-w-2xl w-full mx-auto mb-16 z-20">
        <div class="relative group">
          <div class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 opacity-20 group-focus-within:opacity-40 blur transition duration-300"></div>
          <div class="relative flex items-center bg-white/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden px-4 py-2">
            <Search class="w-5 h-5 text-neutral-400 shrink-0 mr-3" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索全网资源（聚合搜索）..."
              class="w-full bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 text-sm py-2"
              @keyup.enter="handleSearch"
            />
            <n-button type="info" secondary round class="ml-2 px-5 hover:scale-105 active:scale-95 transition-transform" @click="handleSearch">
              搜索
            </n-button>
          </div>
        </div>
      </div>

      <!-- 规则数据源网格部分 -->
      <div class="w-full">
        <div class="flex items-center justify-between mb-6 border-b border-neutral-200/50 dark:border-neutral-800 pb-4">
          <h2 class="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <Eye class="w-5 h-5 text-sky-500" />
            已启用的数据源
          </h2>
          <n-button quaternary size="small" type="info" @click="router.push('/rules')">
            管理规则
          </n-button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
          <n-spin size="large" />
          <span class="text-neutral-400 text-sm">正在加载规则数据源...</span>
        </div>

        <!-- 空白无规则数据状态 -->
        <div v-else-if="rules.length === 0" class="flex flex-col items-center justify-center py-16 px-4 bg-white/40 dark:bg-neutral-800/10 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl text-center">
          <ShieldAlert class="w-10 h-10 text-amber-500 mb-3" />
          <p class="text-neutral-600 dark:text-neutral-400 font-medium">暂无启用的规则源</p>
          <p class="text-neutral-400 text-xs mt-1">请先点击右上角“管理规则”添加并启用至少一个解析规则。</p>
        </div>

        <!-- 数据源卡片网格 -->
        <div v-else class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div
            v-for="rule in rules"
            :key="rule.id"
            class="group relative cursor-pointer"
            @click="goToSource(rule.id)"
          >
            <!-- 卡片悬停发光底影 -->
            <div class="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition duration-300"></div>
            
            <!-- 卡片主体内容 -->
            <div class="relative p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-800/30 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col h-full">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-lg border border-sky-500/20">
                  {{ rule.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-sky-500 transition-colors duration-200">
                    {{ rule.name }}
                  </h3>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 dark:text-sky-400">
                    {{ rule.type }}
                  </span>
                </div>
              </div>
              
              <p class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-2 flex-1">
                {{ rule.description || '暂无该规则源的描述信息。' }}
              </p>
              
              <div class="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/50 flex justify-between text-[10px] text-neutral-400">
                <span>作者: {{ rule.author }}</span>
                <span>v{{ rule.version }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>