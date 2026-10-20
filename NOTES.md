# NOTES — 开发笔记与验证记录

> 项目：Starlit Portfolio（星海作品集）
> 状态：✅ 已完成并验证
> 日期：2026-10-20
> 目录：`D:/personal-portfolio`

---

## 1. 交付清单 / Deliverables

| 文件 | 作用 | 状态 |
| --- | --- | --- |
| `index.html` | 首页：Hero / About / Skills / Projects / Contact | ✅ |
| `admin.html` | 后台：资料、社交、技能、项目、保存/重置/导入导出 | ✅ |
| `assets/js/store.js` | 数据契约、规范化、localStorage、订阅、URL/HTML 安全工具 | ✅ |
| `assets/js/starfield.js` | Canvas 星空引擎（闪烁/漂移/星座/流星/视差） | ✅ |
| `assets/js/index.js` | 首页渲染、导航、滚动高亮、进度条、社交链接 | ✅ |
| `assets/js/admin.js` | 表单回填/收集/校验、预览、Toast、重置对话框 | ✅ |
| `assets/css/theme.css` | 主题 Tokens、玻璃卡、按钮、头像光环、表单、降级 | ✅ |
| `assets/favicon.svg` | 星形渐变图标 | ✅ |
| `PRD.md` | 产品需求文档（14 节） | ✅ |
| `TECH_DESIGN.md` | 技术设计文档（17 节 + API） | ✅ |
| `AGENTS.md` | AI 代理编码规范 | ✅ |
| `README.md` | 使用、部署、测试、排查 | ✅ |
| `NOTES.md` | 本文 | ✅ |
| `PITFALLS.md` | 踩坑与规避 | ✅ |

**未引入**：`package.json`、`node_modules`、构建配置、框架、后端、数据库。

**版本控制**：本次未初始化 Git/Fossil。如需，可在项目根执行 `git init`，或使用 WSL 中的 Fossil 将仓库放在 `D:/fossil/`（不要放在 C:）。

---

## 2. 架构速览 / Architecture at a Glance

```text
index.html ──► store.js ◄── admin.html
    │             │              │
    ├─ starfield.js              └─ admin.js
    └─ index.js
          │
   localStorage["portfolio.data.v1"]
          │
   storage event → 跨标签页同步
```

- **唯一数据源**：`store.js`。页面脚本不直接读写 localStorage。
- **渲染安全**：用户文本只走 `textContent`；URL 先经 `safeUrl()` 白名单。
- **降级**：localStorage 异常 → 默认数据；图片失败 → 首字回退；CDN 失败 → 本地 CSS。
- **零构建**：经典 `<script>`，可在 `file://` 与任意静态托管上运行。

---

## 3. 关键决策 / Decisions

| # | 决策 | 理由 |
| --- | --- | --- |
| D1 | 使用经典脚本 + IIFE，而非 ES Module | `file://` 下 ES Module 受 CORS 限制；零构建更彻底 |
| D2 | 单一存储键 `portfolio.data.v1` + `schemaVersion` | 原子写入、易导入导出、可演进 |
| D3 | 读写两侧都做规范化 | 防历史脏数据、手工篡改、导入恶意 JSON |
| D4 | 用户数据只走 DOM API | 从根上消除 XSS，不依赖转义正确性 |
| D5 | 自定义 CSS 承担关键布局 | Tailwind CDN 被墙时仍可读、无横向滚动 |
| D6 | 进度条观察 `.skill-track` 而非 `.skill-fill` | 0 宽度的 fill 可能永远不产生 intersection |
| D7 | 头像回退使用绝对定位覆盖层 | 加载中显示首字，加载成功后隐藏，不占布局 |
| D8 | 后台保存后重新渲染表单 | 展示规范化后的值（trim、截断、URL 编码） |
| D9 | 重置使用原生 `<dialog>` | 焦点管理、Esc 关闭、backdrop 均由浏览器处理 |
| D10 | 导出时若表单未保存，导出表单内容 | 避免用户误以为备份包含最新修改 |

---

## 4. 验证记录 / Verification Log

环境：Windows 11 · Git Bash · Python 3.12 · Node 22 · Microsoft Edge Headless（Chromium）。
静态服务：`python -m http.server 8123`，访问 `http://127.0.0.1:8123/`。

### 4.1 静态检查

```text
node --check assets/js/store.js      OK
node --check assets/js/starfield.js  OK
node --check assets/js/index.js      OK
node --check assets/js/admin.js      OK
ID 契约检查（index/admin）            missing = none
重复 ID 检查                          duplicates = none
内联 style 检查                       none
绝对资源路径检查                       none
```

### 4.2 浏览器端到端（Edge Headless）

25 项全部通过：

```text
PASS | admin loads
PASS | profile prefilled
PASS | skills hydrated (12)
PASS | projects hydrated (4)
PASS | preview initials
PASS | dirty state set
PASS | unsafe URL blocked (javascript:)
PASS | live preview name
PASS | preview CJK initial
PASS | saved to localStorage
PASS | saved name
PASS | saved github
PASS | updatedAt set
PASS | dirty cleared
PASS | index name
PASS | index bio paragraphs
PASS | index initial fallback
PASS | github link rendered
PASS | canvas sized
PASS | skill bar animated (92%)
PASS | saved data survives reload
PASS | reset dialog opens
PASS | storage cleared on reset
PASS | form restored defaults
PASS | index restored defaults
```

### 4.3 响应式 / 布局

6 项全部通过（index 360/768/1280/1920，admin 360/1280）：

- `scrollWidth === viewport`，无横向溢出。
- 360 px：桌面导航隐藏、菜单按钮显示。
- ≥ 768 px：桌面导航显示、菜单按钮隐藏。
- 后台固定操作栏 `position: fixed`，宽度不溢出。

### 4.4 UI / 计算样式

15 项全部通过：

- body 背景 `rgb(5, 6, 15)`、容器 `max-width: 1120px`、玻璃卡 `padding: 24px`。
- 主按钮渐变、桌面技能网格 2 列、Hero 桌面 2 列 / 移动 1 列。
- Canvas 已绘制（`toDataURL` 约 95 KB），DPR 尺寸正确。
- 移动菜单开合与 `aria-expanded` 同步，点击链接自动关闭。

补充：头像专项 7 项全部通过（data 图片保存、显示、缓存重渲染不遮挡、破图回退首字）；邮箱联动 9 项全部通过（修改/清空邮箱后 Hero、Contact CTA、About、社交入口同步，且隐藏链接不残留 href）。

### 4.5 减少动态效果

9 项全部通过（`--force-prefers-reduced-motion`）：

- `prefers-reduced-motion` 命中。
- reveal opacity = 1；Aurora / 头像光环 / 状态点动画为 `none`。
- 进度条立即 92%；`scroll-behavior: auto`。
- 星空静态绘制且尺寸正确。

### 4.6 CDN 降级

11 项全部通过（`--host-resolver-rules` 把 `cdn.tailwindcss.com` 指向 127.0.0.1）：

- 首页/后台仍渲染 12 技能、4 项目。
- 背景、容器宽度、玻璃卡、按钮渐变、网格、输入框、固定操作栏均保持。
- 两个页面均无横向溢出。

### 4.7 数据层边界测试（Node `vm` + 假 localStorage）

通过：

- 默认 12 技能 / 4 项目；空存储回退默认。
- 损坏 JSON 回退默认。
- 保存 / 重新读取 / updatedAt。
- 自定义事件订阅、退订、`storage` 事件。
- 重置清除存储。
- 技能等级 clamp（999→100，-5→0，abc→60）。
- 标签去重 + 上限 8。
- 无标题项目被丢弃。
- URL 白名单：接受 https/http/相对路径；拒绝 `javascript:`、`vbscript:`、`data:text/html`、`file:`、`blob:`、`about:`、`//evil.com`、`/\evil.com`、控制字符。
- data:image 需显式 opt-in，仅 PNG/JPEG/GIF/WebP。
- 非法 avatar/link/repo 被置空。
- 空技能/项目数组被保留（不会误用默认值）。
- 邮箱校验与非法邮箱置空。
- HTML 转义。
- 缺失字段类型错误时回退默认。
- 配额错误抛出可读中文提示。
- `storageAvailable()` 探测。

> 测试脚本中曾出现 2 个 `deepStrictEqual` 跨 realm 比较的误报，以及 2 个因 shell 转义导致的反斜杠用例误报；确认均为测试写法问题，已用 JSON 比较与 `String.fromCharCode(92)` 复核，代码行为正确。

### 4.8 手动检查建议

- 用真实鼠标/触屏体验星空与视差。
- 用手机（iOS Safari）验证 `backdrop-filter` 与滚动性能。
- 在 Chrome DevTools Lighthouse 中跑 Performance / Accessibility。
- 用超长姓名、超长项目标题测试布局（数据层会截断，但视觉换行仍值得确认）。

---

## 5. 已知限制 / Known Limitations

1. **无真实鉴权**：`admin.html` 是本地编辑器，不是权限边界。
2. **不跨设备同步**：数据仅在当前浏览器；迁移靠 JSON 导入导出。
3. **头像 base64 受长度限制**（2048 字符）：建议使用图片 URL。
4. **Tailwind Play CDN 不适合生产**：控制台会有官方警告；本项目用本地 CSS 兜底关键样式。若要求极致性能，可改为预编译 CSS（会引入构建步骤，违反当前约束）。
5. **SEO 有限**：内容由 JS 渲染，搜索引擎主要看到静态骨架与 meta；未做 SSR/预渲染。
6. **无访问统计/评论/博客**：超出本期范围。
7. **Canvas 在极低端设备可能降帧**：已通过星数封顶、DPR 封顶、隐藏暂停缓解。

---

## 6. 本地运行 / Run Locally

```bash
cd /d/personal-portfolio
python -m http.server 8080
# 打开 http://localhost:8080/
```

停止服务：`Ctrl+C`。

---

## 7. 后续可做 / Next Steps

- [ ] 接入 Cloudflare Workers / Supabase，实现真实远程内容与登录。
- [ ] 图片上传到 R2/S3，替代 URL 输入。
- [ ] 项目详情页（`project.html?id=`）。
- [ ] 中英文切换（i18n 字典）。
- [ ] 内容版本快照与回滚。
- [ ] Lighthouse CI + HTML/JS lint。
- [ ] 初始化 Git/Fossil 仓库（Fossil 仓库建议放 `D:/fossil/`）。

---

## 8. 默认内容提醒 / Default Content

- 姓名：王梦涵 / Wang Menghan
- 邮箱：`menghan.wang@example.com`（**占位符，请替换**）
- GitHub：`https://github.com/wangmenghan`（**示例，请替换**）
- 项目 4 个、技能 12 项，均为演示数据。

在 `admin.html` 中修改并“保存并应用”，或直接编辑 `assets/js/store.js` 的 `DEFAULT_DATA` 后“恢复默认”。
