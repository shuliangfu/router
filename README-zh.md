# @dreamer/router

> 一个兼容 Deno 和 Bun
> 的文件路由系统，提供统一的文件路由接口，支持服务端路由匹配和客户端路由导航

[English](./README.md) | 中文 (Chinese)

[![JSR](https://jsr.io/badges/@dreamer/router)](https://jsr.io/@dreamer/router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![Tests](https://img.shields.io/badge/tests-130%20passed-brightgreen)](./TEST_REPORT.md)

---

## 🎯 功能

文件路由系统，提供统一的文件路由抽象层：

- **服务端**：路由文件扫描、SSR 路由匹配、API 路由处理、中间件链、重定向
- **客户端**：浏览器路由导航、路由守卫、历史操作、滚动行为、预取、Link 组件

---

## 📦 安装

### 服务端（Deno）

```bash
deno add jsr:@dreamer/router
```

### 服务端（Bun）

```bash
bunx jsr add @dreamer/router
```

### 客户端

```typescript
// 客户端使用 /client 子路径
import { createRouter } from "jsr:@dreamer/router/client";
```

---

## 🌍 环境兼容性

| 环境   | 支持 | 说明                           |
| ------ | ---- | ------------------------------ |
| Deno   | ✅   | 2.6+                           |
| Bun    | ✅   | 1.3.5+                         |
| 服务端 | ✅   | SSR 路由匹配、API 路由、中间件 |
| 浏览器 | ✅   | 客户端路由导航（/client）      |

---

## ✨ 特性

### 服务端路由（@dreamer/router）

- **文件路由系统**（类似 Next.js、Remix）：
  - 基于文件系统自动生成路由
  - 文件结构即路由结构
  - 自动路由发现和注册
  - 支持嵌套路由
- **路由类型支持**：
  - 静态路由（`/about.tsx` → `/about`）
  - 动态路由（`/user/[id].tsx` → `/user/:id`）
  - 通配符路由（`/posts/[...slug].tsx` → `/posts/*`）
  - 可选参数路由（`/blog/[[slug]].tsx` → `/blog` 或 `/blog/:slug`）
- **API 路由支持**：
  - RESTful 形式（GET、POST、PUT、DELETE）
  - 操作方法形式（login、register、getUser）
  - 动态 API 路由
- **特殊文件处理**：
  - `_app.tsx`：应用根组件（必须）
  - `_layout.tsx`：布局组件（可选）
  - `_404.tsx`：404 页面（可选）
  - `_error.tsx`：错误页面（可选）
  - `_middleware.ts`：路由中间件（可选）
- **重定向配置**：路由级别的重定向规则
- **中间件链**：多个中间件链式执行
- **路由元数据**：为路由添加自定义元数据

### 客户端路由（@dreamer/router/client）

- **路由导航**：
  - `navigate()` 编程式导航（异步，返回 Promise）
  - `replace()` 替换当前历史记录
  - `back()`/`forward()`/`go()` 历史操作
  - `start()` 启动链接拦截
- **路由守卫**：
  - `beforeRoute` 前置守卫（可阻止导航或重定向）
  - `afterRoute` 后置守卫
  - 动态添加/移除守卫
- **路由匹配**：
  - 静态/动态/通配符路由匹配
  - 查询参数解析
  - 路由参数提取
- **滚动行为管理**：
  - 自定义滚动行为函数
  - 保存/恢复滚动位置
- **预取功能**：
  - `prefetch()` 提前加载目标路由组件
  - 组件缓存
- **Link/NavLink 组件**：
  - 声明式导航
  - 活跃状态样式
  - 预取支持
- **路由模式**：
  - History 模式（默认）
  - Hash 模式（`#/path`）
- **基础路径**：支持部署在子路径下
- **路由元数据**：自动更新页面标题等
- **导航状态**：加载状态监听（idle/loading/error）
- **多引擎支持**：
  - Preact（默认）
  - React
- **Hooks**：
  - `useRouter()` 获取路由器实例
  - `useRoute()` 获取当前路由
  - `useParams()` 获取路由参数
  - `useQuery()` 获取查询参数
  - `useMeta()` 获取路由元数据
  - `useNavigationState()` 获取导航状态
  - `useIsActive()` 检查路径是否活跃

---

## 🚀 快速开始

### 服务端路由

```typescript
import { createRouter, json, notFound } from "jsr:@dreamer/router";

// 创建文件路由（engine、ssr 由上层框架如 dweb 的 render 配置提供）
const router = createRouter({
  routesDir: "./src/routes",
  apiMode: "restful",
  // 重定向配置
  redirects: [
    { source: "/old-page", destination: "/new-page", permanent: true },
    { source: "/blog/:slug", destination: "/posts/:slug" },
  ],
});

// 添加全局中间件
router.use(async (context, next) => {
  console.log(`请求: ${context.request.url}`);
  const response = await next();
  console.log(`响应: ${response.status}`);
  return response;
});

// 扫描路由文件
await router.scan();

// 处理请求（带中间件链）
const response = await router.handleRequest(request, async (match, context) => {
  if (!match) {
    return notFound();
  }

  // 处理重定向
  if (match.redirect) {
    return Response.redirect(
      match.redirect.destination,
      match.redirect.statusCode,
    );
  }

  // 加载并渲染页面
  const Component = await match.load();
  const html = renderToString(<Component params={match.params} />);
  return new Response(html, { headers: { "Content-Type": "text/html" } });
});
```

### 客户端路由

```typescript
import {
  createLinkComponent,
  createRouter,
  useParams,
  useRoute,
  useRouter,
} from "jsr:@dreamer/router/client";

// 创建客户端路由器
const router = createRouter({
  routes: [
    { path: "/", component: "index", meta: { title: "首页" } },
    { path: "/about", component: "about", meta: { title: "关于" } },
    { path: "/user/:id", component: "user/[id]", type: "dynamic" },
  ],
  engine: "preact",
  basePath: "/app", // 可选：部署在子路径
  mode: "history", // 或 "hash"
  // 滚动行为
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition;
    return { top: 0, behavior: "smooth" };
  },
});

// 设置组件加载器
router.setComponentLoader(async (component) => {
  return await import(`./routes/${component}.tsx`);
});

// 启动路由器（开始拦截链接点击）
router.start();

// 路由守卫 - 支持重定向
router.beforeRoute((to, from) => {
  if (to.route.path === "/admin" && !isAuthenticated()) {
    return "/login"; // 返回字符串表示重定向
  }
  return true;
});

// 导航状态监听
router.onNavigationState((state, error) => {
  if (state === "loading") {
    showLoadingIndicator();
  } else {
    hideLoadingIndicator();
  }
});

// 导航
await router.navigate("/about");
await router.replace("/home"); // 替换历史记录

// 预取
await router.prefetch("/user/123");

// 历史操作
router.back();
router.forward();
router.go(-2);
```

### Link 组件使用

```typescript
import { h } from "preact";
import {
  createLinkComponent,
  createNavLinkComponent,
} from "jsr:@dreamer/router/client";

// 创建 Link 组件
const Link = createLinkComponent(h);
const NavLink = createNavLinkComponent(h);

function Navigation() {
  return (
    <nav>
      {/* 基本链接 */}
      <Link to="/about">关于</Link>

      {/* 带预取的链接 */}
      <Link to="/contact" prefetch>联系我们</Link>

      {/* 替换历史记录 */}
      <Link to="/home" replace>首页</Link>

      {/* 导航链接（自动添加活跃状态） */}
      <NavLink to="/products" activeClass="nav-active" exact>
        产品
      </NavLink>

      {/* 带活跃样式的导航链接 */}
      <NavLink
        to="/blog"
        activeClass="active"
        activeStyle={{ fontWeight: "bold", color: "blue" }}
      >
        博客
      </NavLink>
    </nav>
  );
}
```

### Hooks 使用

```typescript
import {
  useMeta,
  useParams,
  useQuery,
  useRoute,
  useRouter,
} from "jsr:@dreamer/router/client";

function UserPage() {
  const router = useRouter();
  const route = useRoute();
  const params = useParams();
  const query = useQuery();
  const meta = useMeta();

  // 获取路由参数
  const userId = params.id;

  // 获取查询参数
  const tab = query.tab || "profile";

  // 获取元数据
  const pageTitle = meta.title;

  return (
    <div>
      <h1>{pageTitle}</h1>
      <p>用户 ID: {userId}</p>
      <p>当前标签: {tab}</p>
      <button onClick={() => router.navigate("/users")}>
        返回用户列表
      </button>
    </div>
  );
}
```

---

## 🎨 高级用法

### 服务端中间件

```typescript
// 认证中间件
const authMiddleware: MiddlewareFunction = async (context, next) => {
  const token = context.request.headers.get("Authorization");

  if (!token && context.route?.meta?.requiresAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 将用户信息存入 context.data
  context.data.user = await validateToken(token);

  return next();
};

// 日志中间件
const logMiddleware: MiddlewareFunction = async (context, next) => {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  console.log(
    `${context.request.method} ${context.request.url} - ${duration}ms`,
  );
  return response;
};

router.use(logMiddleware);
router.use(authMiddleware);
```

### 路由级别中间件

在路由目录下创建 `_middleware.ts` 文件：

```typescript
// src/routes/admin/_middleware.ts
import type { MiddlewareContext } from "@dreamer/router";

export default async function middleware(
  context: MiddlewareContext,
  next: () => Promise<Response>,
) {
  // 只对 /admin/* 路由生效
  if (!context.data.user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  return next();
}
```

### Hash 模式

```typescript
const router = createRouter({
  routes: [...],
  mode: "hash", // 使用 hash 模式
});

// URL 格式：http://example.com/#/about
await router.navigate("/about");
```

### 基础路径

```typescript
const router = createRouter({
  routes: [...],
  basePath: "/app", // 部署在 /app 子路径下
});

// 实际 URL：http://example.com/app/about
await router.navigate("/about");
```

---

## 📚 API 文档

### 服务端 API（@dreamer/router）

#### createRouter(options)

创建服务端路由器实例。

| 参数              | 类型                  | 默认值    | 说明           |
| ----------------- | --------------------- | --------- | -------------- |
| routesDir         | string                | -         | 路由文件目录   |
| apiMode           | "restful" \| "action" | "restful" | API 路由形式   |
| redirects         | RedirectConfig[]      | []        | 重定向配置     |
| middlewares       | MiddlewareFunction[]  | []        | 全局中间件     |
| skipAppValidation | boolean               | false     | 跳过 _app 验证 |

#### Router 方法

| 方法                            | 返回值                        | 说明                 |
| ------------------------------- | ----------------------------- | -------------------- |
| scan()                          | Promise\<void\>               | 扫描路由文件         |
| match(pathname, options?)       | Promise\<RouteMatch \| null\> | 匹配路由             |
| handleRequest(request, handler) | Promise\<Response\>           | 处理请求（带中间件） |
| use(middleware)                 | void                          | 添加全局中间件       |
| addRedirect(config)             | void                          | 添加重定向配置       |
| getRoutes()                     | Route[]                       | 获取所有路由         |
| getClientRoutes()               | ClientRoute[]                 | 获取客户端路由配置   |
| getApiMode()                    | "restful" \| "action"         | 获取 API 模式        |
| getSpecialFile(name)            | string \| undefined           | 获取特殊文件路径     |
| loadModule(path)                | Promise\<any\>                | 加载模块             |
| clearCache(path?)               | void                          | 清除模块缓存         |

#### 辅助函数

| 函数                                             | 说明           |
| ------------------------------------------------ | -------------- |
| json(data, status?)                              | 创建 JSON 响应 |
| html(content, status?)                           | 创建 HTML 响应 |
| notFound(message?)                               | 创建 404 响应  |
| createRedirectResponse(destination, statusCode?) | 创建重定向响应 |

### 客户端 API（@dreamer/router/client）

#### createRouter(options)

创建客户端路由器实例。

| 参数           | 类型                  | 默认值    | 说明         |
| -------------- | --------------------- | --------- | ------------ |
| routes         | ClientRoute[]         | -         | 路由配置列表 |
| engine         | "preact" \| "react"   | "preact"  | 渲染引擎     |
| basePath       | string                | ""        | 基础路径     |
| mode           | "history" \| "hash"   | "history" | 路由模式     |
| scrollBehavior | ScrollBehaviorHandler | -         | 滚动行为函数 |

#### ClientRouter 方法

| 方法                        | 返回值                     | 说明                     |
| --------------------------- | -------------------------- | ------------------------ |
| start()                     | void                       | 启动路由器，开始拦截链接 |
| navigate(path, options?)    | Promise\<void\>            | 导航到指定路径           |
| replace(path, state?)       | Promise\<void\>            | 替换当前历史记录并导航   |
| back()                      | void                       | 后退一步                 |
| forward()                   | void                       | 前进一步                 |
| go(delta)                   | void                       | 前进/后退指定步数        |
| match(pathname)             | ClientRouteMatch \| null   | 匹配路由                 |
| getCurrentRoute()           | ClientRouteMatch \| null   | 获取当前路由             |
| prefetch(path)              | Promise\<unknown \| null\> | 预取路由组件             |
| isActive(path, exact?)      | boolean                    | 检查路径是否匹配当前路由 |
| resolvePath(path)           | string                     | 解析路径（添加基础路径） |
| onRouteChange(callback)     | () => void                 | 监听路由变化             |
| onNavigationState(callback) | () => void                 | 监听导航状态变化         |
| beforeRoute(guard)          | () => void                 | 添加前置守卫             |
| afterRoute(guard)           | () => void                 | 添加后置守卫             |
| getRoutes()                 | ClientRoute[]              | 获取所有路由             |
| getEngine()                 | string                     | 获取渲染引擎             |
| getMode()                   | RouterMode                 | 获取路由模式             |
| getBasePath()               | string                     | 获取基础路径             |
| getNavigationState()        | NavigationState            | 获取导航状态             |
| addRoute(route)             | void                       | 动态添加路由             |
| removeRoute(path)           | boolean                    | 动态移除路由             |
| setComponentLoader(loader)  | void                       | 设置组件加载器           |
| clearCache(component?)      | void                       | 清除组件缓存             |
| destroy()                   | void                       | 销毁路由器               |

#### Hooks

| Hook                      | 返回值                   | 说明             |
| ------------------------- | ------------------------ | ---------------- |
| useRouter()               | ClientRouter             | 获取路由器实例   |
| useRoute()                | ClientRouteMatch \| null | 获取当前路由     |
| useParams()               | Record\<string, string\> | 获取路由参数     |
| useQuery()                | Record\<string, string\> | 获取查询参数     |
| useMeta()                 | RouteMeta                | 获取路由元数据   |
| useNavigationState()      | NavigationState          | 获取导航状态     |
| useIsActive(path, exact?) | boolean                  | 检查路径是否活跃 |

#### 组件工厂函数

| 函数                      | 说明                  |
| ------------------------- | --------------------- |
| createLinkComponent(h)    | 创建 Link 组件        |
| createNavLinkComponent(h) | 创建 NavLink 组件     |
| createLinkProps(props)    | 创建 Link 属性对象    |
| createNavLinkProps(props) | 创建 NavLink 属性对象 |

#### 类型定义

```typescript
interface ClientRoute {
  path: string; // 路由路径
  component: string; // 组件标识
  type?: "static" | "dynamic" | "wildcard" | "optional";
  meta?: RouteMeta; // 路由元数据
  redirect?: string; // 重定向目标
}

interface RouteMeta {
  title?: string; // 页面标题
  requiresAuth?: boolean; // 是否需要认证
  keepAlive?: boolean; // 是否缓存组件
  [key: string]: unknown; // 自定义数据
}

interface ClientRouteMatch {
  route: ClientRoute;
  params: Record<string, string>;
  query: Record<string, string>;
  fullPath: string;
  hash: string;
  meta: RouteMeta;
  load?: () => Promise<unknown>;
}

type NavigationState = "idle" | "loading" | "error";
type RouterMode = "history" | "hash";
```

---

## 📊 测试报告

| 指标     | 数值       |
| -------- | ---------- |
| 总测试数 | 130        |
| 通过     | 130        |
| 失败     | 0          |
| 通过率   | 100%       |
| 测试时间 | 2026-02-03 |
| 执行时间 | ~31s       |

### 运行时兼容性

| 运行时 | 测试数 | 通过 | 状态 |
| ------ | ------ | ---- | ---- |
| Deno   | 130    | 130  | ✅   |
| Bun    | 130    | 130  | ✅   |

### 测试文件覆盖

| 测试文件               | 测试数量 | 覆盖内容                                              |
| ---------------------- | -------- | ----------------------------------------------------- |
| client-browser.test.ts | 27       | 浏览器测试：导航、守卫、链接拦截、历史操作            |
| client.test.ts         | 69       | 客户端单元测试：路由匹配、元数据、basePath、hash 模式 |
| mod.test.ts            | 34       | 服务端测试：扫描、匹配、重定向、中间件                |

详细测试报告请查看 [TEST_REPORT.md](./TEST_REPORT.md)。

---

## 📝 注意事项

### 服务端和客户端代码分离

**重要**：客户端路由代码不能使用服务端 API。

```typescript
// ❌ 错误 - 客户端不能使用服务端 API
import * as path from "std/path";

// ✅ 正确 - 使用浏览器 API
const url = new URL(window.location.href);
```

### API 路由形式选择

API 路由必须通过配置选择使用哪种形式，**不能混合使用**：

- `apiMode: "restful"` - RESTful 形式（GET、POST、PUT、DELETE）
- `apiMode: "action"` - 操作方法形式（login、register）

### navigate 方法是异步的

`navigate()` 方法返回 Promise，需要 await 等待导航完成：

```typescript
// 等待导航完成（包括守卫执行）
await router.navigate("/about");
```

### 必须调用 start() 方法

客户端路由器需要调用 `start()` 方法来启动链接拦截：

```typescript
const router = createRouter({ routes });
router.start(); // 开始拦截 <a> 标签点击
```

### 不拦截的链接

以下链接不会被客户端路由器拦截：

- 带 `target="_blank"` 属性
- 带 `download` 属性
- 带 `data-native` 属性
- 外部链接（不同源）
- 按住 Ctrl/Cmd/Shift/Alt 键点击

---

## 📋 变更日志

**v1.0.5**（2026-02-09）

- **修复**：服务端路由 (processFile) - 路径规范化，解决 Windows 下
  specialFiles、API 检测、route.path 异常
- **变更**：提升 @dreamer/test 至 ^1.0.2

详见 [CHANGELOG-zh.md](./CHANGELOG-zh.md)。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE.md](./LICENSE.md)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
