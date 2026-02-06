# @dreamer/router Test Report

## Test Overview

| Item | Info |
|------|------|
| Test library version | 1.0.0-beta.9 |
| Runtime adapter | @dreamer/runtime-adapter@^1.0.0-beta.22 |
| Test framework | @dreamer/test@^1.0.0-beta.40 |
| Test date | 2026-02-03 |
| Test environment | Deno + Bun + Puppeteer (browser tests) |

## Test Results

### Overall Statistics

| Metric | Value |
|--------|-------|
| Total tests | 130 |
| Passed | 130 |
| Failed | 0 |
| Pass rate | 100% |
| Execution time | ~31s |

### Runtime Compatibility

| Runtime | Tests | Passed | Status |
|---------|-------|--------|--------|
| Deno | 130 | 130 | ✅ |
| Bun | 130 | 130 | ✅ |

### Test File Statistics

| Test File | Count | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| client-browser.test.ts | 27 | 27 | 0 | ✅ |
| client.test.ts | 69 | 69 | 0 | ✅ |
| mod.test.ts | 34 | 34 | 0 | ✅ |

## Feature Test Details

### 1. Client Router Browser Tests (client-browser.test.ts) - 27 tests

**Test environment**: Real browser tests via HTTP server + Puppeteer

- ✅ Export all required functions, useRouter errors, getEngine
- ✅ navigate, replace mode
- ✅ onRouteChange, beforeRoute, afterRoute guards
- ✅ back/forward/go history operations
- ✅ Dynamic routes, query params, component loader
- ✅ start link interception (same-origin, external, target=_blank, modifier keys, etc.)
- ✅ destroy

### 2. Client Router Unit Tests (client.test.ts) - 69 tests

- ✅ createRouter (preact, react, empty routes)
- ✅ match (static, dynamic, wildcard, optional params, query params)
- ✅ onRouteChange, getCurrentRoute
- ✅ beforeRoute, afterRoute guards
- ✅ getEngine (preact, react)
- ✅ Dynamic route management, component loader, guard management
- ✅ start, destroy, edge cases
- ✅ Route metadata, base path, route mode, navigation state, isActive, redirect, cache

### 3. Server Router Tests (mod.test.ts) - 34 tests

- ✅ constructor, scan, match, getRoutes, getSpecialFile
- ✅ Redirect, middleware, getClientRoutes, skipAppValidation
- ✅ getEngine, getApiMode, isSSREnabled, clearCache
- ✅ RouteMatch extensions (load, fullPath, meta)

## Conclusion

@dreamer/router has 100% test coverage with all 130 tests passing. Supports Preact and React rendering engines, covering server-side route scan/match and client-side route navigation/guards/link interception.

---

**Report generated**: 2026-02-03
**Test environment**: Deno + Bun + Puppeteer
