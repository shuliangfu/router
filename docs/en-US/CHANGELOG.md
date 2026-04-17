# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.4] - 2026-04-17

### Added

- **`Route.matchPrep`**: Optional **`RouteMatchPrep | null`** stored on each
  **`Route`** so multiple routes from the same disk file do not share one
  incorrect prep (e.g. API **`index`** plus an explicit **`index/:method`**
  route).

### Changed

- **`Router`**: Removed **`routeMatchPrepByFullPath`**; **`matchRouteToPath`**
  uses **`route.matchPrep`** from the matched **`Route`**.
- **API `index` files**: When scanning **`api/.../index.ts`** (or **`.js`**),
  also registers **`/api/.../index/:method`** so action-style URLs such as
  **`POST /api/auth/index/login`** align with exports from the same module (with
  **`apiMode: "action"`** and server **`RouterAdapter`** **`params.method`**).

### Tests

- **`tests/mod.test.ts`**: Covers extra **`/api/.../index/:method`**
  registration and **`match`** for **`/api/auth/index/login`**.

---

## [1.1.3] - 2026-03-26

### Added

- **`src/core.ts`**: Shared matching and scan-order logic for **`Router`** and
  **`ClientRouter`** — **`buildRouteMatchPrep`** / **`matchRoutePattern`**
  (pre-split route segments and wildcard/optional bases to avoid repeating
  **`split("/")`** on every **`match`**), plus **`buildRouteSpecificityTuple`**,
  **`compareSpecificityTuples`**, and **`compareRoutesForScanOrder`** for
  deterministic “more specific route first” ordering.
- **`tests/specificity-sort.test.ts`**: Covers tuple ranking, pairwise
  **`compareRoutesForScanOrder`**, and **`Router.scan`** integration — e.g.
  **`/blog/new`** (static) ordered before **`/blog/:slug`** so
  **`match("/blog/new")`** hits the static route; API tree case where
  **`/api/v1/health`** wins over **`/api/v1/:id`**.
- **`tests/client.test.ts`**: Asserts **`ClientRouter`** re-sorts after
  **`addRoute`** and that a static **`/blog/new`** beats a dynamic
  **`/blog/:slug`** even when routes are registered in the “wrong” order.
- **`tests/mod.test.ts`**: Ensures non-API **`.ts`** / **`.js`** files under the
  routes directory are **not** registered as page routes.

### Changed

- **`Router.scan()`**: After collecting routes, sorts them with
  **`compareRoutesForScanOrder`** — non-API routes before API routes; within
  each block, higher specificity first (static > dynamic > optional > wildcard;
  literal path segments rank above **`:param`** segments); ties broken by
  **`path.localeCompare`**. Result no longer depends on filesystem **`readdir`**
  order when static and dynamic siblings compete.
- **`Router`**: Stores **`RouteMatchPrep | null`** per **`fullPath`**
  (**`routeMatchPrepByFullPath`**) at registration; **`matchRouteToPath`**
  delegates to **`matchRoutePattern`**.
- **`ClientRouter`**: Precomputes prep per route in a **`WeakMap`**
  (**`routeMatchPrepByRoute`**), runs **`sortRoutesForMatchOrder()`** in the
  constructor, and re-sorts after **`addRoute`** so client match order mirrors
  server **`scan()`**.
- **Route file discovery**: Page routes are only **`.tsx`** / **`.jsx`**; under
  **`api/`** (or paths containing **`api`**) **`.ts`**, **`.js`**, **`.tsx`**,
  and **`.jsx`** remain valid API handlers.
- **`parseRoutePath`**: Strips **`.js`** / **`.jsx`** when deriving the route
  name (in addition to **`.ts`** / **`.tsx`**).
- **`getRawClientRoutes`**: Component paths strip **`.tsx`** / **`.jsx`** only
  (page routes no longer use plain **`.ts`** as entries).
- **`loadApiHandlers`**: Caches successful parse results per **`filePath`**
  (**`apiHandlersCache`**); cache is cleared on full or per-file
  **`clearCache`** and on **`scan`**.

### Fixed

- Dynamic page routes (e.g. **`blog/[slug].tsx`**) could win over static
  siblings (e.g. **`blog/new.tsx`**) when the OS listed the dynamic file first;
  ordering is now by specificity, not scan order.
- Utility **`.ts`** / **`.js`** files co-located with page routes were
  previously treated as routes; they are ignored unless they are API route
  files.

---

## [1.1.2] - 2026-03-23

### Added

- **`isLikelyClientBundledAssetPath(pathname)`** (`src/mod.ts`): Returns true
  for typical dweb/esbuild client script URLs (`/_client.js`, `/chunk-*.js`,
  `/_layout-*.js`, hashed route chunks, etc.). **`Router.match`** returns
  **`null`** early for these paths so HTTP adapters do not run **O(routes)**
  scans or spam **`debug`** logs on every asset request.
- **Client link intercept** (`src/client/mod.ts`): Resolve `<a>` via
  **`composedPath()`** when the parent chain from **`event.target`** does not
  contain an anchor (Shadow DOM retargeting).
- **`normalizeAnchorTargetAttribute`**: Treats **`"undefined"`** / **`"null"`**
  string targets (from bad **`setAttribute`**) as unspecified so same-document
  navigation is not skipped.
- When **`debug: true`**, **`logClickInterceptSkip`** records reasons for
  skipping intercept (non-**`_self`** target, download, cross-origin, hash-only,
  URL errors, etc.); routine non-link clicks no longer log noise.

### Changed

- **`Router.match`**: Runs bundle-path fast path before **`debugLog`** for
  **`match`**.
- **`@dreamer/esbuild`** import map / npm dependency range bumped to **^1.1.6**.

---

## [1.1.1] - 2026-03-21

### Fixed

- Client hooks no longer throw when no global `ClientRouter` is registered (e.g.
  Hybrid/SSR first paint): `useRouter()` returns `null`; `useRoute()` returns
  `null`; `useQuery()`, `useParams()`, and `useMeta()` return `{}`;
  `useNavigationState()` returns `"idle"`; `useIsActive()` returns `false`.

### Changed

- **`useRouter()`** return type is now `ClientRouter | null`. Use optional
  chaining for navigation: `useRouter()?.navigate(...)`.
- **`getGlobalRouter`** and **`setGlobalRouter`** are no longer exported from
  `jsr:@dreamer/router/client`; use **`useRouter()`** instead.
- Internal `Link` / `navigate` helpers use **`useRouter()`** instead of removed
  exports.

---

## [1.1.0] - 2026-03-13

### Added

- **Client engine "view"**: `ClientRouterOptions.engine` now accepts `"view"` in
  addition to `"preact"` and `"react"`, for use with `@dreamer/view` in dweb
  applications.

---

## [1.0.16] - 2026-03-11

### Added

- **Nested layout API**: `getLayoutPathsForPath(pathname)` returns the full
  filesystem paths of layout files from root to the given route path (for
  SSR/build). `getLayoutKeysForPath(pathname)` returns the layout keys (e.g.
  `["_layout", "bgb-x-admin/_layout"]`) for client-side dynamic loading. Enables
  frameworks to support nested `_layout.tsx` per route segment.

---

## [1.0.15] - 2026-02-19

### Changed

- **i18n**: i18n now auto-initializes when the module is loaded.
  `initRouterI18n` is no longer exported; the main entry no longer imports or
  calls it. The translation function `$tr` initializes i18n on first use if not
  yet initialized. Use `setRouterLocale` when you need to set the locale for
  router messages.
- **Dependencies**: Bumped `@dreamer/test` to ^1.0.11,
  `@dreamer/runtime-adapter` to ^1.0.15, `@dreamer/esbuild` to ^1.0.30.

---

## [1.0.14] - 2026-02-19

### Changed

- **i18n**: Renamed translation method from `$t` to `$tr` to avoid conflict with
  global `$t`. Update existing code to use `$tr` for package messages.

---

## [1.0.13] - 2026-02-18

### Changed

- **i18n**: Init at entry only; `initRouterI18n()` is called once in `mod.ts`.
  `$t()` no longer calls `ensureRouterI18n()` or sets locale internally.

---

## [1.0.12] - 2026-02-17

### Added

- **Server-side i18n**: Optional `lang` in `RouterOptions` (e.g. `"en-US"`,
  `"zh-CN"`). When omitted, locale is auto-detected from env (`LANGUAGE` /
  `LC_ALL` / `LANG`). New `src/i18n.ts` and `src/locales/en-US.json`,
  `zh-CN.json`. Three server messages are now translated: scan routes failed,
  missing special file, load API handler failed.

### Changed

- **Publish include**: `publish.include` uses globs `src/**/*.ts` and
  `src/**/*.json` (plus `LICENSE`, `NOTICE`, `README.md`) for maintainability.

---

## [1.0.11] - 2026-02-17

### Added

- **Anchor link handling**: In history mode, `getPathname()` now includes
  `location.hash` so that navigation to a path with hash (e.g. `/about#team`)
  produces a match with `hash`; after navigation, `handleScrollBehavior` scrolls
  to the element with the matching `id` (cross-page anchor).
- **Link interception — protocol filter**: Only `http:` and `https:` links are
  intercepted. Links with `mailto:`, `tel:`, `javascript:`, `blob:`, `data:` or
  other non-http(s) protocols are no longer intercepted and are left to the
  browser.
- **Unit tests for link interception**: 14 tests covering same-page anchor,
  same-page anchor with path+search+hash, `target="_blank"`, `download`,
  `data-native`, `mailto:`, `tel:`, `javascript:`, `blob:`, `data:`,
  cross-origin, empty `href`, same-origin intercept, and cross-page hash
  intercept.

### Changed

- **Docs**: README and zh-CN README add a "Link interception" subsection (what
  is intercepted / not intercepted). Test report and README test stats updated
  to 146 tests (28 + 84 + 34).

---

## [1.0.10] - 2026-02-16

### Added

- **Client `interceptLinks` option**: `ClientRouterOptions` now accepts
  `interceptLinks?: boolean` (default `true`). When `false`, `start()` does not
  register the link click interceptor, so that SSR/SSG apps can hydrate the
  current page only and let link clicks perform full page navigation instead of
  client-side routing.

---

## [1.0.9] - 2026-02-14

### Fixed

- **Client navigation / SPA main content blank**: After clicking a link, the
  main content area sometimes did not render (e.g. in View Hybrid) because
  navigation finished before the route-change callback completed. The client now
  awaits all `onRouteChange` callbacks before ending the navigation, so SPA
  content is rendered before the navigation completes.

### Changed

- **RouteChangeCallback**: Type now allows `void | Promise<void> | unknown` so
  that async callbacks (e.g. load module + render) are supported; callbacks are
  invoked with `Promise.resolve(callback(match))` and awaited.
- **notifyRouteChange**: Made async; `handleRouteChange` awaits it so that
  route-change listeners (including async render) complete before scroll and
  other post-navigation logic run.
- **License**: This package is licensed under Apache License 2.0 (see
  [LICENSE](../../LICENSE)).

---

## [1.0.8] - 2026-02-12

### Fixed

- **Client click handling**: When `event.target` is a text node (e.g. in
  Solid.js or other frameworks that use document-level delegation), the anchor
  was not found because text nodes have no `parentElement`. Now the handler
  walks up via `parentNode` and checks `nodeType === 1` and `tagName === "A"` to
  find the `<a>` element correctly.
- **Client click interception**: After `preventDefault()`, call
  `stopImmediatePropagation()` so that framework document-level listeners (e.g.
  Solid) do not also handle the click and trigger default navigation. Added
  optional `stopImmediatePropagation` to the internal `BrowserMouseEvent` type.

### Added

- **Client debug**: `debugLog` for click interception ("intercepted", "no
  &lt;a&gt; found for target") when `debug: true` in client options.

---

## [1.0.7] - 2026-02-10

### Added

- **Docs**: Client subpath documentation at `docs/zh-CN/client/README.md` and
  `docs/en-US/client/README.md` (moved from `src/client/README.md`; en-US added
  as translation).

### Changed

- **Docs**: Restructure docs into `docs/en-US/` and `docs/zh-CN/`. Root README
  remains English entry; CHANGELOG, TEST_REPORT, and zh-CN README moved;
  TEST_REPORT in zh-CN translated to Chinese. All doc links updated.
- **CI**: Add Playwright Chromium install step for browser tests (Linux,
  Windows, macOS).

---

## [1.0.6] - 2026-02-09

### Added

- **Debug option**: Add `debug?: boolean` to `RouterOptions` (server) and
  `ClientRouterOptions` (client). When `debug: true`, detailed logs are emitted
  for route matching, loadModule/loadComponent, and navigation. Helps diagnose
  Windows path issues and component loading failures.

---

## [1.0.5] - 2026-02-09

### Fixed

- **Server routing (processFile)**: Normalize `relativePath` with
  `normalizeRouteFile()` before processing. On Windows, `join()` may produce
  backslashes; using raw `relativePath` caused incorrect `specialFiles` keys,
  API route detection (`split("/")` fails with backslashes), and wrong
  `route.path`. Now all logic uses normalized forward-slash paths for consistent
  cross-platform behavior.

### Changed

- **Dependencies**: Bump @dreamer/test to ^1.0.2 for latest compatible version.

---

## [1.0.4] - 2026-02-08

### Changed

- **Dependencies**: Bump @dreamer/runtime-adapter and @dreamer/test to ensure
  latest compatible versions are used.

---

## [1.0.3] - 2026-02-08

### Fixed

- **Windows compatibility**: Replace string concatenation with `join()` and
  `dirname()` for path construction in `loadRouteMiddlewares`, `scanDirectory`,
  and `processFile`. Ensures cross-platform path handling on Windows.

---

## [1.0.2] - 2026-02-08

### Fixed

- **Windows compatibility**: Normalize `route.file` to use forward slashes.
  Added `normalizeRouteFile()` to convert backslashes to forward slashes in
  `parseRoutePath`, ensuring consistent path format on Windows.

---

## [1.0.1] - 2026-02-07

### Fixed

#### Client: Scroll position restoration when navigating between pages

- **Problem**: When users navigated between pages (e.g., clicking links, then
  pressing browser back/forward), scroll positions were not restored. The
  previous page always scrolled to top. Causes:
  1. On `popstate` (browser back/forward), `saveScrollPosition()` used
     `getPathname()` which returns the new path after navigation — the scroll of
     the page being left was never saved.
  2. When `scrollBehavior` was not provided, the default always scrolled to top
     and ignored any saved positions.
- **Solution**:
  1. Added `saveScrollPositionForPath(path)` to save scroll for a given path. At
     the start of `handleRouteChange`, when `previousMatch` exists (including
     from `popstate`), save the current scroll for `previousMatch.fullPath`
     before processing.
  2. When `scrollBehavior` is not provided: if `savedPosition` exists for the
     target path, restore it; otherwise scroll to top.
- **Impact**: Users switching between pages will now have their scroll positions
  remembered and restored when using browser back/forward. No configuration
  required.

---

## [1.0.0] - 2026-02-06

### Added

First stable release. Full file-based routing system compatible with Deno and
Bun.

#### Server Router (@dreamer/router)

- **File-based routing** (Next.js/Remix style)
  - Auto-generate routes from filesystem
  - File structure equals route structure
  - Auto route discovery and registration
  - Nested routes support
- **Route types**
  - Static routes (`/about.tsx` → `/about`)
  - Dynamic routes (`/user/[id].tsx` → `/user/:id`)
  - Wildcard routes (`/posts/[...slug].tsx` → `/posts/*`)
  - Optional param routes (`/blog/[[slug]].tsx` → `/blog` or `/blog/:slug`)
- **API routes**
  - RESTful style (GET, POST, PUT, DELETE)
  - Action style (login, register, getUser)
  - Dynamic API routes
- **Special files**
  - `_app.tsx`: App root (required)
  - `_layout.tsx`: Layout (optional)
  - `_404.tsx`: 404 page (optional)
  - `_error.tsx`: Error page (optional)
  - `_middleware.ts`: Route middleware (optional)
- **Redirects**: Route-level redirect config
- **Middleware chain**: Global and route-level middleware
- **Helpers**: `json()`, `html()`, `notFound()`, `createRedirectResponse()`

#### Client Router (@dreamer/router/client)

- **Navigation**
  - `navigate()` programmatic navigation (async)
  - `replace()` replace history
  - `back()` / `forward()` / `go()` history operations
  - `start()` start link interception
- **Route guards**
  - `beforeRoute` pre-guard (supports redirect)
  - `afterRoute` post-guard
- **Route matching**: Static/dynamic/wildcard matching, query param parsing
- **Scroll behavior**: Custom scroll behavior, save/restore position
- **Prefetch**: `prefetch()` preload components, component cache
- **Link / NavLink components**: Declarative navigation, active state, prefetch
  support
- **Route mode**: History mode (default), Hash mode
- **Base path**: Deploy under subpath
- **Multi-engine**: Preact (default), React
- **Hooks**
  - `useRouter()`, `useRoute()`, `useParams()`, `useQuery()`
  - `useMeta()`, `useNavigationState()`, `useIsActive()`

#### Environment Compatibility

- Deno 2.6+
- Bun 1.3.5+
- Server: SSR route matching, API routes, middleware
- Browser: Client-side routing

#### Testing

- 130 tests, all passing
- Covers server, client, and browser tests
- Deno and Bun runtime compatible
