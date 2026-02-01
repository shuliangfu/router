# @dreamer/router

> 一个兼容 Deno 和 Bun 的文件路由系统，提供统一的文件路由接口，支持服务端路由匹配和客户端路由导航

[![JSR](https://jsr.io/badges/@dreamer/router)](https://jsr.io/@dreamer/router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![Tests](https://img.shields.io/badge/tests-91%20passed-brightgreen)](./TEST_REPORT.md)

---

## 🎯 功能

文件路由系统，提供统一的文件路由抽象层：
- **服务端**：路由文件扫描、SSR 路由匹配、API 路由处理
- **客户端**：浏览器路由导航、路由守卫、历史操作

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

| 环境 | 支持 | 说明 |
|------|------|------|
| Deno | ✅ | 2.6+ |
| Bun | ✅ | 1.3.5+ |
| 服务端 | ✅ | SSR 路由匹配、API 路由 |
| 浏览器 | ✅ | 客户端路由导航（/client） |

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

### 客户端路由（@dreamer/router/client）

- **路由导航**：
  - `navigate()` 编程式导航（异步，返回 Promise）
  - `back()`/`forward()`/`go()` 历史操作
  - 支持替换历史记录（replace 模式）
- **路由守卫**：
  - `beforeRoute` 前置守卫（可阻止导航）
  - `afterRoute` 后置守卫
  - 动态添加/移除守卫
- **路由匹配**：
  - 静态/动态/通配符路由匹配
  - 查询参数解析
  - 路由参数提取
- **多引擎支持**：
  - Preact（默认）
  - React
  - Vue3
- **动态路由管理**：
  - `addRoute()` 动态添加路由
  - `removeRoute()` 动态移除路由
  - `setComponentLoader()` 自定义组件加载器

---

## 🎯 使用场景

### 服务端

- **SSR 路由匹配**：服务端路由匹配和渲染
- **API 路由**：处理 API 请求
- **路由文件扫描**：扫描和注册路由文件

### 客户端

- **SPA 路由导航**：单页应用路由切换
- **路由守卫**：权限控制、登录检查
- **历史操作**：前进、后退、跳转

---

## 🚀 快速开始

### 服务端路由

```typescript
import { createRouter } from "jsr:@dreamer/router";

// 创建文件路由
const router = createRouter({
  routesDir: "./src/routes",
  framework: "preact",
  ssr: true,
  apiMode: "restful",
});

// 扫描路由文件
await router.scan();

// 获取路由列表
const routes = router.getRoutes();

// 服务端路由匹配
const match = router.match("/user/123");
if (match) {
  const Component = await match.load();
  const html = renderToString(<Component params={match.params} />);
}
```

### 客户端路由

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

// 创建客户端路由器
const router = createRouter({
  routes: [
    { path: "/", component: "index", type: "static" },
    { path: "/about", component: "about", type: "static" },
    { path: "/user/:id", component: "user/[id]", type: "dynamic" },
  ],
  engine: "preact", // 或 "react"、"vue3"
});

// 设置组件加载器
router.setComponentLoader(async (component) => {
  return await import(`./routes/${component}.tsx`);
});

// 路由守卫
router.beforeRoute((to, from) => {
  if (to.route.path === "/admin" && !isAuthenticated()) {
    return false; // 阻止导航
  }
  return true;
});

// 导航（异步方法）
await router.navigate("/about");

// 历史操作
router.back();
router.forward();
router.go(-2);

// 监听路由变化
const unsubscribe = router.onRouteChange((match) => {
  console.log("当前路由:", match?.route.path);
});
```

---

## 🎨 使用示例

### API 路由示例

#### RESTful 形式

```typescript
// src/routes/api/user.ts
export async function GET(request: Request) {
  const users = await getUsers();
  return Response.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await createUser(body);
  return Response.json(user, { status: 201 });
}
```

#### 操作方法形式

```typescript
// src/routes/api/user.ts
export async function login(request: Request) {
  const { username, password } = await request.json();
  const user = await authenticateUser(username, password);
  return Response.json(user);
}

export async function register(request: Request) {
  const body = await request.json();
  const user = await createUser(body);
  return Response.json(user, { status: 201 });
}
```

### 客户端路由守卫

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

const router = createRouter({ routes: [...] });

// 前置守卫 - 权限检查
const removeGuard = router.beforeRoute((to, from) => {
  if (to.route.path.startsWith("/admin")) {
    if (!isAuthenticated()) {
      router.navigate("/login");
      return false;
    }
  }
  return true;
});

// 后置守卫 - 页面统计
router.afterRoute((to, from) => {
  analytics.trackPageView(to.route.path);
});

// 移除守卫
removeGuard();
```

### 动态路由管理

```typescript
const router = createRouter({ routes: [] });

// 动态添加路由
router.addRoute({
  path: "/dynamic",
  component: "dynamic",
  type: "static",
});

// 动态移除路由
router.removeRoute("/dynamic");

// 获取当前引擎
const engine = router.getEngine(); // "preact" | "react" | "vue3"

// 销毁路由器
router.destroy();
```

---

## 📚 API 文档

### 服务端 API（@dreamer/router）

#### createRouter(options)

创建服务端路由器实例。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| routesDir | string | - | 路由文件目录 |
| framework | "preact" \| "react" | "preact" | 前端框架 |
| ssr | boolean | true | 是否启用 SSR |
| apiMode | "restful" \| "action" | - | API 路由形式 |

#### Router 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| scan() | Promise\<void\> | 扫描路由文件 |
| match(pathname) | RouteMatch \| null | 匹配路由 |
| getRoutes() | Route[] | 获取所有路由 |
| getSpecialFile(name) | string \| undefined | 获取特殊文件路径 |

### 客户端 API（@dreamer/router/client）

#### createRouter(options)

创建客户端路由器实例。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| routes | ClientRoute[] | - | 路由配置列表 |
| engine | "preact" \| "react" \| "vue3" | "preact" | 渲染引擎 |

#### ClientRouter 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| navigate(path, replace?) | Promise\<void\> | 导航到指定路径 |
| back() | void | 后退一步 |
| forward() | void | 前进一步 |
| go(delta) | void | 前进/后退指定步数 |
| match(pathname) | ClientRouteMatch \| null | 匹配路由 |
| getCurrentRoute() | ClientRouteMatch \| null | 获取当前路由 |
| getRoutes() | ClientRoute[] | 获取所有路由 |
| getEngine() | "preact" \| "react" \| "vue3" | 获取渲染引擎 |
| onRouteChange(callback) | () => void | 监听路由变化 |
| beforeRoute(guard) | () => void | 添加前置守卫 |
| afterRoute(guard) | void | 添加后置守卫 |
| removeBeforeRoute(guard) | boolean | 移除前置守卫 |
| removeAfterRoute(guard) | boolean | 移除后置守卫 |
| addRoute(route) | void | 动态添加路由 |
| removeRoute(path) | boolean | 动态移除路由 |
| setComponentLoader(loader) | void | 设置组件加载器 |
| destroy() | void | 销毁路由器 |

#### ClientRoute 类型

```typescript
interface ClientRoute {
  path: string;           // 路由路径
  component: string;      // 组件标识
  type: "static" | "dynamic" | "wildcard" | "optional";
}
```

#### ClientRouteMatch 类型

```typescript
interface ClientRouteMatch {
  route: ClientRoute;              // 匹配的路由
  params: Record<string, string>;  // 路由参数
  query: Record<string, string>;   // 查询参数
  load: () => Promise<unknown>;    // 组件加载函数
}
```

---

## 📊 测试报告

| 指标 | 数值 |
|------|------|
| 总测试数 | 91 |
| 通过 | 91 |
| 失败 | 0 |
| 通过率 | 100% |
| 测试时间 | 2026-02-02 |

详细测试报告请查看 [TEST_REPORT.md](./TEST_REPORT.md)

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
