/**
 * @fileoverview scan() 后路由特异性排序：单元测试与 Router 集成测试
 */

import {
  cwd,
  join,
  mkdir,
  remove,
  writeTextFile,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import {
  buildRouteSpecificityTuple,
  compareRoutesForScanOrder,
  compareSpecificityTuples,
  type RouteLikeForSort,
} from "../src/core.ts";
import { Router } from "../src/mod.ts";

/** 测试用路由目录（与 mod.test 并列，避免与现有 data 冲突） */
const scanOrderDir = join(cwd(), "tests", "data", "scan-specificity-order");

/**
 * 清空并创建「静态与动态并存」的博客路由树；文件名顺序保证 [slug] 在字典序上先于 new（与常见 readdir 一致）
 */
async function setupBlogStaticVsDynamic(): Promise<void> {
  try {
    await remove(scanOrderDir, { recursive: true });
  } catch {
    // 忽略首次删除失败
  }
  await mkdir(join(scanOrderDir, "blog"), { recursive: true });
  await writeTextFile(
    join(scanOrderDir, "_app.tsx"),
    "export default ({ children }: { children: unknown }) => children;",
  );
  await writeTextFile(
    join(scanOrderDir, "index.tsx"),
    "export default () => null;",
  );
  // 先写动态段，后写静态 new，便于依赖排序而非创建顺序
  await writeTextFile(
    join(scanOrderDir, "blog", "[slug].tsx"),
    "export default () => null;",
  );
  await writeTextFile(
    join(scanOrderDir, "blog", "new.tsx"),
    "export default () => null;",
  );
}

describe("buildRouteSpecificityTuple", () => {
  it("静态路径应含类型优先级与各段字面量 rank", () => {
    const t = buildRouteSpecificityTuple("/blog/new", "static");
    expect(t[0]).toBe(5);
    // 路径按 / 分段：blog、new 两段均为字面量
    expect(t.slice(1)).toEqual([3, 3]);
  });

  it("动态段应对 :param 使用低于字面量的 rank", () => {
    const t = buildRouteSpecificityTuple("/blog/:slug", "dynamic");
    expect(t[0]).toBe(4);
    expect(t.slice(1)).toEqual([3, 1]);
  });

  it("可选参数段 rank 介于字面量与必填动态之间", () => {
    const t = buildRouteSpecificityTuple("/blog/:slug?", "optional");
    expect(t[0]).toBe(3);
    expect(t.slice(1)).toEqual([3, 2]);
  });

  it("通配符末段应为 * 的最低 rank", () => {
    const t = buildRouteSpecificityTuple("/docs/*", "wildcard");
    expect(t[0]).toBe(1);
    expect(t.slice(1)).toEqual([3, 0]);
  });
});

describe("compareSpecificityTuples", () => {
  it("类型位更高者应视为更具体（排在前面时 compare 为负）", () => {
    const staticT = buildRouteSpecificityTuple("/a", "static");
    const dynT = buildRouteSpecificityTuple("/a", "dynamic");
    expect(compareSpecificityTuples(staticT, dynT)).toBeLessThan(0);
    expect(compareSpecificityTuples(dynT, staticT)).toBeGreaterThan(0);
  });

  it("同类型时字面量段应优先于动态段", () => {
    const a = buildRouteSpecificityTuple("/blog/new", "static");
    const b = buildRouteSpecificityTuple("/blog/:slug", "dynamic");
    expect(compareSpecificityTuples(a, b)).toBeLessThan(0);
  });
});

describe("compareRoutesForScanOrder", () => {
  const r = (
    path: string,
    type: RouteLikeForSort["type"],
    isApi: boolean,
  ): RouteLikeForSort => ({ path, type, isApi });

  it("同块内静态 /blog/new 应排在动态 /blog/:slug 之前", () => {
    expect(
      compareRoutesForScanOrder(
        r("/blog/new", "static", false),
        r("/blog/:slug", "dynamic", false),
      ),
    ).toBeLessThan(0);
  });

  it("动态 /blog/:id 应排在通配 /blog/* 之前", () => {
    expect(
      compareRoutesForScanOrder(
        r("/blog/:id", "dynamic", false),
        r("/blog/*", "wildcard", false),
      ),
    ).toBeLessThan(0);
  });

  it("必填动态应排在同路径形状的 optional 之前", () => {
    expect(
      compareRoutesForScanOrder(
        r("/blog/:id", "dynamic", false),
        r("/blog/:slug?", "optional", false),
      ),
    ).toBeLessThan(0);
  });

  it("页面路由应整体排在 API 路由之前（isApi false 先于 true）", () => {
    expect(
      compareRoutesForScanOrder(
        r("/z/last", "static", false),
        r("/a/first", "static", true),
      ),
    ).toBeLessThan(0);
  });

  it("特异性相同时按 path 字典序稳定兜底", () => {
    expect(
      compareRoutesForScanOrder(
        r("/a/c", "static", false),
        r("/a/b", "static", false),
      ),
    ).toBeGreaterThan(0);
  });
});

describe("Router.scan 特异性排序（集成）", () => {
  it("match(/blog/new) 应命中静态 new 而非动态 [slug]", async () => {
    await setupBlogStaticVsDynamic();
    const router = new Router({
      routesDir: scanOrderDir,
    });
    await router.scan();

    const blogRoutes = router.getRoutes().filter(
      (x) => x.path.startsWith("/blog") && !x.isSpecial,
    );
    expect(blogRoutes.length).toBeGreaterThanOrEqual(2);
    expect(blogRoutes[0]?.path).toBe("/blog/new");
    expect(blogRoutes[1]?.path).toBe("/blog/:slug");

    const m = await router.match("/blog/new");
    expect(m).toBeTruthy();
    expect(m?.route.path).toBe("/blog/new");
    expect(m?.route.type).toBe("static");

    const m2 = await router.match("/blog/hello");
    expect(m2).toBeTruthy();
    expect(m2?.route.path).toBe("/blog/:slug");
    expect(m2?.params.slug).toBe("hello");
  });

  it("API 路由中静态段应优先于动态段", async () => {
    try {
      await remove(scanOrderDir, { recursive: true });
    } catch {
      // ignore
    }
    await mkdir(join(scanOrderDir, "api", "v1"), { recursive: true });
    await writeTextFile(
      join(scanOrderDir, "_app.tsx"),
      "export default ({ children }: { children: unknown }) => children;",
    );
    await writeTextFile(
      join(scanOrderDir, "index.tsx"),
      "export default () => null;",
    );
    await writeTextFile(
      join(scanOrderDir, "api", "v1", "[id].ts"),
      "export async function GET() { return new Response('dyn'); }",
    );
    await writeTextFile(
      join(scanOrderDir, "api", "v1", "health.ts"),
      "export async function GET() { return new Response('ok'); }",
    );

    const router = new Router({
      routesDir: scanOrderDir,
      apiMode: "restful",
    });
    await router.scan();

    const apiV1 = router
      .getRoutes()
      .filter((r) => r.isApi && r.path.startsWith("/api/v1"));
    const healthIdx = apiV1.findIndex((r) => r.path === "/api/v1/health");
    const idIdx = apiV1.findIndex((r) => r.path === "/api/v1/:id");
    expect(healthIdx).toBeGreaterThanOrEqual(0);
    expect(idIdx).toBeGreaterThanOrEqual(0);
    expect(healthIdx).toBeLessThan(idIdx);

    const hit = await router.match("/api/v1/health", { method: "GET" });
    expect(hit?.route.path).toBe("/api/v1/health");
  });
});
