# FluxView · 项目全景架构与会话交接指南 (Project Handover)

> **致未来的 Antigravity / AI 助手**：
> 本文档是 **FluxView (魔方视界)** 项目的核心上下文资产。在新的开发环境或新会话中启动时，**请首先完整阅读本文档**，以快速同步项目架构、已完成的里程碑、设计决策以及接下来的待办事项。

---

## 📌 项目基本信息与仓库

* **项目名称**：FluxView (魔方视界) - 跨平台多媒体聚合与沙箱规则引擎
* **GitHub 仓库 (Monorepo)**：[`https://github.com/stevealvin/flux-view`](https://github.com/stevealvin/flux-view) （**默认主分支：`main`**）
* **移动端仓库 (Flutter)**：[`https://github.com/stevealvin/flux-view-app`](https://github.com/stevealvin/flux-view-app) （**默认主分支：`main`**）
* **架构模式**：npm Workspaces Monorepo（根目录下扁平放置 `web` 与 `server`）
  * **前端 `web/`**：Vue 3 + TypeScript + Vite + Tailwind CSS 4 + Naive UI + Lucide Icons + Monaco Editor + ArtPlayer
  * **后端 `server/`**：Hono.js + Node.js VM 沙箱 + Better-SQLite3 + Cheerio + Axios
* **云端部署**：已配置针对 Monorepo 双服务的 [vercel.json](file:///c:/dev/projects/flux-view/vercel.json)

---

## 🎨 核心设计体系 (mori-box Frosted Glass & Aurora)

项目已全面完成与 `C:\dev\projects\mori-box` 一致的现代化视觉与动效重构：
1. **设计 Token & 样式**：
   * 主题色：Indigo (`#6366f1`) 与 Accent Pink (`#ec4899`)。
   * 暗色模式底色：`hsl(224, 25%, 3.8%)`，配以双轨道平滑流动的背景极光 (`.ambient-glow`)。
   * 毛玻璃质感面板：`.glass-panel` 与 `.glass-panel-hover`。
   * 字体栈：Google Fonts（`Outfit` 品牌字、`Plus Jakarta Sans` 正文字、`JetBrains Mono` 代码字）。
2. **布局架构**：
   * 左侧：可折叠分组侧边栏（`发现检索`、`媒体流`、`规则引擎`）。
   * 顶部：Apple Segmented 质感多标签栏（`h-9`）+ 下拉批量关闭菜单。
   * 视图层：Vue `<keep-alive>` 动态组件级缓存与按需销毁。

---

## 🏛️ 当前已完成的架构重构 (Milestones)

### 1. 标准化媒体与规则数据契约 (`web/src/types/rule.ts`)
* **`RuleSchema`**：规则实体定义（`id`, `name`, `type: 'video'|'picture'|'novel'`, `version`, `author`, `baseUrl`, `code`, `enabled`）。
* **`MediaItem`**：发现大厅与搜索卡片标准模型（`key`, `title`, `cover`, `badge`, `desc`）。
* **`MediaDetail`**：通用媒体详情模型（`title`, `cover`, `desc`, `tags`, `groups`, `media`, `recommendations`）。
* **`MediaPayload` & `ParseResult`**：针对视频播放直链、图集画廊、小说纯文本正文的标准载荷。

### 2. 标准化生命周期钩子沙箱 (`server/src/routes/rules.ts`)
* 规则代码已由早期松散的多个字符串字段收敛为统一的 **单 ESModule 模块 (`code`)**，支持 4 个标准异步生命周期方法：
  * `discovery({ category, page })`：发现页分类与流式分页列表。
  * `search({ keyword, page })`：全网并发与站内搜索。
  * `detail({ key, item })`：获取完整详情、多分组选集、推荐与图集。
  * `parse({ key, groupName })`：动态解析分集播放直链或小说正文。
* 沙箱自动将 ESModule 转换为 Node.js VM 安全执行沙箱，注入 `axios`, `cheerio`, `crypto`, `Buffer`, `URL` 及统一的桌面级 `User-Agent`。

### 3. 现存所有规则重写与种子数据清洗 (`web/src/utils/rules.json`)
* 预置的 6 大精选规则均已按照新规范重写：
  1. `全面屏超清壁纸` (`picture`)：discovery + search + detail
  2. `美图写真` (`picture`)：discovery + detail (全屏画廊)
  3. `木瓜视频` (`video`)：discovery + detail (eval 解密提取直链)
  4. `蜜桃视频` (`video`)：discovery + search + detail (流媒体 API)
  5. `JAVMENU` (`video`)：discovery + search + detail (预告、海报与剧照)
  6. `笔趣阁小说` (`novel`)：discovery + search + detail + parse (全本章节与正文阅读)

### 4. 路由瘦身与多态媒体渲染器
* **URL 瘦身**：详情页统一使用 `/rules/detail?ruleId=1&key=...`，彻底移除了对超长 `JSON.stringify` 的依赖。
* **三大沉浸式渲染组件**：
  * 🎬 **视频流 (`VideoDetail.vue`)**：ArtPlayer 播放器 + 剧集多线路分组切换 + 动态 `parse` 解析 + 右侧相似推荐。
  * 🖼️ **图集画廊 (`ImageDetail.vue`)**：瀑布流卡片 + 全屏灯箱查看。
  * 📖 **小说阅读器 (`TextDetail.vue`)**：章节目录抽屉 + 沉浸式阅读器 + 翻章按钮 + 字号与羊皮纸/夜间主题切换。

### 5. 规则集市 (`web/src/views/rules/market.vue`)
* 汇聚源仓库 (YCKCEO)、源小二、阅读3.0、TVBox 等规则社区站点，支持一键直达、复制链接与自定义本地站点收藏。

---

## 📋 待办事项与下一步计划 (Roadmap & Pending Tasks)

以下是经过深入架构讨论后，建议在接下来的会话中优先实施的升级项：

### 🎯 待办 1：后端沙箱升级为 `ruleId` 直读与编译缓存模式
* **目标**：优化网络传输与后端性能。
* **实现方案**：
  * 常规页面（发现、搜索、详情）向后端发起请求时，请求体**只需携带 `{ ruleId, action, params }`**，无需在网络上传输大段 `code` 字符串。
  * 后端 `/api/rules/execute` 接收到 `ruleId` 时，直接从 SQLite 中读取该规则的 `code`，并在内存中对 `vm.Script` 做编译缓存（提高并发执行速度）。
  * 规则编辑/调试页仍支持传入自定义 `{ code, action, params }`，实现即时无保存调试。

### 🎯 待办 2：实现全局媒体上下文总线 (`MediaContextStore`)
* **目标**：解决“搜索/发现跳详情时的 0 秒秒开预热”与“上下文参数传递”。
* **实现方案**：
  * 创建 `web/src/stores/mediaContext.ts`。
  * 在搜索页和发现页点击卡片时，将该项的完整搜索结果先存入 `MediaContextStore`，然后执行极简路由跳转 `/rules/detail?ruleId=1&key=...`。
  * 详情页加载时，先从 `MediaContextStore` 读取预热数据瞬间渲染标题与封面（实现 **Optimistic UI 零白屏**），同时后台发起 `ruleService.runDetail(ruleId, { key, item: preheatData })`。
  * 用户按 F5 刷新或分享链接时，页面发现内存为空，依然仅凭 `ruleId` + `key` 自动重拉数据并恢复展示（具备完美的刷新自愈能力）。

### 🎯 待办 3：多源搜索错误熔断与并发性能优化
* **目标**：当某个规则站点网络超时或失效时，不影响其他正常源的搜索结果聚合呈现。

---

## 🚀 换机器/新会话启动提示词 (Quick Prompt for Next Session)

在其他设备或新会话中使用 Antigravity 打开本项目时，直接将以下提示词发送给 AI 即可无缝接续工作：

> **“你好！本项目是 FluxView (魔方视界)。请先完整阅读根目录下的 `PROJECT_HANDOVER.md`，了解当前已完成的架构重构以及待办事项（如：后端沙箱 ruleId 直读模式、MediaContextStore 内存上下文总线等），然后准备协助我继续进行开发。”**
