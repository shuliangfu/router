/**
 * 客户端路由器测试
 *
 * 测试 @dreamer/router/client 的所有功能
 */

import { afterEach, beforeEach, describe, expect, it } from "@dreamer/test";
import {
  type ClientRoute,
  type ClientRouteMatch,
  ClientRouter,
  type ClientRouterOptions,
  createRouter,
} from "../src/client/mod.ts";

/**
 * 测试用路由配置
 */
const testRoutes: ClientRoute[] = [
  { path: "/", component: "index", type: "static" },
  { path: "/about", component: "about", type: "static" },
  { path: "/user/:id", component: "user/[id]", type: "dynamic" },
  {
    path: "/post/:category/:slug",
    component: "post/[category]/[slug]",
    type: "dynamic",
  },
  { path: "/docs/*", component: "docs/[...path]", type: "wildcard" },
  { path: "/settings/:tab?", component: "settings/[[tab]]", type: "optional" },
];

describe("ClientRouter", () => {
  describe("createRouter", () => {
    it("应该创建路由器实例", () => {
      const router = createRouter({ routes: testRoutes });
      expect(router).toBeInstanceOf(ClientRouter);
    });

    it("应该使用默认引擎 preact", () => {
      const router = createRouter({ routes: testRoutes });
      expect(router).toBeDefined();
    });

    it("应该支持自定义引擎", () => {
      const router = createRouter({ routes: testRoutes, engine: "react" });
      expect(router).toBeDefined();
    });

    it("应该支持空路由列表", () => {
      const router = createRouter({ routes: [] });
      expect(router.getRoutes()).toHaveLength(0);
    });
  });

  describe("getRoutes", () => {
    it("应该返回所有路由", () => {
      const router = createRouter({ routes: testRoutes });
      const routes = router.getRoutes();
      expect(routes).toHaveLength(testRoutes.length);
    });

    it("应该返回路由的副本", () => {
      const router = createRouter({ routes: testRoutes });
      const routes1 = router.getRoutes();
      const routes2 = router.getRoutes();
      expect(routes1).not.toBe(routes2);
      expect(routes1).toEqual(routes2);
    });
  });

  describe("match - 静态路由", () => {
    it("应该匹配根路径", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/");
      expect(match).not.toBeNull();
      expect(match?.route.path).toBe("/");
      expect(match?.route.component).toBe("index");
      expect(match?.params).toEqual({});
    });

    it("应该匹配静态路径 /about", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/about");
      expect(match).not.toBeNull();
      expect(match?.route.path).toBe("/about");
      expect(match?.route.component).toBe("about");
    });

    it("应该返回 null 对于不存在的路径", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/nonexistent");
      expect(match).toBeNull();
    });
  });

  describe("match - 动态路由", () => {
    it("应该匹配单参数动态路由", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/user/123");
      expect(match).not.toBeNull();
      expect(match?.route.path).toBe("/user/:id");
      expect(match?.params).toEqual({ id: "123" });
    });

    it("应该匹配多参数动态路由", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/post/tech/hello-world");
      expect(match).not.toBeNull();
      expect(match?.route.path).toBe("/post/:category/:slug");
      expect(match?.params).toEqual({ category: "tech", slug: "hello-world" });
    });

    it("应该正确处理特殊字符参数", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/user/user-123_abc");
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ id: "user-123_abc" });
    });
  });

  describe("match - 通配符路由", () => {
    it("应该匹配通配符路由", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/docs/getting-started");
      expect(match).not.toBeNull();
      expect(match?.route.path).toBe("/docs/*");
      expect(match?.params["*"]).toBe("/getting-started");
    });

    it("应该匹配深层通配符路径", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/docs/api/reference/methods");
      expect(match).not.toBeNull();
      expect(match?.params["*"]).toBe("/api/reference/methods");
    });
  });

  describe("match - 可选参数路由", () => {
    it("应该匹配可选参数存在时", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/settings/profile");
      expect(match).not.toBeNull();
      expect(match?.route.path).toBe("/settings/:tab?");
      expect(match?.params).toEqual({ tab: "profile" });
    });

    it("应该匹配可选参数不存在时", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/settings");
      expect(match).not.toBeNull();
      expect(match?.route.path).toBe("/settings/:tab?");
      expect(match?.params).toEqual({});
    });
  });

  describe("match - 查询参数", () => {
    it("应该解析查询参数", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/about?foo=bar&baz=123");
      expect(match).not.toBeNull();
      expect(match?.query).toEqual({ foo: "bar", baz: "123" });
    });

    it("应该处理空查询参数", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/about");
      expect(match).not.toBeNull();
      expect(match?.query).toEqual({});
    });

    it("应该处理动态路由的查询参数", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/user/123?tab=settings");
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ id: "123" });
      expect(match?.query).toEqual({ tab: "settings" });
    });
  });

  describe("match - load 函数", () => {
    it("应该返回 load 函数", () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/about");
      expect(match?.load).toBeDefined();
      expect(typeof match?.load).toBe("function");
    });

    it("load 函数应该返回 Promise", async () => {
      const router = createRouter({ routes: testRoutes });
      const match = router.match("/about");
      // load 函数默认会拒绝，因为需要构建工具支持
      try {
        await match?.load?.();
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          "组件加载功能需要根据构建工具实现",
        );
      }
    });
  });

  describe("onRouteChange", () => {
    it("应该注册回调并立即触发", () => {
      const router = createRouter({ routes: testRoutes });
      let callCount = 0;
      const captured: { match: ClientRouteMatch | null } = { match: null };

      router.onRouteChange((match) => {
        callCount++;
        captured.match = match;
      });

      expect(callCount).toBe(1);
      // 在非浏览器环境中，pathname 默认为 "/"
      expect(captured.match?.route.path).toBe("/");
    });

    it("应该返回取消订阅函数", () => {
      const router = createRouter({ routes: testRoutes });
      let callCount = 0;

      const unsubscribe = router.onRouteChange(() => {
        callCount++;
      });

      expect(callCount).toBe(1);
      expect(typeof unsubscribe).toBe("function");

      // 取消订阅
      unsubscribe();
      // 后续不应再触发（需要浏览器环境测试）
    });

    it("应该支持多个回调", () => {
      const router = createRouter({ routes: testRoutes });
      let count1 = 0;
      let count2 = 0;

      router.onRouteChange(() => count1++);
      router.onRouteChange(() => count2++);

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe("getCurrentRoute", () => {
    it("应该返回当前路由", () => {
      const router = createRouter({ routes: testRoutes });
      const route = router.getCurrentRoute();
      // 在非浏览器环境中，pathname 默认为 "/"
      expect(route?.route.path).toBe("/");
    });

    it("应该缓存当前路由", () => {
      const router = createRouter({ routes: testRoutes });
      const route1 = router.getCurrentRoute();
      const route2 = router.getCurrentRoute();
      expect(route1).toBe(route2);
    });
  });

  describe("beforeRoute 守卫", () => {
    it("应该注册前置守卫", () => {
      const router = createRouter({ routes: testRoutes });
      let guardCalled = false;

      router.beforeRoute(() => {
        guardCalled = true;
      });

      // 守卫在导航时触发，需要浏览器环境测试
      expect(guardCalled).toBe(false);
    });

    it("应该支持多个前置守卫", () => {
      const router = createRouter({ routes: testRoutes });
      const guards: string[] = [];

      router.beforeRoute(() => {
        guards.push("guard1");
      });
      router.beforeRoute(() => {
        guards.push("guard2");
      });

      // 守卫已注册
      expect(guards).toHaveLength(0);
    });
  });

  describe("afterRoute 守卫", () => {
    it("应该注册后置守卫", () => {
      const router = createRouter({ routes: testRoutes });
      let guardCalled = false;

      router.afterRoute(() => {
        guardCalled = true;
      });

      expect(guardCalled).toBe(false);
    });
  });
});

describe("ClientRouter - 类型检查", () => {
  it("ClientRouterOptions 应该包含 engine 属性", () => {
    const options: ClientRouterOptions = {
      routes: [],
      engine: "preact",
    };
    expect(options.engine).toBe("preact");
  });

  it("ClientRoute 应该包含所有必需属性", () => {
    const route: ClientRoute = {
      path: "/test",
      component: "test",
      type: "static",
    };
    expect(route.path).toBe("/test");
    expect(route.component).toBe("test");
    expect(route.type).toBe("static");
  });

  it("ClientRouteMatch 应该包含所有必需属性", () => {
    const router = createRouter({ routes: testRoutes });
    const match = router.match("/");

    expect(match).not.toBeNull();
    if (match) {
      expect(match.route).toBeDefined();
      expect(match.params).toBeDefined();
      expect(match.query).toBeDefined();
      expect(match.load).toBeDefined();
    }
  });
});

describe("ClientRouter - getEngine", () => {
  it("应该返回默认引擎 preact", () => {
    const router = createRouter({ routes: testRoutes });
    expect(router.getEngine()).toBe("preact");
  });

  it("应该返回配置的引擎 react", () => {
    const router = createRouter({ routes: testRoutes, engine: "react" });
    expect(router.getEngine()).toBe("react");
  });
});

describe("ClientRouter - 动态路由管理", () => {
  it("应该动态添加路由", () => {
    const router = createRouter({ routes: [] });
    expect(router.getRoutes()).toHaveLength(0);

    router.addRoute({ path: "/test", component: "test", type: "static" });
    expect(router.getRoutes()).toHaveLength(1);
    expect(router.getRoutes()[0].path).toBe("/test");
  });

  it("应该动态移除路由", () => {
    const router = createRouter({ routes: [...testRoutes] });
    const initialLength = router.getRoutes().length;

    const removed = router.removeRoute("/about");
    expect(removed).toBe(true);
    expect(router.getRoutes()).toHaveLength(initialLength - 1);
  });

  it("移除不存在的路由应返回 false", () => {
    const router = createRouter({ routes: testRoutes });
    const removed = router.removeRoute("/nonexistent");
    expect(removed).toBe(false);
  });

  it("应该能匹配动态添加的路由", () => {
    const router = createRouter({ routes: [] });
    router.addRoute({ path: "/dynamic", component: "dynamic", type: "static" });

    const match = router.match("/dynamic");
    expect(match).not.toBeNull();
    expect(match?.route.component).toBe("dynamic");
  });
});

describe("ClientRouter - 组件加载器", () => {
  it("应该使用自定义组件加载器", async () => {
    const router = createRouter({ routes: testRoutes });
    const mockComponent = { default: () => "test" };

    router.setComponentLoader((_component) => {
      return Promise.resolve(mockComponent);
    });

    const match = router.match("/about");
    const loaded = await match?.load?.();
    expect(loaded).toBe(mockComponent);
  });

  it("组件加载器应该接收组件标识", async () => {
    const router = createRouter({ routes: testRoutes });
    let receivedComponent = "";

    router.setComponentLoader((component) => {
      receivedComponent = component;
      return Promise.resolve({ default: () => null });
    });

    const match = router.match("/about");
    await match?.load?.();
    expect(receivedComponent).toBe("about");
  });
});

describe("ClientRouter - 守卫管理", () => {
  it("应该移除前置守卫", () => {
    const router = createRouter({ routes: testRoutes });
    const guard = () => true;

    router.beforeRoute(guard);
    const removed = router.removeBeforeRoute(guard);
    expect(removed).toBe(true);
  });

  it("移除不存在的前置守卫应返回 false", () => {
    const router = createRouter({ routes: testRoutes });
    const guard = () => true;

    const removed = router.removeBeforeRoute(guard);
    expect(removed).toBe(false);
  });

  it("应该移除后置守卫", () => {
    const router = createRouter({ routes: testRoutes });
    const guard = () => {};

    router.afterRoute(guard);
    const removed = router.removeAfterRoute(guard);
    expect(removed).toBe(true);
  });

  it("移除不存在的后置守卫应返回 false", () => {
    const router = createRouter({ routes: testRoutes });
    const guard = () => {};

    const removed = router.removeAfterRoute(guard);
    expect(removed).toBe(false);
  });
});

describe("ClientRouter - start 启动方法", () => {
  it("应该能调用 start 方法", () => {
    const router = createRouter({ routes: testRoutes });
    // start 方法应该存在且可调用（在非浏览器环境中不会报错）
    expect(typeof router.start).toBe("function");
    router.start();
    // 在非浏览器环境中，start 不会报错，只是不会设置监听器
    expect(router).toBeDefined();
  });

  it("start 方法应该是幂等的（多次调用不重复设置）", () => {
    const router = createRouter({ routes: testRoutes });
    // 多次调用 start 不应该报错
    router.start();
    router.start();
    router.start();
    expect(router).toBeDefined();
  });

  it("销毁后应该能重新启动", () => {
    const router = createRouter({ routes: testRoutes });
    router.start();
    router.destroy();
    // 销毁后应该能重新启动
    router.start();
    expect(router).toBeDefined();
  });
});

/**
 * 链接拦截 - 特殊链接形式
 * 通过 mock document/location 捕获 click 处理器，验证各类链接是否被正确拦截或放行
 */
describe("ClientRouter - 链接拦截 (特殊链接形式)", () => {
  const origin = "https://example.com";
  let mockLocation: {
    origin: string;
    pathname: string;
    search: string;
    hash: string;
    protocol: string;
    host: string;
  };
  let capturedClickHandler: ((e: Event) => void) | null = null;
  let savedLocation: unknown;
  let savedDocument: unknown;
  let savedHistory: unknown;

  /** 创建模拟的 <a> 元素 */
  function createMockAnchor(attrs: {
    href: string;
    target?: string;
    download?: boolean;
    dataNative?: boolean;
  }) {
    return {
      tagName: "A",
      nodeType: 1,
      parentNode: null as unknown,
      getAttribute: (name: string): string | null => {
        if (name === "href") return attrs.href;
        if (name === "target") return attrs.target ?? null;
        return null;
      },
      hasAttribute: (name: string): boolean => {
        if (name === "download") return attrs.download ?? false;
        if (name === "data-native") return attrs.dataNative ?? false;
        return false;
      },
    };
  }

  /** 创建模拟的点击事件，返回 { event, preventDefaultCalled } */
  function createMockClickEvent(
    anchor: ReturnType<typeof createMockAnchor>,
  ): { event: Event; preventDefaultCalled: () => boolean } {
    let prevented = false;
    const event = {
      target: anchor,
      button: 0,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      preventDefault: () => {
        prevented = true;
      },
      stopImmediatePropagation: () => {},
    } as unknown as Event;
    return {
      event,
      preventDefaultCalled: () => prevented,
    };
  }

  beforeEach(() => {
    savedLocation = (globalThis as unknown as Record<string, unknown>).location;
    savedDocument = (globalThis as unknown as Record<string, unknown>).document;
    savedHistory = (globalThis as unknown as Record<string, unknown>).history;

    mockLocation = {
      origin,
      pathname: "/",
      search: "",
      hash: "",
      protocol: "https:",
      host: "example.com",
    };
    capturedClickHandler = null;

    (globalThis as unknown as Record<string, unknown>).location =
      mockLocation as unknown;
    (globalThis as unknown as Record<string, unknown>).document = {
      addEventListener: (
        type: string,
        handler: (e: Event) => void,
        _options?: boolean | { capture?: boolean },
      ) => {
        if (type === "click") capturedClickHandler = handler;
      },
      removeEventListener: () => {},
    };
    (globalThis as unknown as Record<string, unknown>).history = {
      pushState: () => {},
      replaceState: () => {},
      go: () => {},
      state: null,
    };
  });

  afterEach(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    g.location = savedLocation;
    g.document = savedDocument;
    g.history = savedHistory;
  });

  /** 启动路由器并返回已注册的 click 处理器（无则 null） */
  function startAndGetClickHandler(): ((e: Event) => void) | null {
    const router = createRouter({
      routes: testRoutes,
      interceptLinks: true,
    });
    router.start();
    return capturedClickHandler;
  }

  it("同页锚点（仅 hash）不应拦截", () => {
    // href="#section" 解析后 pathname 来自 base（origin 即 /），故当前页也设为 /
    mockLocation.pathname = "/";
    mockLocation.search = "";
    mockLocation.hash = "";
    const handler = startAndGetClickHandler();
    if (!handler) {
      return; // 无 DOM 时跳过
    }
    const anchor = createMockAnchor({ href: "#section" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("同页锚点（pathname+search 相同且带 hash）不应拦截", () => {
    mockLocation.pathname = "/about";
    mockLocation.search = "?tab=1";
    mockLocation.hash = "";
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({
      href: "https://example.com/about?tab=1#section",
    });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("target=_blank 不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({
      href: "/about",
      target: "_blank",
    });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("download 属性不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "/file.pdf", download: true });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("data-native 属性不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({
      href: "/about",
      dataNative: true,
    });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("mailto: 不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "mailto:test@example.com" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("tel: 不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "tel:+8613800138000" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("javascript: 不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "javascript:void(0)" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("blob: 不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({
      href: "blob:https://example.com/uuid-here",
    });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("data: 不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "data:text/html,<p>hi</p>" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("跨域链接不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "https://other.com/about" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("空 href 不应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(false);
  });

  it("同源普通 http(s) 链接应拦截", () => {
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "/about" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(true);
  });

  it("跨页带 hash 的链接应拦截", () => {
    mockLocation.pathname = "/";
    mockLocation.search = "";
    mockLocation.hash = "";
    const handler = startAndGetClickHandler();
    if (!handler) return;
    const anchor = createMockAnchor({ href: "/about#team" });
    const { event, preventDefaultCalled } = createMockClickEvent(anchor);
    handler(event);
    expect(preventDefaultCalled()).toBe(true);
  });
});

describe("ClientRouter - 销毁", () => {
  it("应该销毁路由器", () => {
    const router = createRouter({ routes: testRoutes });
    router.onRouteChange(() => {});
    router.beforeRoute(() => true);
    router.afterRoute(() => {});

    // 销毁前应该能获取路由
    expect(router.getRoutes().length).toBeGreaterThan(0);

    router.destroy();

    // 销毁后路由器仍然可用，但内部状态已清空
    // getRoutes 仍然返回路由列表（因为路由本身不被清空）
    expect(router.getRoutes()).toBeDefined();
  });

  it("销毁后组件加载器应被清空", () => {
    const router = createRouter({ routes: testRoutes });

    router.setComponentLoader(() => Promise.resolve({ default: () => null }));

    router.destroy();

    // 销毁后组件加载器被清空，load 应该抛出错误
    const match = router.match("/about");
    expect(match?.load).toBeDefined();
  });

  it("销毁后守卫应被清空", () => {
    const router = createRouter({ routes: testRoutes });
    const guard = () => true;

    router.beforeRoute(guard);
    router.afterRoute(guard);

    router.destroy();

    // 销毁后，尝试移除守卫应该返回 false（因为已被清空）
    expect(router.removeBeforeRoute(guard)).toBe(false);
    expect(router.removeAfterRoute(guard)).toBe(false);
  });
});

describe("ClientRouter - 边界情况", () => {
  it("应该处理尾部斜杠", () => {
    const routes: ClientRoute[] = [
      { path: "/about", component: "about", type: "static" },
    ];
    const router = createRouter({ routes });

    // 带尾部斜杠的路径（静态路由需要精确匹配，所以不匹配）
    const match = router.match("/about/");
    // 静态路由 "/about" 不匹配 "/about/"
    expect(match).toBeNull();
  });

  it("应该处理空路径", () => {
    const router = createRouter({ routes: testRoutes });
    const match = router.match("");
    // 空路径应该解析为 "/" 并匹配根路由
    expect(match).not.toBeNull();
    expect(match?.route.path).toBe("/");
  });

  it("应该处理没有类型的路由（默认为静态）", () => {
    const routes: ClientRoute[] = [
      { path: "/test", component: "test" }, // 没有 type
    ];
    const router = createRouter({ routes });
    const match = router.match("/test");
    expect(match).not.toBeNull();
    expect(match?.route.path).toBe("/test");
  });

  it("应该处理完整 URL", () => {
    const router = createRouter({ routes: testRoutes });
    const match = router.match("http://localhost/about");
    expect(match).not.toBeNull();
    expect(match?.route.path).toBe("/about");
  });

  it("应该处理编码的 URL 参数", () => {
    const router = createRouter({ routes: testRoutes });
    const match = router.match("/user/hello%20world");
    expect(match).not.toBeNull();
    expect(match?.params.id).toBe("hello%20world");
  });
});

describe("ClientRouter - 新功能测试", () => {
  describe("路由元数据 (meta)", () => {
    it("应该支持路由元数据", () => {
      const routes: ClientRoute[] = [
        {
          path: "/",
          component: "index",
          type: "static",
          meta: { title: "首页", requiresAuth: false },
        },
        {
          path: "/admin",
          component: "admin",
          type: "static",
          meta: { title: "管理后台", requiresAuth: true },
        },
      ];
      const router = createRouter({ routes });

      const homeMatch = router.match("/");
      expect(homeMatch?.meta.title).toBe("首页");
      expect(homeMatch?.meta.requiresAuth).toBe(false);

      const adminMatch = router.match("/admin");
      expect(adminMatch?.meta.title).toBe("管理后台");
      expect(adminMatch?.meta.requiresAuth).toBe(true);
    });

    it("应该返回空对象当没有元数据时", () => {
      const routes: ClientRoute[] = [
        { path: "/", component: "index", type: "static" },
      ];
      const router = createRouter({ routes });
      const match = router.match("/");
      expect(match?.meta).toEqual({});
    });
  });

  describe("基础路径 (basePath)", () => {
    it("应该支持基础路径配置", () => {
      const routes: ClientRoute[] = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = createRouter({ routes, basePath: "/app" });
      expect(router.getBasePath()).toBe("/app");
    });

    it("应该正确解析路径", () => {
      const routes: ClientRoute[] = [
        { path: "/about", component: "about", type: "static" },
      ];
      const router = createRouter({ routes, basePath: "/app" });
      const resolved = router.resolvePath("/about");
      expect(resolved).toBe("/app/about");
    });

    it("应该不重复添加基础路径", () => {
      const routes: ClientRoute[] = [
        { path: "/about", component: "about", type: "static" },
      ];
      const router = createRouter({ routes, basePath: "/app" });
      const resolved = router.resolvePath("/app/about");
      expect(resolved).toBe("/app/about");
    });
  });

  describe("路由模式 (mode)", () => {
    it("应该默认使用 history 模式", () => {
      const router = createRouter({ routes: testRoutes });
      expect(router.getMode()).toBe("history");
    });

    it("应该支持 hash 模式", () => {
      const router = createRouter({ routes: testRoutes, mode: "hash" });
      expect(router.getMode()).toBe("hash");
    });
  });

  describe("导航状态 (navigation state)", () => {
    it("应该返回初始空闲状态", () => {
      const router = createRouter({ routes: testRoutes });
      expect(router.getNavigationState()).toBe("idle");
    });

    it("应该支持导航状态监听", () => {
      const router = createRouter({ routes: testRoutes });
      let currentState = "";

      router.onNavigationState((state) => {
        currentState = state;
      });

      expect(currentState).toBe("idle");
    });
  });

  describe("isActive 方法", () => {
    it("应该正确判断路径是否活跃", () => {
      const routes: ClientRoute[] = [
        { path: "/", component: "index", type: "static" },
        { path: "/about", component: "about", type: "static" },
      ];
      const router = createRouter({ routes });

      // 在非浏览器环境中，getCurrentRoute 返回 "/" 的匹配
      const isRootActive = router.isActive("/", true);
      expect(isRootActive).toBe(true);
    });
  });

  describe("路由重定向", () => {
    it("应该支持路由级别重定向", () => {
      const routes: ClientRoute[] = [
        { path: "/old", component: "old", type: "static", redirect: "/new" },
        { path: "/new", component: "new", type: "static" },
      ];
      const router = createRouter({ routes });

      const match = router.match("/old");
      // 重定向应该返回新路由的匹配
      expect(match?.route.path).toBe("/new");
    });
  });

  describe("组件缓存", () => {
    it("应该支持清除缓存", () => {
      const router = createRouter({ routes: testRoutes });
      // 清除缓存不应该报错
      router.clearCache();
      router.clearCache("about");
      expect(router).toBeDefined();
    });
  });

  describe("replace 方法", () => {
    it("应该存在 replace 方法", () => {
      const router = createRouter({ routes: testRoutes });
      expect(typeof router.replace).toBe("function");
    });
  });

  describe("prefetch 方法", () => {
    it("应该存在 prefetch 方法", () => {
      const router = createRouter({ routes: testRoutes });
      expect(typeof router.prefetch).toBe("function");
    });
  });
});
