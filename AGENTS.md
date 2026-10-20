# AGENTS.md — AI 代理编码规范
# Coding Rules & Guidelines for AI Agents

> 本文件是**强制性**约束。任何 AI 代理（Claude、GPT、Copilot、Cursor 等）在修改本仓库前必须先完整阅读本文件、`PRD.md`、`TECH_DESIGN.md` 与 `PITFALLS.md`。
> This file is **normative**. Any AI agent must read it plus `PRD.md`, `TECH_DESIGN.md`, and `PITFALLS.md` before editing.

---

## 1. 项目身份 / Project Identity

| 项 | 值 |
| --- | --- |
| 名称 | Starlit Portfolio（星海作品集） |
| 类型 | 纯静态、零构建的个人作品集 + 本地后台 |
| 视觉主题 | 深空星野 + 霓虹渐变 + 玻璃拟态（Dark Neon Starfield） |
| 核心文件 | `index.html`, `admin.html`, `assets/js/*.js`, `assets/css/theme.css` |
| 数据源 | `localStorage["portfolio.data.v1"]`（唯一真相来源） |
| 部署 | Cloudflare Pages / Vercel / GitHub Pages，无构建命令 |

---

## 2. 不可违反的规则 / Non-Negotiable Rules

### R1 — 零构建依赖 / Zero Build
- ❌ 不创建 `package.json`、`node_modules`、`vite.config.*`、`webpack.config.*`。
- ❌ 不引入 npm 包、PostCSS、Sass、TypeScript 编译步骤。
- ❌ 不要求 `npm install` / `npm run build` 才能运行。
- ✅ 只允许 CDN：Tailwind Play CDN（`https://cdn.tailwindcss.com`）。
- ✅ 允许原生 ES6+、HTML5、CSS3。

> 若某需求必须引入构建链，**停止并询问用户**，不要擅自改变项目形态。

### R2 — 数据契约唯一 / Single Source of Truth
- 所有读写必须经过 `assets/js/store.js`。
- ❌ 页面脚本禁止直接 `localStorage.setItem/getItem`。
- ❌ 禁止硬编码业务数据到 `index.js` / `admin.js`（默认值只存在于 `store.js`）。
- ✅ 新增字段必须同时更新：`DEFAULT_DATA`、`normalize()`、`PRD.md` 数据模型、后台表单、首页渲染（如适用）。

### R3 — 安全渲染 / Safe Rendering
- ❌ 禁止 `innerHTML` 拼接任何用户数据（姓名、简介、项目、标签、URL）。
- ✅ 文本用 `textContent`；属性用 `setAttribute` / 属性赋值。
- ✅ 静态 SVG 图标常量可用 `innerHTML`，但不得包含变量。
- ✅ 所有 URL 必须经过 `PortfolioStore.safeUrl()`。
- ❌ 禁止 `eval`、`new Function`、`document.write`、远程脚本注入。
- ❌ 禁止 `javascript:`、`vbscript:`、`data:text/html`、`file:`、`blob:` 链接。

### R4 — 健壮性 / Fail-Safe
- 任何 localStorage 异常、JSON 损坏、字段缺失、图片失败都**不得白屏**。
- 读取失败 → 默认数据；保存失败 → 明确提示，内存数据不丢。
- 新代码必须考虑 `null`、`undefined`、空数组、超长字符串、越界数字。

### R5 — 主题一致 / Theme Consistency
- 严格使用 Tokens：背景 `#05060f`、青 `#22d3ee`、紫 `#a855f7`、粉 `#f472b6`。
- 新组件必须复用 `.glass-card`、`.btn-primary`、`.btn-ghost`、`.section-title` 等既有类。
- ❌ 禁止引入亮色背景、圆角小于 8 px 的卡片、默认蓝色链接。
- ✅ 动效克制：150–1200 ms，禁止弹跳/旋转超过 1 圈的装饰动画（头像光环除外）。

### R6 — 可访问性 / Accessibility
- 交互元素必须是原生 `<a>` / `<button>` / `<input>`。
- 必须有可见 `:focus-visible` 样式。
- 图片必须有 `alt`；装饰元素 `aria-hidden="true"`。
- 动态提示使用 `role="status"` / `role="alert"`。
- 必须尊重 `prefers-reduced-motion`。

### R7 — 响应式 / Responsive
- 移动优先，最小支持宽度 360 px。
- 任何断点不得出现横向滚动。
- 触摸目标 ≥ 44×44 px。
- 新增布局必须在 360 / 768 / 1280 / 1920 px 下自检。

### R8 — 相对路径 / Relative Paths
- 所有资源引用使用 `./` 或 `../`，禁止以 `/` 开头的绝对路径。
- 保证子路径部署（如 `example.com/portfolio/`）可用。

### R9 — 性能 / Performance
- 新增 JS 单文件 ≤ 20 KB（未压缩）。
- 禁止在滚动/鼠标事件中执行重布局；使用 rAF 合并。
- 禁止逐帧创建对象/数组（星空中除外，且需预分配）。
- Canvas 星数 ≤ 220，DPR ≤ 2。

### R10 — 文档同步 / Docs in Sync
修改行为后必须同步更新：
- `PRD.md`（若需求/验收变化）
- `TECH_DESIGN.md`（若架构/数据/算法变化）
- `README.md`（若使用/部署方式变化）
- `NOTES.md`（记录决策）
- `PITFALLS.md`（记录新踩的坑）

---

## 3. 文件职责 / File Responsibilities

| 文件 | 可以做什么 | 绝对不要做什么 |
| --- | --- | --- |
| `assets/js/store.js` | 默认值、规范化、读写、订阅、URL/HTML 工具 | DOM 操作、动画、网络请求 |
| `assets/js/starfield.js` | Canvas 绘制、尺寸、生命周期 | 业务数据、localStorage、修改页面文本 |
| `assets/js/index.js` | 读取 store、渲染首页、导航/滚动交互 | 直接写存储、定义默认业务数据 |
| `assets/js/admin.js` | 表单回填/收集/校验、预览、导入导出 UI | 绕过 store 写存储、把校验逻辑复制进 HTML |
| `assets/css/theme.css` | Tokens、组件、动效、降级 | 覆盖 Tailwind 布局工具类的职责 |
| `index.html` | 语义化骨架、静态文案、CDN | 大段内联业务逻辑 |
| `admin.html` | 表单骨架、对话框、模板 | 内联 `onclick` 处理业务 |

---

## 4. 代码风格 / Code Style

### 4.1 JavaScript
- ES6+，但**不使用 ES Module**（保证 `file://` 可运行）；使用 IIFE 隔离作用域：
  ```js
  (function () {
    'use strict';
    // ...
  })();
  ```
- 2 空格缩进；单引号；语句结尾加分号。
- 命名：
  - 变量/函数：`camelCase`
  - 常量：`UPPER_SNAKE_CASE`
  - CSS 类：`kebab-case`
  - 数据字段：`camelCase`（与存储契约一致）
- 函数保持单一职责，超过 40 行考虑拆分。
- 优先早返回（early return），减少嵌套。
- 注释使用中文，解释**为什么**而非**是什么**；公共 API 用 JSDoc。

### 4.2 HTML
- 语义化标签优先；每个 `<section>` 有 `id` 与 `aria-labelledby`。
- 属性顺序：`id` → `class` → `data-*` → `aria-*` → 其他。
- 布尔属性不写值（`disabled` 而非 `disabled="true"`）。
- 表单控件必须有 `<label for>` 或 `aria-label`。
- 不使用内联 `style`（动态数值如进度条宽度除外）。

### 4.3 CSS
- 优先 Tailwind 工具类；复杂/复用组件写入 `theme.css`。
- 使用 CSS 变量，不重复硬编码颜色。
- 选择器扁平化，避免 `!important`（除非覆盖第三方）。
- 动画必须提供 `prefers-reduced-motion` 降级。

### 4.4 命名约定（数据）
```text
profile.name / profile.title / profile.avatarUrl
profile.socials.github / zhihu / bilibili / linkedin / website
skills[].name / category / level
projects[].title / description / tags / link / repo / featured
meta.updatedAt
```

---

## 5. 修改流程 / Workflow

### 5.1 开始前
1. 阅读 `PITFALLS.md`，确认不重复踩坑。
2. 阅读相关文件的完整实现，不要基于猜测修改。
3. 明确变更属于哪一层（数据/渲染/样式/文档）。

### 5.2 修改中
1. 小步修改，每次只解决一个问题。
2. 新增字段 → 先改 `store.js` 契约，再改 UI。
3. 新增交互 → 先保证键盘可用，再考虑鼠标。
4. 新增样式 → 先复用 Tokens/组件类。

### 5.3 完成后（Definition of Done）
- [ ] `node --check` 通过所有 JS 文件。
- [ ] 页面无 Console 错误。
- [ ] 360 / 768 / 1280 px 无横向滚动。
- [ ] 键盘可完成主要操作（导航、保存、重置）。
- [ ] 清空 localStorage 后仍正常显示默认内容。
- [ ] 损坏 JSON 时自动回退，不白屏。
- [ ] 非法 URL 被拒绝。
- [ ] `prefers-reduced-motion` 下无动画且内容完整。
- [ ] 文档已同步（PRD/TECH/README/NOTES/PITFALLS 按需）。
- [ ] 未新增任何构建依赖。

---

## 6. 常用命令 / Commands

```bash
# 语法检查
node --check assets/js/store.js
node --check assets/js/starfield.js
node --check assets/js/index.js
node --check assets/js/admin.js

# 本地静态服务（任选）
python -m http.server 8080
npx serve .
php -S localhost:8080

# 检查是否误引入依赖
ls package.json node_modules 2>/dev/null || echo "OK: zero dependencies"

# 检查绝对路径（应为空）
grep -rnE '(src|href)="/' index.html admin.html || echo "OK: relative paths"
```

---

## 7. 禁止事项速查 / Forbidden Cheat Sheet

| ❌ 禁止 | ✅ 替代 |
| --- | --- |
| `npm install` / 打包工具 | 原生脚本 + CDN |
| `innerHTML = userData` | `textContent` / DOM API |
| 直接读写 localStorage | `PortfolioStore.save/load` |
| 硬编码默认数据到页面 | 只放在 `store.js` |
| `onclick="..."` 内联事件 | `addEventListener` |
| 绝对路径 `/assets/...` | `./assets/...` |
| 无 `alt` 的图片 | `alt` + 失败回退 |
| 忽略减少动效 | `prefers-reduced-motion` |
| 静默吞异常 | 用户可见提示 + Console 记录 |
| 删除/重命名存储键 | 通过 `schemaVersion` 迁移 |
| 引入亮色主题 | 保持深空霓虹 Tokens |
| 修改后不更新文档 | 同步 PRD/TECH/NOTES |

---

## 8. 给 AI 的提示词模板 / Prompt Template

```text
你在维护 Starlit Portfolio（纯静态零构建作品集）。
先读：AGENTS.md → PITFALLS.md → TECH_DESIGN.md 相关章节。
约束：无构建、无 npm、数据只经 store.js、用户数据只走 textContent、
      相对路径、深空霓虹主题、可访问性、减少动效。
任务：<具体需求>
交付：修改文件清单 + 验证命令 + 手动测试点 + 文档更新说明。
```

---

## 9. 审查清单 / Review Checklist（提交前）

1. **正确性**：默认数据、边界值、空状态、异常路径是否覆盖？
2. **安全性**：是否新增了未净化的输出或 URL？
3. **一致性**：命名、主题、组件、文案语气是否统一？
4. **性能**：是否引入逐帧分配、布局抖动、超大资源？
5. **可访问性**：键盘、焦点、ARIA、对比度、减少动效？
6. **可维护性**：职责是否清晰？是否重复实现 store 的能力？
7. **文档**：是否需要更新？是否记录到 `NOTES.md`？
8. **零构建**：是否仍然 `ls package.json` 为空？

---

> **一句话原则 / One-line Principle**
> 任何修改都应让项目更接近：**打开即惊艳、后台即可改、断网不白屏、无依赖可部署。**
> Every change should move the project toward: **stunning on open, editable in admin, resilient offline, deployable with zero dependencies.**
