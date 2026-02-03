/**
 * @module @dreamer/router/client/vue
 *
 * Vue 路由组件和组合式函数（Composables）
 *
 * 支持版本：
 * - Vue 3.x（原生支持）
 * - Vue 2.7+（原生支持组合式 API）
 *
 * 注意：不支持 Vue 2.6 及以下版本
 *
 * 提供与 Vue 组合式 API 兼容的路由功能：
 * - Link 和 NavLink 组件
 * - useRouter、useRoute 等组合式函数
 * - 响应式路由状态
 * - Vue 2/3 通用插件
 *
 * @example Vue 3 / Vue 2.7+ 使用
 * ```typescript
 * import { h, ref, computed, onMounted, onUnmounted, watch } from "vue";
 * import { createVueComposables, createVueLinkComponent } from "@dreamer/router/client/vue";
 *
 * const { useRouter, useRoute } = createVueComposables({
 *   ref, computed, onMounted, onUnmounted, watch
 * });
 * const Link = createVueLinkComponent(h);
 * ```
 */

import {
  type ClientRouteMatch,
  type ClientRouter,
  getGlobalRouter,
  type NavigationState,
  type RouteMeta,
  setGlobalRouter,
} from "./mod.ts";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Vue 的 h 函数类型（兼容 Vue 2 和 Vue 3）
 *
 * Vue 2: h(tag, data?, children?)
 * Vue 3: h(tag, props?, children?)
 */
type VueH = (
  type: string | object,
  propsOrData?: Record<string, unknown> | null,
  children?: unknown,
) => unknown;

/**
 * Vue 的 ref 类型（兼容 Vue 2 和 Vue 3）
 */
interface VueRef<T> {
  value: T;
}

/**
 * Vue 的 computed 类型（兼容 Vue 2 和 Vue 3）
 */
interface VueComputed<T> {
  readonly value: T;
}

/**
 * Vue 响应式 API 接口（兼容 Vue 2.7+ 和 Vue 3）
 *
 * Vue 3.x / Vue 2.7+: 从 'vue' 导入
 */
export interface VueReactivity {
  /** 创建响应式引用 */
  ref: <T>(value: T) => VueRef<T>;
  /** 创建计算属性 */
  computed: <T>(getter: () => T) => VueComputed<T>;
  /** 组件挂载时回调 */
  onMounted: (callback: () => void) => void;
  /** 组件卸载时回调 */
  onUnmounted: (callback: () => void) => void;
  /** 监听响应式数据变化（可选，用于高级场景） */
  watch?: <T>(
    source: () => T,
    callback: (newVal: T, oldVal: T) => void,
  ) => () => void;
}

/**
 * Link 组件属性
 */
export interface VueLinkProps {
  /** 目标路径 */
  to: string;
  /** 是否替换历史记录 */
  replace?: boolean;
  /** 是否预取目标组件 */
  prefetch?: boolean;
  /** 导航状态数据 */
  state?: unknown;
  /** CSS 类名 */
  class?: string;
  /** 内联样式 */
  style?: Record<string, string | number> | string;
  /** target 属性 */
  target?: string;
  /** rel 属性 */
  rel?: string;
  /** title 属性 */
  title?: string;
  /** 禁用状态 */
  disabled?: boolean;
}

/**
 * NavLink 组件属性
 */
export interface VueNavLinkProps extends VueLinkProps {
  /** 活跃状态的 CSS 类名（默认：router-link-active） */
  activeClass?: string;
  /** 精确匹配时的 CSS 类名（默认：router-link-exact-active） */
  exactActiveClass?: string;
  /** 是否精确匹配 */
  exact?: boolean;
}

/**
 * Vue 组件定义（兼容 Vue 2/3）
 */
export interface VueComponentDefinition {
  /** 组件名称 */
  name: string;
  /** 组件属性定义 */
  props: Record<string, unknown>;
  /** setup 函数 */
  // deno-lint-ignore no-explicit-any
  setup: (props: any, context: { slots: any; attrs: any }) => () => unknown;
}

/**
 * createVueComposables 返回的组合式函数集合
 */
export interface VueComposables {
  /** 获取路由器实例 */
  useRouter: () => ClientRouter;
  /** 获取当前路由信息（响应式） */
  useRoute: () => VueComputed<ClientRouteMatch | null>;
  /** 获取当前路由参数（响应式） */
  useParams: () => VueComputed<Record<string, string>>;
  /** 获取当前查询参数（响应式） */
  useQuery: () => VueComputed<Record<string, string>>;
  /** 获取当前路由元数据（响应式） */
  useMeta: () => VueComputed<RouteMeta>;
  /** 获取导航状态（响应式） */
  useNavigationState: () => VueComputed<NavigationState>;
  /** 检查路径是否活跃（响应式） */
  useIsActive: (path: string, exact?: boolean) => VueComputed<boolean>;
  /** 获取完整路径（响应式） */
  useFullPath: () => VueComputed<string>;
  /** 获取当前 hash（响应式） */
  useHash: () => VueComputed<string>;
}

/**
 * Vue 路由插件定义
 */
export interface VueRouterPlugin {
  /** 安装方法 */
  install: (app: Vue3App, options: VueRouterPluginOptions) => void;
}

/**
 * Vue 3 应用实例类型
 */
export interface Vue3App {
  /** 注册全局组件 */
  component: (name: string, component: unknown) => void;
  /** 提供依赖 */
  provide: (key: string | symbol, value: unknown) => void;
  /** 应用配置 */
  config: { globalProperties: Record<string, unknown> };
}

/**
 * Vue 路由插件选项
 */
export interface VueRouterPluginOptions {
  /** 路由器实例 */
  router: ClientRouter;
  /** Link 组件名称（默认：RouterLink） */
  linkName?: string;
  /** NavLink 组件名称（默认：RouterNavLink） */
  navLinkName?: string;
}

// ============================================================================
// Vue 组合式函数（Composables）- 兼容 Vue 2 和 Vue 3
// ============================================================================

/**
 * 创建 Vue 组合式函数工厂
 *
 * 同时兼容 Vue 2.7+ 和 Vue 3
 *
 * @param vue Vue 响应式 API 对象
 * @returns Vue 组合式函数集合
 *
 * @example
 * ```typescript
 * import { ref, computed, onMounted, onUnmounted, watch } from "vue";
 * import { createVueComposables } from "@dreamer/router/client/vue";
 *
 * const { useRouter, useRoute, useParams } = createVueComposables({
 *   ref, computed, onMounted, onUnmounted, watch
 * });
 * ```
 */
export function createVueComposables(vue: VueReactivity): VueComposables {
  const { ref, computed, onMounted, onUnmounted } = vue;

  /**
   * 获取路由器实例
   * @returns 路由器实例
   * @throws 如果没有设置全局路由器，抛出错误
   */
  function useRouter(): ClientRouter {
    const router = getGlobalRouter();
    if (!router) {
      throw new Error(
        "useRouter: 没有找到路由器实例。请确保已创建路由器并调用了 start() 方法。",
      );
    }
    return router;
  }

  /**
   * 获取当前路由信息（响应式）
   * @returns 计算属性，包含当前路由匹配结果
   */
  function useRoute(): VueComputed<ClientRouteMatch | null> {
    const router = useRouter();
    const currentRoute = ref<ClientRouteMatch | null>(router.getCurrentRoute());

    // 存储取消订阅函数
    let unsubscribe: (() => void) | null = null;

    onMounted(() => {
      unsubscribe = router.onRouteChange((match) => {
        currentRoute.value = match;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    });

    return computed(() => currentRoute.value);
  }

  /**
   * 获取路由参数（响应式）
   * @returns 计算属性，包含路由参数对象
   */
  function useParams(): VueComputed<Record<string, string>> {
    const route = useRoute();
    return computed(() => route.value?.params || {});
  }

  /**
   * 获取查询参数（响应式）
   * @returns 计算属性，包含查询参数对象
   */
  function useQuery(): VueComputed<Record<string, string>> {
    const route = useRoute();
    return computed(() => route.value?.query || {});
  }

  /**
   * 获取路由元数据（响应式）
   * @returns 计算属性，包含路由元数据
   */
  function useMeta(): VueComputed<RouteMeta> {
    const route = useRoute();
    return computed(() => route.value?.meta || {});
  }

  /**
   * 获取导航状态（响应式）
   * @returns 计算属性，包含当前导航状态
   */
  function useNavigationState(): VueComputed<NavigationState> {
    const router = useRouter();
    const state = ref<NavigationState>(router.getNavigationState());

    let unsubscribe: (() => void) | null = null;

    onMounted(() => {
      unsubscribe = router.onNavigationState((newState) => {
        state.value = newState;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    });

    return computed(() => state.value);
  }

  /**
   * 检查路径是否活跃（响应式）
   *
   * @param path 路径（可以是 ref 或字符串）
   * @param exact 是否精确匹配
   * @returns 计算属性，表示路径是否活跃
   */
  function useIsActive(
    path: string | VueRef<string>,
    exact = false,
  ): VueComputed<boolean> {
    const router = useRouter();
    const route = useRoute();

    return computed(() => {
      // 触发响应式依赖，确保路由变化时重新计算
      const _currentRoute = route.value;
      void _currentRoute;

      const pathValue = typeof path === "string" ? path : path.value;
      return router.isActive(pathValue, exact);
    });
  }

  /**
   * 获取完整路径（响应式）
   * @returns 计算属性，包含当前完整路径
   */
  function useFullPath(): VueComputed<string> {
    const route = useRoute();
    return computed(() => route.value?.fullPath || "/");
  }

  /**
   * 获取 hash 值（响应式）
   * @returns 计算属性，包含当前 hash
   */
  function useHash(): VueComputed<string> {
    const route = useRoute();
    return computed(() => route.value?.hash || "");
  }

  return {
    useRouter,
    useRoute,
    useParams,
    useQuery,
    useMeta,
    useNavigationState,
    useIsActive,
    useFullPath,
    useHash,
  };
}

// ============================================================================
// Vue 组件工厂 - 兼容 Vue 2 和 Vue 3
// ============================================================================

/**
 * 创建 Vue Link 组件
 *
 * 同时兼容 Vue 2.7+ 和 Vue 3
 *
 * @param h Vue 的 h 函数
 * @returns Link 组件定义对象
 *
 * @example
 * ```typescript
 * import { h } from "vue";
 * import { createVueLinkComponent } from "@dreamer/router/client/vue";
 *
 * const Link = createVueLinkComponent(h);
 * ```
 */
export function createVueLinkComponent(h: VueH): VueComponentDefinition {
  return {
    name: "RouterLink",
    props: {
      to: { type: String, required: true },
      replace: { type: Boolean, default: false },
      prefetch: { type: Boolean, default: false },
      state: { type: Object, default: undefined },
      target: { type: String, default: undefined },
      disabled: { type: Boolean, default: false },
      title: { type: String, default: undefined },
      rel: { type: String, default: undefined },
    },
    setup(props: VueLinkProps, context: { slots: any; attrs: any }) {
      const { slots, attrs } = context;
      const router = getGlobalRouter();

      /**
       * 处理点击事件
       */
      const handleClick = (event: Event) => {
        // 禁用时阻止
        if (props.disabled) {
          event.preventDefault();
          return;
        }

        // 有 target 属性且不是 _self 时，使用默认行为
        if (props.target && props.target !== "_self") {
          return;
        }

        // 检查修饰键（Ctrl/Cmd + 点击 = 新标签页打开）
        const mouseEvent = event as unknown as {
          ctrlKey?: boolean;
          shiftKey?: boolean;
          altKey?: boolean;
          metaKey?: boolean;
          button?: number;
        };

        if (
          mouseEvent.ctrlKey ||
          mouseEvent.shiftKey ||
          mouseEvent.altKey ||
          mouseEvent.metaKey ||
          mouseEvent.button !== 0
        ) {
          return;
        }

        // 阻止默认导航行为
        event.preventDefault();

        // 使用路由器导航
        if (router) {
          router.navigate(props.to, {
            replace: props.replace,
            state: props.state,
          });
        }
      };

      /**
       * 处理鼠标进入事件（用于预取）
       */
      const handleMouseEnter = () => {
        if (props.prefetch && router) {
          router.prefetch(props.to);
        }
      };

      // 返回渲染函数
      return () => {
        const href = router ? router.resolvePath(props.to) : props.to;

        // 构建属性对象（兼容 Vue 2 和 Vue 3）
        const linkProps: Record<string, unknown> = {
          href,
          target: props.target,
          title: props.title,
          rel: props.rel,
          // Vue 3 事件绑定
          onClick: handleClick,
          onMouseenter: props.prefetch ? handleMouseEnter : undefined,
          // 传递其他属性
          ...attrs,
        };

        // 添加禁用样式
        if (props.disabled) {
          linkProps["aria-disabled"] = "true";
          linkProps.tabindex = -1;
        }

        return h("a", linkProps, slots.default?.());
      };
    },
  };
}

/**
 * 创建 Vue NavLink 组件（带活跃状态）
 *
 * 同时兼容 Vue 2.7+ 和 Vue 3
 *
 * @param h Vue 的 h 函数
 * @param vue Vue 响应式 API（需要 computed）
 * @returns NavLink 组件定义对象
 *
 * @example
 * ```typescript
 * import { h, computed } from "vue";
 * import { createVueNavLinkComponent } from "@dreamer/router/client/vue";
 *
 * const NavLink = createVueNavLinkComponent(h, { computed });
 * ```
 */
export function createVueNavLinkComponent(
  h: VueH,
  vue: { computed: VueReactivity["computed"] },
): VueComponentDefinition {
  const { computed } = vue;

  return {
    name: "RouterNavLink",
    props: {
      to: { type: String, required: true },
      replace: { type: Boolean, default: false },
      prefetch: { type: Boolean, default: false },
      state: { type: Object, default: undefined },
      target: { type: String, default: undefined },
      disabled: { type: Boolean, default: false },
      title: { type: String, default: undefined },
      rel: { type: String, default: undefined },
      activeClass: { type: String, default: "router-link-active" },
      exactActiveClass: { type: String, default: "router-link-exact-active" },
      exact: { type: Boolean, default: false },
    },
    setup(props: VueNavLinkProps, context: { slots: any; attrs: any }) {
      const { slots, attrs } = context;
      const router = getGlobalRouter();

      /**
       * 计算是否活跃（非精确匹配）
       */
      const isActive = computed(() => {
        if (!router) return false;
        return router.isActive(props.to, false);
      });

      /**
       * 计算是否精确活跃
       */
      const isExactActive = computed(() => {
        if (!router) return false;
        return router.isActive(props.to, true);
      });

      /**
       * 处理点击事件
       */
      const handleClick = (event: Event) => {
        if (props.disabled) {
          event.preventDefault();
          return;
        }

        if (props.target && props.target !== "_self") {
          return;
        }

        const mouseEvent = event as unknown as {
          ctrlKey?: boolean;
          shiftKey?: boolean;
          altKey?: boolean;
          metaKey?: boolean;
          button?: number;
        };

        if (
          mouseEvent.ctrlKey ||
          mouseEvent.shiftKey ||
          mouseEvent.altKey ||
          mouseEvent.metaKey ||
          mouseEvent.button !== 0
        ) {
          return;
        }

        event.preventDefault();

        if (router) {
          router.navigate(props.to, {
            replace: props.replace,
            state: props.state,
          });
        }
      };

      /**
       * 处理鼠标进入事件（用于预取）
       */
      const handleMouseEnter = () => {
        if (props.prefetch && router) {
          router.prefetch(props.to);
        }
      };

      // 返回渲染函数
      return () => {
        const href = router ? router.resolvePath(props.to) : props.to;

        // 构建类名
        const classes: string[] = [];

        // 添加用户自定义类名
        if (attrs.class) {
          if (typeof attrs.class === "string") {
            classes.push(attrs.class);
          } else if (Array.isArray(attrs.class)) {
            classes.push(...attrs.class);
          }
        }

        // 添加活跃类名
        if (props.exact) {
          // 精确匹配模式
          if (isExactActive.value) {
            if (props.activeClass) classes.push(props.activeClass);
            if (props.exactActiveClass) classes.push(props.exactActiveClass);
          }
        } else {
          // 非精确匹配模式
          if (isActive.value && props.activeClass) {
            classes.push(props.activeClass);
          }
          if (isExactActive.value && props.exactActiveClass) {
            classes.push(props.exactActiveClass);
          }
        }

        const finalClass = classes.join(" ").trim() || undefined;

        // 构建属性对象
        const linkProps: Record<string, unknown> = {
          href,
          target: props.target,
          title: props.title,
          rel: props.rel,
          class: finalClass,
          onClick: handleClick,
          onMouseenter: props.prefetch ? handleMouseEnter : undefined,
          "data-active": isActive.value || undefined,
          "aria-current": isExactActive.value ? "page" : undefined,
          ...attrs,
          // 确保 class 被正确设置
          ...(finalClass ? { class: finalClass } : {}),
        };

        if (props.disabled) {
          linkProps["aria-disabled"] = "true";
          linkProps.tabindex = -1;
        }

        return h("a", linkProps, slots.default?.());
      };
    },
  };
}

// ============================================================================
// Vue 插件 - 兼容 Vue 2 和 Vue 3
// ============================================================================

/**
 * 创建 Vue 路由插件
 *
 * 同时兼容 Vue 2.7+ 和 Vue 3
 *
 * @param vue Vue 响应式 API 对象（包含 h 函数）
 * @returns Vue 插件对象
 *
 * @example Vue 3
 * ```typescript
 * import { createApp, h, ref, computed, onMounted, onUnmounted, watch } from "vue";
 * import { createRouter } from "@dreamer/router/client";
 * import { createVueRouterPlugin } from "@dreamer/router/client/vue";
 *
 * const router = createRouter({ routes: [...] });
 * router.start();
 *
 * const routerPlugin = createVueRouterPlugin({
 *   h, ref, computed, onMounted, onUnmounted, watch
 * });
 *
 * const app = createApp(App);
 * app.use(routerPlugin, { router });
 * app.mount("#app");
 * ```
 *
 * @example Vue 2.7+
 * ```typescript
 * import Vue from "vue";
 * import { h, ref, computed, onMounted, onUnmounted, watch } from "vue";
 * import { createRouter } from "@dreamer/router/client";
 * import { createVueRouterPlugin } from "@dreamer/router/client/vue";
 *
 * const router = createRouter({ routes: [...] });
 * router.start();
 *
 * const routerPlugin = createVueRouterPlugin({
 *   h, ref, computed, onMounted, onUnmounted, watch
 * });
 *
 * Vue.use(routerPlugin, { router });
 * new Vue({ render: h => h(App) }).$mount("#app");
 * ```
 */
export function createVueRouterPlugin(
  vue: VueReactivity & { h: VueH },
): VueRouterPlugin {
  const { h, computed } = vue;

  return {
    /**
     * Vue 3 安装方法
     */
    install(app: Vue3App, options: VueRouterPluginOptions) {
      const { router, linkName = "RouterLink", navLinkName = "RouterNavLink" } =
        options;

      // 设置全局路由器
      setGlobalRouter(router);

      // 创建组件
      const Link = createVueLinkComponent(h);
      const NavLink = createVueNavLinkComponent(h, { computed });

      // 注册全局组件
      app.component(linkName, Link);
      app.component(navLinkName, NavLink);

      // Vue 3: 使用 provide 注入
      app.provide("$router", router);
      app.config.globalProperties.$router = router;
    },
  };
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 导航到指定路径（非响应式，可在任何地方调用）
 *
 * @param to 目标路径
 * @param options 导航选项
 */
export function navigate(
  to: string,
  options: { replace?: boolean; state?: unknown } = {},
): Promise<void> {
  const router = getGlobalRouter();
  if (!router) {
    return Promise.reject(new Error("navigate: 没有找到路由器实例"));
  }
  return router.navigate(to, options);
}

/**
 * 预取指定路径的组件
 *
 * @param path 目标路径
 */
export function prefetch(path: string): Promise<unknown | null> {
  const router = getGlobalRouter();
  if (!router) {
    return Promise.resolve(null);
  }
  return router.prefetch(path);
}

/**
 * 后退一步
 */
export function back(): void {
  const router = getGlobalRouter();
  if (router) {
    router.back();
  }
}

/**
 * 前进一步
 */
export function forward(): void {
  const router = getGlobalRouter();
  if (router) {
    router.forward();
  }
}

/**
 * 前进或后退指定步数
 *
 * @param delta 步数（正数前进，负数后退）
 */
export function go(delta: number): void {
  const router = getGlobalRouter();
  if (router) {
    router.go(delta);
  }
}

// ============================================================================
// 导出类型
// ============================================================================

export type { VueComputed, VueH, VueRef };
