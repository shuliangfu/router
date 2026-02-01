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
 *
 * @example
 * ```typescript
 * import { createRouter } from "jsr:@dreamer/router/client";
 *
 * const router = createRouter({
 *   routes: [
 *     { path: "/", component: "index" },
 *     { path: "/about", component: "about" },
 *     { path: "/user/:id", component: "user/[id]" },
 *   ],
 *   engine: "preact",
 * });
 *
 * router.navigate("/about");
 * ```
 */

/**
 * 浏览器全局对象类型扩展
 */
interface BrowserGlobalThis {
  location?: {
    pathname: string;
    search: string;
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
  };
  addEventListener?: (
    type: string,
    listener: (event: Event) => void,
  ) => void;
}

/**
 * 客户端路由配置选项
 */
export interface ClientRouterOptions {
  /** 路由配置列表（由服务端生成） */
  routes: ClientRoute[];
  /** 渲染引擎类型（preact、react 或 vue3，默认：preact） */
  engine?: "preact" | "react" | "vue3";
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
) => boolean | Promise<boolean> | void | Promise<void>;

/**
 * 客户端路由器类
 * 提供客户端路由导航、匹配等功能
 */
/**
 * 组件加载器函数类型
 */
export type ComponentLoader = (component: string) => Promise<unknown>;

export class ClientRouter {
  private routes: ClientRoute[] = [];
  private options: Required<Pick<ClientRouterOptions, "engine">>;
  private currentMatch: ClientRouteMatch | null = null;
  private routeChangeCallbacks: RouteChangeCallback[] = [];
  private beforeRouteGuards: RouteGuard[] = [];
  private afterRouteGuards: RouteGuard[] = [];
  private popstateHandler: (() => void) | null = null;
  private componentLoader: ComponentLoader | null = null;

  /**
   * 创建客户端路由器实例
   * @param options 路由配置选项
   */
  constructor(options: ClientRouterOptions) {
    this.routes = options.routes || [];
    this.options = {
      engine: options.engine || "preact",
    };

    // 监听浏览器历史记录变化
    this.setupHistoryListener();
  }

  /**
   * 设置历史记录监听器
   */
  private setupHistoryListener(): void {
    // 使用 popstate 事件监听浏览器前进/后退
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis !== "undefined" && browserGlobal.addEventListener) {
      this.popstateHandler = () => {
        this.handleRouteChange();
      };
      browserGlobal.addEventListener("popstate", this.popstateHandler);
    }
  }

  /**
   * 处理路由变化
   */
  private async handleRouteChange(): Promise<void> {
    const pathname = this.getPathname();
    const match = this.match(pathname);

    // 保存旧的匹配结果（用于后置守卫）
    const previousMatch = this.currentMatch;

    // 执行前置守卫
    const canNavigate = await this.executeBeforeGuards(match, previousMatch);
    if (!canNavigate) {
      return;
    }

    // 更新当前匹配
    this.currentMatch = match;

    // 执行后置守卫（使用保存的旧匹配作为 from）
    await this.executeAfterGuards(match, previousMatch);

    // 触发路由变化回调
    this.notifyRouteChange(match);
  }

  /**
   * 执行前置守卫
   * @param to 目标路由
   * @param from 来源路由
   * @returns 是否允许导航
   */
  private async executeBeforeGuards(
    to: ClientRouteMatch | null,
    from: ClientRouteMatch | null,
  ): Promise<boolean> {
    if (!to) return true;

    for (const guard of this.beforeRouteGuards) {
      const result = await guard(to, from);
      if (result === false) {
        return false;
      }
    }

    return true;
  }

  /**
   * 执行后置守卫
   * @param to 目标路由
   * @param from 来源路由
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
   * @param match 路由匹配结果
   */
  private notifyRouteChange(match: ClientRouteMatch | null): void {
    for (const callback of this.routeChangeCallbacks) {
      callback(match);
    }
  }

  /**
   * 获取当前路径（包含查询参数）
   * @returns 当前路径，格式如 /path?query=value
   */
  private getPathname(): string {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis !== "undefined" && browserGlobal.location) {
      // 返回 pathname + search 以便正确解析查询参数
      const { pathname, search } = browserGlobal.location;
      return search ? `${pathname}${search}` : pathname;
    }
    return "/";
  }

  /**
   * 获取当前页面的 base URL
   * @returns 当前页面的 base URL
   */
  private getBaseUrl(): string {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis !== "undefined" && browserGlobal.location) {
      // 优先使用 origin（如果可用）
      if (browserGlobal.location.origin) {
        return browserGlobal.location.origin;
      }
      // 否则使用 protocol 和 host 组合
      return `${browserGlobal.location.protocol}//${browserGlobal.location.host}`;
    }
    // 如果无法获取，使用默认值（但这种情况不应该在浏览器环境中发生）
    return "http://localhost";
  }

  /**
   * 匹配路由
   * @param pathname 路径（如 /user/123）
   * @returns 路由匹配结果或 null
   */
  match(pathname: string): ClientRouteMatch | null {
    // 解析查询参数
    // 如果 pathname 已经是完整 URL，直接使用；否则使用当前页面的 base URL
    const baseUrl = this.getBaseUrl();
    const url = new URL(pathname, baseUrl);
    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    const cleanPath = url.pathname;

    // 匹配路由
    for (const route of this.routes) {
      const match = this.matchRoute(route, cleanPath);
      if (match) {
        return {
          route,
          params: match.params,
          query,
          load: () => this.loadComponent(route.component),
        };
      }
    }

    return null;
  }

  /**
   * 匹配单个路由
   * @param route 路由对象
   * @param pathname 路径
   * @returns 匹配结果或 null
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

    // 动态路由匹配
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
      // 继续匹配动态部分
    }

    // 动态路由匹配
    if (routeParts.length !== pathParts.length) {
      return null;
    }

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(":")) {
        // 动态参数
        const paramName = routePart.replace(/^:/, "").replace(/\?$/, "");
        params[paramName] = pathPart;
      } else if (routePart !== pathPart) {
        return null;
      }
    }

    return { params };
  }

  /**
   * 加载组件（懒加载）
   * @param component 组件标识
   * @returns 组件模块
   */
  private loadComponent(component: string): Promise<unknown> {
    // 如果设置了自定义组件加载器，使用它
    if (this.componentLoader) {
      return this.componentLoader(component);
    }
    // 否则返回错误，需要用户设置加载器
    return Promise.reject(
      new Error(
        `组件加载功能需要根据构建工具实现: ${component}`,
      ),
    );
  }

  /**
   * 设置自定义组件加载器
   * @param loader 组件加载函数
   * @example
   * ```typescript
   * router.setComponentLoader(async (component) => {
   *   // 根据 component 路径动态导入
   *   return await import(`./pages/${component}.tsx`);
   * });
   * ```
   */
  setComponentLoader(loader: ComponentLoader): void {
    this.componentLoader = loader;
  }

  /**
   * 导航到指定路径
   * @param path 路径
   * @param replace 是否替换当前历史记录（默认：false）
   * @returns Promise，在路由变化处理完成后 resolve
   */
  async navigate(path: string, replace = false): Promise<void> {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis === "undefined" || !browserGlobal.history) {
      throw new Error("浏览器环境不支持 history API");
    }

    if (replace) {
      browserGlobal.history.replaceState(null, "", path);
    } else {
      browserGlobal.history.pushState(null, "", path);
    }

    // 触发路由变化并等待完成
    await this.handleRouteChange();
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
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis === "undefined" || !browserGlobal.history) {
      throw new Error("浏览器环境不支持 history API");
    }

    browserGlobal.history.back();
  }

  /**
   * 前进一步
   */
  forward(): void {
    const browserGlobal = globalThis as unknown as BrowserGlobalThis;
    if (typeof globalThis === "undefined" || !browserGlobal.history) {
      throw new Error("浏览器环境不支持 history API");
    }

    browserGlobal.history.forward();
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
   * 添加路由前置守卫
   * @param guard 守卫函数
   */
  beforeRoute(guard: RouteGuard): void {
    this.beforeRouteGuards.push(guard);
  }

  /**
   * 添加路由后置守卫
   * @param guard 守卫函数
   */
  afterRoute(guard: RouteGuard): void {
    this.afterRouteGuards.push(guard);
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

  /**
   * 销毁路由器
   * 移除所有事件监听器和回调函数
   */
  destroy(): void {
    // 移除 popstate 监听器
    if (this.popstateHandler) {
      const browserGlobal = globalThis as unknown as {
        removeEventListener?: (
          type: string,
          listener: () => void,
        ) => void;
      };
      if (browserGlobal.removeEventListener) {
        browserGlobal.removeEventListener("popstate", this.popstateHandler);
      }
      this.popstateHandler = null;
    }

    // 清除所有回调和守卫
    this.routeChangeCallbacks = [];
    this.beforeRouteGuards = [];
    this.afterRouteGuards = [];
    this.currentMatch = null;
    this.componentLoader = null;
  }
}

/**
 * 创建客户端路由器实例
 * @param options 路由配置选项
 * @returns 客户端路由器实例
 */
export function createRouter(options: ClientRouterOptions): ClientRouter {
  return new ClientRouter(options);
}

/**
 * React/Preact Hook：获取路由器实例
 * @returns 路由器实例
 */
export function useRouter(): ClientRouter {
  // 这里需要根据框架实现
  // 实际使用时需要通过 Context 或其他方式提供路由器实例
  throw new Error(
    "useRouter Hook 需要根据框架实现（React Context 或 Preact Context）",
  );
}
