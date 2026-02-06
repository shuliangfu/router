# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2026-02-06

### Added

First stable release. Full file-based routing system compatible with Deno and Bun.

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
- **Link / NavLink components**: Declarative navigation, active state, prefetch support
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
