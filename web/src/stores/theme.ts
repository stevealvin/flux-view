import { defineStore } from 'pinia';
import { useDark, useToggle } from '@vueuse/core';

/**
 * 全局主题状态管理 (基于 @vueuse/core 的 useDark & useToggle)
 * 
 * 特性：
 * 1. 使用 VueUse 原生 useDark()，自动响应系统主题偏好与无感持久化；
 * 2. 自动同步 <html class="dark"> 类名切换；
 * 3. 采用标准存储机制，无缝支撑深浅双主题切换。
 */
export const useThemeStore = defineStore('theme', () => {
  // 直接采用 VueUse 官方标准 useDark()
  const isDark = useDark();

  // 基于 useToggle 快速生成切换函数
  const toggleTheme = useToggle(isDark);

  function setDark(val: boolean) {
    isDark.value = val;
  }

  return {
    isDark,
    toggleTheme,
    setDark,
  };
});
