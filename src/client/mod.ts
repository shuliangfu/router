/**
 * @module @dreamer/router/client
 *
 * 客户端路由导航库，提供统一的客户端路由接口，支持浏览器路由导航和历史记录管理。
 *
 * 功能特性：
 * - 客户端路由导航：基于浏览器原生 API 的路由导航
 * - 路由匹配：客户端路由匹配和参数解析
 * - 历史记录管理：前进、后退、历史记录管理
 * - 路由守卫：路由变化前后的钩子函数
 * - 路由变化监听：监听路由变化事件
 * - 滚动行为管理：页面切换时的滚动位置控制
 * - 路由元数据：为路由添加自定义元数据
 * - 预取功能：提前加载目标路由组件
 * - 基础路径：支持部署在子路径下
 * - Hash 模式：支持 hash 路由
 * - 加载状态：路由切换时的 loading 状态
 *
 * @example
 * ```typescript
 * import { createRouter } from "jsr:@dreamer/router/client";
 *
 * const router = createRouter({
 *   routes: [
 *     { path: "/", component: "index", meta: { title: "首页" } },
 *     { path: "/about", component: "about", meta: { title: "关于" } },
 *     { path: "/user/:id", component: "user/[id]", type: "dynamic" },
 *   ],
 *   engine: "preact",
 *   scrollBehavior: (to, from, savedPosition) => savedPosition || { top: 0 },
 * });
 *
 * router.start();
 * await router.navigate("/about");
 * ```
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * DOM 元素类型（用于类型检查，避免依赖 DOM 类型库）
 */
interface BrowserElement {
  tagName: string;
  parentElement: BrowserElement | null;
  getAttribute: (name: string) => string | null;
  hasAttribute: (name: string) => boolean;
}

/**
 * 鼠标事件类型（用于类型检查）
 */
interface BrowserMouseEvent {
  target: BrowserElement | null;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
}

/**
 * 浏览器全局对象类型扩展
 */
interface BrowserGlobalThis {
  location?: {
    pathname: string;
    search: string;
    hash: string;
    href: string;
    protocol: string;
    host: string;
    origin: string;
  };
  history?: {
    pushState: (state: any, title: string, url: string) => void;
    replaceState: (state: any, title: string, url: string) => void;
    go: (delta: number) => void;
    back: () => void;
    forward: () => void;
    state: any;
  };
  addEventListener?: (
    type: string,
    listener: (event: Event) => void,
    options?: boolean | { capture?: boolean },
  ) => void;
  removeEventListener?: (
    type: string,
    listener: (event: Event) => void,
    options?: boolean | { capture?: boolean },
  ) => void;
  document?: {
    addEventListener: (
      type: string,
      listener: (event: Event) => void,
      options?: boolean | { capture?: boolean },
    ) => void;
    removeEventListener: (
      type: string,
      listener: (event: Event) => void,
      options?: boolean | { capture?: boolean },
    ) => void;
    title: string;
  };
  scrollTo?: (options: { top: number; left: number; behavior?: string }) => void;
  scrollX?: number;
  scrollY?: number;
}

/**
 * 路由元数据类型
 */
export interface RouteMeta {
  /** 页面标题 */
  title?: string;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 是否缓存组件 */
  keepAlive?: boolean;
  /** 自定义数据 */
  [key: string]: unknown;
}

/**
 * 滚动位置类型
 */
export interface ScrollPosition {
  /** 垂直滚动位置 */
  top: number;
  /** 水平滚动位置 */
  left?: number;
  /** 滚动行为 */
  behavior?: "auto" | "smooth";
}

/**
 * 滚动行为函数类型
 */
export type ScrollBehaviorHandler = (
  to: ClientRouteMatch,
  from: ClientRouteMatch | null,
  savedPosition: ScrollPosition | null,
) => ScrollPosition | false | void | Promise<ScrollPosition | false | void>;

/**
 * 路由模式
 */
export type RouterMode = "history" | "hash";

/**
 * 导航状态
 */
export type NavigationState = "idle" | "loading" | "error";

/**
 * 客户端路由配置选项
 */
export interface ClientRouterOptions {
  /** 路由配置列表（由服务端生成） */
  routes: ClientRoute[];
  /** 渲染引擎类型（preact、react 或 vue3，默认：preact） */
  engine?: "preact" | "react" | "vue3";
  /** 基础路径（如 /app，默认：空） */
  basePath?: string;
  /** 路由模式（history 或 hash，默认：history） */
  mode?: RouterMode;
  /** 滚动行为处理函数 */
  scrollBehavior?: ScrollBehaviorHandler;
}

/**
 * 客户端路由信息
 */
export interface ClientRoute {
  /** 路由路径（如 /user/:id） */
  path: string;
  /** 组件标识（用于懒加载） */
  component: string;
  /** 路由类型 */
  type?: "static" | "dynamic" | "wildcard" | "optional";
  /** 路由元数据 */
  meta?: RouteMeta;
  /** 重定向目标路径 */
  redirect?: string;
}

/**
 * 客户端路由匹配结果
 */
export interface ClientRouteMatch {
  /** 匹配的路由 */
  route: ClientRoute;
  /** 路由参数（动态路由参数） */
  params: Record<string, string>;
  /** 查询参数 */
  query: Record<string, string>;
  /** 完整路径 */
  fullPath: string;
  /** Hash 值 */
  hash: string;
  /** 路由元数据 */
  meta: RouteMeta;
  /** 懒加载组件函数 */
  load?: () => Promise<any>;
}

/**
 * 路由变化回调函数
 */
export type RouteChangeCallback = (match: ClientRouteMatch | null) => void;

/**
 * 路由守卫函数
 */
export type RouteGuard = (
  to: ClientRouteMatch,
  from: ClientRouteMatch | null,
) => boolean | string | Promise<boolean | string> | void | Promise<void>;

/**
 * 组件加载器函数类型
 */
export type ComponentLoader = (component: string) => Promise<unknown>;

/**
 * 导航状态变化回调
 */
export type NavigationStateCallback = (state: NavigationState, error?: Error) => void;

// ============================================================================
// 全局路由器实例（用于 Hook）
// ============================================================================

/** 全局路由器实例 */
let globalRouter: ClientRouter | null = null;

/**
 * 设置全局路由器实例
 * @param router 路由器实例
 */
export function setGlobalRouter(router: ClientRouter | null): void {
  globalRouter = router;
}

/**
 * 获取全局路由器实例
 * @returns 路由器实例
 */
export function getGlobalRouter(): ClientRouter | null {
  return globalRouter;
}

// ============================================================================
// 客户端路由器类
// ============================================================================

/**
 * 客户端路由器类
 * 提供客户端路由导航、匹配等功能
 */
export class ClientRouter {
  private routes: ClientRoute[] = [];
  private options: Required<Pick<ClientRouterOptions, "engine" | "mode">> & {
    basePath: string;
    scrollBehavior?: ScrollBehaviorHandler;
  };
  private currentMatch: ClientRouteMatch | null = null;
  private routeChangeCallbacks: RouteChangeCallback[] = [];
  private beforeRouteGuards: RouteGuard[] = [];
  private afterRouteGuards: RouteGuard[] = [];
  private navigationStateCallbacks: NavigationStateCallback[] = [];
  private popstateHandler: (() => void) | null = null;
  private hashChangeHandler: (() => void) | null = null;
  private clickHandler: ((event: Event) => void) | null = null;
  private componentLoader: ComponentLoader | null = null;
  private componentCache: Map<string, unknown> = new Map();
  private scrollPositions: Map<string, ScrollPosition> = new Map();
  private isStarted = false;
  private navigationState: NavigationState = "idle";
  private currentNavigationId = 0;

  /**
   * 创建客户端路由器实例
   * @param options 路由配置选项
   */
  constructor(options: ClientRouterOptions) {
    this.routes = options.routes || [];
    this.options = {
      engine: options.engine || "preact",
      basePath: options.basePath || "",
      mode: options.mode || "history",
      scrollBehavior: options.scrollBehavior,
    };

    // 监听浏览器历史记录变化
    this.setupHistoryListener();

    // 设置为全局路由器
    setGlobalRouter(this);
  }

  // ==========================================================================
  // 公共方法
  // ==========================================================================

  /**
   * 启动路由器，开始拦截链接点击
   * 调用此方法后，页面上所有同源 <a> 标签的点击都会被拦截，
   * 使用客户端导航而不是页面跳转
   */
  start(): void {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    this.setupClickInterceptor();
  }

  /**
   * 导航到指定路径
   * @param path 路径
   * @param options 导航选项
   * @returns Promise，在路由变化处理完成后 resolve
   */
  async navigate(
    path: string,
    options: { replace?: boolean; state?: any } = {},
  ): Promise<void> {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis === "undefined" || !browserGlobal.history) {
      throw new Error("浏览器环境不支持 history API");
    }

    // 生成导航 ID，用于取消过期的导航
    const navigationId = ++this.currentNavigationId;

    // 设置加载状态
    this.setNavigationState("loading");

    try {
      // 保存当前滚动位置
      this.saveScrollPosition();

      // 处理基础路径
      const fullPath = this.resolvePath(path);

      // 根据模式更新 URL
      if (this.options.mode === "hash") {
        const hashPath = `#${path}`;
        if (options.replace) {
          browserGlobal.history.replaceState(options.state || null, "", hashPath);
        } else {
          browserGlobal.history.pushState(options.state || null, "", hashPath);
        }
      } else {
        if (options.replace) {
          browserGlobal.history.replaceState(options.state || null, "", fullPath);
        } else {
          browserGlobal.history.pushState(options.state || null, "", fullPath);
        }
      }

      // 检查导航是否已被取消
      if (navigationId !== this.currentNavigationId) {
        return;
      }

      // 触发路由变化并等待完成
      await this.handleRouteChange();

      // 设置空闲状态
      this.setNavigationState("idle");
    } catch (error) {
      // 设置错误状态
      this.setNavigationState("error", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * 替换当前历史记录并导航
   * @param path 路径
   * @param state 状态数据
   */
  replace(path: string, state?: any): Promise<void> {
    return this.navigate(path, { replace: true, state });
  }

  /**
   * 前进或后退指定步数
   * @param delta 步数（正数前进，负数后退）
   */
  go(delta: number): void {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis === "undefined" || !browserGlobal.history) {
      throw new Error("浏览器环境不支持 history API");
    }

    browserGlobal.history.go(delta);
  }

  /**
   * 后退一步
   */
  back(): void {
    this.go(-1);
  }

  /**
   * 前进一步
   */
  forward(): void {
    this.go(1);
  }

  /**
   * 匹配路由
   * @param pathname 路径（如 /user/123）
   * @returns 路由匹配结果或 null
   */
  match(pathname: string): ClientRouteMatch | null {
    // 处理 hash 模式
    let pathToMatch = pathname;
    if (this.options.mode === "hash" && pathname.startsWith("#")) {
      pathToMatch = pathname.slice(1) || "/";
    }

    // 移除基础路径
    if (this.options.basePath && pathToMatch.startsWith(this.options.basePath)) {
      pathToMatch = pathToMatch.slice(this.options.basePath.length) || "/";
    }

    // 解析查询参数和 hash
    const baseUrl = this.getBaseUrl();
    const url = new URL(pathToMatch, baseUrl);
    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    const cleanPath = url.pathname;
    const hash = url.hash;

    // 匹配路由
    for (const route of this.routes) {
      const matchResult = this.matchRoute(route, cleanPath);
      if (matchResult) {
        // 检查重定向
        if (route.redirect) {
          // 递归匹配重定向目标
          return this.match(route.redirect);
        }

        return {
          route,
          params: matchResult.params,
          query,
          fullPath: pathname,
          hash,
          meta: route.meta || {},
          load: () => this.loadComponent(route.component),
        };
      }
    }

    return null;
  }

  /**
   * 获取当前路由匹配结果
   * @returns 当前路由匹配结果
   */
  getCurrentRoute(): ClientRouteMatch | null {
    if (!this.currentMatch) {
      const pathname = this.getPathname();
      this.currentMatch = this.match(pathname);
    }
    return this.currentMatch;
  }

  /**
   * 预取路由组件
   * @param path 路由路径
   * @returns 加载的组件模块
   */
  async prefetch(path: string): Promise<unknown | null> {
    const match = this.match(path);
    if (!match) {
      return null;
    }

    // 检查缓存
    if (this.componentCache.has(match.route.component)) {
      return this.componentCache.get(match.route.component);
    }

    // 加载并缓存组件
    try {
      const module = await this.loadComponent(match.route.component);
      this.componentCache.set(match.route.component, module);
      return module;
    } catch {
      return null;
    }
  }

  /**
   * 检查路径是否匹配当前路由
   * @param path 路径
   * @param exact 是否精确匹配
   * @returns 是否匹配
   */
  isActive(path: string, exact = false): boolean {
    const current = this.getCurrentRoute();
    if (!current) return false;

    const targetMatch = this.match(path);
    if (!targetMatch) return false;

    if (exact) {
      return current.route.path === targetMatch.route.path;
    }

    // 非精确匹配：检查当前路径是否以目标路径开头
    const currentPath = this.getPathname().split("?")[0];
    const targetPath = path.split("?")[0];
    return currentPath.startsWith(targetPath);
  }

  /**
   * 解析路径（添加基础路径）
   * @param path 原始路径
   * @returns 完整路径
   */
  resolvePath(path: string): string {
    if (!this.options.basePath) {
      return path;
    }

    // 如果路径已经包含基础路径，直接返回
    if (path.startsWith(this.options.basePath)) {
      return path;
    }

    // 添加基础路径
    return `${this.options.basePath}${path}`;
  }

  // ==========================================================================
  // 监听器方法
  // ==========================================================================

  /**
   * 监听路由变化
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onRouteChange(callback: RouteChangeCallback): () => void {
    this.routeChangeCallbacks.push(callback);

    // 立即触发一次（获取当前路由）
    const currentRoute = this.getCurrentRoute();
    callback(currentRoute);

    // 返回取消监听的函数
    return () => {
      const index = this.routeChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.routeChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 监听导航状态变化
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onNavigationState(callback: NavigationStateCallback): () => void {
    this.navigationStateCallbacks.push(callback);

    // 立即触发一次
    callback(this.navigationState);

    return () => {
      const index = this.navigationStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.navigationStateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 添加路由前置守卫
   * @param guard 守卫函数
   * @returns 移除守卫的函数
   */
  beforeRoute(guard: RouteGuard): () => void {
    this.beforeRouteGuards.push(guard);
    return () => this.removeBeforeRoute(guard);
  }

  /**
   * 添加路由后置守卫
   * @param guard 守卫函数
   * @returns 移除守卫的函数
   */
  afterRoute(guard: RouteGuard): () => void {
    this.afterRouteGuards.push(guard);
    return () => this.removeAfterRoute(guard);
  }

  /**
   * 移除路由前置守卫
   * @param guard 守卫函数
   * @returns 是否成功移除
   */
  removeBeforeRoute(guard: RouteGuard): boolean {
    const index = this.beforeRouteGuards.indexOf(guard);
    if (index > -1) {
      this.beforeRouteGuards.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 移除路由后置守卫
   * @param guard 守卫函数
   * @returns 是否成功移除
   */
  removeAfterRoute(guard: RouteGuard): boolean {
    const index = this.afterRouteGuards.indexOf(guard);
    if (index > -1) {
      this.afterRouteGuards.splice(index, 1);
      return true;
    }
    return false;
  }

  // ==========================================================================
  // 配置方法
  // ==========================================================================

  /**
   * 设置自定义组件加载器
   * @param loader 组件加载函数
   */
  setComponentLoader(loader: ComponentLoader): void {
    this.componentLoader = loader;
  }

  /**
   * 获取所有路由
   * @returns 路由列表
   */
  getRoutes(): ClientRoute[] {
    return [...this.routes];
  }

  /**
   * 获取当前渲染引擎
   * @returns 渲染引擎类型
   */
  getEngine(): "preact" | "react" | "vue3" {
    return this.options.engine;
  }

  /**
   * 获取路由模式
   * @returns 路由模式
   */
  getMode(): RouterMode {
    return this.options.mode;
  }

  /**
   * 获取基础路径
   * @returns 基础路径
   */
  getBasePath(): string {
    return this.options.basePath;
  }

  /**
   * 获取当前导航状态
   * @returns 导航状态
   */
  getNavigationState(): NavigationState {
    return this.navigationState;
  }

  /**
   * 动态添加路由
   * @param route 路由配置
   */
  addRoute(route: ClientRoute): void {
    this.routes.push(route);
  }

  /**
   * 动态移除路由
   * @param path 路由路径
   * @returns 是否成功移除
   */
  removeRoute(path: string): boolean {
    const index = this.routes.findIndex((r) => r.path === path);
    if (index > -1) {
      this.routes.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 清除组件缓存
   * @param component 组件标识（可选，不传则清除所有）
   */
  clearCache(component?: string): void {
    if (component) {
      this.componentCache.delete(component);
    } else {
      this.componentCache.clear();
    }
  }

  /**
   * 销毁路由器
   * 移除所有事件监听器和回调函数
   */
  destroy(): void {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;

    // 移除 popstate 监听器
    if (this.popstateHandler && browserGlobal.removeEventListener) {
      browserGlobal.removeEventListener("popstate", this.popstateHandler);
      this.popstateHandler = null;
    }

    // 移除 hashchange 监听器
    if (this.hashChangeHandler && browserGlobal.removeEventListener) {
      browserGlobal.removeEventListener("hashchange", this.hashChangeHandler);
      this.hashChangeHandler = null;
    }

    // 移除点击拦截器
    if (this.clickHandler && browserGlobal.document) {
      browserGlobal.document.removeEventListener(
        "click",
        this.clickHandler,
        true,
      );
      this.clickHandler = null;
    }

    // 清除所有回调和守卫
    this.routeChangeCallbacks = [];
    this.beforeRouteGuards = [];
    this.afterRouteGuards = [];
    this.navigationStateCallbacks = [];
    this.currentMatch = null;
    this.componentLoader = null;
    this.componentCache.clear();
    this.scrollPositions.clear();
    this.isStarted = false;

    // 清除全局路由器
    if (globalRouter === this) {
      setGlobalRouter(null);
    }
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  /**
   * 设置链接点击拦截器
   */
  private setupClickInterceptor(): void {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;

    if (typeof globalThis === "undefined" || !browserGlobal.document) {
      return;
    }

    this.clickHandler = (event: Event) => {
      const mouseEvent = event as unknown as BrowserMouseEvent;

      // 检查修饰键
      if (
        mouseEvent.ctrlKey ||
        mouseEvent.shiftKey ||
        mouseEvent.altKey ||
        mouseEvent.metaKey
      ) {
        return;
      }

      // 检查鼠标左键
      if (mouseEvent.button !== 0) {
        return;
      }

      // 查找 <a> 元素
      let target = mouseEvent.target as BrowserElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (!target) {
        return;
      }

      const anchor = target;
      const href = anchor.getAttribute("href");
      if (!href) {
        return;
      }

      // 检查 target 属性
      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") {
        return;
      }

      // 检查 download 属性
      if (anchor.hasAttribute("download")) {
        return;
      }

      // 检查 data-native 属性
      if (anchor.hasAttribute("data-native")) {
        return;
      }

      // 检查同源
      try {
        const linkUrl = new URL(href, browserGlobal.location?.origin);
        const currentOrigin = browserGlobal.location?.origin;

        if (linkUrl.origin !== currentOrigin) {
          return;
        }

        // 检查 hash 链接
        if (
          linkUrl.pathname === browserGlobal.location?.pathname &&
          linkUrl.search === browserGlobal.location?.search &&
          linkUrl.hash
        ) {
          return;
        }

        mouseEvent.preventDefault();

        const path = linkUrl.pathname + linkUrl.search + linkUrl.hash;
        this.navigate(path);
      } catch {
        return;
      }
    };

    browserGlobal.document.addEventListener("click", this.clickHandler, true);
  }

  /**
   * 设置历史记录监听器
   */
  private setupHistoryListener(): void {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis === "undefined" || !browserGlobal.addEventListener) {
      return;
    }

    // 监听 popstate 事件
    this.popstateHandler = () => {
      this.handleRouteChange();
    };
    browserGlobal.addEventListener("popstate", this.popstateHandler);

    // Hash 模式额外监听 hashchange 事件
    if (this.options.mode === "hash") {
      this.hashChangeHandler = () => {
        this.handleRouteChange();
      };
      browserGlobal.addEventListener("hashchange", this.hashChangeHandler);
    }
  }

  /**
   * 处理路由变化
   */
  private async handleRouteChange(): Promise<void> {
    const pathname = this.getPathname();
    const match = this.match(pathname);

    const previousMatch = this.currentMatch;

    // 执行前置守卫
    const guardResult = await this.executeBeforeGuards(match, previousMatch);
    if (guardResult === false) {
      return;
    }

    // 如果守卫返回字符串，重定向到该路径
    if (typeof guardResult === "string") {
      await this.navigate(guardResult, { replace: true });
      return;
    }

    // 更新当前匹配
    this.currentMatch = match;

    // 更新页面标题
    this.updateDocumentTitle(match);

    // 执行后置守卫
    await this.executeAfterGuards(match, previousMatch);

    // 触发路由变化回调
    this.notifyRouteChange(match);

    // 处理滚动行为
    await this.handleScrollBehavior(match, previousMatch);
  }

  /**
   * 执行前置守卫
   */
  private async executeBeforeGuards(
    to: ClientRouteMatch | null,
    from: ClientRouteMatch | null,
  ): Promise<boolean | string> {
    if (!to) return true;

    for (const guard of this.beforeRouteGuards) {
      const result = await guard(to, from);
      if (result === false) {
        return false;
      }
      if (typeof result === "string") {
        return result;
      }
    }

    return true;
  }

  /**
   * 执行后置守卫
   */
  private async executeAfterGuards(
    to: ClientRouteMatch | null,
    from: ClientRouteMatch | null,
  ): Promise<void> {
    if (!to) return;

    for (const guard of this.afterRouteGuards) {
      await guard(to, from);
    }
  }

  /**
   * 通知路由变化
   */
  private notifyRouteChange(match: ClientRouteMatch | null): void {
    for (const callback of this.routeChangeCallbacks) {
      callback(match);
    }
  }

  /**
   * 设置导航状态
   */
  private setNavigationState(state: NavigationState, error?: Error): void {
    this.navigationState = state;
    for (const callback of this.navigationStateCallbacks) {
      callback(state, error);
    }
  }

  /**
   * 更新文档标题
   */
  private updateDocumentTitle(match: ClientRouteMatch | null): void {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (match?.meta.title && browserGlobal.document) {
      browserGlobal.document.title = match.meta.title;
    }
  }

  /**
   * 保存滚动位置
   */
  private saveScrollPosition(): void {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (browserGlobal.scrollX !== undefined && browserGlobal.scrollY !== undefined) {
      const pathname = this.getPathname();
      this.scrollPositions.set(pathname, {
        left: browserGlobal.scrollX,
        top: browserGlobal.scrollY,
      });
    }
  }

  /**
   * 处理滚动行为
   */
  private async handleScrollBehavior(
    to: ClientRouteMatch | null,
    from: ClientRouteMatch | null,
  ): Promise<void> {
    if (!to) return;

    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (!browserGlobal.scrollTo) return;

    // 获取保存的滚动位置
    const savedPosition = this.scrollPositions.get(to.fullPath) || null;

    // 如果有自定义滚动行为
    if (this.options.scrollBehavior) {
      const result = await this.options.scrollBehavior(to, from, savedPosition);
      if (result === false) {
        return;
      }
      if (result) {
        browserGlobal.scrollTo({
          top: result.top,
          left: result.left || 0,
          behavior: result.behavior || "auto",
        });
        return;
      }
    }

    // 默认滚动到顶部
    browserGlobal.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  /**
   * 获取当前路径
   */
  private getPathname(): string {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis === "undefined" || !browserGlobal.location) {
      return "/";
    }

    if (this.options.mode === "hash") {
      // Hash 模式：使用 hash 部分
      const hash = browserGlobal.location.hash;
      return hash ? hash.slice(1) : "/";
    }

    // History 模式
    const { pathname, search } = browserGlobal.location;
    return search ? `${pathname}${search}` : pathname;
  }

  /**
   * 获取基础 URL
   */
  private getBaseUrl(): string {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis !== "undefined" && browserGlobal.location) {
      if (browserGlobal.location.origin) {
        return browserGlobal.location.origin;
      }
      return `${browserGlobal.location.protocol}//${browserGlobal.location.host}`;
    }
    return "http://localhost";
  }

  /**
   * 匹配单个路由
   */
  private matchRoute(
    route: ClientRoute,
    pathname: string,
  ): { params: Record<string, string> } | null {
    const routePath = route.path;
    const params: Record<string, string> = {};

    // 静态路由
    if (route.type === "static" || !route.type) {
      return routePath === pathname ? { params } : null;
    }

    const routeParts = routePath.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    // 通配符路由
    if (route.type === "wildcard") {
      const prefix = routePath.replace("/*", "");
      if (pathname.startsWith(prefix)) {
        const rest = pathname.slice(prefix.length);
        params["*"] = rest;
        return { params };
      }
      return null;
    }

    // 可选参数路由
    if (route.type === "optional") {
      const basePath = routePath.replace(/\/:[^?]+(\?)?$/, "");
      if (pathname === basePath) {
        return { params };
      }
    }

    // 动态路由匹配
    if (routeParts.length !== pathParts.length) {
      return null;
    }

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(":")) {
        const paramName = routePart.replace(/^:/, "").replace(/\?$/, "");
        params[paramName] = pathPart;
      } else if (routePart !== pathPart) {
        return null;
      }
    }

    return { params };
  }

  /**
   * 加载组件
   */
  private loadComponent(component: string): Promise<unknown> {
    // 检查缓存
    if (this.componentCache.has(component)) {
      return Promise.resolve(this.componentCache.get(component));
    }

    if (this.componentLoader) {
      return this.componentLoader(component).then((module) => {
        this.componentCache.set(component, module);
        return module;
      });
    }

    return Promise.reject(
      new Error(`组件加载功能需要根据构建工具实现: ${component}`),
    );
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建客户端路由器实例
 * @param options 路由配置选项
 * @returns 客户端路由器实例
 */
export function createRouter(options: ClientRouterOptions): ClientRouter {
  return new ClientRouter(options);
}

// ============================================================================
// Hooks（框架无关的通用实现）
// ============================================================================

/**
 * 获取路由器实例
 * @returns 路由器实例
 * @throws 如果没有设置全局路由器，抛出错误
 */
export function useRouter(): ClientRouter {
  const router = getGlobalRouter();
  if (!router) {
    throw new Error(
      "useRouter: 没有找到路由器实例。请确保已创建路由器并调用了 start() 方法。",
    );
  }
  return router;
}

/**
 * 获取当前路由信息
 * @returns 当前路由匹配结果
 */
export function useRoute(): ClientRouteMatch | null {
  const router = useRouter();
  return router.getCurrentRoute();
}

/**
 * 获取路由参数
 * @returns 路由参数对象
 */
export function useParams(): Record<string, string> {
  const route = useRoute();
  return route?.params || {};
}

/**
 * 获取查询参数
 * @returns 查询参数对象
 */
export function useQuery(): Record<string, string> {
  const route = useRoute();
  return route?.query || {};
}

/**
 * 获取路由元数据
 * @returns 路由元数据
 */
export function useMeta(): RouteMeta {
  const route = useRoute();
  return route?.meta || {};
}

/**
 * 获取导航状态
 * @returns 当前导航状态
 */
export function useNavigationState(): NavigationState {
  const router = useRouter();
  return router.getNavigationState();
}

/**
 * 检查路径是否活跃
 * @param path 路径
 * @param exact 是否精确匹配
 * @returns 是否活跃
 */
export function useIsActive(path: string, exact = false): boolean {
  const router = useRouter();
  return router.isActive(path, exact);
}

// ============================================================================
// 重新导出组件模块
// ============================================================================

export {
  createLinkProps,
  createNavLinkProps,
  createLinkComponent,
  createNavLinkComponent,
  isPathActive,
  navigate,
  prefetch,
} from "./components.ts";

export type {
  LinkProps,
  NavLinkProps,
  LinkAttributes,
  NavLinkAttributes,
} from "./components.ts";

// ============================================================================
// 导出类型
// ============================================================================

export type {
  BrowserElement,
  BrowserMouseEvent,
  BrowserGlobalThis,
};
