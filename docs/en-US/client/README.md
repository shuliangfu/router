# @dreamer/router/client

> Client-side routing for the browser: navigation, history, and SPA route management

[![JSR](https://jsr.io/badges/@dreamer/router/client)](https://jsr.io/@dreamer/router/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../../LICENSE.md)

[English](./README.md) | [中文 (Chinese)](../../zh-CN/client/README.md)

---

## Server support

For server-side routing, see the [main router docs](../../../README.md).

## Features

Client-side routing with a unified API for browser navigation and history. Built on native browser APIs (`history.pushState`, `popstate`, etc.) with no server dependencies.

## Characteristics

### Client navigation

- **Native browser API**:
  - `history.pushState` / `history.replaceState` for navigation
  - `popstate` for back/forward
  - `location.pathname` for current path
  - No external dependencies
- **Navigation methods**:
  - `navigate(path, replace)` — go to path
  - `go(delta)` — move in history
  - `back()` — back one step
  - `forward()` — forward one step
- **History**: automatic management, replace current entry when needed

### Route types

- **Static**: `/about` — exact match
- **Dynamic**: `/user/:id` — e.g. `/user/123` → `{ id: "123" }`
- **Wildcard**: `/posts/*` — e.g. `/posts/any/path` → `{ "*": "any/path" }`
- **Optional**: `/blog/:slug?` — `/blog` or `/blog/my-post`
- **Query**: parsed from `?key=value`

### Route guards

- **beforeRoute**: runs before change; can block (return `false`) or redirect; async supported
- **afterRoute**: runs after change; e.g. analytics, scroll to top; async supported

### Route change and current route

- Listens to `popstate` and `navigate`-triggered changes
- `getCurrentRoute()` — current match (route, params, query)

### Matching and lazy load

- All route types supported; params and query parsed
- Component lazy load via `load()` (implementation depends on your build)

## Installation

```bash
deno add jsr:@dreamer/router/client
```

## Environment

- **Deno**: 2.5+
- **Environment**: browser only
- **Dependencies**: none (TypeScript only)
- **Browser**: needs `history.pushState` and `popstate`

## Quick start

### Basic usage

```typescript
import { createRouter } from "jsr:@dreamer/router/client";

const router = createRouter({
  routes: [
    { path: "/", component: "index", type: "static" },
    { path: "/about", component: "about", type: "static" },
    { path: "/user/:id", component: "user/[id]", type: "dynamic" },
    { path: "/posts/*", component: "posts/[...slug]", type: "wildcard" },
    { path: "/blog/:slug?", component: "blog/[[slug]]", type: "optional" },
  ],
  engine: "preact", // or "react"
});

router.navigate("/about");
router.navigate("/about", true); // replace
router.back();
router.forward();
router.go(-2);
router.go(1);
```

### Route matching

```typescript
const match = router.match(globalThis.location.pathname);

if (match) {
  console.log("Route:", match.route.path);
  console.log("Params:", match.params);
  console.log("Query:", match.query);
}

const userMatch = router.match("/user/123?tab=profile");
// userMatch.params === { id: "123" }, userMatch.query === { tab: "profile" }
```

### Route guards

```typescript
router.beforeRoute(async (to, from) => {
  if (to.route.path === "/dashboard" && !isLoggedIn()) {
    router.navigate("/login");
    return false;
  }
  return true;
});

router.afterRoute((to, from) => {
  analytics.track("page_view", { path: to.route.path, params: to.params });
});

router.afterRoute(() => {
  globalThis.scrollTo(0, 0);
});
```

### Route change listener

```typescript
const unsubscribe = router.onRouteChange((match) => {
  if (match) {
    document.title = `Page - ${match.route.path}`;
    updateUI(match);
  }
});
// unsubscribe();
```

### Current route

```typescript
const currentRoute = router.getCurrentRoute();
if (currentRoute) {
  updateActiveNav(currentRoute.route.path);
}
```

---

## API

### `createRouter(options: ClientRouterOptions): ClientRouter`

**Options**: `routes`, `engine` (`"preact"` | `"react"`, default `"preact"`)

### `ClientRouter.navigate(path: string, replace?: boolean): void`

Navigate to `path`; if `replace === true`, replace current history entry.

### `ClientRouter.go(delta: number): void`

Move in history by `delta` (positive = forward, negative = back).

### `ClientRouter.back()` / `ClientRouter.forward()`

Back or forward one step.

### `ClientRouter.match(pathname: string): ClientRouteMatch | null`

Match a pathname; returns match or `null`.

### `ClientRouter.getCurrentRoute(): ClientRouteMatch | null`

Current route match.

### `ClientRouter.onRouteChange(callback): () => void`

Subscribe to route changes; returns unsubscribe.

### `ClientRouter.beforeRoute(guard)` / `ClientRouter.afterRoute(guard)`

Add before/after guards. Before guard can return `false` to block.

### `ClientRouter.getRoutes(): ClientRoute[]`

All route configs.

## Types

### `ClientRouterOptions`

```typescript
interface ClientRouterOptions {
  routes: ClientRoute[];
  engine?: "preact" | "react";
}
```

### `ClientRoute`

```typescript
interface ClientRoute {
  path: string;
  component: string;
  type?: "static" | "dynamic" | "wildcard" | "optional";
}
```

### `ClientRouteMatch`

```typescript
interface ClientRouteMatch {
  route: ClientRoute;
  params: Record<string, string>;
  query: Record<string, string>;
  load?: () => Promise<unknown>;
}
```

### `RouteGuard`

```typescript
type RouteGuard = (
  to: ClientRouteMatch,
  from: ClientRouteMatch | null,
) => boolean | Promise<boolean> | void | Promise<void>;
```

## Use cases

- **CSR navigation**: SPA route changes and link handling
- **SPA**: Front-end routes + browser history
- **Client matching**: Match path and lazy-load component
- **History**: back, forward, replace

## Notes

- **Routes**: Usually generated by server (`@dreamer/router`) and passed to client (inline in HTML, API, or build-time file).
- **load()**: Implement with your bundler (e.g. dynamic `import()`).
- **Browser**: Requires `history.pushState`, `popstate`, `location.pathname`.
- **With server**: Server uses `@dreamer/router` for SSR/API; client uses `@dreamer/router/client` for CSR; same route config on both.

---

- **Browser-only API**: Uses `globalThis.location`, `globalThis.history`, etc.
- **No server APIs**: No Node/Deno server modules in client code.
- **TypeScript**: Full types.

---

## Contributing

Issues and Pull Requests are welcome.

## License

MIT — see [LICENSE.md](../../../LICENSE.md).

---

<div align="center">**Made with ❤️ by Dreamer Team**</div>
