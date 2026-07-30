<script setup lang="ts">
import { dateZhCN, zhCN, darkTheme, lightTheme, createDiscreteApi, type ConfigProviderProps } from 'naive-ui'
import Layout from './views/layout/index.vue'
import { useColorMode } from '@vueuse/core'

const colorMode = useColorMode()

const theme = computed(() => colorMode.value == 'dark' ? darkTheme : lightTheme)

const configProviderPropsRef = computed<ConfigProviderProps>(() => ({
  locale: zhCN,
  dateLocale: dateZhCN,
  theme: colorMode.value === 'light' ? lightTheme : darkTheme
}))

const { message, notification, dialog, loadingBar, modal } = createDiscreteApi(
  ['message', 'dialog', 'notification', 'loadingBar', 'modal'],
  {
    configProviderProps: configProviderPropsRef
  }
)

window.$message = message
</script>

<template>
  <!-- <suspense>
    <template #fallback>
      <div>Loading...</div>
    </template> -->
    
    <n-message-provider>
    <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="theme" class="h-full">
        <Layout>
          
        </Layout>
      </n-config-provider>
    </n-message-provider>
  <!-- </suspense> -->
</template>

<style scoped>

</style>
