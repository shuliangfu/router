# @dreamer/router

一个用于 Deno 的文件路由系统，提供统一的文件路由接口，支持服务端路由匹配。

## 功能

文件路由系统，提供统一的文件路由抽象层，支持服务端路由匹配（SSR）。

## 特性

### 服务端路由（@dreamer/router）

- **文件路由系统**（类似 Next.js、Remix）：
  - 基于文件系统自动生成路由
  - 文件结构即路由结构
  - 自动路由发现和注册
  - 支持嵌套路由
  - 使用 Deno 文件系统 API 扫描路由文件
- **路由类型支持**：
  - 静态路由（`/about.tsx` → `/about`）
  - 动态路由（`/user/[id].tsx` → `/user/:id`）
  - 通配符路由（`/posts/[...slug].tsx` → `/posts/*`）
  - 可选参数路由（`/blog/[[slug]].tsx` → `/blog` 或 `/blog/:slug`）
- **API 路由支持**：
  - API 路由（`/api/user.ts` → `/api/user`）
  - 动态 API 路由（`/api/user/[id].ts` → `/api/user/:id`）
  - **RESTful 形式**：HTTP 方法支持（GET、POST、PUT、DELETE、PATCH 等）
  - **操作方法形式**：函数名支持（login()、register()、getUser()、deleteUser() 等）
  - 请求和响应处理（Request、Response）
  - 仅服务端运行（不包含客户端代码）
  - 配置选择 API 形式（不能混合使用）
- **特殊文件处理**：
  - `_app.tsx`：应用根组件（必须），定义 HTML 结构
  - `_layout.tsx`：布局组件（可选），全局布局
  - `_404.tsx`：404 页面（可选），路由不匹配时显示
  - `_error.tsx`：错误页面（可选），发生错误时显示
  - `_middleware.ts`：路由中间件（可选），路由匹配前执行
- **服务端路由功能**：
  - 路由参数解析（`params`）
  - 查询参数解析（`query`）
  - 服务端路由匹配（SSR）
  - 路由懒加载（代码分割）
  - 可以使用服务端 API（如 `path` 模块）


## 设计原则

**所有 @dreamer/* 库都遵循以下原则**：

- **主包（@dreamer/xxx）**：用于服务端（Deno 运行时）
- **客户端子包（@dreamer/xxx/client）**：用于客户端（浏览器环境）

这样可以：
- 明确区分服务端和客户端代码
- 避免在客户端代码中引入服务端依赖
- 提供更好的类型安全和代码提示
- 支持更好的 tree-shaking

## 使用场景

### 服务端

- **SSR 路由匹配**：服务端路由匹配和渲染
- **API 路由**：处理 API 请求（RESTful 或操作方法形式）
- **路由文件扫描**：扫描和注册路由文件
- **服务端路由处理**：使用服务端 API 处理路由


## 优先级

⭐⭐⭐⭐⭐

## 安装

### 服务端

```bash
deno add jsr:@dreamer/router
```


## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **服务端**：✅ 支持（Deno 运行时，SSR 路由匹配、API 路由）
  - 使用 Deno 文件系统 API 扫描路由文件
  - 支持服务端路由匹配和 SSR 渲染
  - 支持 API 路由处理（仅服务端运行）
  - 可以使用服务端 API（如 `path` 模块）
- **客户端**：✅ 支持（浏览器环境，通过 `jsr:@dreamer/router/client` 使用客户端路由导航）
- **依赖**：无外部依赖（纯 TypeScript 实现）

## 使用示例

### 服务端路由

#### 基本使用（服务端路由匹配）

```typescript
import { createRouter } from "jsr:@dreamer/router";
import * as path from "std/path"; // ✅ 服务端可以使用

// 创建文件路由
const router = createRouter({
  routesDir: "./src/routes",
  framework: "preact", // 或 "react"（默认 Preact）
  ssr: true, // SSR 模式
  // API 路由形式选择（必须配置，不能混合使用）
  apiMode: "restful", // 或 "action"
});

// 自动扫描路由文件并生成路由配置（使用 Deno 文件系统 API）
await router.scan();

// 获取路由列表
const routes = router.getRoutes();
// [
//   { path: "/", file: "src/routes/index.tsx" },
//   { path: "/about", file: "src/routes/about.tsx" },
//   { path: "/user/:id", file: "src/routes/user/[id].tsx" },
//   ...
// ]

// 服务端路由匹配（SSR）
const match = router.match("/user/123");
if (match) {
  // 服务端可以使用 path 等服务端 API
  const filePath = path.join("./src/routes", match.file); // ✅
  const Component = await match.load(); // 懒加载组件
  const html = renderToString(<Component params={match.params} />);
}
```

#### API 路由（服务端）

```typescript
import { createRouter } from "jsr:@dreamer/router";

const router = createRouter({
  routesDir: "./src/routes",
  apiMode: "restful", // 或 "action"
});

await router.scan();

// 服务端 API 路由匹配
const apiMatch = router.match("/api/user/123", { method: "GET" });
if (apiMatch && apiMatch.isApi) {
  // 调用 API 处理函数
  const handler = apiMatch.handlers.GET; // RESTful 形式
  // 或 apiMatch.handlers.getUser; // 操作方法形式
  const response = await handler(request, { params: apiMatch.params });
  return response;
}
```

## 客户端支持

客户端路由支持请查看 [client/README.md](./src/client/README.md)。
      <p>Query: {searchParams.get("tab")}</p>
    </div>
  );
}
```

### API 路由示例

`@dreamer/router` 支持两种 API 路由形式，需要通过配置选择使用哪种形式，**不能混合使用**。

#### 形式 1：RESTful API（HTTP 方法形式）

**服务端配置**：
```typescript
// 服务端代码
import { createRouter } from "jsr:@dreamer/router";

const router = createRouter({
  routesDir: "./src/routes",
  apiMode: "restful", // 使用 RESTful 形式
});
```

**API 路由文件**：
```typescript
// src/routes/api/user.ts
// 导出 HTTP 方法处理函数

// GET /api/user
export async function GET(request: Request) {
  const users = await getUsers();
  return Response.json(users);
}

// POST /api/user
export async function POST(request: Request) {
  const body = await request.json();
  const user = await createUser(body);
  return Response.json(user, { status: 201 });
}

// PUT /api/user
export async function PUT(request: Request) {
  const body = await request.json();
  const user = await updateUser(body);
  return Response.json(user);
}

// DELETE /api/user
export async function DELETE(request: Request) {
  await deleteUser();
  return new Response(null, { status: 204 });
}
```

**客户端调用**：
```typescript
// 客户端代码（使用 fetch API）
fetch("/api/user", { method: "GET" });      // GET /api/user
fetch("/api/user", { method: "POST", ... }); // POST /api/user
fetch("/api/user", { method: "PUT", ... });  // PUT /api/user
fetch("/api/user", { method: "DELETE" });    // DELETE /api/user
```

#### 形式 2：操作方法 API（函数名形式）

**服务端配置**：
```typescript
// 服务端代码
import { createRouter } from "jsr:@dreamer/router";

const router = createRouter({
  routesDir: "./src/routes",
  apiMode: "action", // 使用操作方法形式
});
```

**API 路由文件**：
```typescript
// src/routes/api/user.ts
// 导出操作方法函数

// POST /api/user/login
export async function login(request: Request) {
  const body = await request.json();
  const { username, password } = body;
  const user = await authenticateUser(username, password);
  return Response.json(user);
}

// POST /api/user/register
export async function register(request: Request) {
  const body = await request.json();
  const user = await createUser(body);
  return Response.json(user, { status: 201 });
}

// POST /api/user/logout
export async function logout(request: Request) {
  await clearUserSession();
  return new Response(null, { status: 204 });
}

// GET /api/user/getUser
export async function getUser(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getUserById(userId);
  return Response.json(user);
}

// GET /api/user/getList
export async function getList(request: Request) {
  const users = await getUsers();
  return Response.json(users);
}

// POST /api/user/updateUser
export async function updateUser(request: Request) {
  const body = await request.json();
  const user = await updateUserById(body.id, body);
  return Response.json(user);
}

// POST /api/user/deleteUser
export async function deleteUser(request: Request) {
  const body = await request.json();
  await deleteUserById(body.id);
  return new Response(null, { status: 204 });
}
```

**客户端调用**：
```typescript
// 客户端代码（使用 fetch API）
fetch("/api/user/login", { method: "POST", ... });      // POST /api/user/login
fetch("/api/user/register", { method: "POST", ... });   // POST /api/user/register
fetch("/api/user/logout", { method: "POST" });           // POST /api/user/logout
fetch("/api/user/getUser", { method: "GET" });          // GET /api/user/getUser
fetch("/api/user/getList", { method: "GET" });          // GET /api/user/getList
fetch("/api/user/updateUser", { method: "POST", ... });  // POST /api/user/updateUser
fetch("/api/user/deleteUser", { method: "POST", ... });  // POST /api/user/deleteUser
```

**操作方法形式的特点**：
- ✅ **语义化**：函数名直接表达操作意图（login、register、getUser 等）
- ✅ **统一接口**：所有操作都通过路径区分，HTTP 方法统一（GET 用于查询，POST 用于修改）
- ✅ **易于理解**：不需要理解 RESTful 规范，直接看函数名就知道功能
- ✅ **适合业务逻辑**：更适合复杂的业务操作，不局限于 CRUD

**动态 API 路由（RESTful 形式）**：
```typescript
// src/routes/api/user/[id].ts
// GET /api/user/:id

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserById(params.id);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json(user);
}

// PUT /api/user/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const user = await updateUserById(params.id, body);
  return Response.json(user);
}

// DELETE /api/user/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await deleteUserById(params.id);
  return new Response(null, { status: 204 });
}
```

**动态 API 路由（操作方法形式）**：
```typescript
// src/routes/api/user/[id].ts
// POST /api/user/:id/getUser
// POST /api/user/:id/updateUser
// POST /api/user/:id/deleteUser

export async function getUser(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserById(params.id);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json(user);
}

export async function updateUser(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const user = await updateUserById(params.id, body);
  return Response.json(user);
}

export async function deleteUser(
  request: Request,
  { params }: { params: { id: string } }
) {
  await deleteUserById(params.id);
  return new Response(null, { status: 204 });
}
```

### 文件路由约定

```
src/routes/
├── _app.tsx              # 应用根组件（必须）
├── _layout.tsx            # 布局组件（可选）
├── _404.tsx               # 404 页面（可选）
├── _error.tsx             # 错误页面（可选）
├── _middleware.ts          # 路由中间件（可选）
├── index.tsx              → /（首页）
├── about.tsx              → /about
├── user/
│   ├── index.tsx          → /user
│   ├── [id].tsx           → /user/:id（动态路由）
│   └── [id]/
│       └── edit.tsx       → /user/:id/edit（嵌套路由）
├── posts/
│   ├── index.tsx          → /posts
│   ├── [id].tsx           → /posts/:id
│   └── [...slug].tsx      → /posts/*（通配符路由）
├── blog/
│   └── [[slug]].tsx       → /blog 或 /blog/:slug（可选参数）
└── api/                   # API 路由目录
    ├── user.ts            → /api/user（API 路由）
    ├── user/
    │   └── [id].ts        → /api/user/:id（动态 API 路由）
    └── posts/
        └── [id].ts        → /api/posts/:id（嵌套 API 路由）
```

**API 路由约定**：
- API 路由文件放在 `api/` 目录下（或使用 `api/` 前缀）
- API 路由文件以 `.ts` 结尾（不是 `.tsx`，因为 API 不需要 JSX）
- API 路由仅运行在服务端，不包含客户端代码
- **必须通过配置选择 API 形式**：`apiMode: "restful"` 或 `apiMode: "action"`，**不能混合使用**
- **RESTful 形式**：导出 HTTP 方法函数（GET、POST、PUT、DELETE、PATCH 等）
- **操作方法形式**：导出操作方法函数（login、register、getUser、deleteUser 等）

### 特殊文件说明

| 文件名 | 说明 | 是否必须 | 作用 |
|--------|------|---------|------|
| `_app.tsx` | 应用根组件 | ✅ **必须** | 定义 HTML 结构，所有页面都会包裹在这个组件中 |
| `_layout.tsx` | 布局组件 | ❌ 可选 | 全局布局，所有路由都会使用这个布局 |
| `_404.tsx` | 404 页面 | ❌ 可选 | 路由不匹配时显示的页面 |
| `_error.tsx` | 错误页面 | ❌ 可选 | 发生错误时显示的页面 |
| `_middleware.ts` | 路由中间件 | ❌ 可选 | 路由级别的中间件，在路由匹配前执行 |

**文件处理规则**：
- 以 `_` 开头的文件是特殊文件，**不会生成路由**
- `_app.tsx` 是必须的，用于定义应用的 HTML 结构
- 其他特殊文件都是可选的，根据需要添加
- 特殊文件在服务端和客户端都有对应的处理逻辑

**处理机制**：

1. **扫描阶段**（服务端）：
   - `@dreamer/router` 使用 Deno 文件系统 API 扫描 `routes/` 目录
   - 识别以 `_` 开头的特殊文件和普通路由文件
   - 生成路由配置

2. **特殊文件处理**：
   - `_app.tsx`：作为应用根组件，用于生成 HTML 结构和客户端入口代码
   - `_layout.tsx`：作为布局组件，自动包裹所有路由页面
   - `_404.tsx`：路由不匹配时自动使用
   - `_error.tsx`：发生错误时自动使用
   - `_middleware.ts`：在路由匹配前执行（服务端和客户端都支持）

3. **客户端代码生成**（服务端生成，客户端使用）：
   - `@dreamer/router` 根据 `_app.tsx` 和路由文件自动生成客户端入口代码
   - 生成的代码包含：React/Preact 初始化、路由导航、SSR 水合逻辑
   - **客户端代码使用浏览器原生 API**，不包含任何服务端依赖

4. **编译处理**：
   - `@dreamer/esbuild` 使用 `@dreamer/router` 自动生成的客户端入口代码进行编译
   - 不影响编译和客户端渲染功能

### 服务端和客户端代码分离

**重要**：客户端路由代码不能使用服务端 API，否则会在浏览器中报错。

**❌ 错误示例（客户端代码中）**：
```typescript
// 客户端路由文件中不能使用服务端 API
import * as path from "std/path"; // ❌ 客户端会报错
import { join } from "std/path/join.ts"; // ❌ 客户端会报错

// 客户端路由组件
export default function Page() {
  const filePath = path.join("/", "user", "123"); // ❌ 客户端会报错
  return <div>{filePath}</div>;
}
```

**✅ 正确示例（客户端代码中）**：
```typescript
// 客户端路由文件使用浏览器 API
import { useRouter } from "jsr:@dreamer/router/client";

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();

  // 使用浏览器原生 API
  const url = new URL(window.location.href); // ✅ 浏览器 API
  const pathname = url.pathname; // ✅ 浏览器 API

  // 或使用路由参数（由 @dreamer/router/client 提供）
  return (
    <div>
      <h1>User ID: {params.id}</h1>
      <p>Path: {pathname}</p>
      <button onClick={() => router.navigate("/about")}>跳转</button>
    </div>
  );
}
```

**服务端代码（可以使用服务端 API）**：
```typescript
// 服务端路由匹配代码可以使用服务端 API
import { createRouter } from "jsr:@dreamer/router";
import * as path from "std/path"; // ✅ 服务端可以使用

const router = createRouter({
  routesDir: "./src/routes",
  framework: "preact",
  ssr: true,
});

await router.scan();

// 服务端路由匹配
const match = router.match("/user/123");
if (match) {
  // 服务端可以使用 path 等服务端 API
  const filePath = path.join("./src/routes", match.file); // ✅
  const Component = await match.load();
  const html = renderToString(<Component params={match.params} />);
}
```

### 统一接口示例

服务端和客户端使用相似的接口，只是导入路径不同：

```typescript
// 服务端
import { createRouter } from "jsr:@dreamer/router";

// 客户端
import { createRouter } from "jsr:@dreamer/router/client";

// 两者都支持路由匹配和导航，但实现方式不同
// 服务端：使用 Deno 文件系统 API 扫描路由，支持 SSR
// 客户端：使用浏览器 API 进行路由导航，支持 CSR
```

## 服务端和客户端对比

| 功能 | 服务端（@dreamer/router） | 客户端（@dreamer/router/client） |
|------|-------------------------|--------------------------------|
| **路由文件扫描** | ✅ 支持（使用 Deno 文件系统 API） | ❌ 不支持（路由配置由服务端生成） |
| **路由匹配** | ✅ 支持（SSR 路由匹配） | ✅ 支持（客户端路由匹配） |
| **路由导航** | ❌ 不支持 | ✅ 支持（使用浏览器 API） |
| **API 路由** | ✅ 支持（仅服务端） | ❌ 不支持 |
| **SSR 支持** | ✅ 支持 | ❌ 不支持 |
| **CSR 支持** | ❌ 不支持 | ✅ 支持 |
| **服务端 API** | ✅ 可以使用（path、fs 等） | ❌ 不能使用 |
| **浏览器 API** | ❌ 不能使用 | ✅ 可以使用（window.location、history 等） |

## 状态

🚧 **开发中**

## 备注

- **服务端和客户端分离**：通过 `/client` 子路径明确区分服务端和客户端代码
- **服务端**：专注于路由文件扫描、SSR 路由匹配、API 路由处理
- **代码分离**：客户端代码不包含任何服务端依赖，使用纯浏览器 API
- **统一接口**：服务端和客户端使用相似的 API 接口，降低学习成本
- **类型安全**：完整的 TypeScript 类型支持
- **无外部依赖**：纯 TypeScript 实现
