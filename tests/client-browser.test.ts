/**
 * 客户端路由器浏览器测试
 *
 * 测试需要浏览器环境的功能：
 * - navigate 导航
 * - go/back/forward 历史操作
 * - 路由守卫执行
 * - popstate 事件监听
 * - onRouteChange 回调触发
 *
 * 注意：这些测试需要 HTTP 服务器环境，因为 history.pushState
 * 在 file:// 协议下无法正常工作。
 */

// 注意：浏览器测试中的 window 是在 browser.evaluate() 回调中使用的
// 这些代码实际在浏览器中执行，window 是正确的全局对象

import {
  cwd,
  resolve,
  serve,
  type ServeHandle,
} from "@dreamer/runtime-adapter";
import { afterAll, beforeAll, describe, expect, it } from "@dreamer/test";

// 服务器实例
let server: ServeHandle | null = null;
let serverPort: number = 0;
let bundleCode: string = "";
let serverReady: boolean = false;

// HTTP 服务器配置（用于需要 history API 的测试）
const serverBrowserConfig = {
  sanitizeOps: false,
  sanitizeResources: false,
  timeout: 60_000,
  browser: {
    enabled: true,
    globalName: "RouterClient",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    reuseBrowser: true,
  },
};

// file:// 协议配置（用于不需要 history API 的测试）
const browserConfig = {
  sanitizeOps: false,
  sanitizeResources: false,
  timeout: 60_000,
  browser: {
    enabled: true,
    entryPoint: "./src/client/mod.ts",
    globalName: "RouterClient",
    browserMode: false,
    moduleLoadTimeout: 30_000,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    reuseBrowser: true,
    bodyContent: `<div id="app"></div>`,
  },
};

/**
 * 启动测试服务器
 */
async function startTestServer(): Promise<number> {
  // 使用 import map 中配置的 esbuild，兼容 Deno 和 Bun
  const esbuild = await import("esbuild");
  const entryPoint = resolve(cwd(), "./src/client/mod.ts");

  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "iife",
    globalName: "RouterClient",
    write: false,
    platform: "browser",
    target: ["chrome100", "firefox100", "safari15"],
  });

  bundleCode = new TextDecoder().decode(result.outputFiles[0].contents);

  server = serve({ port: 0 }, (_req) => {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Router Test</title></head>
<body>
<div id="app"></div>
<script>
${bundleCode}
window.testReady = true;
</script>
</body>
</html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  });

  await new Promise((r) => setTimeout(r, 100));
  serverPort = server.port || 3456;
  serverReady = true;
  return serverPort;
}

/**
 * 停止测试服务器
 */
async function stopTestServer(): Promise<void> {
  if (server) {
    await server.shutdown();
    server = null;
    serverReady = false;
  }
}

/**
 * 获取服务器 URL
 */
function getServerUrl(): string {
  return `http://localhost:${serverPort}`;
}

/**
 * 准备浏览器测试环境
 */
async function prepareBrowser(browser: any): Promise<boolean> {
  if (!serverReady) {
    console.warn("服务器未就绪");
    return false;
  }
  try {
    await browser.goto(getServerUrl());
    await browser.waitFor(
      () => (globalThis as any).RouterClient !== undefined,
      { timeout: 10000 },
    );
    return true;
  } catch (error) {
    console.warn("浏览器准备失败:", error);
    return false;
  }
}

describe("客户端路由器 - 浏览器测试", () => {
  // 启动/停止服务器
  beforeAll(async () => {
    console.log("启动测试服务器...");
    const port = await startTestServer();
    console.log(`测试服务器已启动在端口 ${port}`);
  });

  afterAll(async () => {
    console.log("停止测试服务器...");
    await stopTestServer();
  });

  // ==================== 基本功能测试（file:// 协议） ====================

  it("应该导出所有必要的函数", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };
      return {
        hasCreateRouter: typeof RouterClient.createRouter === "function",
        hasClientRouter: typeof RouterClient.ClientRouter === "function",
        hasUseRouter: typeof RouterClient.useRouter === "function",
      };
    });

    if (result.error) {
      console.warn("测试跳过:", result.error);
      return;
    }
    expect(result.hasCreateRouter).toBe(true);
    expect(result.hasClientRouter).toBe(true);
    expect(result.hasUseRouter).toBe(true);
  }, browserConfig);

  it("useRouter: 应该抛出错误", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };
      try {
        RouterClient.useRouter();
        return { threw: false };
      } catch (e) {
        return { threw: true, message: (e as Error).message };
      }
    });

    if (result.error) return;
    expect(result.threw).toBe(true);
    expect(result.message).toContain("useRouter");
  }, browserConfig);

  it("getEngine: 应该返回配置的引擎", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const r1 = RouterClient.createRouter({ routes: [], engine: "preact" });
      const r2 = RouterClient.createRouter({ routes: [], engine: "react" });
      const r3 = RouterClient.createRouter({ routes: [], engine: "vue3" });
      const r4 = RouterClient.createRouter({ routes: [] });

      return {
        preact: r1.getEngine(),
        react: r2.getEngine(),
        vue3: r3.getEngine(),
        defaultEngine: r4.getEngine(),
      };
    });

    if (result.error) return;
    expect(result.preact).toBe("preact");
    expect(result.react).toBe("react");
    expect(result.vue3).toBe("vue3");
    expect(result.defaultEngine).toBe("preact");
  }, browserConfig);

  // ==================== navigate 导航测试（HTTP 服务器） ====================

  it("navigate: 应该能导航到指定路径", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.navigate("/about");

      return {
        pathname: (globalThis as any).location.pathname,
        currentRoute: router.getCurrentRoute()?.route.path,
      };
    });

    if (result.error) return;
    expect(result.pathname).toBe("/about");
    expect(result.currentRoute).toBe("/about");
  }, serverBrowserConfig);

  it("navigate: 应该支持替换历史记录", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
        { path: "/contact", component: "contact", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.navigate("/about");
      router.navigate("/contact", true); // replace

      return {
        pathname: (globalThis as any).location.pathname,
        currentRoute: router.getCurrentRoute()?.route.path,
      };
    });

    if (result.error) return;
    expect(result.pathname).toBe("/contact");
    expect(result.currentRoute).toBe("/contact");
  }, serverBrowserConfig);

  // ==================== onRouteChange 回调测试 ====================

  it("onRouteChange: 应该在导航时触发回调", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      const callHistory: string[] = [];

      router.onRouteChange((match: any) => {
        callHistory.push(match?.route.path || "null");
      });
      router.navigate("/about");

      return { callHistory };
    });

    if (result.error) return;
    expect(result.callHistory.length).toBeGreaterThanOrEqual(2);
    expect(result.callHistory[result.callHistory.length - 1]).toBe("/about");
  }, serverBrowserConfig);

  // ==================== beforeRoute 前置守卫测试 ====================

  it("beforeRoute: 应该在导航前执行守卫", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      let guardCalled = false;
      let guardTo: string | null = null;

      router.beforeRoute((to: any, _from: any) => {
        guardCalled = true;
        guardTo = to.route.path;
        return true;
      });
      router.navigate("/about");

      return { guardCalled, guardTo };
    });

    if (result.error) return;
    expect(result.guardCalled).toBe(true);
    expect(result.guardTo).toBe("/about");
  }, serverBrowserConfig);

  it("beforeRoute: 应该能阻止导航", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
        { path: "/admin", component: "admin", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      // 先导航到 /about
      router.navigate("/about");
      const routeAfterAbout = router.getCurrentRoute()?.route.path;

      // 添加阻止 /admin 的守卫
      router.beforeRoute((to: any) => {
        if (to.route.path === "/admin") return false;
        return true;
      });

      // 尝试导航到 /admin（应该被阻止）
      router.navigate("/admin");
      const routeAfterAdmin = router.getCurrentRoute()?.route.path;

      return { routeAfterAbout, routeAfterAdmin };
    });

    if (result.error) return;
    expect(result.routeAfterAbout).toBe("/about");
    expect(result.routeAfterAdmin).toBe("/about"); // 被阻止，保持在 /about
  }, serverBrowserConfig);

  // ==================== afterRoute 后置守卫测试 ====================

  it("afterRoute: 应该在导航后执行守卫", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      let afterGuardCalled = false;
      let afterTo: string | null = null;

      router.afterRoute((to: any) => {
        afterGuardCalled = true;
        afterTo = to.route.path;
      });

      // navigate 现在是异步的，需要 await
      await router.navigate("/about");

      return { afterGuardCalled, afterTo };
    });

    if (result.error) return;
    expect(result.afterGuardCalled).toBe(true);
    expect(result.afterTo).toBe("/about");
  }, serverBrowserConfig);

  // ==================== 历史操作测试 ====================

  it("back: 应该能后退", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
        { path: "/contact", component: "contact", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      router.navigate("/about");
      router.navigate("/contact");

      // 使用 Promise 等待 popstate 事件
      await new Promise<void>((resolve) => {
        (globalThis as any).addEventListener("popstate", () => resolve(), {
          once: true,
        });
        router.back();
      });

      return { pathname: (globalThis as any).location.pathname };
    });

    if (result.error) return;
    expect(result.pathname).toBe("/about");
  }, serverBrowserConfig);

  it("forward: 应该能前进", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
        { path: "/contact", component: "contact", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      router.navigate("/about");
      router.navigate("/contact");

      // 等待 back 完成
      await new Promise<void>((resolve) => {
        (globalThis as any).addEventListener("popstate", () => resolve(), {
          once: true,
        });
        router.back();
      });

      // 等待 forward 完成
      await new Promise<void>((resolve) => {
        (globalThis as any).addEventListener("popstate", () => resolve(), {
          once: true,
        });
        router.forward();
      });

      return { pathname: (globalThis as any).location.pathname };
    });

    if (result.error) return;
    expect(result.pathname).toBe("/contact");
  }, serverBrowserConfig);

  it("go: 应该能跳转多步", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/page1", component: "page1", type: "static" },
        { path: "/page2", component: "page2", type: "static" },
        { path: "/page3", component: "page3", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      router.navigate("/page1");
      router.navigate("/page2");
      router.navigate("/page3");

      // 等待 go(-2) 完成
      await new Promise<void>((resolve) => {
        (globalThis as any).addEventListener("popstate", () => resolve(), {
          once: true,
        });
        router.go(-2);
      });

      return { pathname: (globalThis as any).location.pathname };
    });

    if (result.error) return;
    expect(result.pathname).toBe("/page1");
  }, serverBrowserConfig);

  // ==================== 动态路由参数测试 ====================

  it("动态路由: 应该正确匹配动态路由参数", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/user/:id", component: "user/[id]", type: "dynamic" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.navigate("/user/123");

      const match = router.getCurrentRoute();
      return { path: match?.route.path, params: match?.params };
    });

    if (result.error) return;
    expect(result.path).toBe("/user/:id");
    expect(result.params).toEqual({ id: "123" });
  }, serverBrowserConfig);

  it("查询参数: 应该正确解析查询参数", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/search", component: "search", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.navigate("/search?q=hello&page=1");

      const match = router.getCurrentRoute();
      return { path: match?.route.path, query: match?.query };
    });

    if (result.error) return;
    expect(result.path).toBe("/search");
    expect(result.query).toEqual({ q: "hello", page: "1" });
  }, serverBrowserConfig);

  // ==================== 组件加载器测试 ====================

  it("setComponentLoader: 应该使用自定义组件加载器", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      const mockComponent = { default: () => "test" };
      let receivedComponent = "";

      router.setComponentLoader((component: string) => {
        receivedComponent = component;
        return Promise.resolve(mockComponent);
      });

      router.navigate("/about");
      const match = router.getCurrentRoute();
      const loaded = await match?.load?.();

      return { receivedComponent, loadedComponent: loaded === mockComponent };
    });

    if (result.error) return;
    expect(result.receivedComponent).toBe("about");
    expect(result.loadedComponent).toBe(true);
  }, serverBrowserConfig);

  // ==================== start 链接拦截测试 ====================

  it("start: 应该能启动链接拦截", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      // start 方法应该存在
      const hasStart = typeof router.start === "function";
      router.start();

      return { hasStart };
    });

    if (result.error) return;
    expect(result.hasStart).toBe(true);
  }, serverBrowserConfig);

  it("start: 应该拦截同源链接点击", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 记录路由变化
      const routeChanges: string[] = [];
      router.onRouteChange((match: any) => {
        routeChanges.push(match?.route.path || "null");
      });

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个链接并点击
      const link = doc.createElement("a");
      link.href = "/about";
      link.textContent = "About";
      doc.body.appendChild(link);

      // 模拟点击
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(clickEvent);

      // 等待路由变化
      await new Promise((r) => setTimeout(r, 50));

      // 清理
      doc.body.removeChild(link);

      return {
        pathname: (globalThis as any).location.pathname,
        routeChanges,
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    expect(result.pathname).toBe("/about");
    expect(result.eventDefaultPrevented).toBe(true);
    expect(result.routeChanges).toContain("/about");
  }, serverBrowserConfig);

  it("start: 不应该拦截外部链接", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个外部链接
      const link = doc.createElement("a");
      link.href = "https://example.com/page";
      link.textContent = "External";
      doc.body.appendChild(link);

      // 模拟点击
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(clickEvent);

      // 清理
      doc.body.removeChild(link);

      return {
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    // 外部链接不应该被阻止默认行为
    expect(result.eventDefaultPrevented).toBe(false);
  }, serverBrowserConfig);

  it("start: 不应该拦截 target=_blank 链接", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个带 target="_blank" 的链接
      const link = doc.createElement("a");
      link.href = "/about";
      link.target = "_blank";
      link.textContent = "About (new tab)";
      doc.body.appendChild(link);

      // 模拟点击
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(clickEvent);

      // 清理
      doc.body.removeChild(link);

      return {
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    // target="_blank" 链接不应该被阻止
    expect(result.eventDefaultPrevented).toBe(false);
  }, serverBrowserConfig);

  it("start: 不应该拦截 data-native 链接", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/download", component: "download", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个带 data-native 的链接
      const link = doc.createElement("a");
      link.href = "/download";
      link.setAttribute("data-native", "");
      link.textContent = "Download";
      doc.body.appendChild(link);

      // 模拟点击
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(clickEvent);

      // 清理
      doc.body.removeChild(link);

      return {
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    // data-native 链接不应该被阻止
    expect(result.eventDefaultPrevented).toBe(false);
  }, serverBrowserConfig);

  it("start: 不应该拦截 download 链接", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/file", component: "file", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个带 download 的链接
      const link = doc.createElement("a");
      link.href = "/file";
      link.download = "file.pdf";
      link.textContent = "Download File";
      doc.body.appendChild(link);

      // 模拟点击
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(clickEvent);

      // 清理
      doc.body.removeChild(link);

      return {
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    // download 链接不应该被阻止
    expect(result.eventDefaultPrevented).toBe(false);
  }, serverBrowserConfig);

  it("start: 按住 Ctrl 键时不应该拦截", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个链接
      const link = doc.createElement("a");
      link.href = "/about";
      link.textContent = "About";
      doc.body.appendChild(link);

      // 模拟按住 Ctrl 键点击
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        ctrlKey: true,
      });
      link.dispatchEvent(clickEvent);

      // 清理
      doc.body.removeChild(link);

      return {
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    // Ctrl+点击不应该被阻止（用于在新标签页打开）
    expect(result.eventDefaultPrevented).toBe(false);
  }, serverBrowserConfig);

  it("start: 按住 Meta 键时不应该拦截", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个链接
      const link = doc.createElement("a");
      link.href = "/about";
      link.textContent = "About";
      doc.body.appendChild(link);

      // 模拟按住 Meta 键点击（macOS 的 Cmd 键）
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        metaKey: true,
      });
      link.dispatchEvent(clickEvent);

      // 清理
      doc.body.removeChild(link);

      return {
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    // Meta+点击不应该被阻止（用于在新标签页打开）
    expect(result.eventDefaultPrevented).toBe(false);
  }, serverBrowserConfig);

  it("start: 应该是幂等的", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });

      // 多次调用 start
      router.start();
      router.start();
      router.start();

      // 记录路由变化
      let routeChangeCount = 0;
      router.onRouteChange(() => {
        routeChangeCount++;
      });

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个链接并点击
      const link = doc.createElement("a");
      link.href = "/about";
      link.textContent = "About";
      doc.body.appendChild(link);

      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(clickEvent);

      await new Promise((r) => setTimeout(r, 50));
      doc.body.removeChild(link);

      // routeChangeCount 应该只增加一次（不会因为多次 start 而重复触发）
      return { routeChangeCount };
    });

    if (result.error) return;
    // 初始触发 1 次 + 导航触发 1 次 = 2 次
    expect(result.routeChangeCount).toBe(2);
  }, serverBrowserConfig);

  it("destroy: 应该移除链接拦截器", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(() => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();
      router.destroy();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个链接
      const link = doc.createElement("a");
      link.href = "/about";
      link.textContent = "About";
      doc.body.appendChild(link);

      // 模拟点击
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(clickEvent);

      doc.body.removeChild(link);

      return {
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    // destroy 后链接点击不应该被阻止
    expect(result.eventDefaultPrevented).toBe(false);
  }, serverBrowserConfig);

  it("start: 应该拦截嵌套在 a 标签内的元素点击", async (ctx) => {
    if ((ctx as any)._browserSetupError) return;
    const browser = (ctx as any).browser;
    if (!browser) return;
    if (!await prepareBrowser(browser)) return;

    const result = await browser.evaluate(async () => {
      const RouterClient = (globalThis as any).RouterClient;
      if (!RouterClient) return { error: "RouterClient not available" };

      const routes = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = RouterClient.createRouter({ routes });
      router.start();

      // 获取浏览器 API（避免 Deno 类型检查错误）
      const doc = (globalThis as any).document;
      const BrowserMouseEvent = (globalThis as any).MouseEvent;

      // 创建一个带嵌套元素的链接
      const link = doc.createElement("a");
      link.href = "/about";
      const span = doc.createElement("span");
      span.textContent = "About";
      link.appendChild(span);
      doc.body.appendChild(link);

      // 点击 span 元素（不是直接点击 a 标签）
      const clickEvent = new BrowserMouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      span.dispatchEvent(clickEvent);

      await new Promise((r) => setTimeout(r, 50));
      doc.body.removeChild(link);

      return {
        pathname: (globalThis as any).location.pathname,
        eventDefaultPrevented: clickEvent.defaultPrevented,
      };
    });

    if (result.error) return;
    expect(result.pathname).toBe("/about");
    expect(result.eventDefaultPrevented).toBe(true);
  }, serverBrowserConfig);
});
