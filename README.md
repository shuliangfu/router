# @dreamer/router

> A file-based routing system compatible with Deno and Bun, providing a unified
> routing interface for server-side route matching and client-side navigation

English | [中文 (Chinese)](./docs/zh-CN/README.md)

[![JSR](https://jsr.io/badges/@dreamer/router)](https://jsr.io/@dreamer/router)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-146%20passed-brightgreen)](./docs/en-US/TEST_REPORT.md)

---

## 🎯 Features

File-based routing system with a unified abstraction layer:

- **Server**: Route file scanning, SSR route matching, API routes, middleware
  chain, redirects
- **Client**: Browser navigation, route guards, history, scroll behavior,
  prefetch, Link component

---

## 📦 Installation

### Server (Deno)

```bash
deno add jsr:@dreamer/router
```

### Server (Bun)

```bash
bunx jsr add @dreamer/router
```

### Client

```typescript
// Client uses /client subpath
import { createRouter } from "jsr:@dreamer/router/client";
```

---

## 🌍 Environment Compatibility

| Environment | Support | Notes                                      |
| ----------- | ------- | ------------------------------------------ |
| Deno        | ✅      | 2.6+                                       |
| Bun         | ✅      | 1.3.5+                                     |
| Server      | ✅      | SSR route matching, API routes, middleware |
| Browser     | ✅      | Client routing (/client)                   |

---

## ✨ Characteristics

### Server Router (@dreamer/router)

- **File-based routing** (Next.js/Remix style):
  - Auto-generate routes from filesystem
  - File structure = route structure
  - Auto route discovery and registration
  - Nested routes
- **Route types**:
  - Static (`/about.tsx` → `/about`)
  - Dynamic (`/user/[id].tsx` → `/user/:id`)
  - Wildcard (`/posts/[...slug].tsx` → `/posts/*`)
  - Optional params (`/blog/[[slug]].tsx` → `/blog` or `/blog/:slug`)
- **API routes**:
  - RESTful (GET, POST, PUT, DELETE)
  - Action style (login, register, getUser)
  - Dynamic API routes
- **Special files**:
  - `_app.tsx`: App root (required)
  - `_layout.tsx`: Layout (optional)
  - `_404.tsx`: 404 page (optional)
  - `_error.tsx`: Error page (optional)
  - `_middleware.ts`: Route middleware (optional)
- **Redirect config**: Route-level redirect rules
- **Middleware chain**: Chained middleware execution
- **Route metadata**: Custom metadata per route

### Client Router (@dreamer/router/client)

- **Navigation**:
  - `navigate()` programmatic navigation (async, returns Promise)
  - `replace()` replace current history
  - `back()`/`forward()`/`go()` history
  - `start()` start link interception
- **Link interception** (when `interceptLinks: true` and after `start()`):
  - **Intercepted**: Same-origin `http:`/`https:` `<a>` clicks → client-side
    `navigate()`. Cross-page links with hash (e.g. `/about#team`) scroll to the
    target element after navigation.
  - **Not intercepted**: `target="_blank"`, `download`, `data-native`, different
    origin, non-http(s) (`mailto:`, `tel:`, `javascript:`, `blob:`, `data:`),
    same-page anchor only (same path+search + hash, e.g. `#section`), empty
    `href`, Ctrl/Cmd/Shift/Alt + click or non-left button. See
    [Links Not Intercepted](#links-not-intercepted) below for the full list.
- **Route guards**:
  - `beforeRoute` pre-guard (can block or redirect)
  - `afterRoute` post-guard
  - Dynamic add/remove guards
- **Route matching**:
  - Static/dynamic/wildcard matching
  - Query param parsing
  - Route param extraction
- **Scroll behavior**:
  - Custom scroll behavior function
  - Save/restore scroll position
  - Anchor links: cross-page links with hash (e.g. `/about#team`) are
    intercepted and the view scrolls to the target element after navigation
- **Prefetch**:
  - `prefetch()` preload route component
  - Component cache
- **Link/NavLink**:
  - Declarative navigation
  - Active state styling
  - Prefetch support
- **Route mode**:
  - History mode (default)
  - Hash mode (`#/path`)
- **Base path**: Deploy under subpath
- **Route metadata**: Auto page title, etc.
- **Navigation state**: idle/loading/error
- **Multi-engine**:
  - Preact (default)
  - React
- **Hooks**:
  - `useRouter()` router instance
  - `useRoute()` current route
  - `useParams()` route params
  - `useQuery()` query params
  - `useMeta()` route metadata
  - `useNavigationState()` navigation state
  - `useIsActive()` check if path is active

---

## 🚀 Quick Start

### Server Router

```typescript
import { createRouter, json, notFound } from "jsr:@dreamer/router";

// Create file router (engine, ssr from upper framework like dweb render config)
const router = createRouter({
  routesDir: "./src/routes",
  apiMode: "restful",
  // Redirect config
  redirects: [
    { source: "/old-page", destination: "/new-page", permanent: true },
    { source: "/blog/:slug", destination: "/posts/:slug" },
  ],
});

// Add global middleware
router.use(async (context, next) => {
  console.log(`Request: ${context.request.url}`);
  const response = await next();
  console.log(`Response: ${response.status}`);
  return response;
});

// Scan route files
await router.scan();

// Handle request (with middleware chain)
const response = await router.handleRequest(request, async (match, context) => {
  if (!match) {
    return notFound();
  }

  // Handle redirect
  if (match.redirect) {
    return Response.redirect(
      match.redirect.destination,
      match.redirect.statusCode,
    );
  }

  // Load and render page
  const Component = await match.load();
  const html = renderToString(<Component params={match.params} />);
  return new Response(html, { headers: { "Content-Type": "text/html" } });
});
```

### Client Router

```typescript
import {
  createLinkComponent,
  createRouter,
  useParams,
  useRoute,
  useRouter,
} from "jsr:@dreamer/router/client";

// Create client router
const router = createRouter({
  routes: [
    { path: "/", component: "index", meta: { title: "Home" } },
    { path: "/about", component: "about", meta: { title: "About" } },
    { path: "/user/:id", component: "user/[id]", type: "dynamic" },
  ],
  engine: "preact",
  basePath: "/app", // Optional: deploy under subpath
  mode: "history", // or "hash"
  // Scroll behavior
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition;
    return { top: 0, behavior: "smooth" };
  },
});

// Set component loader
router.setComponentLoader(async (component) => {
  return await import(`./routes/${component}.tsx`);
});

// Start router (begin link interception)
router.start();

// Route guard - supports redirect
router.beforeRoute((to, from) => {
  if (to.route.path === "/admin" && !isAuthenticated()) {
    return "/login"; // Return string for redirect
  }
  return true;
});

// Navigation state listener
router.onNavigationState((state, error) => {
  if (state === "loading") {
    showLoadingIndicator();
  } else {
    hideLoadingIndicator();
  }
});

// Navigate
await router.navigate("/about");
await router.replace("/home"); // Replace history

// Prefetch
await router.prefetch("/user/123");

// History
router.back();
router.forward();
router.go(-2);
```

### Link Component Usage

```typescript
import { h } from "preact";
import {
  createLinkComponent,
  createNavLinkComponent,
} from "jsr:@dreamer/router/client";

// Create Link component
const Link = createLinkComponent(h);
const NavLink = createNavLinkComponent(h);

function Navigation() {
  return (
    <nav>
      {/* Basic link */}
      <Link to="/about">About</Link>

      {/* Link with prefetch */}
      <Link to="/contact" prefetch>Contact</Link>

      {/* Replace history */}
      <Link to="/home" replace>Home</Link>

      {/* NavLink (auto active state) */}
      <NavLink to="/products" activeClass="nav-active" exact>
        Products
      </NavLink>

      {/* NavLink with active style */}
      <NavLink
        to="/blog"
        activeClass="active"
        activeStyle={{ fontWeight: "bold", color: "blue" }}
      >
        Blog
      </NavLink>
    </nav>
  );
}
```

### Hooks Usage

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

  // Route params
  const userId = params.id;

  // Query params
  const tab = query.tab || "profile";

  // Metadata
  const pageTitle = meta.title;

  return (
    <div>
      <h1>{pageTitle}</h1>
      <p>User ID: {userId}</p>
      <p>Current tab: {tab}</p>
      <button type="button" onClick={() => router.navigate("/users")}>
        Back to users
      </button>
    </div>
  );
}
```

---

## 🎨 Advanced Usage

### Server Middleware

```typescript
// Auth middleware
const authMiddleware: MiddlewareFunction = async (context, next) => {
  const token = context.request.headers.get("Authorization");

  if (!token && context.route?.meta?.requiresAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Store user in context.data
  context.data.user = await validateToken(token);

  return next();
};

// Log middleware
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

### Route-level Middleware

Create `_middleware.ts` under route directory:

```typescript
// src/routes/admin/_middleware.ts
import type { MiddlewareContext } from "@dreamer/router";

export default async function middleware(
  context: MiddlewareContext,
  next: () => Promise<Response>,
) {
  // Only applies to /admin/* routes
  if (!context.data.user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  return next();
}
```

### Hash Mode

```typescript
const router = createRouter({
  routes: [...],
  mode: "hash", // Use hash mode
});

// URL format: http://example.com/#/about
await router.navigate("/about");
```

### Base Path

```typescript
const router = createRouter({
  routes: [...],
  basePath: "/app", // Deploy under /app subpath
});

// Actual URL: http://example.com/app/about
await router.navigate("/about");
```

---

## 📚 API Reference

### Server API (@dreamer/router)

#### createRouter(options)

Create server router instance.

| Param             | Type                  | Default   | Description          |
| ----------------- | --------------------- | --------- | -------------------- |
| routesDir         | string                | -         | Route file directory |
| apiMode           | "restful" \| "action" | "restful" | API route style      |
| redirects         | RedirectConfig[]      | []        | Redirect config      |
| middlewares       | MiddlewareFunction[]  | []        | Global middleware    |
| skipAppValidation | boolean               | false     | Skip _app validation |

#### Router Methods

| Method                          | Returns                       | Description                      |
| ------------------------------- | ----------------------------- | -------------------------------- |
| scan()                          | Promise\<void\>               | Scan route files                 |
| match(pathname, options?)       | Promise\<RouteMatch \| null\> | Match route                      |
| handleRequest(request, handler) | Promise\<Response\>           | Handle request (with middleware) |
| use(middleware)                 | void                          | Add global middleware            |
| addRedirect(config)             | void                          | Add redirect config              |
| getRoutes()                     | Route[]                       | Get all routes                   |
| getClientRoutes()               | ClientRoute[]                 | Get client route config          |
| getApiMode()                    | "restful" \| "action"         | Get API mode                     |
| getSpecialFile(name)            | string \| undefined           | Get special file path            |
| loadModule(path)                | Promise\<any\>                | Load module                      |
| clearCache(path?)               | void                          | Clear module cache               |

#### Helper Functions

| Function                                         | Description              |
| ------------------------------------------------ | ------------------------ |
| json(data, status?)                              | Create JSON response     |
| html(content, status?)                           | Create HTML response     |
| notFound(message?)                               | Create 404 response      |
| createRedirectResponse(destination, statusCode?) | Create redirect response |

### Client API (@dreamer/router/client)

#### createRouter(options)

Create client router instance.

| Param          | Type                  | Default   | Description              |
| -------------- | --------------------- | --------- | ------------------------ |
| routes         | ClientRoute[]         | -         | Route config list        |
| engine         | "preact" \| "react"   | "preact"  | Render engine            |
| basePath       | string                | ""        | Base path                |
| mode           | "history" \| "hash"   | "history" | Route mode               |
| scrollBehavior | ScrollBehaviorHandler | -         | Scroll behavior function |

#### ClientRouter Methods

| Method                      | Returns                    | Description                           |
| --------------------------- | -------------------------- | ------------------------------------- |
| start()                     | void                       | Start router, begin link interception |
| navigate(path, options?)    | Promise\<void\>            | Navigate to path                      |
| replace(path, state?)       | Promise\<void\>            | Replace history and navigate          |
| back()                      | void                       | Go back                               |
| forward()                   | void                       | Go forward                            |
| go(delta)                   | void                       | Go by delta                           |
| match(pathname)             | ClientRouteMatch \| null   | Match route                           |
| getCurrentRoute()           | ClientRouteMatch \| null   | Get current route                     |
| prefetch(path)              | Promise\<unknown \| null\> | Prefetch route component              |
| isActive(path, exact?)      | boolean                    | Check if path matches current route   |
| resolvePath(path)           | string                     | Resolve path (add base path)          |
| onRouteChange(callback)     | () => void                 | Listen route change                   |
| onNavigationState(callback) | () => void                 | Listen navigation state               |
| beforeRoute(guard)          | () => void                 | Add pre-guard                         |
| afterRoute(guard)           | () => void                 | Add post-guard                        |
| getRoutes()                 | ClientRoute[]              | Get all routes                        |
| getEngine()                 | string                     | Get render engine                     |
| getMode()                   | RouterMode                 | Get route mode                        |
| getBasePath()               | string                     | Get base path                         |
| getNavigationState()        | NavigationState            | Get navigation state                  |
| addRoute(route)             | void                       | Add route dynamically                 |
| removeRoute(path)           | boolean                    | Remove route dynamically              |
| setComponentLoader(loader)  | void                       | Set component loader                  |
| clearCache(component?)      | void                       | Clear component cache                 |
| destroy()                   | void                       | Destroy router                        |

#### Hooks

| Hook                      | Returns                  | Description             |
| ------------------------- | ------------------------ | ----------------------- |
| useRouter()               | ClientRouter             | Get router instance     |
| useRoute()                | ClientRouteMatch \| null | Get current route       |
| useParams()               | Record\<string, string\> | Get route params        |
| useQuery()                | Record\<string, string\> | Get query params        |
| useMeta()                 | RouteMeta                | Get route metadata      |
| useNavigationState()      | NavigationState          | Get navigation state    |
| useIsActive(path, exact?) | boolean                  | Check if path is active |

#### Component Factory Functions

| Function                  | Description                 |
| ------------------------- | --------------------------- |
| createLinkComponent(h)    | Create Link component       |
| createNavLinkComponent(h) | Create NavLink component    |
| createLinkProps(props)    | Create Link props object    |
| createNavLinkProps(props) | Create NavLink props object |

#### Type Definitions

```typescript
interface ClientRoute {
  path: string; // Route path
  component: string; // Component id
  type?: "static" | "dynamic" | "wildcard" | "optional";
  meta?: RouteMeta; // Route metadata
  redirect?: string; // Redirect target
}

interface RouteMeta {
  title?: string; // Page title
  requiresAuth?: boolean; // Requires auth
  keepAlive?: boolean; // Cache component
  [key: string]: unknown; // Custom data
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

## 📊 Test Report

| Metric      | Value      |
| ----------- | ---------- |
| Total tests | 146        |
| Passed      | 146        |
| Failed      | 0          |
| Pass rate   | 100%       |
| Test date   | 2026-02-17 |
| Duration    | ~3s        |

### Runtime Compatibility

| Runtime | Tests | Passed | Status |
| ------- | ----- | ------ | ------ |
| Deno    | 146   | 146    | ✅     |
| Bun     | 146   | 146    | ✅     |

### Test File Coverage

| Test file              | Count | Coverage                                                               |
| ---------------------- | ----- | ---------------------------------------------------------------------- |
| client-browser.test.ts | 28    | Browser: navigation, guards, link interception, history                |
| client.test.ts         | 84    | Client unit: route matching, metadata, basePath, hash mode, link types |
| mod.test.ts            | 34    | Server: scan, match, redirect, middleware                              |

See [TEST_REPORT.md](./docs/en-US/TEST_REPORT.md) for details.

---

## 📝 Notes

### Server/Client Code Separation

**Important**: Client route code must not use server API.

```typescript
// ❌ Wrong - client cannot use server API
import * as path from "std/path";

// ✅ Correct - use browser API
const url = new URL(globalThis.location.href);
```

### API Route Style

API routes must choose one style via config, **cannot mix**:

- `apiMode: "restful"` - RESTful (GET, POST, PUT, DELETE)
- `apiMode: "action"` - Action style (login, register)

### navigate is Async

`navigate()` returns a Promise; await for completion:

```typescript
// Wait for navigation (including guards)
await router.navigate("/about");
```

### Must Call start()

Client router must call `start()` to begin link interception:

```typescript
const router = createRouter({ routes });
router.start(); // Begin intercepting <a> clicks
```

### Links Not Intercepted

These links are not intercepted (handled by the browser or left as full
navigation):

- `target="_blank"`
- `download` attribute
- `data-native` attribute
- External links (different origin)
- Non-http(s) protocols: `mailto:`, `tel:`, `javascript:`, `blob:`, `data:`
- Same-page anchor only (same pathname + search, link has hash; e.g. `#section`)
- Empty or missing `href`
- Ctrl/Cmd/Shift/Alt + click or non-left button

---

## 📋 Changelog

**v1.0.12** (2026-02-17)

- **Added**: Server-side i18n: optional `lang` in RouterOptions; auto-detect
  from env when omitted. New i18n module and en-US/zh-CN locales for server
  error and log messages.
- **Changed**: Publish include uses globs `src/**/*.ts` and `src/**/*.json`.

See [CHANGELOG.md](./docs/en-US/CHANGELOG.md) for full history.

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

## 📄 License

Apache License 2.0 - see [LICENSE](./LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
