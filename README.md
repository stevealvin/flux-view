# 🌊 FluxView (流光视界)

> **轻量级、沙箱规则驱动的跨媒体聚合浏览与播放平台**

---

## 📖 项目简介

**FluxView (流光视界)** 是一款现代化的全栈多媒体聚合浏览平台。项目采用 **Monorepo** 架构，前端基于 Vue 3 + Tailwind CSS + Naive UI，后端依托 Hono.js 构建。

FluxView 的核心在于其**沙箱 JavaScript 动态规则引擎**。如同“流光”般顺畅无缝，FluxView 打破了不同内容平台之间的界限，通过简短的规则脚本即可将视频、图集、小说等海量媒体源集中在一个纯净、优雅且无广告的视界中展示与播放。

---

## ✨ 核心特性

* ⚡ **沙箱规则驱动**：内置安全轻量的 JS 运行沙箱，支持编写/导入自定义规则（支持“发现页、搜索页、详情页”三段式解析脚本），轻松对接各类数据源。
* 🎬 **跨媒体全能体验**：
  * 📹 **视频播放**：集成现代 **ArtPlayer** 高清播放器，支持富文本剧情简介与同屏多列相关推荐。
  * 🖼️ **画廊图集**：4:3 网格画廊与大图瀑布流展厅。
  * 📖 **小说阅读**：沉浸式纯净阅读器体验。
* 🎨 **极致现代 UI 设计**：基于 Vue 3 + Tailwind CSS 构建，拥有 HSL 深色模式、毛玻璃视觉特效（Glassmorphism）与 60FPS 粒子动态背景。
* 📦 **规范 Monorepo 架构**：使用 `npm workspaces` 管理 `web`（前端）与 `server`（后端 API）子项目，支持一键并发启动与统一构建。
* 📋 **极简生态管理**：支持规则纯前端 LocalStorage 存储、一键导入/导出（支持 JSON 文件与剪贴板一键复制），以及内置 Monaco Code Editor 实时调试与测试。

---

## 📁 目录结构

```text
flux-view/
├── web/                   # Vue 3 + Vite 网页前端
│   ├── src/
│   │   ├── components/    # 粒子背景、ArtPlayer 播放器等公用组件
│   │   ├── utils/         # ruleService 规则存储与核心解析器
│   │   └── views/         # 首页、发现页、搜索、详情页与规则编辑器
│   └── package.json
├── server/                # Hono.js 后端 API 服务
│   ├── src/               # Hono 路由与规则沙箱执行器
│   └── package.json
├── package.json           # Monorepo 根节点 Workspace 配置文件
└── .gitignore             # 统一的 Git 忽略规则
```

---

## 🚀 快速开始

### 准备工作
* **Node.js** >= 20.0.0
* **npm** >= 10.0.0

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/flux-view.git
cd flux-view

# 2. 安装根目录及所有工作区依赖
npm install

# 3. 同时启动前端与后端开发服务
npm run dev
```

启动成功后：
* **前端 Web 界面**：`http://localhost:5173`
* **后端 API 服务**：`http://localhost:3000`

---

## ⚙️ 常用脚本命令

| 命令 | 描述 |
| :--- | :--- |
| `npm run dev` | 并发启动前端 Web (`web`) 和后端 API (`server`) 开发服务器 |
| `npm run dev:web` | 仅启动前端 Vite 开发服务器 |
| `npm run dev:server` | 仅启动后端 Hono API 开发服务器 |
| `npm run build` | 依次编译构建 `server` 与 `web` 生产环境 bundle |
| `npm run build:web` | 仅编译前端 Web |
| `npm run build:server` | 仅编译后端 Server |

---

## 📜 规则脚本规范简述

FluxView 的规则基于 ES6 异步函数，在安全的 VM 沙箱中执行，内置支持 `axios` 与 `cheerio`：

```javascript
// 示例：发现页解析规则脚本
export default async () => {
  const res = await axios.get('https://example.com/api/list');
  const $ = cheerio.load(res.data);
  
  const list = [];
  $('.item').each((i, el) => {
    list.push({
      title: $(el).find('.title').text().trim(),
      cover: $(el).find('img').attr('src'),
      href: $(el).find('a').attr('href')
    });
  });

  return list;
}
```

---

## 📄 开源协议

[MIT License](LICENSE) © 2026 FluxView Team
