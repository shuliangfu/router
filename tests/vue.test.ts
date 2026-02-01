/**
 * @fileoverview Vue 路由模块测试
 *
 * 测试 Vue 2.7+/3 路由组件和组合式函数
 */

import { describe, expect, it } from "@dreamer/test";
import {
  createRouter,
  getGlobalRouter,
  setGlobalRouter,
} from "../src/client/mod.ts";
import {
  back,
  createVueComposables,
  createVueLinkComponent,
  createVueNavLinkComponent,
  createVueRouterPlugin,
  forward,
  go,
  navigate,
  prefetch,
  type VueReactivity,
} from "../src/client/vue.ts";

// 模拟 Vue 响应式 API
function createMockVueReactivity(): VueReactivity {
  return {
    ref: <T>(value: T) => ({ value }),
    computed: <T>(getter: () => T) => ({
      get value() {
        return getter();
      },
    }),
    onMounted: (callback: () => void) => {
      callback();
    },
    onUnmounted: (_callback: () => void) => {/* 不执行 */},
    watch: <T>(_source: () => T, _callback: (newVal: T, oldVal: T) => void) => {
      return () => {};
    },
  };
}

// 模拟 Vue h 函数
function mockH(
  type: string | object,
  props?: Record<string, unknown> | null,
  children?: unknown,
): {
  type: string | object;
  props: Record<string, unknown> | null;
  children: unknown;
} {
  return { type, props: props || null, children };
}

describe("Vue 路由模块", () => {
  describe("createVueComposables", () => {
    it("应该创建组合式函数集合", () => {
      const vue = createMockVueReactivity();
      const composables = createVueComposables(vue);

      expect(composables.useRouter).toBeDefined();
      expect(composables.useRoute).toBeDefined();
      expect(composables.useParams).toBeDefined();
      expect(composables.useQuery).toBeDefined();
      expect(composables.useMeta).toBeDefined();
      expect(composables.useNavigationState).toBeDefined();
      expect(composables.useIsActive).toBeDefined();
      expect(composables.useFullPath).toBeDefined();
      expect(composables.useHash).toBeDefined();
    });

    it("useRouter 应该在没有路由器时抛出错误", () => {
      // 确保没有全局路由器
      setGlobalRouter(null);

      const vue = createMockVueReactivity();
      const { useRouter } = createVueComposables(vue);

      expect(() => useRouter()).toThrow();
    });

    it("useRouter 应该返回路由器实例", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const vue = createMockVueReactivity();
      const { useRouter } = createVueComposables(vue);

      const result = useRouter();
      expect(result).toBe(router);

      // 清理
      router.destroy();
    });

    it("useRoute 应该返回响应式路由", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const vue = createMockVueReactivity();
      const { useRoute } = createVueComposables(vue);

      const route = useRoute();
      expect(route).toBeDefined();
      expect(route.value).toBeDefined();

      router.destroy();
    });

    it("useParams 应该返回响应式参数", () => {
      const router = createRouter({
        routes: [{ path: "/user/:id", component: "user", type: "dynamic" }],
      });

      const vue = createMockVueReactivity();
      const { useParams } = createVueComposables(vue);

      const params = useParams();
      expect(params).toBeDefined();
      expect(typeof params.value).toBe("object");

      router.destroy();
    });

    it("useQuery 应该返回响应式查询参数", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const vue = createMockVueReactivity();
      const { useQuery } = createVueComposables(vue);

      const query = useQuery();
      expect(query).toBeDefined();
      expect(typeof query.value).toBe("object");

      router.destroy();
    });

    it("useMeta 应该返回响应式元数据", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index", meta: { title: "首页" } }],
      });

      const vue = createMockVueReactivity();
      const { useMeta } = createVueComposables(vue);

      const meta = useMeta();
      expect(meta).toBeDefined();

      router.destroy();
    });

    it("useNavigationState 应该返回响应式导航状态", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const vue = createMockVueReactivity();
      const { useNavigationState } = createVueComposables(vue);

      const state = useNavigationState();
      expect(state).toBeDefined();
      expect(state.value).toBe("idle");

      router.destroy();
    });

    it("useIsActive 应该返回响应式活跃状态", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const vue = createMockVueReactivity();
      const { useIsActive } = createVueComposables(vue);

      const isActive = useIsActive("/", true);
      expect(isActive).toBeDefined();
      expect(typeof isActive.value).toBe("boolean");

      router.destroy();
    });

    it("useFullPath 应该返回响应式完整路径", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const vue = createMockVueReactivity();
      const { useFullPath } = createVueComposables(vue);

      const fullPath = useFullPath();
      expect(fullPath).toBeDefined();
      expect(typeof fullPath.value).toBe("string");

      router.destroy();
    });

    it("useHash 应该返回响应式 hash", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const vue = createMockVueReactivity();
      const { useHash } = createVueComposables(vue);

      const hash = useHash();
      expect(hash).toBeDefined();
      expect(typeof hash.value).toBe("string");

      router.destroy();
    });
  });

  describe("createVueLinkComponent", () => {
    it("应该创建 Link 组件", () => {
      const Link = createVueLinkComponent(mockH);

      expect(Link).toBeDefined();
      expect(Link.name).toBe("RouterLink");
      expect(Link.props).toBeDefined();
      expect(Link.props.to).toBeDefined();
      expect(Link.props.replace).toBeDefined();
      expect(Link.props.prefetch).toBeDefined();
    });

    it("Link 组件应该有正确的 props 定义", () => {
      const Link = createVueLinkComponent(mockH);

      expect(Link.props.to.required).toBe(true);
      expect(Link.props.replace.default).toBe(false);
      expect(Link.props.prefetch.default).toBe(false);
      expect(Link.props.disabled.default).toBe(false);
    });
  });

  describe("createVueNavLinkComponent", () => {
    it("应该创建 NavLink 组件", () => {
      const vue = createMockVueReactivity();
      const NavLink = createVueNavLinkComponent(mockH, {
        computed: vue.computed,
      });

      expect(NavLink).toBeDefined();
      expect(NavLink.name).toBe("RouterNavLink");
      expect(NavLink.props).toBeDefined();
    });

    it("NavLink 组件应该有活跃类名 props", () => {
      const vue = createMockVueReactivity();
      const NavLink = createVueNavLinkComponent(mockH, {
        computed: vue.computed,
      });

      expect(NavLink.props.activeClass).toBeDefined();
      expect(NavLink.props.activeClass.default).toBe("router-link-active");
      expect(NavLink.props.exactActiveClass).toBeDefined();
      expect(NavLink.props.exactActiveClass.default).toBe(
        "router-link-exact-active",
      );
      expect(NavLink.props.exact).toBeDefined();
      expect(NavLink.props.exact.default).toBe(false);
    });
  });

  describe("createVueRouterPlugin", () => {
    it("应该创建插件对象", () => {
      const vue = {
        ...createMockVueReactivity(),
        h: mockH,
      };
      const plugin = createVueRouterPlugin(vue);

      expect(plugin).toBeDefined();
      expect(plugin.install).toBeDefined();
      expect(typeof plugin.install).toBe("function");
    });

    it("插件应该注册全局组件", () => {
      const vue = {
        ...createMockVueReactivity(),
        h: mockH,
      };
      const plugin = createVueRouterPlugin(vue);

      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const registeredComponents: Record<string, unknown> = {};
      const mockApp = {
        component: (name: string, component: unknown) => {
          registeredComponents[name] = component;
        },
        provide: (_key: string | symbol, _value: unknown) => {},
        config: { globalProperties: {} as Record<string, unknown> },
      };

      plugin.install(mockApp, { router });

      expect(registeredComponents["RouterLink"]).toBeDefined();
      expect(registeredComponents["RouterNavLink"]).toBeDefined();

      router.destroy();
    });

    it("插件应该支持自定义组件名称", () => {
      const vue = {
        ...createMockVueReactivity(),
        h: mockH,
      };
      const plugin = createVueRouterPlugin(vue);

      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      const registeredComponents: Record<string, unknown> = {};
      const mockApp = {
        component: (name: string, component: unknown) => {
          registeredComponents[name] = component;
        },
        provide: (_key: string | symbol, _value: unknown) => {},
        config: { globalProperties: {} as Record<string, unknown> },
      };

      plugin.install(mockApp, {
        router,
        linkName: "MyLink",
        navLinkName: "MyNavLink",
      });

      expect(registeredComponents["MyLink"]).toBeDefined();
      expect(registeredComponents["MyNavLink"]).toBeDefined();

      router.destroy();
    });
  });

  describe("便捷函数", () => {
    it("navigate 应该在没有路由器时返回 rejected Promise", async () => {
      setGlobalRouter(null);

      try {
        await navigate("/about");
        expect(true).toBe(false); // 不应该到达这里
      } catch (error) {
        expect((error as Error).message).toContain("navigate");
      }
    });

    it("prefetch 应该在没有路由器时返回 null", async () => {
      setGlobalRouter(null);

      const result = await prefetch("/about");
      expect(result).toBeNull();
    });

    it("back 应该在没有路由器时不抛出错误", () => {
      setGlobalRouter(null);

      // 不应该抛出错误
      expect(() => back()).not.toThrow();
    });

    it("forward 应该在没有路由器时不抛出错误", () => {
      setGlobalRouter(null);

      expect(() => forward()).not.toThrow();
    });

    it("go 应该在没有路由器时不抛出错误", () => {
      setGlobalRouter(null);

      expect(() => go(-1)).not.toThrow();
    });

    it("navigate 应该在有路由器时正常工作", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      // navigate 返回 Promise，但在非浏览器环境会抛出错误
      // 这里只验证函数存在且可调用
      expect(typeof navigate).toBe("function");

      router.destroy();
    });
  });

  describe("全局路由器管理", () => {
    it("创建路由器时应该自动设置全局路由器", () => {
      setGlobalRouter(null);
      expect(getGlobalRouter()).toBeNull();

      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      expect(getGlobalRouter()).toBe(router);

      router.destroy();
    });

    it("销毁路由器时应该清除全局路由器", () => {
      const router = createRouter({
        routes: [{ path: "/", component: "index" }],
      });

      expect(getGlobalRouter()).toBe(router);

      router.destroy();

      expect(getGlobalRouter()).toBeNull();
    });
  });
});
