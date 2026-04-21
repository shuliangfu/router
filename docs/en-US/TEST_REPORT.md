# @dreamer/router Test Report

## Test Overview

| Item                 | Info                                   |
| -------------------- | -------------------------------------- |
| Test library version | @dreamer/test@^1.1.7                   |
| Runtime adapter      | @dreamer/runtime-adapter@^1.0.18       |
| Test framework       | @dreamer/test (describe/it/expect)     |
| Test date            | 2026-04-21                             |
| Test environment     | Deno + Bun + Puppeteer (browser tests) |

## Test Results

### Overall Statistics (Deno — canonical count)

| Metric         | Value           |
| -------------- | --------------- |
| Total tests    | 193             |
| Passed         | 193             |
| Failed         | 0               |
| Pass rate      | 100%            |
| Execution time | ~31s full suite |

**Bun** (`bun test tests/`): **189** passed, **0** failed (~32s). The reported
total can differ from Deno because the Bun runner counts nested **`describe`**
cases differently; the same files run and all cases pass.

### Runtime Compatibility

| Runtime | Tests (reported) | Passed | Status |
| ------- | ---------------- | ------ | ------ |
| Deno    | 193              | 193    | ✅     |
| Bun     | 189              | 189    | ✅     |

### Test File Statistics

| Test File                | Count | Passed | Failed | Status |
| ------------------------ | ----- | ------ | ------ | ------ |
| client-browser.test.ts   | 28    | 28     | 0      | ✅     |
| client.test.ts           | 101   | 101    | 0      | ✅     |
| mod.test.ts              | 45    | 45     | 0      | ✅     |
| nav-match.test.ts        | 5     | 5      | 0      | ✅     |
| specificity-sort.test.ts | 14    | 14     | 0      | ✅     |

## Feature Test Details

### 1. Client Router Browser Tests (`client-browser.test.ts`) — 28 tests

**Environment**: Real browser via HTTP server + Puppeteer.

- ✅ Export surface, `useRouter` null when no global instance, `getEngine`
- ✅ `navigate`, `replace`
- ✅ `onRouteChange`, `beforeRoute`, `afterRoute` guards
- ✅ `back` / `forward` / `go`
- ✅ Dynamic routes, query params, custom component loader
- ✅ `start` link interception (same-origin, external, `target=_blank`,
  `data-native`, `download`, modifier keys, nested clicks, idempotent `start`)
- ✅ `destroy`

### 2. Client Router Unit Tests (`client.test.ts`) — 101 tests

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

### 3. Server Router Tests (`mod.test.ts`) — 45 tests

- ✅ Constructor, `scan`, `match`, `getRoutes`, `getSpecialFile`
- ✅ Optional/wildcard/API routes, non-route `.ts`/`.js` ignored under non-`api`
  paths
- ✅ Flat API files: `/api/foo/:method` alongside static `/api/foo` for action
  style URLs
- ✅ `getLayoutPathsForPath` / `getLayoutKeysForPath` (nested `_layout`)
- ✅ Redirects, middleware, `getClientRoutes`, `skipAppValidation`,
  `getApiMode`, module cache
- ✅ `RouteMatch.load` / `fullPath` / `meta`
- ✅ `isLikelyClientBundledAssetPath` and `match` fast-reject for bundle-like
  paths

### 4. Nav Match (`nav-match.test.ts`) — 5 tests

- ✅ `normalizePathname` (root, trim trailing slashes)
- ✅ `isNavActive` (home exact match, prefix segments)

### 5. Specificity Sort Tests (`specificity-sort.test.ts`) — 14 tests

- ✅ `buildRouteSpecificityTuple`, `compareSpecificityTuples`,
  `compareRoutesForScanOrder`
- ✅ Integration: `Router.scan()` then `match` prefers static over dynamic/API
  static over dynamic segment

## Conclusion

All tests pass on Deno (193) and Bun (189). The package covers server file
routing (including **scan-order specificity** and **flat API `:method`**
routes), client navigation/guards/link interception, **nav highlighting**
helpers, layout key helpers, bundle path heuristics, and shared **core**
matching/sort logic used by both runtimes.

---

**Report generated**: 2026-04-21 **Test environment**: Deno + Bun + Puppeteer
