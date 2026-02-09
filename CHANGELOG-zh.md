# 变更日志

本项目的所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，并遵循[语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.4] - 2026-02-08

### 变更

- **依赖**：提升 @dreamer/runtime-adapter、@dreamer/test 至最新兼容版本。

---

## [1.0.3] - 2026-02-08

### 修复

- **Windows 兼容**：`loadRouteMiddlewares`、`scanDirectory`、`processFile` 中用 `join()` 和 `dirname()` 替代字符串拼接，确保 Windows 下路径正确处理。

---

## [1.0.2] - 2026-02-08

### 修复

- **Windows 兼容**：`route.file` 统一使用正斜杠。新增 `normalizeRouteFile()` 在 `parseRoutePath` 中将反斜杠转为正斜杠，确保 Windows 下路径格式一致。

---

## [1.0.1] - 2026-02-07

### 修复

#### 客户端：页面切换时恢复滚动位置

- **问题**：用户在不同页面间切换（如点击链接后按浏览器前进/后退）时，滚动位置不会恢复，总是回到顶部。原因：
  1. `popstate`（浏览器后退/前进）时，`saveScrollPosition()` 使用的 `getPathname()` 已返回新路径，离开页的滚动未被保存。
  2. 未配置 `scrollBehavior` 时，默认始终滚到顶部，忽略已保存的位置。
- **解决方案**：
  1. 新增 `saveScrollPositionForPath(path)`，用于保存指定路径的滚动。在 `handleRouteChange` 开头，若存在 `previousMatch`（包括 `popstate` 场景），先保存当前滚动到 `previousMatch.fullPath`。
  2. 未配置 `scrollBehavior` 时：若目标路径有 `savedPosition` 则恢复，否则滚到顶部。
- **影响**：使用浏览器前进/后退时，页面的滚动位置会被记住并恢复。无需额外配置。

---

## [1.0.0] - 2026-02-06

### 新增

首个稳定版本。完整基于文件的路由系统，兼容 Deno 与 Bun。

（详细说明见 [CHANGELOG.md](./CHANGELOG.md)）
