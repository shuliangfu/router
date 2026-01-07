/**
 * @fileoverview Router 测试
 */

import { describe, expect, it } from "jsr:@dreamer/test@^1.0.0-alpha.1";
import { ensureDir } from "jsr:@std/fs@^1.0.0";
import { join } from "jsr:@std/path@^1.0.0/join";
import { Router } from "../src/mod.ts";

describe("Router", () => {
  const testRoutesDir = join(Deno.cwd(), "tests", "output", "test-routes");

  // 辅助函数：创建测试路由文件
  async function setupTestRoutes() {
    await ensureDir(testRoutesDir);
    await ensureDir(join(testRoutesDir, "user"));
    // 创建必需的特殊文件
    await Deno.writeTextFile(
      join(testRoutesDir, "_app.tsx"),
      "export default ({ children }: { children: any }) => children;",
    );
    await Deno.writeTextFile(
      join(testRoutesDir, "index.tsx"),
      "export default () => <div>Home</div>;",
    );
    await Deno.writeTextFile(
      join(testRoutesDir, "user", "[id].tsx"),
      "export default () => <div>User</div>;",
    );
  }

  describe("scan", () => {
    it("应该扫描路由文件", async () => {
      await setupTestRoutes();
      const router = new Router({ routesDir: testRoutesDir });
      await router.scan();

      const routes = router.getRoutes();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe("match", () => {
    it("应该匹配静态路由", async () => {
      await setupTestRoutes();
      const router = new Router({ routesDir: testRoutesDir });
      await router.scan();

      const match = await router.match("/");
      expect(match).toBeTruthy();
    });

    it("应该匹配动态路由", async () => {
      await setupTestRoutes();
      const router = new Router({ routesDir: testRoutesDir });
      await router.scan();

      const match = await router.match("/user/123");
      expect(match).toBeTruthy();
      if (match) {
        expect(match.params.id).toBe("123");
      }
    });
  });
});
