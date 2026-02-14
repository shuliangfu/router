# 变更日志

本项目的所有重要变更将记录在此文件中。

格式基于
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，并遵循[语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.9] - 2026-02-14

### 修复

- **客户端导航 / SPA 主体区空白**：点击链接后，因导航在路由变化回调完成前就
  结束，导致主体内容有时不渲染（如 View Hybrid）。现改为在导航结束前等待所有
  `onRouteChange` 回调完成，从而在导航完成前完成 SPA 内容渲染。

### 变更

- **RouteChangeCallback**：类型现允许 `void | Promise<void> | unknown`，以支持
  异步回调（如加载模块 + 渲染）；回调通过 `Promise.resolve(callback(match))`
  调用并被 await。
- **notifyRouteChange**：改为 async；`handleRouteChange` 会 await
  它，使路由变化监听器（含异步渲染）在滚动等后续逻辑前完成。
- **许可证**：本包采用 Apache License 2.0（见 [LICENSE](../../LICENSE)）。

---

## [1.0.8] - 2026-02-12

### 修复

- **客户端点击处理**：当 `event.target` 为文本节点（如 Solid.js 等使用 document
  委托的框架）时，因文本节点无 `parentElement` 导致找不到 `<a>`。现改为通过
  `parentNode` 向上查找，并用 `nodeType === 1` 与 `tagName === "A"` 正确找到
  `<a>` 元素。
- **客户端点击拦截**：在 `preventDefault()` 后调用
  `stopImmediatePropagation()`，避免框架在 document 上的监听器（如 Solid）
  再次处理点击并触发默认导航。内部 `BrowserMouseEvent` 类型增加可选
  `stopImmediatePropagation`。

### 新增

- **客户端调试**：在客户端选项 `debug: true` 时，对点击拦截输出
  `debugLog`（"intercepted"、"no &lt;a&gt; found for target"）。

---

## [1.0.7] - 2026-02-10

### 新增

- **文档**：客户端子路径文档置于 `docs/zh-CN/client/README.md` 与
  `docs/en-US/client/README.md`（由 `src/client/README.md` 迁移并新增英文版）。

### 变更

- **文档**：文档结构调整为 `docs/en-US/`、`docs/zh-CN/`；根目录 README
  保留英文入口； CHANGELOG、TEST_REPORT 及中文 README 迁入对应目录；zh-CN
  测试报告已翻译为中文； 所有文档链接已更新。
- **CI**：为浏览器测试增加 Playwright Chromium
  安装步骤（Linux、Windows、macOS）。

---

## [1.0.6] - 2026-02-09

### 新增

- **调试选项**：在 `RouterOptions`（服务端）和 `ClientRouterOptions`（客户端）中
  增加 `debug?: boolean`。传 `debug: true` 时输出路由匹配、模块加载、导航等详细
  日志，便于诊断 Windows 路径问题及组件加载失败。

---

## [1.0.5] - 2026-02-09

### 修复

- **服务端路由 (processFile)**：在 `processFile` 中先用 `normalizeRouteFile()`
  规范化 `relativePath` 再处理。Windows 下 `join()` 可能产生反斜杠，直接使用
  `relativePath` 会导致 `specialFiles` 的 key 错误、API
  路由检测失败（`split("/")` 在含反斜杠时失效）、以及 `route.path`
  错误。现已统一使用正斜杠规范化路径，确保跨平台行为一致。

### 变更

- **依赖**：提升 @dreamer/test 至 ^1.0.2，使用最新兼容版本。

---

## [1.0.4] - 2026-02-08

### 变更

- **依赖**：提升 @dreamer/runtime-adapter、@dreamer/test 至最新兼容版本。

---

## [1.0.3] - 2026-02-08

### 修复

- **Windows 兼容**：`loadRouteMiddlewares`、`scanDirectory`、`processFile` 中用
  `join()` 和 `dirname()` 替代字符串拼接，确保 Windows 下路径正确处理。

---

## [1.0.2] - 2026-02-08

### 修复

- **Windows 兼容**：`route.file` 统一使用正斜杠。新增 `normalizeRouteFile()` 在
  `parseRoutePath` 中将反斜杠转为正斜杠，确保 Windows 下路径格式一致。

---

## [1.0.1] - 2026-02-07

### 修复

#### 客户端：页面切换时恢复滚动位置

- **问题**：用户在不同页面间切换（如点击链接后按浏览器前进/后退）时，滚动位置不会恢复，总是回到顶部。原因：
  1. `popstate`（浏览器后退/前进）时，`saveScrollPosition()` 使用的
     `getPathname()` 已返回新路径，离开页的滚动未被保存。
  2. 未配置 `scrollBehavior` 时，默认始终滚到顶部，忽略已保存的位置。
- **解决方案**：
  1. 新增 `saveScrollPositionForPath(path)`，用于保存指定路径的滚动。在
     `handleRouteChange` 开头，若存在 `previousMatch`（包括 `popstate`
     场景），先保存当前滚动到 `previousMatch.fullPath`。
  2. 未配置 `scrollBehavior` 时：若目标路径有 `savedPosition`
     则恢复，否则滚到顶部。
- **影响**：使用浏览器前进/后退时，页面的滚动位置会被记住并恢复。无需额外配置。

---

## [1.0.0] - 2026-02-06

### 新增

首个稳定版本。完整基于文件的路由系统，兼容 Deno 与 Bun。

（详细说明见 [CHANGELOG.md](../en-US/CHANGELOG.md) 英文版）
