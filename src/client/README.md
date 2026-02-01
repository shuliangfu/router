# @dreamer/router/client

> 一个用于浏览器的路由导航库，提供客户端路由导航功能，支持 SPA 应用的路由管理

[![JSR](https://jsr.io/badges/@dreamer/router/client)](https://jsr.io/@dreamer/router/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE.md)

---

## 服务端支持

服务端路由支持请查看 [服务端文档](../../README.md)。

## 功能

客户端路由导航库，提供统一的客户端路由抽象层，支持浏览器路由导航和历史记录管理。使用浏览器原生 API（`history.pushState`、`popstate` 事件等）实现，不包含任何服务端依赖。

## 特性

### 客户端路由导航

- **基于浏览器原生 API**：
  - 使用 `history.pushState` 和 `history.replaceState` 进行路由导航
  - 使用 `popstate` 事件监听浏览器前进/后退
  - 使用 `location.pathname` 获取当前路径
  - 完全基于浏览器 API，无外部依赖
- **路由导航方法**：
  - `navigate(path, replace)` - 导航到指定路径
  - `go(delta)` - 前进或后退指定步数
  - `back()` - 后退一步
  - `forward()` - 前进一步
- **历史记录管理**：
  - 自动管理浏览器历史记录
  - 支持前进/后退导航
  - 支持替换当前历史记录（不添加新记录）

### 路由类型支持

- **静态路由**：
  - `/about` → 精确匹配
- **动态路由**：
  - `/user/:id` → 匹配 `/user/123`，提取 `{ id: "123" }`
- **通配符路由**：
  - `/posts/*` → 匹配 `/posts/any/path/here`，提取 `{ "*": "any/path/here" }`
- **可选参数路由**：
  - `/blog/:slug?` → 匹配 `/blog` 或 `/blog/my-post`，提取 `{ slug?: "my-post" }`
- **查询参数解析**：
  - 自动解析 URL 查询参数（`?key=value`）

### 路由守卫

- **前置守卫**（`beforeRoute`）：
  - 在路由变化前执行
  - 可以阻止导航（返回 `false`）
  - 支持异步守卫函数
  - 可以用于权限检查、登录验证等
- **后置守卫**（`afterRoute`）：
  - 在路由变化后执行
  - 可以用于日志记录、页面追踪等
  - 支持异步守卫函数

### 路由变化监听

- **路由变化事件**：
  - 自动监听浏览器 `popstate` 事件（前进/后退）
  - 监听 `navigate` 方法触发的路由变化
  - 提供路由变化回调函数
- **当前路由获取**：
  - `getCurrentRoute()` - 获取当前路由匹配结果
  - 包含路由信息、参数、查询参数等

### 路由匹配

- **客户端路由匹配**：
  - 支持所有路由类型（静态、动态、通配符、可选参数）
  - 自动解析路由参数和查询参数
  - 返回完整的匹配结果（路由、参数、查询参数）
- **组件懒加载**：
  - 支持组件懒加载（通过 `load()` 方法）
  - 需要根据构建工具实现具体的加载逻辑

## 安装

```bash
deno add jsr:@dreamer/router/client
```

## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **环境**：✅ 支持（浏览器环境）
- **依赖**：无外部依赖（纯 TypeScript 实现）
- **浏览器要求**：支持 `history.pushState` 和 `popstate` 事件的现代浏览器

## 🚀 快速开始

### 基本使用（创建路由和导航）

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

// 创建客户端路由
// 路由配置通常由服务端生成并传递给客户端
const router = createRouter({
  routes: [
    { path: "/", component: "index", type: "static" },
    { path: "/about", component: "about", type: "static" },
    { path: "/user/:id", component: "user/[id]", type: "dynamic" },
    { path: "/posts/*", component: "posts/[...slug]", type: "wildcard" },
    { path: "/blog/:slug?", component: "blog/[[slug]]", type: "optional" },
  ],
  framework: "preact", // 或 "react"
});

// 导航到指定路径
router.navigate("/about");

// 替换当前历史记录（不添加新记录）
router.navigate("/about", true);

// 后退一步
router.back();

// 前进一步
router.forward();

// 前进或后退指定步数
router.go(-2); // 后退两步
router.go(1);  // 前进一步
```

### 路由匹配

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

const router = createRouter({
  routes: [
    { path: "/", component: "index" },
    { path: "/user/:id", component: "user/[id]" },
    { path: "/posts/*", component: "posts/[...slug]" },
  ],
});

// 匹配当前路径
const match = router.match(window.location.pathname);

if (match) {
  console.log("匹配的路由:", match.route.path);
  console.log("路由参数:", match.params);
  console.log("查询参数:", match.query);

  // 加载组件（需要根据构建工具实现）
  // const Component = await match.load();
  // render(<Component params={match.params} query={match.query} />);
}

// 匹配指定路径
const userMatch = router.match("/user/123?tab=profile");
if (userMatch) {
  console.log(userMatch.params); // { id: "123" }
  console.log(userMatch.query);  // { tab: "profile" }
}
```

### 路由类型示例

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

const router = createRouter({
  routes: [
    // 静态路由
    { path: "/", component: "index", type: "static" },
    { path: "/about", component: "about", type: "static" },

    // 动态路由
    { path: "/user/:id", component: "user/[id]", type: "dynamic" },
    // 匹配: /user/123 → { id: "123" }
    // 匹配: /user/456 → { id: "456" }

    // 通配符路由
    { path: "/posts/*", component: "posts/[...slug]", type: "wildcard" },
    // 匹配: /posts/hello → { "*": "hello" }
    // 匹配: /posts/hello/world → { "*": "hello/world" }

    // 可选参数路由
    { path: "/blog/:slug?", component: "blog/[[slug]]", type: "optional" },
    // 匹配: /blog → {}
    // 匹配: /blog/my-post → { slug: "my-post" }
  ],
});

// 测试路由匹配
const match1 = router.match("/user/123");
console.log(match1?.params); // { id: "123" }

const match2 = router.match("/posts/hello/world");
console.log(match2?.params); // { "*": "hello/world" }

const match3 = router.match("/blog");
console.log(match3?.params); // {}

const match4 = router.match("/blog/my-post");
console.log(match4?.params); // { slug: "my-post" }
```

### 路由守卫

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

const router = createRouter({
  routes: [
    { path: "/", component: "index" },
    { path: "/login", component: "login" },
    { path: "/dashboard", component: "dashboard" },
  ],
});

// 前置守卫：权限检查
router.beforeRoute(async (to, from) => {
  // 检查是否需要登录
  if (to.route.path === "/dashboard" && !isLoggedIn()) {
    // 重定向到登录页
    router.navigate("/login");
    return false; // 阻止导航
  }

  // 允许导航
  return true;
});

// 前置守卫：异步权限检查
router.beforeRoute(async (to, from) => {
  if (to.route.path.startsWith("/admin")) {
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      router.navigate("/403");
      return false;
    }
  }
});

// 后置守卫：页面追踪
router.afterRoute((to, from) => {
  // 发送页面访问统计
  analytics.track("page_view", {
    path: to.route.path,
    params: to.params,
  });
});

// 后置守卫：滚动到顶部
router.afterRoute(() => {
  window.scrollTo(0, 0);
});
```

### 路由变化监听

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

const router = createRouter({
  routes: [
    { path: "/", component: "index" },
    { path: "/about", component: "about" },
  ],
});

// 监听路由变化
const unsubscribe = router.onRouteChange((match) => {
  if (match) {
    console.log("路由变化:", match.route.path);
    console.log("参数:", match.params);
    console.log("查询参数:", match.query);

    // 更新页面标题
    document.title = `页面 - ${match.route.path}`;

    // 更新 UI
    updateUI(match);
  } else {
    console.log("未匹配到路由");
  }
});

// 取消监听
// unsubscribe();
```

### 获取当前路由

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

const router = createRouter({
  routes: [
    { path: "/", component: "index" },
    { path: "/user/:id", component: "user/[id]" },
  ],
});

// 获取当前路由
const currentRoute = router.getCurrentRoute();

if (currentRoute) {
  console.log("当前路径:", currentRoute.route.path);
  console.log("当前参数:", currentRoute.params);
  console.log("当前查询参数:", currentRoute.query);

  // 根据当前路由更新 UI
  updateActiveNav(currentRoute.route.path);
}
```

---

## 📚 API 文档

### `createRouter(options: ClientRouterOptions): ClientRouter`

创建客户端路由器实例。

**参数：**
- `options.routes` - 路由配置列表（由服务端生成）
- `options.framework` - 框架类型（`"preact"` 或 `"react"`，默认：`"preact"`）

**返回：** `ClientRouter` 实例

**示例：**
```typescript
const router = createRouter({
  routes: [
    { path: "/", component: "index" },
    { path: "/about", component: "about" },
  ],
  framework: "preact",
});
```

### `ClientRouter.navigate(path: string, replace?: boolean): void`

导航到指定路径。

**参数：**
- `path` - 目标路径
- `replace` - 是否替换当前历史记录（默认：`false`）

**示例：**
```typescript
router.navigate("/about");
router.navigate("/about", true); // 替换当前历史记录
```

### `ClientRouter.go(delta: number): void`

前进或后退指定步数。

**参数：**
- `delta` - 步数（正数前进，负数后退）

**示例：**
```typescript
router.go(-1); // 后退一步
router.go(1);  // 前进一步
router.go(-2); // 后退两步
```

### `ClientRouter.back(): void`

后退一步（等同于 `router.go(-1)`）。

### `ClientRouter.forward(): void`

前进一步（等同于 `router.go(1)`）。

### `ClientRouter.match(pathname: string): ClientRouteMatch | null`

匹配路由。

**参数：**
- `pathname` - 路径（如 `/user/123` 或 `/user/123?tab=profile`）

**返回：** 路由匹配结果或 `null`

**示例：**
```typescript
const match = router.match("/user/123?tab=profile");
if (match) {
  console.log(match.params); // { id: "123" }
  console.log(match.query);  // { tab: "profile" }
}
```

### `ClientRouter.getCurrentRoute(): ClientRouteMatch | null`

获取当前路由匹配结果。

**返回：** 当前路由匹配结果或 `null`

### `ClientRouter.onRouteChange(callback: RouteChangeCallback): () => void`

监听路由变化。

**参数：**
- `callback` - 路由变化回调函数

**返回：** 取消监听的函数

**示例：**
```typescript
const unsubscribe = router.onRouteChange((match) => {
  console.log("路由变化:", match);
});
// 取消监听
unsubscribe();
```

### `ClientRouter.beforeRoute(guard: RouteGuard): void`

添加路由前置守卫。

**参数：**
- `guard` - 守卫函数（返回 `false` 可以阻止导航）

**示例：**
```typescript
router.beforeRoute((to, from) => {
  if (!isLoggedIn() && to.route.path === "/dashboard") {
    router.navigate("/login");
    return false; // 阻止导航
  }
  return true;
});
```

### `ClientRouter.afterRoute(guard: RouteGuard): void`

添加路由后置守卫。

**参数：**
- `guard` - 守卫函数

**示例：**
```typescript
router.afterRoute((to) => {
  analytics.track("page_view", { path: to.route.path });
});
```

### `ClientRouter.getRoutes(): ClientRoute[]`

获取所有路由配置。

**返回：** 路由配置列表

## 类型定义

### `ClientRouterOptions`

```typescript
interface ClientRouterOptions {
  /** 路由配置列表（由服务端生成） */
  routes: ClientRoute[];
  /** 框架类型（preact 或 react，默认：preact） */
  framework?: "preact" | "react";
}
```

### `ClientRoute`

```typescript
interface ClientRoute {
  /** 路由路径（如 /user/:id） */
  path: string;
  /** 组件标识（用于懒加载） */
  component: string;
  /** 路由类型 */
  type?: "static" | "dynamic" | "wildcard" | "optional";
}
```

### `ClientRouteMatch`

```typescript
interface ClientRouteMatch {
  /** 匹配的路由 */
  route: ClientRoute;
  /** 路由参数（动态路由参数） */
  params: Record<string, string>;
  /** 查询参数 */
  query: Record<string, string>;
  /** 懒加载组件函数 */
  load?: () => Promise<any>;
}
```

### `RouteChangeCallback`

```typescript
type RouteChangeCallback = (match: ClientRouteMatch | null) => void;
```

### `RouteGuard`

```typescript
type RouteGuard = (
  to: ClientRouteMatch,
  from: ClientRouteMatch | null,
) => boolean | Promise<boolean> | void | Promise<void>;
```

## 使用场景

### CSR 路由导航

客户端路由导航和页面切换，适用于单页应用（SPA）。

```typescript
// 在用户点击链接时导航
function handleLinkClick(e: Event, path: string) {
  e.preventDefault();
  router.navigate(path);
}
```

### SPA 应用

单页应用的路由管理，支持前端路由和浏览器历史记录。

```typescript
// 初始化路由
const router = createRouter({ routes });
router.onRouteChange(handleRouteChange);
```

### 客户端路由匹配

客户端路由匹配和组件加载，支持代码分割和懒加载。

```typescript
// 根据当前路径加载对应组件
const match = router.match(window.location.pathname);
if (match) {
  const Component = await match.load();
  render(<Component params={match.params} />);
}
```

### 浏览器历史管理

管理浏览器历史记录，支持前进、后退、替换等操作。

```typescript
// 替换当前历史记录（不添加新记录）
router.navigate("/new-path", true);
```

## 注意事项

### 路由配置来源

客户端路由配置通常由服务端生成并传递给客户端。服务端使用 `@dreamer/router` 扫描路由文件，生成路由配置，然后通过以下方式传递给客户端：

1. **内联到 HTML**：将路由配置内联到 HTML 中
2. **API 获取**：通过 API 获取路由配置
3. **构建时生成**：在构建时生成路由配置文件

### 组件懒加载

`match.load()` 方法需要根据构建工具实现具体的加载逻辑。例如：

```typescript
// 使用动态 import
const loadComponent = async (component: string) => {
  const module = await import(`./routes/${component}.tsx`);
  return module.default;
};

// 在路由匹配结果中使用
match.load = () => loadComponent(match.route.component);
```

### 浏览器兼容性

需要支持以下浏览器 API：
- `history.pushState` / `history.replaceState`
- `popstate` 事件
- `location.pathname`

现代浏览器（Chrome、Firefox、Safari、Edge）都支持这些 API。

### 与服务端路由的配合

客户端路由通常与服务端路由配合使用：
- **服务端**：使用 `@dreamer/router` 进行 SSR 路由匹配和 API 路由处理
- **客户端**：使用 `@dreamer/router/client` 进行 CSR 路由导航和页面切换

两者使用相同的路由配置，确保服务端和客户端路由一致。

---

## 📝 备注

- **纯浏览器 API 实现**：使用 `globalThis.location`、`globalThis.history` 等浏览器原生 API
- **不依赖服务端 API**：客户端代码不包含任何服务端依赖（如 `path` 模块）
- **统一接口**：与服务端使用相似的 API 接口，降低学习成本
- **类型安全**：完整的 TypeScript 类型支持
- **无外部依赖**：纯 TypeScript 实现，不依赖任何外部库

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE.md](../../../LICENSE.md)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
