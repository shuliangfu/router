# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
