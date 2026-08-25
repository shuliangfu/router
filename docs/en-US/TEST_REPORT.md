# @dreamer/router Test Report

## Test Overview

| Item                 | Info                                                               |
| -------------------- | ------------------------------------------------------------------ |
| Test library version | @dreamer/test@^1.2.3                                               |
| Runtime adapter      | @dreamer/runtime-adapter@^1.2.2                                    |
| Test framework       | @dreamer/test (describe/it/expect)                                 |
| Test date            | 2026-08-25                                                         |
| Test environment     | Deno 2.x + Bun 1.x + Node.js 22+ (unit); Puppeteer (local browser) |

## Test Results

### Overall Statistics (unit suite, run in CI)

| Metric         | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Total tests    | 168 unit (Deno/Node report 172 incl. 4 lifecycle hooks) |
| Passed         | Deno 172 / Bun 168 / Node 172                           |
| Failed         | 0                                                       |
| Pass rate      | 100%                                                    |
| Execution time | ~0.5–0.8s unit suite (per runtime)                      |

The four unit test files (`mod`, `client`, `nav-match`, `specificity-sort`) are
run in CI on all three runtimes. Deno (and Node via the same `@dreamer/test`
runner) additionally counts the `@dreamer/test cleanup browsers` lifecycle hook
as a test (once per file → +4), which is why Deno/Node report 172 while Bun
reports 168. **v1.2.1** adds one `apiOnly` case in `mod.test.ts`.

### Runtime Compatibility

| Runtime | Tests (reported) | Passed | Status |
| ------- | ---------------- | ------ | ------ |
| Deno    | 172              | 172    | ✅     |
| Bun     | 168              | 168    | ✅     |
| Node.js | 172              | 172    | ✅     |

### Test File Statistics

| Test File                | Count | Passed | Failed | Status | CI                             |
| ------------------------ | ----- | ------ | ------ | ------ | ------------------------------ |
| client.test.ts           | 100   | 100    | 0      | ✅     | ✅                             |
| mod.test.ts              | 51    | 51     | 0      | ✅     | ✅                             |
| specificity-sort.test.ts | 13    | 13     | 0      | ✅     | ✅                             |
| nav-match.test.ts        | 4     | 4      | 0      | ✅     | ✅                             |
| client-browser.test.ts   | 28    | 28     | 0      | ✅     | ❌ (local `test:browser` only) |

## Feature Test Details

### 1. Client Router Unit Tests (`client.test.ts`) — 100 tests

- ✅ `createRouter` (preact, react, empty routes)
- ✅ `match` (static, dynamic, wildcard, optional, query)
- ✅ `onRouteChange`, `getCurrentRoute`, before/after guards
- ✅ `getEngine`, dynamic `addRoute` / `removeRoute`, component loader, guard
  removal
- ✅ `start` / `destroy`, edge cases (slashes, full URL, encoded params)
- ✅ Meta, `basePath`, history/hash mode, navigation state, `isActive`,
  redirect, cache, `replace` / `prefetch`, `loadComponent` caching
- ✅ Link interception — special link shapes: same-page hash-only anchor,
  path+search+hash anchor, `target=_blank`, `download`, `data-native`,
  `mailto:`, `tel:`, `javascript:`, `blob:`, `data:`, cross-origin, empty
  `href`, same-origin intercept, composedPath, cross-page hash
- ✅ **Route specificity**: after construction and `addRoute`, order matches
  server `scan()` (e.g. static `/blog/new` before dynamic `/blog/:slug`)
- ✅ Hooks with no global router (SSR-safe): `useRoute`, `useQuery`,
  `useParams`, `useNavigationState`, `useIsActive`, `useRouter`

### 2. Server Router Tests (`mod.test.ts`) — 50 tests

- ✅ Constructor, `scan`, `match`, `getRoutes`, `getSpecialFile`
- ✅ Optional/wildcard/API routes, non-route `.ts`/`.js` ignored under non-`api`
  paths
- ✅ Flat API files: `/api/foo/:method` alongside static `/api/foo` for action
  style URLs
- ✅ `getLayoutPathsForPath` / `getLayoutKeysForPath` (nested `_layout`)
- ✅ `getMiddlewarePathsForPath` / `getMiddlewareKeysForPath` (nested
  `_middleware`) and `handleRequest` chain order
- ✅ Redirects, middleware, `getClientRoutes`, `skipAppValidation`,
  `getApiMode`, module cache
- ✅ `RouteMatch.load` / `fullPath` / `meta`
- ✅ `isLikelyClientBundledAssetPath` and `match` fast-reject for bundle-like
  paths

### 3. Specificity Sort Tests (`specificity-sort.test.ts`) — 13 tests

- ✅ `buildRouteSpecificityTuple`, `compareSpecificityTuples`,
  `compareRoutesForScanOrder`
- ✅ Integration: `Router.scan()` then `match` prefers static over dynamic/API
  static over dynamic segment

### 4. Nav Match (`nav-match.test.ts`) — 4 tests

- ✅ `normalizePathname` (root, trim trailing slashes)
- ✅ `isNavActive` (home exact match, prefix segments)

### 5. Client Router Browser Tests (`client-browser.test.ts`) — 28 tests (local)

**Environment**: Real browser via HTTP server + Puppeteer. Excluded from CI; run
locally via `deno task test:browser`.

- ✅ Export surface, `useRouter` null when no global instance, `getEngine`
- ✅ `navigate`, `replace`
- ✅ `onRouteChange`, `beforeRoute`, `afterRoute` guards
- ✅ `back` / `forward` / `go`
- ✅ Dynamic routes, query params, custom component loader
- ✅ `start` link interception (same-origin, external, `target=_blank`,
  `data-native`, `download`, modifier keys, nested clicks, idempotent `start`)
- ✅ `destroy`

## Conclusion

All unit tests pass on Deno (171), Bun (167) and Node.js (167). The package
covers server file routing (including **scan-order specificity**, **flat API
`:method`** routes, and **nested `_middleware` chains**), client
navigation/guards/link interception, **nav highlighting** helpers,
layout/middleware key helpers, bundle path heuristics, and shared **core**
matching/sort logic used by both server and client. The Playwright browser
integration test (28 cases) passes locally and is kept out of CI for stability.

---

**Report generated**: 2026-07-23 **Test environment**: Deno 2.9 + Bun 1.3 +
Node.js 22 (unit); Puppeteer (local browser)
