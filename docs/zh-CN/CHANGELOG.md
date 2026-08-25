# 变更日志

本项目的所有重要变更将记录在此文件中。

格式基于
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，并遵循[语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.2.1] - 2026-08-25

### 新增

- **`RouterOptions.apiOnly`**：将 `routesDir` 下所有非特殊文件视为 API handler
  （`.ts` / `.js` / `.tsx` / `.jsx`），**不必**再套 `api/` 路径段；开启时默认
  `skipAppValidation: true`。供纯 API 应用（如 dweb `kind: "api"`）把 handler
  直接放在 `routes/`（例：`routes/hello.ts` → `/hello`）。

### 测试

- 补充 `apiOnly` 扫描与匹配单测（`tests/mod.test.ts`）。

---

## [1.2.0] - 2026-07-23

### 新增

- **Node.js 22+** 作为第三个支持的运行时（与 Deno、Bun 并列）。服务端路由通过
  `@dreamer/runtime-adapter` 的跨运行时 `readdir` / `stat` / `cwd` / `join` 扫描
  文件系统并匹配路由（无 `Deno.*` 调用）。客户端路由器把所有浏览器全局对象
  （`history` / `location` / `document` / `addEventListener`）都收敛到
  `browserGlobal` 守卫之后，因此可在无头环境下导入并运行——在真实浏览器全局对象
  出现（或被 mock）之前，导航方法会抛 `"浏览器环境不支持 history API"`。
- 新增 **`tsconfig.json`** 与 **`test:node`** 任务
  （`tsx --tsconfig tsconfig.json --test --test-force-exit ...`）支持 Node.js。
- 新增 **`.npmrc`**（`@jsr:registry=https://npm.jsr.io`），让 `npm` / `bun`
  能解析 `npm:@jsr/dreamer__*` 别名。

### 变更

- 升级 `@dreamer/runtime-adapter` → `^1.2.2`、`@dreamer/i18n` → `^1.1.2`、
  `@dreamer/test` → `^1.2.3`。
- **esbuild 隔离**：从 `package.json` 运行时依赖中移除 `@dreamer/esbuild`。
  `src/` 对 esbuild 零依赖；仅本地 Playwright 浏览器测试
  （`tests/client-browser.test.ts`）懒加载它，经 `deno.json` 的 `jsr:` import
  map 解析。这样避免 Node/Bun 触发 esbuild 二进制 postinstall 摩擦。
- `deno.json` 新增 `minimumDependencyAge: 0` 与 `compilerOptions.lib`。
- `publish.yml` 改为仅 tags 触发（不再 push `main` 分支）。

### CI

- 新增 9-job 矩阵：Deno 2.9 / Bun 1.3 / Node 22 × Linux / macOS / Windows，仅跑
  4 个
  单元测试文件（`mod`、`client`、`nav-match`、`specificity-sort`）。Playwright
  浏览器 测试（`client-browser.test.ts`）拆为本地 `test:browser` 任务，避免 CI
  受 Chromium 下载/启动不稳定影响。

### 测试

- 三运行时单元套件全绿：Deno 171（167 单元 + 4 个 `@dreamer/test` cleanup
  生命周期 钩子）/ Bun 167 / Node 167。

---

## [1.1.8] - 2026-06-27

### 新增

- **`Router.getMiddlewarePathsForPath(pathname)`**、
  **`Router.getMiddlewareKeysForPath(pathname)`**：按 pathname
  从根到当前路径收集嵌套 **`_middleware.ts`**（外 → 内），与
  **`getLayoutPathsForPath`** /
  **`getLayoutKeysForPath`**（**`_layout.tsx`**）规则一致。

### 变更

- **`Router.handleRequest`**：按请求 pathname 加载并执行完整嵌套中间件链（根
  **`routes/_middleware.ts`** 及各段前缀如
  **`hs-admin/_middleware.ts`**），不再仅匹配 页面所在目录的一层。

### 测试

- **`tests/mod.test.ts`**：嵌套中间件路径/key 收集及 **`handleRequest`**
  执行顺序（根 → 子目录）。

---

## [1.1.7] - 2026-04-21

### 新增

- **`src/client/nav-match.ts`**（由 **`@dreamer/router/client`** 再导出）：提供
  **`normalizePathname`**、**`isNavActive`**，用于仅用当前 pathname
  做导航项高亮，无需 **`ClientRouter`** 实例。

### 变更

- **`Router.scan`**：当单个 API 路由文件映射到无动态段的静态路径（例如
  **`routes/api/auth.ts`** → **`/api/auth`**）时，额外注册
  **`/api/auth/:method`**，使 **`POST /api/auth/login`** 可在
  **`apiMode: "action"`** 下解析；与已有的
  **`api/.../index/:method`**（**`index.ts`** 打包）规则并存。
- **`ClientRouter`**：**`loadComponent`** 改为 **`async`/`await`**
  实现（对外行为不变）。

### 测试

- **`tests/nav-match.test.ts`**：**`normalizePathname`** / **`isNavActive`**。
- **`tests/mod.test.ts`**：扁平 **`api/auth.ts`** 注册
  **`/api/auth/:method`**，以及对 **`/api/auth/login`** 的 **`match`**。
- **`tests/client.test.ts`**：补充客户端相关用例（含 prefetch /
  **`loadComponent`** 等）。

---

## [1.1.4] - 2026-04-17

### 新增

- **`Route.matchPrep`**：每条 **`Route`** 上可选的 **`RouteMatchPrep | null`**，
  同一磁盘文件对应多条路由时不再共用错误的预计算（例如 API **`index`** 与显式
  **`index/:method`** 并存）。

### 变更

- **`Router`**：移除按 **`fullPath`** 的 **`routeMatchPrepByFullPath`** 映射；
  **`matchRouteToPath`** 改为使用当前匹配 **`Route`** 上的 **`matchPrep`**。
- **API `index` 文件**：扫描 **`api/.../index.ts`**（或 **`.js`**）时，额外注册
  **`/api/.../index/:method`**，使 **`POST /api/auth/index/login`**
  等与同模块导出 对齐（配合 **`apiMode: "action"`** 与服务端 **`RouterAdapter`**
  的 **`params.method`**）。

### 测试

- **`tests/mod.test.ts`**：覆盖 **`/api/.../index/:method`** 注册及对
  **`/api/auth/index/login`** 的 **`match`**。

---

## [1.1.3] - 2026-03-26

### 新增

- **`src/core.ts`**：服务端 **`Router`** 与 **`ClientRouter`** 共用的路径匹配与
  scan 排序逻辑 — **`buildRouteMatchPrep`** / **`matchRoutePattern`**（预切分
  path 段、wildcard/optional 基路径，减少每次 **`match`** 上的重复
  **`split`**），以及
  **`buildRouteSpecificityTuple`**、**`compareSpecificityTuples`**、
  **`compareRoutesForScanOrder`**，用于「更具体的路由优先」的稳定排序。
- **`tests/specificity-sort.test.ts`**：元组优先级、两两比较及 **`Router.scan`**
  集成测试 — 例如静态 **`/blog/new`** 排在动态 **`/blog/:slug`** 之前，使
  **`match("/blog/new")`** 命中静态路由；API 树下 **`/api/v1/health`** 优先于
  **`/api/v1/:id`**。
- **`tests/client.test.ts`**：覆盖 **`addRoute`** 后重排，以及手写路由顺序下静态
  **`/blog/new`** 仍优先于 **`/blog/:slug`**。
- **`tests/mod.test.ts`**：非 **`api`** 路径下的 **`.ts` / `.js`**
  文件不应注册为 页面路由。

### 变更

- **`Router.scan()`**：收集路由后按 **`compareRoutesForScanOrder`** 排序 — 非
  API 整体先于 API；同块内按特异性降序（静态 > 动态 > 可选 >
  通配；字面量段优先于 **`:param`** 段）；相同则按 **`path`
  字典序**。静态与动态兄弟路由的胜负不再依赖 **`readdir`** 顺序。
- **`Router`**：注册时为每条路由写入 **`routeMatchPrepByFullPath`**；
  **`matchRouteToPath`** 使用 **`matchRoutePattern`**。
- **`ClientRouter`**：构造时用 **`WeakMap`**（**`routeMatchPrepByRoute`**）缓存
  prep，构造结束调用 **`sortRoutesForMatchOrder()`**；**`addRoute`** 后更新 prep
  并重排，使客户端匹配顺序与服务端 **`scan()`** 一致。
- **扫描规则**：页面路由仅 **`.tsx` / `.jsx`**；**`api/`**（或路径含 **`api`**）
  下仍支持 **`.ts`、`.js`、`.tsx`、`.jsx`** 作为 handler。
- **`parseRoutePath`**：去扩展名时包含 **`.js` / `.jsx`**。
- **`getRawClientRoutes`**：组件路径仅去掉 **`.tsx` / `.jsx`**（与页面扩展名策略
  一致）。
- **`loadApiHandlers`**：按 **`filePath`**
  缓存解析结果（**`apiHandlersCache`**）； 在 **`clearCache`**（全量或单文件）与
  **`scan`** 时失效。

### 修复

- 当动态页（如 **`blog/[slug].tsx`**）在文件系统遍历中先于静态页（如
  **`blog/new.tsx`**）出现时，可能错误命中动态路由；现按特异性排序决定匹配顺序。
- 与页面同目录的 **`.ts` / `.js`** 工具文件曾被当作页面路由注册；现除非为 API
  路由文件，否则忽略。

---

## [1.1.2] - 2026-03-23

### 新增

- **`isLikelyClientBundledAssetPath(pathname)`**（`src/mod.ts`）：识别常见
  dweb/esbuild 客户端脚本 URL（如 **`/_client.js`**、**`/chunk-*.js`**、
  **`/_layout-*.js`**、带 hash 的 route chunk 等）。**`Router.match`** 对这些
  pathname **提前返回 `null`**，避免 HTTP 适配器在静态资源请求上 **O(routes)**
  全表扫描及 **`debug`** 日志刷屏。
- **客户端链接拦截**（`src/client/mod.ts`）：沿 **`event.target`** 父链找不到
  **`<a>`** 时回退 **`composedPath()`**，应对 Shadow DOM 重定向。
- **`normalizeAnchorTargetAttribute`**：将错误的 **`"undefined"` / `"null"`**
  字符串 target（来自不当 **`setAttribute`**）视为未指定，避免误判为非
  **`_self`** 而跳过拦截。
- **`debug: true`** 时通过 **`logClickInterceptSkip`** 记录未拦截原因（非
  **`_self`**、download、跨域、仅 hash、URL 解析错误等）；普通非链接点击不再打
  debug 噪音。

### 变更

- **`Router.match`**：在输出 **`match`** 的 **`debugLog`** 之前先做 bundle
  路径快速排除。
- **`@dreamer/esbuild`** 依赖范围升至 **^1.1.6**（import map / npm）。

---

## [1.1.1] - 2026-03-21

### 修复

- 无全局 `ClientRouter` 时（如 Hybrid/SSR 首屏）客户端 hooks
  不再抛错：`useRouter()` 返回 `null`；`useRoute()` 返回
  `null`；`useQuery()`、`useParams()`、`useMeta()` 返回
  `{}`；`useNavigationState()` 返回 `"idle"`；`useIsActive()` 返回 `false`。

### 变更

- **`useRouter()`** 返回类型为 `ClientRouter | null`，导航请使用可选链：
  `useRouter()?.navigate(...)`。
- **`getGlobalRouter`**、**`setGlobalRouter`** 不再从
  `jsr:@dreamer/router/client` 导出，请改用 **`useRouter()`**。
- 内部 Link / `navigate` 等改为使用 **`useRouter()`**。

---

## [1.1.0] - 2026-03-13

### 新增

- **客户端引擎 "view"**：`ClientRouterOptions.engine` 现支持 `"view"`（与
  `"preact"`、`"react"` 并列），用于在 dweb 应用中配合 `@dreamer/view`。

---

## [1.0.16] - 2026-03-11

### 新增

- **嵌套布局 API**：`getLayoutPathsForPath(pathname)`
  返回从根到该路由路径的布局文件完整路径数组（供
  SSR/构建使用）。`getLayoutKeysForPath(pathname)` 返回布局 key 数组（如
  `["_layout", "admin/_layout"]`），供客户端按 key
  动态加载。便于上层框架支持按路由层级的嵌套 `_layout.tsx`。

---

## [1.0.15] - 2026-02-19

### 变更

- **i18n**：i18n 在模块加载时自动初始化。`initRouterI18n`
  不再对外导出，主入口不再 导入或调用。翻译函数 `$tr`
  在首次使用时若尚未初始化会自动初始化。需设置路由 消息语言时请使用
  `setRouterLocale`。
- **依赖**：`@dreamer/test` 升级至 ^1.0.11，`@dreamer/runtime-adapter` 升级至
  ^1.0.15，`@dreamer/esbuild` 升级至 ^1.0.30。

---

## [1.0.14] - 2026-02-19

### 变更

- **i18n**：翻译方法由 `$t` 重命名为 `$tr`，避免与全局 `$t`
  冲突。请将现有代码中本包消息改为使用 `$tr`。

---

## [1.0.13] - 2026-02-18

### 变更

- **i18n**：仅在入口初始化；`mod.ts` 中调用一次 `initRouterI18n()`。`$t()`
  内不再调用 `ensureRouterI18n()` 或设置 locale。

---

## [1.0.12] - 2026-02-17

### 新增

- **服务端 i18n**：`RouterOptions` 支持可选 `lang`（如
  `"en-US"`、`"zh-CN"`）。不传时从环境变量 `LANGUAGE` / `LC_ALL` / `LANG`
  自动检测。新增 `src/i18n.ts` 与
  `src/locales/en-US.json`、`zh-CN.json`。三处服务端文案已翻译：扫描路由失败、缺少特殊文件、加载
  API 处理函数失败。

### 变更

- **发布包含**：`publish.include` 改为使用 glob
  `src/**/*.ts`、`src/**/*.json`（以及
  `LICENSE`、`NOTICE`、`README.md`）便于维护。

---

## [1.0.11] - 2026-02-17

### 新增

- **锚点链接处理**：History 模式下 `getPathname()` 现包含
  `location.hash`，导航到带 hash 的路径（如 `/about#team`）会得到带 `hash`
  的匹配结果；导航完成后 `handleScrollBehavior` 会滚动到对应 `id`
  的元素（跨页锚点）。
- **链接拦截 — 协议过滤**：仅拦截 `http:` 与 `https:`
  链接。`mailto:`、`tel:`、`javascript:`、`blob:`、`data:` 等非 http(s)
  协议不再拦截，交由浏览器处理。
- **链接拦截单元测试**：14 项测试覆盖同页锚点、path+search+hash
  同页锚点、`target="_blank"`、`download`、`data-native`、`mailto:`、`tel:`、`javascript:`、`blob:`、`data:`、跨域、空
  `href`、同源拦截、跨页 hash 拦截。

### 变更

- **文档**：README 与 zh-CN README
  增加「链接拦截」小节（会拦截/不拦截的链接）。测试报告与 README 测试统计更新为
  146 项（28 + 84 + 34）。

---

## [1.0.10] - 2026-02-16

### 新增

- **客户端 `interceptLinks` 选项**：`ClientRouterOptions` 现支持
  `interceptLinks?: boolean`（默认 `true`）。为 `false` 时，`start()` 不注册
  链接点击拦截，SSR/SSG 应用可仅对当前页做 hydrate，链接点击走浏览器整页
  跳转而非客户端路由。

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
