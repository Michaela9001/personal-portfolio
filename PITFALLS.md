# PITFALLS — 踩坑与规避清单

> **先读这里，再改代码。**
> 每条包含：现象 / 原因 / 解决 / 预防。按“症状”检索即可。

---

## P1. 无头浏览器里 `scrollIntoView` 不滚动，进度条一直是 0%

**现象**
用 Edge/Chrome Headless + `--virtual-time-budget` 做 E2E 时：
- `scrollIntoView()` 或 `window.scrollTo(0, y)` 调用后，`scrollY` 仍为 0；
- 技能进度条停留在 `0%`，但 `aria-valuenow` 正确。

**原因**
`theme.css` 里 `html { scroll-behavior: smooth; }`。
`scrollTo` / `scrollIntoView` 默认行为会继承该 CSS，变成平滑滚动；
在虚拟时间/无渲染帧的无头环境中，平滑滚动动画不推进。

**解决**
测试中先强制瞬时滚动：

```js
doc.documentElement.style.scrollBehavior = 'auto';
win.scrollTo(0, target.offsetTop);
```

或使用：

```js
win.scrollTo({ top: target.offsetTop, behavior: 'instant' });
```

**预防**
- 不要因为 E2E 失败就改生产代码的平滑滚动。
- 在测试里显式设置 `scrollBehavior = 'auto'`，再断言 IntersectionObserver 相关行为。

---

## P2. 重新渲染后，首字回退层盖住了已加载的头像

**现象**
后台保存后返回首页（或跨标签页同步），头像区域只显示“王”/“WM”，看不到图片；
刷新页面后又正常。

**原因**
`renderAvatar()` 每次渲染都会把 fallback 设为可见，再设置 `img.src`。
如果 URL 没变且图片已缓存，浏览器**不会再次触发 `load` 事件**，`fallback.hidden` 永远不为 true。
由于 fallback 在 DOM 中位于 `<img>` 之后且绝对定位，它会覆盖图片。

**解决**
在设置 `src` 前判断缓存命中：

```js
if (img.getAttribute('src') === url && img.complete && img.naturalWidth > 0) {
  fallback.hidden = true;
  return;
}
```

**预防**
- 任何“图片 + 占位层”的组件都要考虑 `load` 不重复触发的情况。
- 用 `img.complete && img.naturalWidth > 0` 判断已加载。
- 图片与占位层的 DOM 顺序、定位关系要明确（本项目 fallback 绝对定位）。

---

## P3. `/\evil.com` 可能被浏览器规范化为 `//evil.com`

**现象**
URL 白名单只拦截了 `//evil.com`，但相对路径 `/\evil.com` 仍被放行。

**原因**
对于 http(s) 等特殊 scheme，浏览器会把反斜杠当作斜杠处理。
`href="/\evil.com"` 在部分解析路径下可能变成协议相对外链。

**解决**
- 拒绝任何包含反斜杠的相对路径：
  ```js
  var hasUnsafeChars = /[\s<>"'`\\]/.test(s);
  ```
- 继续拒绝开头 `//`、`\\`、`\/`。

**预防**
- 安全白名单要覆盖编码/规范化差异，而不只是字面协议。
- 对 URL 做“先 strip 控制字符 → 协议判断 → 相对路径字符集检查”的顺序处理。
- 不要把“用户输入了 URL”当作“URL 一定安全”。

---

## P4. 进度条观察 0 宽度的元素，IntersectionObserver 永远不触发

**现象**
技能条已经滚到视口内，但仍然不增长；控制台无错误。

**原因**
曾尝试直接观察 `.skill-fill`。它初始 `width: 0`，零面积元素的 intersection 可能为 0，
`threshold: 0.3` 永远无法满足。

**解决**
观察有实际尺寸的父元素 `.skill-track`，在回调里给子元素 `.skill-fill` 设置宽度：

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.querySelector('.skill-fill').style.width =
      entry.target.dataset.level + '%';
    observer.unobserve(entry.target);
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-track[data-level]').forEach((el) => observer.observe(el));
```

**预防**
- IntersectionObserver 的目标必须有非零布局尺寸。
- 用 `getBoundingClientRect()` 调试“是否真的在视口内”。

---

## P5. `<template>` 里的行也被 `querySelectorAll` 统计

**现象**
后台只有 12 个技能行，但 E2E 断言 `#skills-list .skill-row` 数量为 12，页面整体查询却是 13；
项目同理（4 → 5）。

**原因**
`<template>` 的内容虽然不渲染，但其节点存在于 `template.content`，某些选择器/序列化结果会把它算进去；
`--dump-dom` 也会输出模板内容。

**解决**
- 查询时限定容器：`#skills-list .skill-row`。
- 需要模板内查询时使用 `template.content.querySelector(...)`。
- 测试断言不要用全文档的宽泛选择器。

**预防**
- 动态行一律放在明确的列表容器内。
- 模板行与真实行使用相同类名时，测试必须限定作用域。

---

## P6. `file://` 下 localStorage 行为不一致

**现象**
双击 `index.html` 保存后，刷新或换页面数据丢失；或不同浏览器表现不同。

**原因**
浏览器对 `file://` 的 origin 与存储实现没有统一规范，部分浏览器按文件隔离或直接禁用。

**解决**
- 用本地静态服务器：`python -m http.server 8080`。
- 部署到 HTTPS 静态托管后行为正常。

**预防**
- 文档明确推荐 HTTP。
- 代码对存储异常做 try/catch，失败时仍能用默认数据渲染。

---

## P7. 头像用 base64 导致“存储空间不足”

**现象**
后台上传/粘贴一张较大图片的 data URL 后保存失败，提示配额不足。

**原因**
localStorage 通常只有约 5 MB（按 UTF-16 计可能更少）；
base64 会把二进制放大约 33%，且字符串按双字节计费。

**解决**
- 使用图片 URL（推荐）。
- 清理站点数据后重试。
- 本项目对 URL 长度限制 2048，并仅允许 PNG/JPEG/GIF/WebP data URL。

**预防**
- 不要把 localStorage 当图片存储。
- 保存失败必须给用户可读提示，而不是静默失败。

---

## P8. 误以为 `admin.html` 有权限控制

**现象**
认为“后台页面”别人打不开，或认为保存会影响所有访客。

**原因**
纯静态 + localStorage 没有服务端，无法做真实鉴权；每个浏览器有独立副本。

**解决**
- 文档明确：这是本地内容编辑器，不是安全边界。
- 不要在默认数据中放敏感信息。
- 需要真实权限时引入后端与认证。

**预防**
- 任何“纯前端后台”的需求都要先确认安全模型。
- 不要把“隐藏入口”当安全措施。

---

## P9. Tailwind Play CDN 的生产警告

**现象**
Console 出现：

```text
cdn.tailwindcss.com should not be used in production...
```

**原因**
Play CDN 在浏览器运行时生成样式，官方不建议用于生产。

**解决**
- 本项目为满足“零构建”约束而保留 CDN。
- 关键布局、颜色、按钮、卡片、表单在 `theme.css` 中有本地实现，CDN 失败仍可用。
- 如要消除警告并优化性能，需改用预编译 Tailwind（会引入构建步骤）。

**预防**
- 不要为了消除一条警告而破坏“零构建”约束；先确认需求优先级。
- 用 `--host-resolver-rules` 模拟 CDN 失败，验证兜底样式。

---

## P10. 固定头部遮住锚点标题

**现象**
点击导航“关于/技能”后，标题被顶部固定导航挡住。

**原因**
`position: fixed` 的 header 不占据文档流。

**解决**
给区块设置滚动外边距：

```css
.section-block {
  scroll-margin-top: 6rem;
}
```

**预防**
- 所有带固定头部的锚点页面都要设置 `scroll-margin-top`。
- 用 `scroll-padding-top` 作为全局替代方案。

---

## P11. 移动端横向滚动条

**常见原因**
- 固定宽度（`width: 1200px`）的容器；
- 负边距 + 100vw；
- 长英文单词/URL 不换行；
- `100vw` 包含滚动条宽度；
- 绝对定位装饰层超出视口。

**本项目的处理**
- `body { overflow-x: hidden; }`（兜底，不是主要手段）；
- `.container-page` 最大宽度 + 左右 padding；
- 网格使用 `minmax(0, 1fr)`，允许子项收缩；
- 图片 `max-width: 100%`；
- 长文本 `word-break: break-word`。

**验证**
在 360 / 768 / 1280 / 1920 px 下检查：

```js
document.documentElement.scrollWidth <= window.innerWidth + 1
```

---

## P12. `innerHTML` 用错位置导致 XSS

**规则**
- 用户数据（姓名、简介、项目、标签、URL）**只能**用 `textContent` 或 `setAttribute`。
- 仅**代码常量**（静态 SVG 图标、菜单图标）可以使用 `innerHTML`。

**本项目中的合法用法**
`assets/js/index.js` 中 `link.innerHTML = meta.icon`、`ICONS.*`、`MENU_ICON` 等，
全部来自常量表，不含任何用户输入。

**预防**
- 代码审查时搜索 `innerHTML`，逐个确认右侧是常量。
- 不要写 `el.innerHTML = '<h3>' + data.title + '</h3>'`。
- 不要用“转义函数 + innerHTML”替代 DOM API；转义容易漏。

---

## P13. 跨 realm 的 `deepStrictEqual` 误报

**现象**
Node `vm` 沙箱测试里，两个数组打印完全一样，但 `assert.deepStrictEqual` 失败：
“Values have the same structure but are not reference-equal”。

**原因**
沙箱内 `Array` 与宿主 `Array` 是不同的构造函数，原型链不同。

**解决**
用 JSON 比较：

```js
assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
```

**预防**
- 跨 realm 测试优先比较序列化结果或逐项 `strictEqual`。
- 看到“结构相同但引用不等”先怀疑 realm，而不是业务逻辑。

---

## P14. Shell 转义把测试用的反斜杠吃掉

**现象**
测试 `safeUrl('/\\evil.com')` 时结果不符合预期，但代码里的正则看起来正确。

**原因**
Bash here-doc / JS 字符串 / 正则三层转义叠加，`\\` 可能变成 `\`，再变成被忽略的转义。

**解决**
用字符码构造，彻底避开转义：

```js
const bs = String.fromCharCode(92);
const cases = [bs + '/evil.com', bs + bs + 'evil.com'];
```

**预防**
- 测试反斜杠、引号、换行时，使用 `String.fromCharCode` 或 `JSON.parse` 构造。
- 不要相信肉眼看到的转义层数。

---

## P15. 保存时的 `beforeunload` 阻止自动化导航

**现象**
E2E 在后台修改字段后直接 `iframe.src = ...`，页面卡住或弹出离开确认。

**原因**
未保存状态下 `beforeunload` 会触发浏览器原生确认框，自动化环境无法点击。

**解决**
- 测试中先保存或恢复默认，再导航。
- 或在测试环境跳过 `beforeunload`（本项目未引入测试开关，保持生产代码干净）。

**预防**
- 有未保存拦截的页面，E2E 流程要显式处理 dirty 状态。
- 不要为了测试在生产代码里加 `window.__TEST__` 分支。

---

## P16. 订阅回调在保存过程中被调用两次

**现象**
担心 `store.save()` 内部的 `dispatchEvent` 会让后台 `renderForm()` 执行两次。

**实际行为**
- `save()` 同步派发 `portfolio:datachange`；
- 后台订阅回调检查 `state.dirty`，保存时仍为 `true`，因此跳过；
- `save()` 返回后，后台自己调用 `renderForm()` 并清除 dirty。

这是**有意设计**，避免同一次保存触发重复渲染/焦点丢失。
跨标签页的 `storage` 事件在 dirty 时也会跳过，避免覆盖未保存编辑。

**预防**
- 修改订阅逻辑时，先确认 dirty 状态机，不要简单地在回调里无条件重渲染。

---

## P17. `new URL('https:///x')` 会被规范化

**现象**
测试期望 `https:///x` 被拒绝，但 `new URL()` 把它规范化为 `https://x/`，于是通过。

**结论**
这不是漏洞：结果仍是合法的 https 绝对地址，用户本来就可以输入 `https://x`。
白名单关心的是**协议**，不是斜杠数量。

**预防**
- 安全测试的期望要基于“是否可执行脚本/是否越权”，而不是“字符串是否难看”。
- 对 URL 的断言优先检查 `protocol` 与 `hostname`。

---

## P18. 直接用 `hidden` 类与自定义 `.mobile-menu` 冲突

**现象**
给移动菜单加 Tailwind 的 `hidden` 类后，JS 切换 `hidden` 属性无效。

**原因**
Tailwind 的 `.hidden { display: none }` 是类选择器，优先级高于 `[hidden]` 的 UA 样式；
两者叠加时容易混乱。

**本项目做法**
- 统一使用 **HTML `hidden` 属性**（`menu.hidden = true/false`）；
- CSS 中 `[hidden] { display: none !important; }` 保证生效；
- 不用 Tailwind 的 `hidden` 类控制同一元素。

**预防**
- 一个元素只用一种显隐机制（属性或类），不要混用。
- 需要过渡动画时，用 `.is-open` 类 + `visibility/opacity`，不要用 `hidden`。

---

## P19. Windows 磁盘空间与构建产物

**现象**
把测试产物、浏览器 profile、依赖装到 `C:` 后，系统盘迅速变满（本机 C: 仅约 14 GB 可用）。

**本项目做法**
- 代码与测试产物全部在 `D:/personal-portfolio`。
- 无 `node_modules`、无构建输出。
- Edge Headless 的 `--user-data-dir` 指向项目内 `.tmp`，测试后删除。

**预防**
- 大型产物、虚拟环境、模型、仓库一律放 `D:`。
- 临时浏览器 profile 用完即删。

---

## P20. 修改数据契约时只改了一侧

**现象**
新增字段后，后台能填、首页不显示；或旧数据读取后字段丢失。

**原因**
本项目的数据流是：`DEFAULT_DATA` → `normalize()` → 表单 → `save()` → `load()` → 渲染。
只改其中一两处会导致契约不一致。

**正确顺序**
1. `assets/js/store.js`：`DEFAULT_DATA` 加默认值。
2. `assets/js/store.js`：`normalize()` 加类型/长度/URL/上限处理。
3. `admin.html`：表单字段 + `admin.js` 的 `collect()` / `renderForm()` / `validate()`。
4. `index.html` + `index.js`：渲染与空状态。
5. `PRD.md` 数据模型、`TECH_DESIGN.md` API、`README.md` 示例。
6. 跑 `node --check` + E2E + 清空 localStorage 回归。

**预防**
- 任何字段变更都按上述清单走。
- 记住：`normalize()` 会丢弃未知字段，**新增字段不补默认值就会在读取时消失**。

---

## P21. 本地预览端口被占用

**现象**
`python -m http.server 8080` 报 `Address already in use`。

**解决**
换端口：

```bash
python -m http.server 8123
```

或查找占用（Windows）：

```powershell
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess
```

**预防**
- 测试脚本使用固定但少见的端口（如 8123），结束后按 PID 精确停止。
- 不要盲目 `taskkill /F /IM python.exe`，会杀掉其他任务。

---

## P22. 删除/重命名存储键导致用户数据“消失”

**规则**
- 存储键 `portfolio.data.v1` 是**兼容性契约**。
- 不要为了“重置”而改键名；使用 `PortfolioStore.reset()`。
- 需要结构升级时，提升 `schemaVersion` 并在 `normalize()` 中兼容旧字段。

**预防**
- 任何键名/字段重命名都要写迁移逻辑。
- 发布前用旧版本数据做一次回归（导入旧 JSON → 保存 → 重新读取）。

---

## 快速自检命令

```bash
cd /d/personal-portfolio

# 语法
for f in assets/js/*.js; do node --check "$f" || exit 1; done

# 零依赖
ls package.json node_modules 2>/dev/null || echo "OK: zero dependencies"

# 无内联样式 / 无绝对资源路径
grep -rn 'style="' --include='*.html' . || echo "OK: no inline styles"
grep -rnE '(src|href)="/' --include='*.html' . || echo "OK: relative paths"

# 本地服务
python -m http.server 8123
```
