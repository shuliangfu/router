# @dreamer/router 测试报告

## 测试概览

| 项目         | 说明                                    |
| ------------ | --------------------------------------- |
| 测试库版本   | 1.0.0-beta.9                            |
| 运行时适配器 | @dreamer/runtime-adapter@^1.0.0-beta.22 |
| 测试框架     | @dreamer/test@^1.0.0-beta.40            |
| 测试日期     | 2026-02-17                              |
| 测试环境     | Deno + Bun + Puppeteer（浏览器测试）    |

## 测试结果

### 总体统计

| 指标     | 数值 |
| -------- | ---- |
| 总测试数 | 146  |
| 通过     | 146  |
| 失败     | 0    |
| 通过率   | 100% |
| 执行时间 | ~3s  |

### 运行时兼容性

| 运行时 | 测试数 | 通过 | 状态 |
| ------ | ------ | ---- | ---- |
| Deno   | 146    | 146  | ✅   |
| Bun    | 146    | 146  | ✅   |

### 测试文件统计

| 测试文件               | 数量 | 通过 | 失败 | 状态 |
| ---------------------- | ---- | ---- | ---- | ---- |
| client-browser.test.ts | 28   | 28   | 0    | ✅   |
| client.test.ts         | 84   | 84   | 0    | ✅   |
| mod.test.ts            | 34   | 34   | 0    | ✅   |

## 功能测试详情

### 1. 客户端路由浏览器测试 (client-browser.test.ts) - 28 项

**测试环境**：通过 HTTP 服务 + Puppeteer 在真实浏览器中运行

- ✅ 导出所需函数、useRouter 错误、getEngine
- ✅ navigate、replace 模式
- ✅ onRouteChange、beforeRoute、afterRoute 守卫
- ✅ back/forward/go 历史操作
- ✅ 动态路由、查询参数、组件加载器
- ✅
  启动链接拦截（同源、外链、target=_blank、data-native、download、修饰键、嵌套元素点击等）
- ✅ destroy

### 2. 客户端路由单元测试 (client.test.ts) - 84 项

- ✅ createRouter（preact、react、空路由）
- ✅ match（静态、动态、通配、可选参数、查询参数）
- ✅ onRouteChange、getCurrentRoute
- ✅ beforeRoute、afterRoute 守卫
- ✅ getEngine（preact、react）
- ✅ 动态路由管理、组件加载器、守卫管理
- ✅ start、destroy、边界情况
- ✅ 路由元数据、base 路径、路由模式、导航状态、isActive、redirect、缓存
- ✅ 链接拦截 - 特殊链接形式（14 项）：同页锚点、path+search+hash
  同页锚点、target=_blank、download、data-native、mailto:、tel:、javascript:、blob:、data:、跨域、空
  href、同源 http(s) 拦截、跨页带 hash 拦截

### 3. 服务端路由测试 (mod.test.ts) - 34 项

- ✅ 构造、scan、match、getRoutes、getSpecialFile
- ✅ 重定向、中间件、getClientRoutes、skipAppValidation
- ✅ getEngine、getApiMode、isSSREnabled、clearCache
- ✅ RouteMatch 扩展（load、fullPath、meta）

## 结论

@dreamer/router 共 146 项测试全部通过，覆盖率为 100%。支持 Preact 与 React
渲染引擎，涵盖服务端路由扫描/匹配与客户端路由导航/守卫/链接拦截（含锚点、mailto、tel
等非 http(s) 协议特殊链接）。

---

**报告生成时间**：2026-02-17 **测试环境**：Deno + Bun + Puppeteer
