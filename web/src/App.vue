<script setup lang="ts">
import { computed } from 'vue'
import {
  NConfigProvider,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  NLoadingBarProvider,
  darkTheme,
  zhCN,
  dateZhCN,
  type GlobalThemeOverrides,
  type ConfigProviderProps,
  createDiscreteApi
} from 'naive-ui'
import Layout from './views/layout/index.vue'
import { useColorMode } from '@vueuse/core'

const colorMode = useColorMode()

const naiveTheme = computed(() => (colorMode.value === 'dark' ? darkTheme : null))

const commonOverrides = {
  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  borderRadius: '12px',
  primaryColor: '#6366f1',
  primaryColorHover: '#4f46e5',
  primaryColorPressed: '#4338ca',
  primaryColorSuppl: '#818cf8',
}

const themeOverrides: GlobalThemeOverrides = {
  common: commonOverrides,
  Button: {
    borderRadiusSmall: '10px',
    borderRadiusMedium: '12px',
    borderRadiusLarge: '14px',
    heightSmall: '30px',
    heightMedium: '36px',
    heightLarge: '44px',
    fontSizeSmall: '12px',
    fontSizeMedium: '13px',
    fontSizeLarge: '14px',
    fontWeight: '600',
  },
  Input: {
    borderRadius: '12px',
    heightSmall: '34px',
    heightMedium: '40px',
    heightLarge: '48px',
    fontSizeMedium: '13px',
    paddingMedium: '0 14px',
  },
  Select: {
    peers: { InternalSelection: { borderRadius: '12px', heightMedium: '40px' } },
  },
  Checkbox: {
    borderRadius: '6px',
    sizeSmall: '14px',
    sizeMedium: '16px',
    sizeLarge: '18px',
  },
  Tag: {
    borderRadius: '8px',
    padding: '2px 10px',
  },
  Tabs: {
    tabFontSizeMedium: '13px',
    tabFontWeightActive: '600',
    barColor: 'var(--primary-color)',
    tabBorderRadius: '12px',
  },
  Card: {
    borderRadius: '14px',
    paddingMedium: '16px',
  },
  Switch: {
    railHeightMedium: '24px',
    railWidthMedium: '42px',
    buttonHeightMedium: '18px',
    buttonWidthMedium: '18px',
  },
}

const configProviderPropsRef = computed<ConfigProviderProps>(() => ({
  locale: zhCN,
  dateLocale: dateZhCN,
  theme: colorMode.value === 'dark' ? darkTheme : null,
  themeOverrides,
}))

const { message, notification, dialog, loadingBar } = createDiscreteApi(
  ['message', 'dialog', 'notification', 'loadingBar'],
  {
    configProviderProps: configProviderPropsRef
  }
)

window.$message = message
</script>

<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
    class="h-full"
  >
    <n-notification-provider>
      <n-dialog-provider>
        <n-loading-bar-provider>
          <n-message-provider>
            <Layout />
          </n-message-provider>
        </n-loading-bar-provider>
      </n-dialog-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<style scoped>
</style>
