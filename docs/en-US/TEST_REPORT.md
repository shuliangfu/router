# @dreamer/router Test Report

## Test Overview

| Item                 | Info                                   |
| -------------------- | -------------------------------------- |
| Test library version | @dreamer/test@^1.0.15                  |
| Runtime adapter      | @dreamer/runtime-adapter@^1.0.18       |
| Test framework       | @dreamer/test (describe/it/expect)     |
| Test date            | 2026-03-24                             |
| Test environment     | Deno + Bun + Puppeteer (browser tests) |

## Test Results

### Overall Statistics (Deno — canonical count)

| Metric         | Value |
| -------------- | ----- |
| Total tests    | 179   |
| Passed         | 179   |
| Failed         | 0     |
| Pass rate      | 100%  |
| Execution time | ~10s  |

**Bun** (`bun test tests/`): **176** passed, **0** failed (~13s). The reported
total can differ from Deno because the Bun runner flattens nested `describe`
labels differently; the same source files are executed and all cases pass.

### Runtime Compatibility

| Runtime | Tests (reported) | Passed | Status |
| ------- | ---------------- | ------ | ------ |
| Deno    | 179              | 179    | ✅     |
| Bun     | 176              | 176    | ✅     |

### Test File Statistics

| Test File                | Count | Passed | Failed | Status |
| ------------------------ | ----- | ------ | ------ | ------ |
| client-browser.test.ts   | 28    | 28     | 0      | ✅     |
| client.test.ts           | 94    | 94     | 0      | ✅     |
| mod.test.ts              | 43    | 43     | 0      | ✅     |
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

### 2. Client Router Unit Tests (`client.test.ts`) — 94 tests

- ✅ `createRouter` (preact, react, empty routes)
- ✅ `match` (static, dynamic, wildcard, optional, query)
- ✅ `onRouteChange`, `getCurrentRoute`, before/after guards
- ✅ `getEngine`, dynamic `addRoute` / `removeRoute`, component loader, guard
  removal
- ✅ `start` / `destroy`, edge cases (slashes, full URL, encoded params)
- ✅ Meta, `basePath`, history/hash mode, navigation state, `isActive`,
  redirect, cache, `replace` / `prefetch`
- ✅ Link interception — special link shapes (14): same-page hash-only anchor,
  path+search+hash anchor, `target=_blank`, `download`, `data-native`,
  `mailto:`, `tel:`, `javascript:`, `blob:`, `data:`, cross-origin, empty
  `href`, same-origin intercept, composedPath, cross-page hash
- ✅ **Route specificity**: after construction and `addRoute`, order matches
  server `scan()` (e.g. static `/blog/new` before dynamic `/blog/:slug`)
- ✅ Hooks with no global router (SSR-safe): `useRoute`, `useQuery`,
  `useParams`, `useNavigationState`, `useIsActive`, `useRouter`

### 3. Server Router Tests (`mod.test.ts`) — 43 tests

- ✅ Constructor, `scan`, `match`, `getRoutes`, `getSpecialFile`
- ✅ Optional/wildcard/API routes, non-route `.ts`/`.js` ignored under non-`api`
  paths
- ✅ `getLayoutPathsForPath` / `getLayoutKeysForPath` (nested `_layout`)
- ✅ Redirects, middleware, `getClientRoutes`, `skipAppValidation`,
  `getApiMode`, module cache
- ✅ `RouteMatch.load` / `fullPath` / `meta`
- ✅ `isLikelyClientBundledAssetPath` and `match` fast-reject for bundle-like
  paths

### 4. Specificity Sort Tests (`specificity-sort.test.ts`) — 14 tests

- ✅ `buildRouteSpecificityTuple`, `compareSpecificityTuples`,
  `compareRoutesForScanOrder`
- ✅ Integration: `Router.scan()` then `match` prefers static over dynamic/API
  static over dynamic segment

## Conclusion

All tests pass on Deno (179) and Bun (176). The package covers server file
routing (including **scan-order specificity**), client navigation/guards/link
interception, layout key helpers, bundle path heuristics, and shared **core**
matching/sort logic used by both runtimes.

---

**Report generated**: 2026-03-24 **Test environment**: Deno + Bun + Puppeteer
