# TECH DESIGN — 个人作品集网站（含后台管理）
# Technical Design Document — Zero-Build Static SPA

| 项目 | 内容 |
| --- | --- |
| 版本 Version | v1.0.0 |
| 架构类型 Architecture | 纯客户端静态 SPA（Client-side only static SPA） |
| 运行时 Runtime | 浏览器（无 Node 服务端） |
| 样式方案 Styling | Tailwind CSS Play CDN + 自定义 CSS Tokens |
| 持久化 Persistence | `localStorage`（键：`portfolio.data.v1`） |
| 部署 Deployment | Cloudflare Pages / Vercel / GitHub Pages / 任意静态服务器 |
| 关联文档 Related | `PRD.md`, `AGENTS.md`, `README.md` |

---

## 1. 概述与约束 / Overview & Constraints

### 1.1 设计目标
1. **零构建**：仓库即产物，`git push` 后托管平台直接发布，无需 `npm install` / `npm run build`。
2. **无后端**：内容编辑与读取全部在浏览器完成，降低运维成本。
3. **模块清晰**：数据层、渲染层、动画引擎、页面脚本职责分离，便于 AI/人类维护。
4. **视觉有辨识度**：深空星野 + 霓虹渐变 + 玻璃拟态。
5. **健壮**：任何损坏数据、缺失字段、非法 URL、localStorage 异常都不能导致白屏。

### 1.2 硬性约束
- 仅允许 HTML5 + ES6+ + CSS；禁止 React/Vue/构建工具/包管理器依赖。
- 唯一外部资源为 Tailwind Play CDN；断网时核心内容仍可读。
- 所有资源使用相对路径，支持部署到域名根目录或子路径。
- 不使用 `eval`、`new Function`、动态远程脚本。
- 不使用 Cookie、不收集任何访客数据。

---

## 2. 架构总览 / Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│                                                              │
│  index.html                         admin.html               │
│  ├─ starfield.js  (Canvas 引擎)      ├─ admin.js (表单/校验)  │
│  ├─ index.js      (首页渲染)         │                        │
│  └──────────────┬────────────────────┘                        │
│                 │                                            │
│           store.js  (唯一数据契约层)                           │
│                 │                                            │
│        localStorage["portfolio.data.v1"]                     │
│                 │                                            │
│      storage event ──► 跨标签页同步                            │
└──────────────────────────────────────────────────────────────┘
                  │
                  ▼
        Static Hosting (Cloudflare Pages / Vercel)
        - 无服务端逻辑，仅静态文件分发 + CDN
```

### 2.1 分层职责
| 层 Layer | 文件 | 职责 | 禁止 |
| --- | --- | --- | --- |
| 数据契约 Data | `assets/js/store.js` | 默认值、规范化、读取、保存、重置、订阅、URL/HTML 安全工具 | 操作 DOM、发起网络请求 |
| 动画 Animation | `assets/js/starfield.js` | Canvas 星空渲染、尺寸适配、生命周期 | 读写 localStorage、修改业务 DOM |
| 首页渲染 View | `assets/js/index.js` | 读取数据并渲染 Hero/About/Skills/Projects、导航交互 | 直接写 localStorage、硬编码业务数据 |
| 后台逻辑 Admin | `assets/js/admin.js` | 表单回填、收集、校验、保存/重置/导入导出、预览 | 绕过 store 直接写 localStorage |
| 结构 Structure | `index.html`, `admin.html` | 语义化骨架、静态文案、CDN 引入 | 内联大段业务 JS |

### 2.2 关键设计决策 / ADRs

| ADR | 决策 | 备选方案 | 理由 |
| --- | --- | --- | --- |
| ADR-01 | 原生 ES6 + 经典 `<script>` | ES Modules / 框架 | `file://` 下 ES Module 受 CORS 限制；经典脚本可直接双击打开，且零构建 |
| ADR-02 | Tailwind Play CDN | 手写全部 CSS / 预编译 Tailwind | 满足“零构建”；自定义 CSS 兜底关键样式 |
| ADR-03 | localStorage | IndexedDB / URL 参数 / 后端 | 同步 API、容量足够存文本；IndexedDB 对此规模过重 |
| ADR-04 | 单一存储键 + `schemaVersion` | 多键分散存储 | 原子写入、易于导入导出与迁移 |
| ADR-05 | 规范化（normalize）在读写两侧执行 | 只信存储内容 | 防止历史脏数据/手工篡改导致渲染崩溃 |
| ADR-06 | DOM API + `textContent` 渲染用户数据 | 模板字符串 + innerHTML | 从根上消除 XSS；仅静态图标使用 innerHTML |
| ADR-07 | Canvas 2D 而非 WebGL | WebGL / CSS 粒子 | 兼容性最好、代码量小、星空效果足够 |
| ADR-08 | 单页锚点导航 | 多页路由 | 静态托管零配置，无 404 回退问题 |

---

## 3. 文件结构 / File Structure

```text
personal-portfolio/
├── index.html                  # 首页（Hero/About/Skills/Projects/Contact）
├── admin.html                  # 后台管理控制台
├── assets/
│   ├── js/
│   │   ├── store.js            # 数据契约 + 持久化 + 安全工具（经典脚本）
│   │   ├── starfield.js        # Canvas 星空引擎
│   │   ├── index.js            # 首页渲染与交互
│   │   └── admin.js            # 后台表单逻辑
│   └── css/
│       └── theme.css           # 主题 Tokens、组件样式、动效、无障碍降级
├── PRD.md                      # 产品需求文档
├── TECH_DESIGN.md              # 技术设计文档（本文）
├── AGENTS.md                   # AI 代理编码规范
├── README.md                   # 使用与部署说明
├── NOTES.md                    # 项目笔记（决策/验证记录）
└── PITFALLS.md                 # 踩坑与规避清单
```

> 所有页面使用**相对路径**（`./assets/...`, `./admin.html`），因此可部署在 `https://example.com/portfolio/` 这类子路径下。

---

## 4. 数据层设计 / Data Layer

### 4.1 存储契约
- Key：`portfolio.data.v1`
- Value：JSON 字符串（UTF-8）
- 版本字段：`schemaVersion: 1`
- 写入时机：仅后台“保存并应用”/“导入”/“恢复默认”触发。
- 读取时机：页面加载、`storage` 事件、后台保存后。

### 4.2 默认数据
默认数据内置于 `store.js` 的 `DEFAULT_DATA` 常量中，包含：
- `profile`：姓名、英文名、头衔、英文头衔、头像、简介、地点、邮箱、状态、社交链接。
- `skills`：12 项，覆盖前端/后端/工具/设计四类。
- `projects`：4 个示例项目。
- `meta.updatedAt`：初始为 `null`。

> 默认值必须始终是**合法且可渲染**的，因为它是所有异常路径的最终兜底。

### 4.3 读取流水线 / Read Pipeline

```text
localStorage.getItem(KEY)
        │
        ├─ 不存在 / 读取抛错 ──────────────► clone(DEFAULT_DATA)
        │
        └─ JSON.parse
                │
                ├─ 解析失败 ─────────────────► clone(DEFAULT_DATA)
                │
                └─ normalize(parsed)
                        │
                        ├─ 字段缺失 → 补默认
                        ├─ 类型错误 → 强制转换或丢弃
                        ├─ 数组超限 → 截断
                        ├─ 数值越界 → clamp
                        ├─ URL 非法 → 置空
                        └─ 未知字段 → 丢弃
                        │
                        ▼
                返回深拷贝（调用方无法污染默认值）
```

### 4.4 规范化规则 / Normalization Rules
| 类型 | 规则 |
| --- | --- |
| string | 非字符串→默认值；`trim()`；按字段 `maxLen` 截断；保留空字符串（允许用户清空） |
| number | `Number()` 后 `Number.isFinite` 检查；`Math.round` + clamp |
| boolean | `=== true` 或 `Boolean()` 严格转换 |
| array | 非数组→默认数组；过滤非法项；上限截断 |
| URL | 见 §9.2 协议白名单 |
| email | 基本正则 `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`，非法→空串 |

### 4.5 写入流水线 / Write Pipeline
```text
admin.collect() → validate() → store.normalize() → JSON.stringify
    → localStorage.setItem
    → 更新 meta.updatedAt
    → dispatch CustomEvent("portfolio:datachange")
    → 其他标签页收到 storage 事件
```

失败处理：
- `QuotaExceededError`：抛出带用户可读文案的错误（“存储空间不足，建议使用图片 URL 而非 base64”）。
- localStorage 被禁用：抛出错误，后台 Toast 提示，表单数据保留在内存中不丢失。

### 4.6 订阅机制 / Subscription
```js
PortfolioStore.subscribe(callback)
```
内部同时监听：
- 自定义事件 `portfolio:datachange`（同文档内保存）
- `window.storage`（跨标签页；`event.key === STORAGE_KEY` 时触发）

回调参数为**最新规范化数据**，订阅方无需再次读取。

### 4.7 版本迁移 / Versioning
- `schemaVersion` 与 `DEFAULT_DATA.schemaVersion` 比较。
- 当前策略：未来版本在 `normalize()` 中按版本追加迁移函数；旧字段可映射则映射，否则丢弃。
- 由于未识别字段被丢弃，**新增字段必须同时提供默认值**，保证旧数据可升级。

---

## 5. 渲染层设计 / Rendering

### 5.1 首页 `index.js`
启动流程：
```text
DOMContentLoaded（defer 脚本天然在解析后执行）
  ├─ PortfolioStore.load()
  ├─ renderProfile(profile)
  ├─ renderSkills(skills)
  ├─ renderProjects(projects)
  ├─ updateStats(data)
  ├─ setupNav() / setupReveal() / setupSkillBars()
  ├─ new Starfield(canvas)
  └─ PortfolioStore.subscribe(renderAll)
```

渲染原则：
1. **文本**：`element.textContent = value`，永不拼接 HTML。
2. **属性**：`setAttribute` / `element.href = sanitizedUrl`。
3. **静态图标**：仅常量 SVG 字符串可用 `innerHTML`。
4. **列表**：先 `replaceChildren()` 清空，再 `append` 新节点，避免残留。
5. **幂等**：重复渲染不重复绑定事件（事件只在初始化绑定一次，使用委托）。

### 5.2 技能分组
```js
const groups = new Map();
for (const skill of skills) {
  if (!groups.has(skill.category)) groups.set(skill.category, []);
  groups.get(skill.category).push(skill);
}
```
`Map` 保留插入顺序 → 分类顺序即数据顺序。每个分类卡包含若干进度条。

进度条动效：
- 初始 `width: 0`；
- `IntersectionObserver`（threshold 0.3, once）触发后写入目标宽度；
- `prefers-reduced-motion` 时直接写入，无过渡；
- 同时更新 `aria-valuenow`。

### 5.3 头像回退链
```text
avatarUrl 非空且通过安全校验
   ├─ <img> 加载成功 → 显示图片
   └─ onerror → 隐藏 img，显示首字母/首字
avatarUrl 为空 → 直接显示首字母/首字
```
首字计算：英文名按空格取首字母（最多 2 个），否则取中文姓名首字。

### 5.4 后台 `admin.js`
状态机：
```text
[pristine] --input--> [dirty] --save success--> [pristine]
                         │
                         ├─ validate fail → [dirty] + error panel
                         └─ reset confirm → [pristine] + defaults
```
- `dirty` 状态驱动固定操作栏提示与 `beforeunload` 拦截。
- 表单使用 `<template>` 克隆动态行，避免字符串拼接。
- 实时预览：`input` 事件 → 更新头像/姓名/头衔（防抖 120 ms，头像加载防抖 250 ms）。

---

## 6. Canvas 星空引擎 / Starfield Engine

### 6.1 目标
- 视觉：深空、微光、闪烁、缓慢漂移、偶发流星、指针视差。
- 性能：中端手机 ≥ 30 FPS；页面隐藏时 0 CPU；DPR 清晰但不浪费。
- 降级：`prefers-reduced-motion` 渲染一帧静态星空。

### 6.2 数据结构
```js
star = {
  x, y,            // CSS 像素坐标
  r,               // 半径 0.4–1.8
  baseAlpha,       // 0.25–1
  phase,           // 闪烁相位
  speed,           // 角速度 rad/ms
  driftX, driftY,  // 缓慢漂移
  depth,           // 0.3–1，用于视差幅度
  color            // 白 / 青 / 紫
}
```

### 6.3 主循环
```text
requestAnimationFrame(loop)
  ├─ dt = min(now - last, 50)          // 防止切回标签页时跳变
  ├─ clearRect(0,0,w,h)
  ├─ 更新视差偏移（lerp 到指针目标）
  ├─ for star in stars:
  │     phase += speed * dt
  │     alpha = baseAlpha * (0.55 + 0.45 * sin(phase))
  │     x += driftX * dt; y += driftY * dt
  │     边界环绕（wrap）
  │     drawCircle(x + parallax * depth, y + parallax * depth)
  ├─ 绘制预计算星座连线（低透明度）
  ├─ 更新并绘制流星
  └─ schedule next frame
```

### 6.4 星数自适应
```js
count = clamp(round(width * height / 14000), 60, 220)
```
- 1080p ≈ 148 颗；手机 ≈ 60–70 颗。
- 连线：构建时一次性计算近距离星对，最多 60 对，避免每帧 O(n²)。

### 6.5 清晰度与尺寸
```js
dpr = min(window.devicePixelRatio || 1, 2)
canvas.width  = cssWidth  * dpr
canvas.height = cssHeight * dpr
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
```
- 使用 `ResizeObserver`（不可用时回退 `resize` 事件）+ rAF 去抖。
- 尺寸变化时重建星星，避免坐标错位。

### 6.6 生命周期
| 事件 | 行为 |
| --- | --- |
| `visibilitychange` 隐藏 | `cancelAnimationFrame`，停止循环 |
| `visibilitychange` 可见 | 重置 `last`，恢复循环 |
| `prefers-reduced-motion` | 只绘制一次静态帧，不注册 rAF |
| `destroy()` | 移除监听、取消 rAF、清空 canvas |

### 6.7 性能预算
| 项目 | 预算 |
| --- | --- |
| 每帧星数 | ≤ 220 |
| 每帧绘制调用 | ≤ 300（星点 + 连线 + 流星） |
| 单帧耗时（中端手机） | ≤ 8 ms |
| 内存 | < 5 MB |

> 禁止逐星使用 `shadowBlur`（极慢）；辉光通过低透明度外层圆或 CSS 背景实现。

---

## 7. 样式系统 / Styling

### 7.1 双层策略
1. **Tailwind Play CDN**：布局、间距、排版、颜色工具类，承担 80% 样式。
2. **`assets/css/theme.css`**：设计 Tokens、复杂组件（头像光环、进度条、玻璃卡）、动画、`prefers-reduced-motion`、Tailwind 不可用时的关键兜底。

### 7.2 主题 Tokens
```css
:root {
  --bg: #05060f;
  --surface: rgba(15, 23, 42, 0.55);
  --border: rgba(255, 255, 255, 0.10);
  --cyan: #22d3ee;
  --violet: #a855f7;
  --pink: #f472b6;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --radius-card: 20px;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 7.3 关键视觉效果
- **Aurora 光晕**：多个 radial-gradient 叠加，24 s 缓慢位移。
- **玻璃卡**：`background: var(--surface); backdrop-filter: blur(14px); border: 1px solid var(--border)`。
- **渐变文字**：`background-clip: text; color: transparent`。
- **头像光环**：conic-gradient 圆环 + 14 s 旋转；内层为深色圆形容器。
- **进度条**：8 px 高，青→紫→粉渐变，`transition: width 1.2s var(--ease-out)`。

### 7.4 动效规范
| 动效 | 时长 | 缓动 |
| --- | --- | --- |
| 入场 reveal | 700 ms | ease-out |
| 进度条 | 1200 ms | cubic-bezier(.22,1,.36,1) |
| 卡片 hover | 250 ms | ease |
| 导航高亮 | 200 ms | ease |
| 头像光环旋转 | 14 s | linear |
| 流星 | 900 ms | linear |

`@media (prefers-reduced-motion: reduce)` 下：关闭所有动画与过渡，星空静态，进度条直出。

---

## 8. 交互设计 / Interactions

| 交互 | 行为 | 可访问性 |
| --- | --- | --- |
| 导航点击 | 锚点平滑滚动，考虑固定头部偏移（`scroll-margin-top`） | `<a href="#id">`，键盘可达 |
| 滚动高亮 | IntersectionObserver 监听区块，更新 `aria-current` | 视觉 + 语义同步 |
| 移动菜单 | 切换 `hidden`，更新 `aria-expanded`；Esc/点击链接关闭 | 按钮带 `aria-controls` |
| 技能进入视口 | 进度条动画 | `role="progressbar"` + `aria-valuenow` |
| 后台保存 | 校验 → 写入 → Toast → 更新时间 | 错误列表 `role="alert"` |
| 恢复默认 | `<dialog>` 二次确认 | 原生焦点管理 + Esc 关闭 |
| 导入 JSON | 文件选择 → 大小/解析校验 → 规范化写入 | 错误提示可读 |
| 未保存离开 | `beforeunload` 提示 | 浏览器原生对话框 |

---

## 9. 安全设计 / Security

### 9.1 信任边界
> **localStorage 中的数据一律视为不可信输入。**
> 它可能来自：用户手工编辑、导入的 JSON、旧版本遗留、同源其他脚本。

### 9.2 URL 协议白名单
允许：
- `https://...`
- `http://...`
- `data:image/png|jpeg|jpg|gif|webp;base64,...`（仅头像，仅光栅格式）
- 相对路径：`./...`、`../...`、`/...`、`assets/...`
- 可选：`mailto:`（仅邮箱字段，由代码拼接，不接受用户原始 `mailto:`）

拒绝：`javascript:`、`vbscript:`、`data:text/html`、`data:image/svg+xml`、`file:`、`blob:`、`about:`、协议相对 `//evil.com`、反斜杠路径 `\/evil.com`、空白/控制字符。

实现要点：
```js
const s = String(raw).trim().replace(/[\u0000-\u001F\u007F]/g, '');
if (!s || s.length > 2048) return '';
if (/^[\\/]{2}/.test(s)) return '';              // //evil.com, \\\\evil.com
if (/^https?:\/\//i.test(s)) {                   // absolute http(s) only
  const u = new URL(s);
  return u.hostname && /^https?:$/.test(u.protocol) ? u.href : '';
}
if (/^data:/i.test(s)) {
  if (!allowDataImage) return '';
  return /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(s) ? s : '';
}
if (/^(?:\.{1,2}\/|\/|assets\/)/.test(s) && !/[\s<>"'`\\]/.test(s)) return s;
return '';
```
> 注意：
> - `//evil.com` 属于协议相对外链，明确拒绝。
> - 相对路径中的反斜杠一律拒绝，因为浏览器可能把 `/\evil.com` 规范化成 `//evil.com`。
> - SVG data URL 被排除，避免历史解析器差异；外链 SVG 图片在 `<img>` 上下文中不执行脚本。

### 9.3 XSS 防护
- 用户数据渲染只使用 `textContent` / `setAttribute`。
- 静态 SVG 图标为代码常量，不含用户输入。
- 不使用 `innerHTML` 拼接姓名、简介、项目描述、标签、URL。
- 不引入 `eval` / `new Function` / 远程脚本。
- CSP 建议（可选，部署时在响应头添加）：
  ```text
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self';
  ```
  > Tailwind Play CDN 需要 `unsafe-inline`（运行时注入样式），这是 CDN 方案的已知代价。

### 9.4 隐私
- 无 Cookie、无埋点、无第三方字体/统计。
- 头像若使用外链，浏览器会向该域名发起请求（用户自行选择）。
- 所有内容仅存于用户本地浏览器。

### 9.5 已知安全局限
`admin.html` **没有真实鉴权**。任何能打开页面的人都可以修改**自己浏览器**中的数据，但无法影响其他访客（数据不共享）。若未来需要真实权限，必须引入服务端与身份认证（见 §15）。

---

## 10. 性能设计 / Performance

| 优化点 | 做法 | 预期收益 |
| --- | --- | --- |
| 零打包 | 直接加载 4 个小 JS 文件 | 无构建开销，缓存粒度细 |
| 脚本顺序 | `defer`，不阻塞解析 | 更快首屏 |
| Canvas 星数 | 面积自适应 + 封顶 | 移动端稳定帧率 |
| DPR 封顶 | 最大 2 | 避免 3x 屏 9 倍像素填充 |
| 隐藏暂停 | `visibilitychange` | 后台标签页 0 CPU |
| 事件节流 | resize/pointer 用 rAF 合并 | 减少布局抖动 |
| 动画触发 | IntersectionObserver | 只渲染可见内容 |
| 图片 | `loading="lazy"` + `decoding="async"` | 减少首屏带宽 |
| 无阻塞字体 | 系统字体栈 | 无 FOIT/FOUT |
| 图标 | 内联 SVG | 无额外请求 |

性能预算：
- HTML ≤ 30 KB/页
- CSS（自定义）≤ 15 KB
- JS 合计 ≤ 60 KB（未压缩）
- 首屏请求数：2 HTML/JS + 1 CDN + 0 图片（默认无头像外链）

---

## 11. 可访问性 / Accessibility

| 要求 | 实现 |
| --- | --- |
| 语义化 | `<header> <nav> <main> <section> <article> <footer>` |
| 跳转链接 | 首个可聚焦元素 “跳到主要内容” |
| 键盘 | 所有交互元素为原生 `<a>/<button>/<input>`；可见 `:focus-visible` |
| 图片 | 头像 `alt` 使用姓名；装饰性 Canvas `aria-hidden="true"` |
| 进度条 | `role="progressbar"` + `aria-valuemin/max/now` + `aria-label` |
| 动态区域 | Toast `role="status" aria-live="polite"`；错误 `role="alert"` |
| 对比度 | 正文 `#e2e8f0` on `#05060f` ≈ 15:1；次文本 `#94a3b8` ≈ 6:1 |
| 减少动效 | 全站 `prefers-reduced-motion` 降级 |
| 表单 | 每个输入有 `<label>` 或 `aria-label`；错误信息关联 `aria-describedby` |
| 语言 | `<html lang="zh-CN">`；英文片段可加 `lang="en"` |

---

## 12. 浏览器兼容 / Compatibility

| 浏览器 | 最低版本 | 说明 |
| --- | --- | --- |
| Chrome / Edge | 100+ | 完整支持 |
| Firefox | 100+ | 完整支持 |
| Safari / iOS Safari | 15.4+ | `dialog`, `backdrop-filter`, `:focus-visible` |
| Android Chrome | 100+ | 完整支持 |

降级策略：
- `ResizeObserver` 不存在 → `window.resize`。
- `IntersectionObserver` 不存在 → 立即显示/直接设置进度条。
- `dialog.showModal` 不存在 → 回退 `window.confirm`。
- `backdrop-filter` 不支持 → 提高卡片背景不透明度，保证可读。
- `structuredClone` 不使用，改用 `JSON.parse(JSON.stringify())`。

---

## 13. 部署 / Deployment

### 13.1 本地预览（推荐）
```bash
# 任选其一，必须通过 HTTP 访问以保证 localStorage 行为一致
python -m http.server 8080
npx serve .
php -S localhost:8080
```
访问 `http://localhost:8080/`。直接双击 `index.html`（`file://`）也能运行，但部分浏览器对 `file://` 的 localStorage 行为不一致，仅建议快速预览。

### 13.2 Cloudflare Pages
1. 将仓库推送到 GitHub/GitLab。
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git。
3. 配置：
   - **Framework preset**：`None`
   - **Build command**：留空
   - **Build output directory**：`/`（仓库根目录）
4. Deploy。后续每次 push 自动发布。

> 也可使用 Direct Upload：把整个目录拖入 Pages 上传界面。

### 13.3 Vercel
1. Import Git Repository。
2. Framework Preset：`Other`。
3. Build Command：留空；Output Directory：`.`（或留空）。
4. Deploy。

或使用 CLI：
```bash
npx vercel --prod
```

### 13.4 GitHub Pages
- Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`。
- 若部署在子路径（`user.github.io/repo/`），本项目的相对路径可直接工作。

### 13.5 缓存建议
| 资源 | Cache-Control |
| --- | --- |
| `*.html` | `no-cache`（保证内容更新可见） |
| `assets/js/*.js` | `public, max-age=3600`（可加版本查询串） |
| 图片 | `public, max-age=86400` |

> 由于数据在浏览器端，HTML/JS 更新后用户的**自定义数据不会丢失**（存储键独立于代码）。

---

## 14. 测试策略 / Testing

### 14.1 静态检查
```bash
node --check assets/js/store.js
node --check assets/js/starfield.js
node --check assets/js/index.js
node --check assets/js/admin.js
```

### 14.2 ID 契约检查
脚本扫描 `index.js` / `admin.js` 中 `getElementById('...')` 的目标，确认在对应 HTML 中存在，防止空引用。

### 14.3 手动测试矩阵
| 场景 | 步骤 | 期望 |
| --- | --- | --- |
| 首次访问 | 清空 localStorage 后打开首页 | 默认内容完整，无 Console 错误 |
| 保存 | 后台改姓名 → 保存 → 首页 | 新姓名出现 |
| 校验 | 清空姓名 → 保存 | 阻止 + 错误提示 |
| 重置 | 保存后重置 | 恢复默认 |
| URL 安全 | 输入 `javascript:alert(1)` | 拒绝并提示 |
| 头像失败 | 填无效图片 URL | 首字回退 |
| 响应式 | 360/768/1280/1920 | 无横向滚动 |
| 减少动效 | 系统开启 reduce motion | 无动画，内容完整 |
| 断网 | 禁用网络后访问 | 内容可读，无报错 |
| 跨标签 | 两个标签同时打开 | 保存后另一个同步 |

### 14.4 已知不可自动化项
Canvas 视觉与动画帧率需人工/浏览器工具评估；本项目不引入 Playwright 以保持零依赖。

---

## 15. 未来演进 / Future Work

1. **接入后端**：Cloudflare Workers / Supabase / Firebase，实现真正的远程内容与鉴权。
2. **图片上传**：对象存储（R2/S3）+ CDN，替代 data URL。
3. **Markdown 项目详情页**：`project.html?id=` + 客户端渲染。
4. **多语言**：i18n 字典 + `lang` 切换。
5. **内容版本历史**：localStorage 保存最近 N 个快照，支持回滚。
6. **CI**：HTML/JS lint、链接检查、Lighthouse CI。
7. **真实 SEO**：静态生成每个项目的 HTML 或使用托管平台预渲染。

---

## 16. 风险登记 / Risk Register

| ID | 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- | --- |
| R-01 | localStorage 配额不足（大头像 base64） | 中 | 保存失败 | 错误提示 + 建议使用图片 URL；限制导入文件 1 MB |
| R-02 | Tailwind CDN 被墙/超时 | 中 | 样式缺失 | 自定义 CSS 兜底关键布局 |
| R-03 | 用户导入恶意 JSON | 低 | XSS | 全量规范化 + 协议白名单 + textContent |
| R-04 | Canvas 低端机掉帧 | 中 | 体验下降 | 星数封顶、DPR 封顶、静态降级 |
| R-05 | 数据与代码版本不匹配 | 低 | 渲染异常 | schemaVersion + 规范化 + 默认兜底 |
| R-06 | 第三方头像防盗链 | 低 | 破图 | onerror 回退首字 |

---

## 17. 附录：模块 API / Appendix — Module API

### 17.1 `window.PortfolioStore`
| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `STORAGE_KEY` | `string` | `"portfolio.data.v1"` |
| `SCHEMA_VERSION` | `number` | `1` |
| `defaults()` | `() => Data` | 返回默认数据深拷贝 |
| `load()` | `() => Data` | 读取 + 规范化；异常回退默认 |
| `save(data)` | `(Data) => Data` | 规范化 + 写入 + 广播；失败抛错 |
| `reset()` | `() => Data` | 删除存储 + 广播；返回默认数据 |
| `normalize(raw)` | `(any) => Data` | 纯函数，导入时复用 |
| `subscribe(fn)` | `(fn) => () => void` | 订阅变化，返回取消函数 |
| `escapeHtml(s)` | `(string) => string` | 转义 `& < > " '` |
| `safeUrl(raw, opts)` | `(any, object) => string` | 返回安全 URL 或 `''` |
| `isSafeUrl(raw, opts)` | `(any, object) => boolean` | 校验用 |
| `storageAvailable()` | `() => boolean` | 探测 localStorage |

### 17.2 `window.Starfield`
```js
const engine = new Starfield(canvasElement, {
  maxStars: 220,
  shootingStars: true,
  parallax: true
});
engine.destroy();
```

### 17.3 存储事件
| 事件名 | 触发时机 | `detail` |
| --- | --- | --- |
| `portfolio:datachange` | 同文档内 `save()` / `reset()` | `{ data, source: 'save' \| 'reset' }` |
| `storage`（原生） | 其他标签页写入同 key | `event.newValue` |
