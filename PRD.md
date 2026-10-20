# PRD — 个人作品集网站（含后台管理）
# Product Requirements Document — Personal Portfolio with Admin Console

| 项目 Item | 内容 Content |
| --- | --- |
| 文档版本 Version | v1.0.0 |
| 状态 Status | Approved / Implemented |
| 产品代号 Codename | Starlit Portfolio（星海作品集） |
| 目标用户 Target | 王梦涵（计算机科学学生 / 求职与项目展示） |
| 技术形态 Form | 纯静态单页应用（SPA），零构建 |
| 关联文档 Related | `TECH_DESIGN.md`, `AGENTS.md`, `README.md` |

---

## 1. 背景与问题 / Background & Problem

### 1.1 背景
王梦涵是一名计算机科学专业学生，需要一个可以长期维护、能体现工程审美与技术能力的个人主页，用于：
- 求职投递时作为简历的补充材料（作品、技能、联系方式）；
- 课程/竞赛/开源项目的集中展示；
- 以低维护成本持续更新个人信息，而不必每次修改源码再重新部署。

### 1.2 核心问题
| # | 问题 Problem | 影响 Impact |
| --- | --- | --- |
| P1 | 通用模板同质化严重，无法体现个人风格 | 缺乏记忆点，转化率低 |
| P2 | 静态站点修改内容必须改代码并重新部署 | 维护成本高，非技术场景不可用 |
| P3 | 引入框架/构建链会带来依赖与部署复杂度 | 与“零构建、长期可托管”的目标冲突 |
| P4 | 移动端体验与可访问性常被忽视 | 面试官可能在手机上快速浏览 |

### 1.3 产品愿景
> 一个“打开即惊艳、后台即可改”的纯静态个人作品集：用 Canvas 星空营造沉浸式第一印象，用浏览器本地存储在无后端的前提下实现内容管理。

---

## 2. 产品目标与成功指标 / Goals & Success Metrics

### 2.1 目标 Goals
1. **G1** 访客在 5 秒内理解“我是谁、我会什么、我做过什么、如何联系我”。
2. **G2** 站主无需写代码，即可在 `admin.html` 修改姓名、头衔、头像、简介与 GitHub 等链接并立即生效。
3. **G3** 全站零构建、零 npm 依赖，可直接部署到 Cloudflare Pages / Vercel / GitHub Pages。
4. **G4** 视觉具备明确的“深空 + 霓虹”识别度，同时保证可读性与可访问性。

### 2.2 成功指标 Metrics
| 指标 Metric | 目标 Target | 测量方式 |
| --- | --- | --- |
| 首屏可交互时间（中端手机，4G） | ≤ 2.5 s | Lighthouse / 手动测速 |
| Lighthouse Performance | ≥ 90 | Chrome Lighthouse |
| Lighthouse Accessibility | ≥ 95 | Chrome Lighthouse |
| 桌面端布局完整性 | 1280–1920 px 无横向滚动 | 手动 + DevTools |
| 移动端布局完整性 | 360–430 px 无横向滚动 | 手动 + DevTools |
| 后台保存成功率 | 100%（localStorage 可用时） | 手动用例 |
| JS 运行时错误 | 0 | Console 检查 |

### 2.3 非目标 Non-Goals
- **NG1** 不做真实的服务端鉴权、用户体系与多租户（纯静态无后端）。
- **NG2** 不做数据库、评论、点赞、访问统计等服务端能力。
- **NG3** 不做博客编辑器 / Markdown 渲染 / 图片上传服务器。
- **NG4** 不追求 SEO 的服务端渲染（SSR）；仅保证基础 meta 与语义化结构。

> 说明：`admin.html` 是“本地内容编辑器”，不是安全边界。任何访问者都能打开它并修改**自己浏览器**中的副本。这是本产品的明确取舍，详见 `TECH_DESIGN.md` §9。

---

## 3. 用户画像与场景 / Personas & Journeys

### 3.1 画像 A：访客（Recruiter / 面试官 / 同学）
- 目标：快速判断技术栈、项目质量与联系方式。
- 行为：从简历/ GitHub 点击进入 → 浏览首屏 → 扫技能 → 点开项目 → 复制邮箱或点 GitHub。
- 关键诉求：加载快、信息密度合理、链接可用、手机可读。

### 3.2 画像 B：站主（王梦涵）
- 目标：不碰源码即可更新资料。
- 行为：进入 `admin.html` → 修改字段 → “保存并应用” → 回到首页确认。
- 关键诉求：表单清晰、有校验、可恢复默认、不会误丢数据。

### 3.3 核心用户旅程
```text
[访客] 打开首页
   ↓ 星空 Hero + 姓名/头衔/头像
   ↓ 关于我（简介 / 地点 / 邮箱 / 社交）
   ↓ 技能矩阵（分类 + 进度条）
   ↓ 项目卡片（标签 / 预览 / 源码）
   ↓ 联系 CTA（mailto / GitHub）
   ↓ 离开或转化

[站主] 首页 → 点击“管理后台” → admin.html
   ↓ 编辑姓名 / 头衔 / 头像 URL / 简介 / GitHub 链接
   ↓ 保存并应用（写入 localStorage）
   ↓ 返回首页（自动读取新数据）
   ↓ 如需回滚：恢复默认
```

---

## 4. 范围 / Scope

### 4.1 In Scope（本期交付）
- 单页首页：Hero、About、Skills、Projects、Contact/Footer。
- Canvas 星空背景（闪烁、漂移、流星、视差）。
- 响应式布局（移动端优先，桌面增强）。
- 后台控制台：资料编辑、社交链接编辑、技能编辑、项目编辑、保存、恢复默认、导入/导出、校验与提示。
- localStorage 持久化 + 跨标签页同步。
- 完整文档：PRD、技术设计、AI 代理规范、README。

### 4.2 Out of Scope（本期不做）
- 服务端 API、数据库、真实登录、OAuth。
- 图片上传与云存储（仅支持 URL / data URL）。
- 多语言切换器（页面采用中英混排的固定文案）。
- 单元测试框架与 CI（提供手动测试清单与 Node 语法检查）。

---

## 5. 信息架构 / Information Architecture

```text
/ index.html
├── Header（固定导航：Home / About / Skills / Projects + 管理后台）
├── Hero #home
│   ├── 状态徽标（开放合作）
│   ├── 姓名（中文）+ 英文名
│   ├── 头衔（中文）+ 英文头衔
│   ├── 简介摘要
│   ├── CTA：查看作品 / 联系我
│   ├── 统计：作品数 / 技能数 / 技能方向数
│   └── 头像（渐变光环 + 首字母回退）
├── About #about
│   ├── 完整简介（按空行分段）
│   ├── 信息卡：所在地 / 邮箱 / 状态
│   └── 社交链接
├── Skills #skills
│   └── 按分类分组的技能卡 + 进度条
├── Projects #projects
│   └── 项目卡（标题 / 描述 / 标签 / 预览 / 源码 / 精选标记）
├── Contact #contact（CTA 卡片）
└── Footer（版权 / 技术栈 / 后台入口）

/ admin.html
├── Header（返回首页 / 导入 / 导出）
├── 本地数据提示（仅当前浏览器）
├── 实时预览卡
├── 基本信息（姓名、英文名、头衔、英文头衔、头像 URL、简介、地点、邮箱、状态）
├── 社交链接（GitHub、LinkedIn、知乎、B 站、个人网站）
├── 技能矩阵（动态行：名称 / 分类 / 熟练度 / 删除）
├── 项目（动态卡：标题 / 标签 / 链接 / 源码 / 描述 / 精选 / 删除）
└── 固定操作栏（未保存提示 / 保存并应用 / 恢复默认）
```

---

## 6. 功能需求 / Functional Requirements

优先级：**P0** 必须；**P1** 应该；**P2** 可选。

### FR-01 星空 Hero（P0）
- 全屏 Canvas 背景，深色底 + 青/紫/粉霓虹光晕。
- 星星具有随机大小、亮度、闪烁相位与缓慢漂移。
- 偶尔出现流星；鼠标移动产生轻微视差。
- 页面隐藏时暂停动画；`prefers-reduced-motion` 下仅渲染静态星空。
- 不得阻塞首屏文字渲染。

**验收**：滚动时星空固定不跟随；调整窗口尺寸后无拉伸变形；移动端无明显掉帧（主观 ≥ 30 FPS）。

### FR-02 个人资料展示（P0）
- 展示头像、姓名、英文名、头衔、英文头衔、简介。
- 头像为空或加载失败时，显示姓名首字母/首字的渐变圆形回退。
- 所有文本从 localStorage 读取；无数据时使用内置默认值。

### FR-03 关于我（P0）
- 展示完整简介，支持按换行分段。
- 展示所在地、邮箱、当前状态（如“开放实习与项目合作”）。
- 展示有效社交链接；无链接时给出轻量提示。

### FR-04 技能矩阵（P0）
- 技能按 `category` 分组，保持数据中的出现顺序。
- 每项显示名称、百分比与进度条；进度条进入视口时动画增长。
- 进度值限制在 0–100 的整数。
- 技能为空时显示空状态并提供后台入口。

### FR-05 项目展示（P0）
- 项目卡展示标题、描述、标签、预览链接、源码链接。
- 仅渲染通过 URL 校验的链接；缺失链接时不显示对应按钮。
- `featured: true` 显示“精选”徽标。
- 项目为空时显示空状态并提供后台入口。
- 标签以逗号分隔输入，自动去重、去空、限制数量。

### FR-06 社交链接（P0）
- 支持 GitHub、LinkedIn、知乎、Bilibili、个人网站与邮箱。
- 链接在新标签页打开，必须带 `rel="noopener noreferrer"`。
- 空值不渲染图标。

### FR-07 响应式布局（P0）
- 断点：`< 640` 单列；`640–1024` 两列；`≥ 1024` 桌面布局。
- 移动端提供折叠菜单，支持 Esc 关闭。
- 任何视口不得出现横向滚动条。

### FR-08 后台入口（P0）
- 首页导航与 Footer 提供清晰可点击的“管理后台”入口，跳转 `admin.html`。
- `admin.html` 提供“返回首页”入口。

### FR-09 资料编辑（P0）
- 可编辑：姓名、英文名、头衔、英文头衔、头像 URL、简介、所在地、邮箱、状态。
- 可编辑社交链接：GitHub、LinkedIn、知乎、Bilibili、个人网站。
- 输入框具备 `maxlength` 与实时字数提示（简介）。

### FR-10 保存并应用（P0）
- “保存并应用”将完整数据写入 `localStorage` 的 `portfolio.data.v1`。
- 保存前执行校验；校验失败时阻止写入并定位错误。
- 保存成功后：显示 Toast、更新时间戳、清除“未保存”状态。
- 首页刷新或跨标签页切换后立即呈现新数据。

### FR-11 恢复默认（P0）
- 提供二次确认对话框，确认后清除存储并恢复内置默认内容。
- 恢复后表单与预览同步刷新。

### FR-12 数据校验（P0）
- 姓名必填，≤ 40 字符。
- 头衔必填，≤ 80 字符。
- 简介 ≤ 600 字符。
- 头像 / 社交 / 项目链接仅允许 `http(s)://`、`data:image/(png|jpeg|gif|webp)`（仅头像）或相对路径；拒绝 `javascript:`、`vbscript:`、`file:`、`blob:`、`data:text/html`、协议相对 `//evil.com` 等。
- 邮箱需符合基本邮箱格式，允许为空。
- 技能名称必填，熟练度 0–100。
- 项目标题必填（存在其他字段时），描述 ≤ 300 字符，标签 ≤ 8 个。

### FR-13 导入 / 导出（P1）
- 导出：下载 `portfolio-data-YYYYMMDD.json`，UTF-8，格式化缩进。
- 导入：读取 ≤ 1 MB 的 JSON 文件，经规范化后写入；非法 JSON 给出错误提示。
- 导入属于破坏性操作，需在 UI 中明确提示。

### FR-14 跨标签页同步（P1）
- 监听 `storage` 事件，任一标签页保存后，其他已打开的首页/后台自动刷新数据。

### FR-15 主题与动效（P1）
- 深空底色 `#05060f`，霓虹青 `#22d3ee`、紫 `#a855f7`、粉 `#f472b6`。
- 玻璃拟态卡片、渐变文字、柔和辉光。
- 动效时长 150–1200 ms；尊重 `prefers-reduced-motion`。

### FR-16 空状态与异常兜底（P1）
- localStorage 不可用（隐私模式/被禁用）时，页面仍以默认数据渲染，后台提示“无法保存”。
- 图片加载失败、头像 URL 非法、数据损坏（JSON 解析失败）均回退默认值，不白屏。

---

## 7. 数据模型 / Data Model

存储键：`portfolio.data.v1`（JSON 字符串）。

```jsonc
{
  "schemaVersion": 1,
  "profile": {
    "name": "王梦涵",
    "nameEn": "Wang Menghan",
    "title": "计算机科学学生 · 前端开发者",
    "titleEn": "Computer Science Student · Frontend Developer",
    "avatarUrl": "",
    "bio": "……",
    "location": "中国 · 杭州",
    "email": "menghan.wang@example.com",
    "availability": "开放实习与项目合作",
    "socials": {
      "github": "https://github.com/...",
      "linkedin": "",
      "zhihu": "",
      "bilibili": "",
      "website": ""
    }
  },
  "skills": [
    { "name": "JavaScript (ES6+)", "category": "前端", "level": 88 }
  ],
  "projects": [
    {
      "title": "星海作品集",
      "description": "……",
      "tags": ["HTML5 Canvas", "Tailwind CSS", "localStorage"],
      "link": "",
      "repo": "https://github.com/...",
      "featured": true
    }
  ],
  "meta": { "updatedAt": "2026-01-01T00:00:00.000Z" }
}
```

### 字段约束
| 字段 Field | 类型 | 必填 | 约束 |
| --- | --- | --- | --- |
| `profile.name` | string | 是 | 1–40 字符 |
| `profile.nameEn` | string | 否 | ≤ 60 字符 |
| `profile.title` | string | 是 | 1–80 字符 |
| `profile.titleEn` | string | 否 | ≤ 100 字符 |
| `profile.avatarUrl` | string | 否 | 安全 URL / data:image / 相对路径 |
| `profile.bio` | string | 否 | ≤ 600 字符 |
| `profile.location` | string | 否 | ≤ 60 字符 |
| `profile.email` | string | 否 | 基本邮箱格式 |
| `profile.availability` | string | 否 | ≤ 60 字符 |
| `profile.socials.*` | string | 否 | 安全 URL |
| `skills[].name` | string | 是 | ≤ 40 字符 |
| `skills[].category` | string | 否 | ≤ 20 字符，默认“其他” |
| `skills[].level` | number | 是 | 0–100 整数 |
| `projects[].title` | string | 是 | ≤ 80 字符 |
| `projects[].description` | string | 否 | ≤ 300 字符 |
| `projects[].tags` | string[] | 否 | ≤ 8 个，每个 ≤ 24 字符 |
| `projects[].link` / `repo` | string | 否 | 安全 URL |
| `projects[].featured` | boolean | 否 | 默认 false |

数组上限：技能 40 条，项目 24 条；超出部分在规范化时截断。

---

## 8. 交互与视觉规范 / Interaction & Visual Spec

### 8.1 色彩 Tokens
| Token | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#05060f` | 页面底色 |
| `--surface` | `rgba(15,23,42,0.55)` | 玻璃卡片 |
| `--border` | `rgba(255,255,255,0.10)` | 卡片描边 |
| `--cyan` | `#22d3ee` | 主强调 / 进度条起点 |
| `--violet` | `#a855f7` | 次强调 / 渐变中段 |
| `--pink` | `#f472b6` | 点缀 / 渐变终点 |
| `--text` | `#e2e8f0` | 主文本 |
| `--muted` | `#94a3b8` | 次文本 |

### 8.2 排版
- 中文优先系统字体栈：`"Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`。
- 英文/数字可用 `ui-monospace` 呈现技术标签，形成“工程感”。
- 行高：正文 1.75；标题 1.15–1.25；字间距：标题略收紧。

### 8.3 组件规则
- **按钮**：主按钮为青→紫渐变，次按钮为玻璃描边；hover 提升亮度与位移 1–2 px；均需可见 focus ring。
- **卡片**：圆角 16–20 px，1 px 半透明描边，hover 时描边转青并出现辉光。
- **进度条**：高 8 px，圆角全满；填充为青→紫→粉渐变；进入视口后 1.2 s 缓动。
- **导航**：顶部悬浮玻璃条，滚动后保持可读；当前区块高亮。
- **动效**：入场 `translateY(18px) → 0` + 淡入；不使用夸张弹跳。

### 8.4 响应式规则
- 容器最大宽度 1120 px，左右留白 16/24/32 px。
- 字号使用 `clamp()` 实现流体标题。
- 触摸目标最小 44×44 px。

---

## 9. 非功能需求 / Non-Functional Requirements

| 类别 | 要求 |
| --- | --- |
| 性能 | 首屏 JS ≤ 60 KB（不含 CDN）；星数按面积自适应并封顶 220；DPR 上限 2；页面隐藏暂停 rAF |
| 可访问性 | 语义化 landmark；`skip link`；键盘可达；焦点可见；图片 alt；进度条 ARIA；对比度 ≥ 4.5:1（正文） |
| 兼容性 | Chrome/Edge/Firefox/Safari 最近两个大版本；iOS Safari 15+；Android Chrome 100+ |
| 可靠性 | localStorage 读写异常不导致白屏；损坏数据自动回退默认 |
| 安全 | 用户输入一律转义；URL 协议白名单；不引入第三方追踪脚本；外链 `noopener noreferrer` |
| 可维护性 | 模块职责单一；数据契约集中在一个文件中；文档与实现同步 |
| 可部署性 | 仅静态文件；无 Node 运行时要求；支持子路径部署（全部使用相对路径） |

---

## 10. 验收标准 / Acceptance Criteria

| ID | Given 前提 | When 操作 | Then 预期 |
| --- | --- | --- | --- |
| AC-01 | 首次访问，无 localStorage | 打开 `index.html` | 展示默认资料、4 个项目、12 项技能；星空动画运行 |
| AC-02 | 任意视口 360–1920 px | 缩放窗口 | 无横向滚动；导航/卡片不重叠 |
| AC-03 | 已知技能数据 | 滚动到技能区 | 进度条从 0 动画到目标值；百分比文本一致 |
| AC-04 | 项目数据含空链接 | 浏览项目卡 | 不渲染空的“预览”按钮 |
| AC-05 | 打开 `admin.html` | 修改姓名、头衔、简介、GitHub | 预览区即时更新 |
| AC-06 | 已填写合法数据 | 点击“保存并应用” | 出现成功 Toast；`localStorage` 写入；首页显示新值 |
| AC-07 | 姓名为空 | 点击保存 | 阻止保存；显示错误并聚焦姓名输入框 |
| AC-08 | 已保存自定义数据 | 点击“恢复默认”并确认 | 数据清除；表单/首页恢复默认 |
| AC-09 | 已保存自定义数据 | 刷新首页 / 新标签页打开 | 数据保持 |
| AC-10 | 后台已打开 | 另一标签页保存 | 后台通过 `storage` 事件同步（或提示刷新） |
| AC-11 | 头像 URL 返回 404 | 打开首页 | 显示姓名首字回退，不出现破图 |
| AC-12 | `javascript:alert(1)` 作为链接 | 保存 | 校验失败，链接不会被写入或渲染 |
| AC-13 | 系统开启减少动态效果 | 打开首页 | 星空静态、入场动画关闭、进度条直接到位 |
| AC-14 | 断开网络（Tailwind CDN 不可用） | 打开页面 | 核心内容与自定义样式仍可读，JS 不报错 |
| AC-15 | 通过静态服务器访问 | 打开两个页面 | 均返回 200，Console 无错误 |

---

## 11. 里程碑 / Milestones

| 阶段 | 交付物 | 状态 |
| --- | --- | --- |
| M0 规范 | PRD / TECH_DESIGN / AGENTS | ✅ |
| M1 数据层 | `store.js`：默认值、规范化、持久化、订阅 | ✅ |
| M2 首页 | 星空引擎 + 首页渲染 | ✅ |
| M3 后台 | 表单、校验、保存、重置、导入导出 | ✅ |
| M4 验证 | 语法检查、ID 契约检查、静态服务访问、手动清单 | ✅ |
| M5 部署 | Cloudflare Pages / Vercel 配置说明 | ✅（文档） |

---

## 12. 风险与缓解 / Risks & Mitigations

| 风险 | 等级 | 缓解措施 |
| --- | --- | --- |
| localStorage 被禁用/配额满 | 中 | 读写包裹 try/catch；失败时 Toast 提示并保留内存数据；头像建议用 URL 而非 base64 |
| 用户输入 XSS | 高 | 渲染使用 `textContent` / 转义；URL 协议白名单；禁止 `innerHTML` 拼接用户数据 |
| Tailwind CDN 不可达 | 中 | 关键布局与主题写入自定义 CSS；语义化 HTML 保底可读 |
| Canvas 在低端机掉帧 | 中 | 星数按面积计算、DPR 封顶、隐藏暂停、减少动效适配 |
| 无后端导致“后台”无真实权限 | 中 | 文档明确安全边界；默认内容不含敏感信息 |
| 数据模型演进破坏旧数据 | 低 | `schemaVersion` + 规范化合并；未知字段丢弃，缺失字段补默认 |
| 头像跨域防盗链 | 低 | `referrerpolicy="no-referrer"`；失败回退首字母 |

---

## 13. 术语表 / Glossary

| 术语 | English | 释义 |
| --- | --- | --- |
| 单页应用 | SPA (Single Page Application) | 一个 HTML 承载多区块，交互不整页刷新 |
| 零构建 | Zero-build | 源码即产物，无需打包/编译即可部署 |
| 玻璃拟态 | Glassmorphism | 半透明 + 背景模糊的视觉风格 |
| 持久化 | Persistence | 数据在刷新/重开后仍存在，此处指 localStorage |
| 规范化 | Normalization | 把任意输入收敛为满足契约的数据结构 |
| 视差 | Parallax | 依据指针位置产生轻微位移，营造景深 |
| 设备像素比 | DPR (Device Pixel Ratio) | 物理像素 / CSS 像素，用于 Canvas 清晰度 |
| 减少动态效果 | `prefers-reduced-motion` | 操作系统级无障碍偏好 |

---

## 14. 附录：默认内容 / Appendix — Default Content

- **姓名**：王梦涵 / Wang Menghan
- **头衔**：计算机科学学生 · 前端开发者 / Computer Science Student · Frontend Developer
- **技能分类**：前端、后端、工具、设计（共 12 项）
- **项目**：星海作品集、校园二手交易平台、手写数字识别、Mini Shell
- **社交**：GitHub（示例占位，可在后台替换）

> 所有默认内容均为演示数据，可通过 `admin.html` 或“恢复默认”随时调整。
