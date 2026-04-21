/**
 * 导航路径匹配纯函数测试（`src/client/nav-match.ts`）
 */

import { describe, expect, it } from "@dreamer/test";
import { isNavActive, normalizePathname } from "../src/client/nav-match.ts";

describe("nav-match", () => {
  describe("normalizePathname()", () => {
    it("根路径与空串规范为 /", () => {
      expect(normalizePathname("/")).toBe("/");
      expect(normalizePathname("")).toBe("/");
    });

    it("去掉末尾多余 /", () => {
      expect(normalizePathname("/foo/")).toBe("/foo");
      expect(normalizePathname("/foo///")).toBe("/foo");
    });
  });

  describe("isNavActive()", () => {
    it("首页仅精确匹配", () => {
      expect(isNavActive("/", "/")).toBe(true);
      expect(isNavActive("/", "/dashboard")).toBe(false);
    });

    it("子路径前缀匹配", () => {
      expect(isNavActive("/dash", "/dash")).toBe(true);
      expect(isNavActive("/dash", "/dash/board")).toBe(true);
      expect(isNavActive("/dash", "/dashboard")).toBe(false);
    });
  });
});
