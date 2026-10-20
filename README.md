# Starlit Portfolio · 星海作品集

> 一个**零构建、零后端、可直接部署**的个人作品集网站：Canvas 星空 + 玻璃拟态界面 + 浏览器本地后台。
>
> A zero-build, backend-free portfolio with a Canvas starfield, glassmorphism UI, and a local admin console.

---

## ✨ 特性 / Features

| 首页 Homepage | 后台 Admin |
| --- | --- |
| Canvas 星空：闪烁、漂移、星座连线、流星、鼠标视差 | 编辑姓名、英文名、头衔、头像 URL、简介、地点、邮箱、状态 |
| 响应式 Hero（360–1920 px） | 编辑 GitHub / LinkedIn / 知乎 / Bilibili / 个人网站 |
| 关于我 + 基本信息 + 社交链接 | 动态增删技能（名称 / 分类 / 熟练度） |
| 技能矩阵：分类分组 + 滚动动画进度条 | 动态增删项目（标题 / 描述 / 标签 / 预览 / 源码 / 精选） |
| 项目卡片：标签、精选徽标、外链 | 实时预览、校验、Toast 提示 |
| 联系 CTA + Footer | 保存并应用、恢复默认、导入 / 导出 JSON |
| localStorage 读取 + 跨标签页同步 | 未保存提示、Ctrl/Cmd+S 快捷保存 |

- **零构建**：没有 `package.json`、没有 `node_modules`，不需要 `npm install`。
- **零后端**：内容只保存在当前浏览器的 `localStorage` 中。
- **零追踪**：无 Cookie、无统计脚本、无第三方字体请求。
- **可访问**：语义化结构、键盘可达、进度条 ARIA、`prefers-reduced-motion` 降级。
- **可降级**：Tailwind CDN 不可达时，关键布局与主题仍由本地 CSS 兜底。

---

## 🚀 快速开始 / Quick Start

### 方式 A：静态服务器（推荐）

任选一种（需要 Python 或 Node）：

```bash
# Python（Windows 自带或已安装）
python -m http.server 8080

# Node
npx serve .

# PHP
php -S localhost:8080
```

然后打开：

- 首页：<http://localhost:8080/>
- 后台：<http://localhost:8080/admin.html>

> 推荐通过 `http://` 访问，因为部分浏览器对 `file://` 下的 `localStorage` 行为不一致。

### 方式 B：直接双击

直接双击 `index.html` 也能运行（经典 `<script>`，非 ES Module），适合快速预览。
如果修改后首页没有变化，请改用方式 A，或检查浏览器是否限制了本地文件存储。

---

## 📁 目录结构 / Project Structure

```text
personal-portfolio/
├── index.html                  # 首页
├── admin.html                  # 后台管理控制台
├── assets/
│   ├── css/
│   │   └── theme.css           # 设计 Tokens、组件、动效、CDN 降级兜底
│   ├── js/
│   │   ├── store.js            # 数据契约：默认值 / 规范化 / 读写 / 订阅 / 安全工具
│   │   ├── starfield.js        # Canvas 星空引擎
│   │   ├── index.js            # 首页渲染与导航交互
│   │   └── admin.js            # 后台表单、校验、预览、导入导出
│   └── favicon.svg
├── PRD.md                      # 产品需求文档
├── TECH_DESIGN.md              # 技术设计文档
├── AGENTS.md                   # AI 代理编码规范
├── NOTES.md                    # 开发笔记与验证记录
├── PITFALLS.md                 # 踩坑与规避清单
└── README.md                   # 本文
```

---

## 🛠️ 使用后台 / Using the Admin Console

1. 打开 `admin.html`（首页右上角“管理后台”）。
2. 修改任意字段，顶部预览会实时更新。
3. 点击底部 **“保存并应用”**（或按 `Ctrl/Cmd + S`）。
4. 返回首页，内容立即生效。

### 可编辑内容

- **基本信息**：姓名、英文名、头衔、英文头衔、头像 URL、简介、所在地、邮箱、状态。
- **社交链接**：GitHub、LinkedIn、知乎、Bilibili、个人网站（留空则不显示）。
- **技能**：名称、分类（前端 / 后端 / 工具 / 设计 / 其他）、熟练度 0–100。
- **项目**：标题、描述、标签（逗号分隔）、在线预览 URL、源码 URL、精选标记。

### 恢复默认

“危险操作 → 恢复默认内容”会二次确认，然后清除当前浏览器的自定义数据并还原内置示例。
**此操作不可撤销**，建议先导出 JSON 备份。

### 导入 / 导出

- **导出 JSON**：下载 `portfolio-data-YYYYMMDD-HHmm.json`，包含当前表单内容（含未保存更改）。
- **导入 JSON**：读取 ≤ 1 MB 的文件，经规范化后覆盖当前内容。

---

## 💾 数据与存储 / Data & Storage

| 项 | 值 |
| --- | --- |
| 存储位置 | `localStorage` |
| 键名 | `portfolio.data.v1` |
| 版本字段 | `schemaVersion: 1` |
| 写入时机 | 保存 / 导入 / 恢复默认 |
| 读取时机 | 页面加载、`storage` 事件 |

- 数据**不会上传**到任何服务器。
- 清除浏览器站点数据会同时删除你的修改。
- 同一浏览器的多个标签页会自动同步。
- 换浏览器 / 换设备不会同步；请用“导出 / 导入 JSON”迁移。
- 头像建议使用图片 URL，而不是 base64（后者会快速消耗 5 MB 左右的存储配额）。

数据形状示例：

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
    "socials": { "github": "https://github.com/…", "linkedin": "", "zhihu": "", "bilibili": "", "website": "" }
  },
  "skills": [{ "name": "JavaScript (ES6+)", "category": "前端", "level": 88 }],
  "projects": [{
    "title": "星海作品集",
    "description": "……",
    "tags": ["HTML5 Canvas", "Tailwind CSS"],
    "link": "",
    "repo": "https://github.com/…",
    "featured": true
  }],
  "meta": { "updatedAt": "2026-01-01T00:00:00.000Z" }
}
```

---

## ☁️ 部署 / Deployment

### Cloudflare Pages（推荐）

1. 把仓库推送到 GitHub / GitLab。
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
3. 配置：
   - **Framework preset**：`None`
   - **Build command**：留空
   - **Build output directory**：`/`（仓库根目录）
4. **Deploy**。之后每次 push 自动发布。

> 也可以使用 **Direct Upload**：直接把整个目录拖进 Pages 上传界面。

### Vercel

1. **Add New → Project → Import Git Repository**。
2. **Framework Preset**：`Other`。
3. **Build Command**：留空；**Output Directory**：`.`（或留空）。
4. **Deploy**。

或使用 CLI：

```bash
npx vercel --prod
```

### GitHub Pages

1. 仓库 **Settings → Pages**。
2. **Source**：`Deploy from a branch` → `main` → `/ (root)`。
3. 保存后等待发布。

所有资源均使用相对路径，因此部署在 `用户名.github.io/仓库名/` 这类子路径下也能正常工作。

### 其他静态托管

Netlify、Render、Surge、对象存储静态网站、Nginx/Apache、Caddy 均可。只要能把整个目录作为静态站点提供即可。

---

## 🎨 自定义 / Customization

### 修改默认内容

默认数据集中在 `assets/js/store.js` 的 `DEFAULT_DATA`。修改后：
- 已保存过自定义数据的浏览器不会自动更新（因为 localStorage 优先）；
- 在后台点“恢复默认”即可载入新的默认值。

### 修改主题

编辑 `assets/css/theme.css` 顶部的 `:root` Tokens：

```css
:root {
  --bg: #05060f;
  --cyan: #22d3ee;
  --violet: #a855f7;
  --pink: #f472b6;
  --radius-card: 20px;
  --font-sans: "Noto Sans SC", ...;
}
```

Tailwind 的扩展配置位于 `index.html` / `admin.html` 的 `tailwind.config` 内联脚本。

### 修改布局与文案

- 首页结构：`index.html`（Hero / About / Skills / Projects / Contact）。
- 后台结构：`admin.html`（Template 定义动态行）。
- 渲染逻辑：`assets/js/index.js`、`assets/js/admin.js`。

### 修改星空

```js
new Starfield(canvas, {
  maxStars: 220,        // 星数上限（实际按面积自适应）
  shootingStars: true,  // 流星
  parallax: true,       // 指针视差
  constellation: true   // 星座连线
});
```

---

## 🔒 安全边界 / Security Model

> **重要：`admin.html` 不是安全的权限边界。**

- 它是“本地内容编辑器”，没有账号、密码或服务端鉴权。
- 任何能打开页面的人都可以修改**自己浏览器**里的副本，但**无法影响其他访客**（数据不共享）。
- localStorage 中的数据一律视为不可信输入：读取时规范化、渲染时使用 `textContent`、URL 走协议白名单。
- 拒绝 `javascript:`、`vbscript:`、`data:text/html`、`file:`、`blob:`、协议相对 `//evil.com`、反斜杠路径等。
- 头像 data URL 仅允许 PNG/JPEG/GIF/WebP，且受长度限制。
- 外链统一带 `rel="noopener noreferrer"`。

如果未来需要真实的远程内容管理与权限，必须引入服务端 + 身份认证（见 `TECH_DESIGN.md` §15）。

---

## ♿ 可访问性与性能 / A11y & Performance

- 语义化 `header/nav/main/section/article/footer`，首个元素为跳转链接。
- 所有交互元素为原生控件，键盘可达，`:focus-visible` 可见。
- 进度条使用 `role="progressbar"` + `aria-valuenow`。
- 尊重 `prefers-reduced-motion`：关闭动画、静态星空、进度条直接到位。
- Canvas 星数按面积自适应并封顶 220，DPR 封顶 2，标签页隐藏时暂停。
- Tailwind CDN 仅用于工具类；关键布局和主题在本地 CSS 中，断网仍可读。

---

## 🧪 测试 / Testing

```bash
# 1. JS 语法
node --check assets/js/store.js
node --check assets/js/starfield.js
node --check assets/js/index.js
node --check assets/js/admin.js

# 2. 确认零依赖
ls package.json node_modules 2>/dev/null || echo "OK: zero dependencies"

# 3. 启动本地服务
python -m http.server 8080
```

建议手动验证：

- [ ] 首次访问（清空 localStorage）显示默认内容。
- [ ] 后台改姓名 → 保存 → 首页更新。
- [ ] 姓名为空 → 保存被阻止并提示。
- [ ] GitHub 填 `javascript:alert(1)` → 被拒绝。
- [ ] 头像填无效 URL → 显示姓名首字回退。
- [ ] 恢复默认 → 数据清除。
- [ ] 360 / 768 / 1280 / 1920 px 无横向滚动。
- [ ] 系统开启“减少动态效果” → 动画停止、内容完整。
- [ ] 禁用网络后刷新 → 内容仍可读（Tailwind 样式降级）。

本项目已在 Edge Headless 下完成 25 项端到端测试、6 项响应式检查、15 项 UI/样式检查、9 项减少动效检查、11 项 CDN 降级检查，详见 `NOTES.md`。

---

## 🩺 故障排查 / Troubleshooting

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 保存后首页没变化 | 浏览器阻止了 localStorage / 打开的是另一个浏览器 | 使用 `http://localhost` 访问；检查是否同一浏览器；查看后台警告 |
| 后台提示“存储空间不足” | 头像 base64 太大或站点数据配额满 | 改用图片 URL；清理站点数据；导出备份后重置 |
| 头像不显示 | URL 失效、防盗链、协议不被允许 | 更换可直接访问的 `https` 图片；留空使用首字回退 |
| 样式很朴素 | Tailwind CDN 被墙/超时 | 本地 CSS 已兜底；如需完整样式可自建 Tailwind 构建（会破坏零构建约束） |
| 直接双击打开不保存 | `file://` 存储行为不一致 | 用本地静态服务器 |
| 导入失败 | JSON 语法错误 / 根节点不是对象 / 文件过大 | 用“导出 JSON”获得正确格式；文件 ≤ 1 MB |
| 按 Ctrl+S 没反应 | 焦点在浏览器地址栏 / 系统快捷键冲突 | 点击页面空白处后重试；或直接点“保存并应用” |

---

## 🌐 浏览器支持 / Browser Support

| 浏览器 | 版本 |
| --- | --- |
| Chrome / Edge | 100+ |
| Firefox | 100+ |
| Safari / iOS Safari | 15.4+ |
| Android Chrome | 100+ |

降级策略：`ResizeObserver` → `resize` 事件；`IntersectionObserver` 缺失 → 直接显示；`dialog` 缺失 → `confirm`；`backdrop-filter` 不支持 → 提高卡片不透明度。

---

## 📄 说明 / Notes

- 默认姓名、项目、GitHub 链接均为演示数据，请通过后台替换为你自己的信息。
- 默认邮箱 `menghan.wang@example.com` 是占位符，务必修改。
- 本项目为个人作品集模板，可自由修改用于自己的主页。

> **一句话原则**：打开即惊艳、后台即可改、断网不白屏、无依赖可部署。
