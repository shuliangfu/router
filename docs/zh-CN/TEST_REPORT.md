# @dreamer/router 测试报告

## 测试概览

| 项目         | 说明                                 |
| ------------ | ------------------------------------ |
| 测试库版本   | @dreamer/test@^1.0.15                |
| 运行时适配器 | @dreamer/runtime-adapter@^1.0.18     |
| 测试框架     | @dreamer/test（describe/it/expect）  |
| 测试日期     | 2026-03-24                           |
| 测试环境     | Deno + Bun + Puppeteer（浏览器测试） |

## 测试结果

### 总体统计（Deno，作为用例数基准）

| 指标     | 数值   |
| -------- | ------ |
| 总测试数 | 179    |
| 通过     | 179    |
| 失败     | 0      |
| 通过率   | 100%   |
| 执行时间 | 约 10s |

**Bun**（`bun test tests/`）：**176** 通过，**0** 失败（约 13s）。Bun 对嵌套
`describe` 的展平与计数方式与 Deno 不同，故汇总数量可能略少于
Deno；源文件一致且全部通过。

### 运行时兼容性

| 运行时 | 测试数（报告值） | 通过 | 状态 |
| ------ | ---------------- | ---- | ---- |
| Deno   | 179              | 179  | ✅   |
| Bun    | 176              | 176  | ✅   |

### 测试文件统计

| 测试文件                 | 数量 | 通过 | 失败 | 状态 |
| ------------------------ | ---- | ---- | ---- | ---- |
| client-browser.test.ts   | 28   | 28   | 0    | ✅   |
| client.test.ts           | 94   | 94   | 0    | ✅   |
| mod.test.ts              | 43   | 43   | 0    | ✅   |
| specificity-sort.test.ts | 14   | 14   | 0    | ✅   |

## 功能测试详情

### 1. 客户端路由浏览器测试（`client-browser.test.ts`）— 28 项

**环境**：HTTP 服务 + Puppeteer 真实浏览器。

- ✅ 导出、`useRouter` 无全局实例、`getEngine`
- ✅ `navigate`、`replace`
- ✅ `onRouteChange`、`beforeRoute`、`afterRoute`
- ✅ `back` / `forward` / `go`
- ✅ 动态路由、查询参数、自定义组件加载器
- ✅ `start`
  链接拦截（同源、外链、`target=_blank`、`data-native`、`download`、修饰键、嵌套点击、`start`
  幂等）
- ✅ `destroy`

### 2. 客户端路由单元测试（`client.test.ts`）— 94 项

- ✅ `createRouter`（preact、react、空路由）
- ✅ `match`（静态、动态、通配、可选参数、查询参数）
- ✅ `onRouteChange`、`getCurrentRoute`、前后置守卫
- ✅ `getEngine`、动态增删路由、组件加载器、守卫移除
- ✅ `start` / `destroy`、边界情况（斜杠、完整 URL、编码参数）
- ✅ 元数据、`basePath`、history/hash
  模式、导航状态、`isActive`、redirect、缓存、`replace` / `prefetch`
- ✅ 链接拦截 — 特殊链接形式（14 项）：同页 hash 锚点、path+search+hash
  锚点、`target=_blank`、`download`、`data-native`、`mailto:`、`tel:`、`javascript:`、`blob:`、`data:`、跨域、空
  `href`、同源拦截、`composedPath`、跨页 hash
- ✅ **路由特异性**：构造与 `addRoute` 后顺序与服务端 `scan()` 一致（如静态
  `/blog/new` 优先于 `/blog/:slug`）
- ✅ 无全局路由器时的 Hooks（SSR
  安全）：`useRoute`、`useQuery`、`useParams`、`useNavigationState`、`useIsActive`、`useRouter`

### 3. 服务端路由测试（`mod.test.ts`）— 43 项

- ✅ 构造、`scan`、`match`、`getRoutes`、`getSpecialFile`
- ✅ 可选参数/通配/API 路由；非 `api` 目录下误放的 `.ts`/`.js` 不注册为页面路由
- ✅ `getLayoutPathsForPath` / `getLayoutKeysForPath`（嵌套 `_layout`）
- ✅
  重定向、中间件、`getClientRoutes`、`skipAppValidation`、`getApiMode`、模块缓存
- ✅ `RouteMatch` 的 `load` / `fullPath` / `meta`
- ✅ `isLikelyClientBundledAssetPath` 及 `match` 对类 bundle 路径的快速拒绝

### 4. 特异性排序测试（`specificity-sort.test.ts`）— 14 项

- ✅
  `buildRouteSpecificityTuple`、`compareSpecificityTuples`、`compareRoutesForScanOrder`
- ✅ 集成：`Router.scan()` 后 `match` 优先静态页、API 静态段优先于动态段

## 结论

Deno 与 Bun 下测试全部通过（Deno 179、Bun 176）。覆盖服务端文件路由（含 **scan
后特异性排序**）、客户端导航/守卫/链接拦截、布局链辅助、bundle
路径启发式，以及两端共用的 **core** 匹配与排序逻辑。

---

**报告生成时间**：2026-03-24 **测试环境**：Deno + Bun + Puppeteer
