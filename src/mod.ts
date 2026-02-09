/**
 * @module @dreamer/router
 *
 * 文件路由系统，提供统一的文件路由接口，支持服务端路由匹配（SSR）和 API 路由。
 *
 * 功能特性：
 * - 文件路由系统：基于文件系统自动生成路由，文件结构即路由结构
 * - 路由类型支持：静态路由、动态路由、通配符路由、可选参数路由
 * - API 路由支持：RESTful 形式（HTTP 方法）和操作方法形式（函数名）
 * - 特殊文件处理：_app（.tsx）、_layout、_404、_error、_middleware.ts
 * - 服务端路由匹配：路由参数解析、查询参数解析、SSR 支持
 * - 路由重定向：支持路由级别的重定向配置
 * - 中间件链：支持多个中间件链式执行
 * - 路由元数据：支持为路由添加自定义元数据
 *
 * 环境兼容性：
 * - 服务端：✅ 支持（Deno 和 Bun 运行时）
 *
 * @example
 * ```typescript
 * import { createRouter } from "jsr:@dreamer/router";
 *
 * const router = createRouter({
 *   routesDir: "./src/routes",
 *   apiMode: "restful",
 *   redirects: [
 *     { source: "/old-page", destination: "/new-page", permanent: true },
 *   ],
 * });
 *
 * await router.scan();
 * const match = await router.match("/user/123");
 * ```
 */

// 导入 runtime-adapter 提供的文件系统 API（兼容 Deno 和 Bun）
import { cwd, dirname, join, readdir, stat } from "@dreamer/runtime-adapter";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 路由元数据类型
 */
export interface RouteMeta {
  /** 页面标题 */
  title?: string;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 缓存策略 */
  cache?: "no-store" | "force-cache" | number;
  /** 自定义数据 */
  [key: string]: unknown;
}

/**
 * 重定向配置
 */
export interface RedirectConfig {
  /** 源路径（支持动态参数，如 /old/:id） */
  source: string;
  /** 目标路径（支持参数引用，如 /new/:id） */
  destination: string;
  /** 是否为永久重定向（301），默认 false（302） */
  permanent?: boolean;
  /** 状态码（覆盖 permanent 设置） */
  statusCode?: 301 | 302 | 303 | 307 | 308;
}

/**
 * 中间件上下文
 */
export interface MiddlewareContext {
  /** 请求对象 */
  request: Request;
  /** 路由参数 */
  params: Record<string, string>;
  /** 查询参数 */
  query: Record<string, string>;
  /** 匹配的路由 */
  route: Route | null;
  /** 自定义数据（可在中间件间传递） */
  data: Record<string, unknown>;
}

/**
 * 中间件函数类型
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<Response>,
) => Promise<Response> | Response;

/**
 * 路由配置选项
 *
 * 说明：engine、ssr 由上层框架（如 dweb 的 render 配置）提供，服务端路由仅负责扫描、匹配、加载模块。
 */
export interface RouterOptions {
  /** 路由文件目录 */
  routesDir: string;
  /** API 路由形式（restful 或 action，默认：restful） */
  apiMode?: "restful" | "action";
  /** 重定向配置列表 */
  redirects?: RedirectConfig[];
  /** 全局中间件列表 */
  middlewares?: MiddlewareFunction[];
  /** 是否跳过 _app 验证（默认：false） */
  skipAppValidation?: boolean;
  /** 是否启用详细调试日志（默认：false） */
  debug?: boolean;
}

/**
 * 路由类型
 */
export type RouteType = "static" | "dynamic" | "wildcard" | "optional";

/**
 * 路由信息
 */
export interface Route {
  /** 路由路径（如 /user/:id） */
  path: string;
  /** 文件路径（相对于 routesDir） */
  file: string;
  /** 完整文件路径 */
  fullPath: string;
  /** 路由类型 */
  type: RouteType;
  /** 是否为 API 路由 */
  isApi: boolean;
  /** 是否为特殊文件 */
  isSpecial: boolean;
  /** 特殊文件类型（如果有） */
  specialType?: "_app" | "_layout" | "_404" | "_error" | "_middleware";
  /** 路由元数据 */
  meta?: RouteMeta;
}

/**
 * 路由匹配结果
 */
export interface RouteMatch {
  /** 匹配的路由 */
  route: Route;
  /** 路由参数（动态路由参数） */
  params: Record<string, string>;
  /** 查询参数 */
  query: Record<string, string>;
  /** 完整路径 */
  fullPath: string;
  /** 是否为 API 路由 */
  isApi: boolean;
  /** 路由元数据 */
  meta: RouteMeta;
  /** API 处理函数（如果是 API 路由） */
  handlers?: Record<
    string,
    (request: Request, context?: any) => Promise<Response> | Response
  >;
  /** 加载页面组件 */
  load?: () => Promise<any>;
  /** 重定向信息（如果需要重定向） */
  redirect?: {
    destination: string;
    statusCode: number;
  };
}

// ============================================================================
// 路由器类
// ============================================================================

/**
 * 服务端模块缓存大小限制
 * 用于防止内存泄漏
 */
const MAX_MODULE_CACHE = 200;

/**
 * 文件路由路由器类
 * 提供文件路由扫描、匹配等功能
 */
export class Router {
  private routes: Route[] = [];
  private options:
    & Required<
      Omit<
        RouterOptions,
        "redirects" | "middlewares" | "skipAppValidation" | "debug"
      >
    >
    & {
      redirects: RedirectConfig[];
      middlewares: MiddlewareFunction[];
      skipAppValidation: boolean;
      debug: boolean;
    };
  private specialFiles: Map<string, string> = new Map();
  private moduleCache: Map<string, any> = new Map();
  /** 模块缓存访问顺序（用于 LRU 淘汰） */
  private moduleCacheOrder: string[] = [];

  /**
   * 创建路由器实例
   * @param options 路由配置选项
   */
  constructor(options: RouterOptions) {
    this.options = {
      apiMode: options.apiMode || "restful",
      routesDir: options.routesDir,
      redirects: options.redirects || [],
      middlewares: options.middlewares || [],
      skipAppValidation: options.skipAppValidation || false,
      debug: options.debug ?? false,
    };
  }

  /**
   * 调试日志：仅当 debug 为 true 时输出
   */
  private debugLog(prefix: string, ...args: unknown[]): void {
    if (this.options.debug) {
      console.log(`[@dreamer/router:${prefix}]`, ...args);
    }
  }

  /**
   * 返回缺失时应提示的应用入口文件名（_app.tsx）
   */
  private getExpectedAppFile(): "_app.tsx" {
    return "_app.tsx";
  }

  // ==========================================================================
  // 公共方法
  // ==========================================================================

  /**
   * 扫描路由文件
   * 使用文件系统 API 扫描 routesDir 目录，生成路由配置
   */
  async scan(): Promise<void> {
    this.routes = [];
    this.specialFiles.clear();
    // 清除缓存和 LRU 顺序
    this.moduleCache.clear();
    this.moduleCacheOrder = [];

    try {
      await this.scanDirectory(this.options.routesDir, "");
    } catch (error) {
      throw new Error(
        `扫描路由文件失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // 验证 _app 是否存在（可配置跳过）
    if (!this.options.skipAppValidation && !this.specialFiles.has("_app")) {
      const expected = this.getExpectedAppFile();
      throw new Error(
        `缺少必需的特殊文件: ${expected}（必须在 ${this.options.routesDir} 目录下）`,
      );
    }
  }

  /**
   * 匹配路由
   * @param pathname 路径（如 /user/123）
   * @param options 匹配选项
   * @returns 路由匹配结果或 null
   */
  async match(
    pathname: string,
    options?: { method?: string; request?: Request },
  ): Promise<RouteMatch | null> {
    this.debugLog("match", "pathname:", pathname, "method:", options?.method);

    // 解析查询参数
    const url = new URL(pathname, "http://localhost");
    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    const cleanPath = url.pathname;

    // 首先检查重定向
    const redirectResult = this.checkRedirects(cleanPath);
    if (redirectResult) {
      return {
        route: {
          path: cleanPath,
          file: "",
          fullPath: "",
          type: "static",
          isApi: false,
          isSpecial: false,
        },
        params: {},
        query,
        fullPath: pathname,
        isApi: false,
        meta: {},
        redirect: redirectResult,
      };
    }

    // 尝试匹配 API 路由
    if (options?.method || cleanPath.startsWith("/api/")) {
      const apiMatch = await this.matchApiRoute(cleanPath, options?.method);
      if (apiMatch) {
        return {
          ...apiMatch,
          query,
          fullPath: pathname,
          meta: apiMatch.route.meta || {},
        };
      }
    }

    // 匹配普通路由
    for (const route of this.routes) {
      if (route.isApi) continue;

      const match = this.matchRoute(route, cleanPath);
      if (match) {
        this.debugLog("match", "matched", {
          path: route.path,
          file: route.file,
          fullPath: route.fullPath,
          params: match.params,
        });
        return {
          route,
          params: match.params,
          query,
          fullPath: pathname,
          isApi: false,
          meta: route.meta || {},
          load: () => this.loadModule(route.fullPath),
        };
      }
    }

    this.debugLog("match", "no match for pathname:", pathname, "routes count:", this.routes.length);
    return null;
  }

  /**
   * 处理请求（包含中间件链执行）
   * @param request 请求对象
   * @param handler 最终处理函数
   * @returns 响应对象
   */
  async handleRequest(
    request: Request,
    handler: (
      match: RouteMatch | null,
      context: MiddlewareContext,
    ) => Promise<Response>,
  ): Promise<Response> {
    const url = new URL(request.url);
    const match = await this.match(url.pathname + url.search, {
      method: request.method,
      request,
    });

    // 创建中间件上下文
    const context: MiddlewareContext = {
      request,
      params: match?.params || {},
      query: match?.query || {},
      route: match?.route || null,
      data: {},
    };

    // 加载路由级别的中间件
    const routeMiddlewares = await this.loadRouteMiddlewares(match?.route);

    // 合并全局中间件和路由中间件
    const allMiddlewares = [...this.options.middlewares, ...routeMiddlewares];

    // 创建中间件链
    const executeMiddlewareChain = async (index: number): Promise<Response> => {
      if (index >= allMiddlewares.length) {
        // 所有中间件执行完毕，执行最终处理函数
        return await handler(match, context);
      }

      const middleware = allMiddlewares[index];
      return await middleware(context, () => executeMiddlewareChain(index + 1));
    };

    return await executeMiddlewareChain(0);
  }

  /**
   * 添加全局中间件
   * @param middleware 中间件函数
   */
  use(middleware: MiddlewareFunction): void {
    this.options.middlewares.push(middleware);
  }

  /**
   * 添加重定向配置
   * @param config 重定向配置
   */
  addRedirect(config: RedirectConfig): void {
    this.options.redirects.push(config);
  }

  /**
   * 获取所有路由
   * @returns 路由列表
   */
  getRoutes(): Route[] {
    return [...this.routes];
  }

  /**
   * 获取客户端路由配置
   * 用于服务端渲染时注入到客户端
   * @returns 客户端路由配置数组
   */
  getClientRoutes(): Array<{
    path: string;
    component: string;
    type: RouteType;
    meta?: RouteMeta;
  }> {
    return this.routes
      .filter((r) => !r.isApi && !r.isSpecial)
      .map((r) => ({
        path: r.path,
        component: r.file.replace(/\.(tsx?|jsx?)$/, ""),
        type: r.type,
        meta: r.meta,
      }));
  }

  /**
   * 获取特殊文件路径
   * @param type 特殊文件类型
   * @returns 文件路径或 undefined
   */
  getSpecialFile(
    type: "_app" | "_layout" | "_404" | "_error" | "_middleware",
  ): string | undefined {
    return this.specialFiles.get(type);
  }

  /**
   * 加载模块（带 LRU 淘汰策略，防止内存泄漏）
   * @param filePath 文件路径
   * @returns 模块
   */
  async loadModule(filePath: string): Promise<any> {
    this.debugLog("loadModule", "filePath:", filePath, "cached:", this.moduleCache.has(filePath));

    // 检查缓存
    if (this.moduleCache.has(filePath)) {
      // 更新 LRU 顺序
      const existingIndex = this.moduleCacheOrder.indexOf(filePath);
      if (existingIndex > -1) {
        this.moduleCacheOrder.splice(existingIndex, 1);
      }
      this.moduleCacheOrder.push(filePath);

      return this.moduleCache.get(filePath);
    }

    const module = await this.importModule(filePath);

    // 添加到缓存和 LRU 顺序
    this.moduleCache.set(filePath, module);
    this.moduleCacheOrder.push(filePath);

    // LRU 淘汰：超过限制时删除最旧的
    while (this.moduleCache.size > MAX_MODULE_CACHE) {
      const oldest = this.moduleCacheOrder.shift();
      if (oldest) {
        this.moduleCache.delete(oldest);
      }
    }

    return module;
  }

  /**
   * 清除模块缓存
   * @param filePath 文件路径（可选，不传则清除所有）
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      this.moduleCache.delete(filePath);
      // 从 LRU 顺序中移除
      const index = this.moduleCacheOrder.indexOf(filePath);
      if (index > -1) {
        this.moduleCacheOrder.splice(index, 1);
      }
    } else {
      this.moduleCache.clear();
      this.moduleCacheOrder = [];
    }
  }

  /**
   * 获取 API 模式
   */
  getApiMode(): "restful" | "action" {
    return this.options.apiMode;
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  /**
   * 检查重定向
   */
  private checkRedirects(
    pathname: string,
  ): { destination: string; statusCode: number } | null {
    for (const redirect of this.options.redirects) {
      const match = this.matchRedirectSource(redirect.source, pathname);
      if (match) {
        // 替换目标路径中的参数
        let destination = redirect.destination;
        for (const [key, value] of Object.entries(match.params)) {
          destination = destination.replace(`:${key}`, value);
        }

        const statusCode = redirect.statusCode ||
          (redirect.permanent ? 301 : 302);
        return { destination, statusCode };
      }
    }
    return null;
  }

  /**
   * 匹配重定向源路径
   */
  private matchRedirectSource(
    source: string,
    pathname: string,
  ): { params: Record<string, string> } | null {
    const params: Record<string, string> = {};

    // 精确匹配
    if (!source.includes(":") && !source.includes("*")) {
      return source === pathname ? { params } : null;
    }

    // 动态匹配
    const sourceParts = source.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    // 通配符
    if (source.endsWith("*")) {
      const prefix = source.slice(0, -1);
      if (pathname.startsWith(prefix)) {
        params["*"] = pathname.slice(prefix.length);
        return { params };
      }
      return null;
    }

    if (sourceParts.length !== pathParts.length) {
      return null;
    }

    for (let i = 0; i < sourceParts.length; i++) {
      const sourcePart = sourceParts[i];
      const pathPart = pathParts[i];

      if (sourcePart.startsWith(":")) {
        const paramName = sourcePart.slice(1);
        params[paramName] = pathPart;
      } else if (sourcePart !== pathPart) {
        return null;
      }
    }

    return { params };
  }

  /**
   * 加载路由级别的中间件
   */
  private async loadRouteMiddlewares(
    route: Route | null | undefined,
  ): Promise<MiddlewareFunction[]> {
    if (!route) return [];

    const middlewares: MiddlewareFunction[] = [];

    // 查找路由目录下的 _middleware.ts（使用 dirname/join 确保 Windows 兼容）
    const routeDir = dirname(route.fullPath);
    const middlewarePath = join(routeDir, "_middleware.ts");

    try {
      const module = await this.loadModule(middlewarePath);
      if (module.default && typeof module.default === "function") {
        middlewares.push(module.default);
      }
      if (module.middleware && typeof module.middleware === "function") {
        middlewares.push(module.middleware);
      }
    } catch {
      // 中间件文件不存在，忽略
    }

    return middlewares;
  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(
    dirPath: string,
    relativePath: string,
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        const fileStat = await stat(fullPath);

        if (fileStat.isDirectory) {
          await this.scanDirectory(
            fullPath,
            relativePath ? join(relativePath, entry.name) : entry.name,
          );
        } else if (fileStat.isFile) {
          this.processFile(fullPath, relativePath, entry.name);
        }
      }
    } catch (error: any) {
      if (error?.code !== "ENOENT" && error?.name !== "NotFound") {
        throw error;
      }
    }
  }

  /**
   * 处理路由文件
   */
  private processFile(
    fullPath: string,
    relativePath: string,
    fileName: string,
  ): void {
    // 规范化路径（Windows 兼容：join 可能产生反斜杠，统一为正斜杠）
    const normalizedPath = this.normalizeRouteFile(relativePath);

    // 检查是否为特殊文件
    if (fileName.startsWith("_")) {
      const specialType = this.getSpecialFileType(fileName);
      if (specialType) {
        // 处理嵌套的特殊文件（key 使用正斜杠，确保 Windows 下查找一致）
        const key = normalizedPath
          ? `${normalizedPath}/${specialType}`
          : specialType;
        this.specialFiles.set(key, fullPath);
        // 根目录的特殊文件也用简单 key 保存
        if (!normalizedPath) {
          this.specialFiles.set(specialType, fullPath);
        }
      }
      return;
    }

    // 检查是否为路由文件（支持 .tsx、.ts）
    const isRouteFile = fileName.endsWith(".tsx") || fileName.endsWith(".ts");
    if (!isRouteFile) {
      return;
    }

    // 判断是否为 API 路由（使用规范化后的路径，Windows 下 relativePath 可能含反斜杠）
    const isApi = normalizedPath.startsWith("api/") ||
      normalizedPath.split("/").includes("api");

    // 解析路由路径和类型（传入规范化路径，确保 route.path 正确）
    const routeInfo = this.parseRoutePath(normalizedPath, fileName, isApi);

    // 创建路由对象
    const route: Route = {
      path: routeInfo.path,
      file: routeInfo.file,
      fullPath: fullPath,
      type: routeInfo.type,
      isApi: isApi,
      isSpecial: false,
    };

    this.routes.push(route);
  }

  /**
   * 获取特殊文件类型
   */
  private getSpecialFileType(
    fileName: string,
  ): "_app" | "_layout" | "_404" | "_error" | "_middleware" | undefined {
    if (fileName === "_app.tsx") return "_app";
    if (fileName === "_layout.tsx") return "_layout";
    if (fileName === "_404.tsx") return "_404";
    if (fileName === "_error.tsx") return "_error";
    if (fileName === "_middleware.ts") return "_middleware";
    return undefined;
  }

  /**
   * 规范化 route.file 为统一正斜杠（Windows 兼容：确保 hydrationData.component 与客户端 ROUTE_LOADERS 一致）
   */
  private normalizeRouteFile(path: string): string {
    return path.replace(/\\/g, "/").trim();
  }

  /**
   * 解析路由路径
   */
  private parseRoutePath(
    relativePath: string,
    fileName: string,
    _isApi: boolean,
  ): { path: string; file: string; type: RouteType } {
    const nameWithoutExt = fileName.replace(/\.(tsx|ts)$/, "");

    // 处理 index 文件
    if (nameWithoutExt === "index") {
      const path = relativePath
        ? `/${relativePath.replace(/\/index$/, "")}`
        : "/";
      const file = this.normalizeRouteFile(
        relativePath ? `${relativePath}/${fileName}` : fileName,
      );
      return {
        path: path || "/",
        file,
        type: "static",
      };
    }

    const filePath = this.normalizeRouteFile(
      relativePath ? `${relativePath}/${fileName}` : fileName,
    );

    let routePath = relativePath ? `/${relativePath}` : "";
    routePath = `${routePath}/${nameWithoutExt}`;

    let routeType: RouteType = "static";

    // 动态路由
    if (nameWithoutExt.startsWith("[") && nameWithoutExt.endsWith("]")) {
      const paramName = nameWithoutExt.slice(1, -1);
      if (paramName.startsWith("...")) {
        routeType = "wildcard";
        routePath = routePath.replace(`/${nameWithoutExt}`, "/*");
      } else if (
        nameWithoutExt.startsWith("[[") && nameWithoutExt.endsWith("]]")
      ) {
        routeType = "optional";
        const optionalParamName = nameWithoutExt.slice(2, -2);
        routePath = routePath.replace(
          `/${nameWithoutExt}`,
          `/:${optionalParamName}?`,
        );
      } else {
        routeType = "dynamic";
        routePath = routePath.replace(`/${nameWithoutExt}`, `/:${paramName}`);
      }
    }

    // 处理路径中的动态参数
    routePath = routePath.replace(/\[\[([^\]]+)\]\]/g, ":$1?");
    routePath = routePath.replace(/\[\.\.\.([^\]]+)\]/g, "*");
    routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

    return {
      path: routePath,
      file: filePath,
      type: routeType,
    };
  }

  /**
   * 匹配 API 路由
   */
  private async matchApiRoute(
    pathname: string,
    method?: string,
  ): Promise<RouteMatch | null> {
    for (const route of this.routes) {
      if (!route.isApi) continue;

      const match = this.matchRoute(route, pathname);
      if (match) {
        const handlers = await this.loadApiHandlers(route.fullPath);
        if (!handlers) continue;

        if (this.options.apiMode === "restful") {
          if (method && handlers[method.toUpperCase()]) {
            return {
              route,
              params: match.params,
              query: {},
              fullPath: pathname,
              isApi: true,
              meta: route.meta || {},
              handlers: {
                [method.toUpperCase()]: handlers[method.toUpperCase()],
              },
            };
          }
        } else {
          return {
            route,
            params: match.params,
            query: {},
            fullPath: pathname,
            isApi: true,
            meta: route.meta || {},
            handlers,
          };
        }
      }
    }

    return null;
  }

  /**
   * 匹配单个路由
   */
  private matchRoute(
    route: Route,
    pathname: string,
  ): { params: Record<string, string> } | null {
    const routePath = route.path;
    const params: Record<string, string> = {};

    if (route.type === "static") {
      return routePath === pathname ? { params } : null;
    }

    const routeParts = routePath.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    if (route.type === "wildcard") {
      const prefix = routePath.replace("/*", "");
      if (pathname.startsWith(prefix)) {
        const rest = pathname.slice(prefix.length);
        params["*"] = rest;
        return { params };
      }
      return null;
    }

    if (route.type === "optional") {
      const basePath = routePath.replace(/\/:[^?]+(\?)?$/, "");
      if (pathname === basePath) {
        return { params };
      }
    }

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
   * 加载 API 处理函数
   */
  private async loadApiHandlers(
    filePath: string,
  ): Promise<
    | Record<
      string,
      (request: Request, context?: any) => Promise<Response> | Response
    >
    | null
  > {
    try {
      const module = await this.importModule(filePath);

      if (this.options.apiMode === "restful") {
        const handlers: Record<
          string,
          (request: Request, context?: any) => Promise<Response> | Response
        > = {};

        const httpMethods = [
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "PATCH",
          "HEAD",
          "OPTIONS",
        ];

        for (const method of httpMethods) {
          if (typeof module[method] === "function") {
            handlers[method] = module[method];
          }
        }

        return Object.keys(handlers).length > 0 ? handlers : null;
      } else {
        const handlers: Record<
          string,
          (request: Request, context?: any) => Promise<Response> | Response
        > = {};

        const excludeNames = [
          "default",
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "PATCH",
        ];

        for (const [name, value] of Object.entries(module)) {
          if (
            !excludeNames.includes(name) &&
            typeof value === "function"
          ) {
            handlers[name] = value as (
              request: Request,
              context?: any,
            ) => Promise<Response> | Response;
          }
        }

        return Object.keys(handlers).length > 0 ? handlers : null;
      }
    } catch (error) {
      console.warn(
        `加载 API 处理函数失败: ${filePath}, ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * 导入模块
   */
  private async importModule(filePath: string): Promise<any> {
    let moduleUrl: string;
    if (filePath.startsWith("file://")) {
      moduleUrl = filePath;
    } else if (filePath.startsWith("/") || filePath.match(/^[A-Za-z]:/)) {
      moduleUrl = `file://${filePath}`;
    } else {
      moduleUrl = `file://${cwd()}/${filePath}`;
    }

    return await import(moduleUrl);
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建路由器实例
 * @param options 路由配置选项
 * @returns 路由器实例
 */
export function createRouter(options: RouterOptions): Router {
  return new Router(options);
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建重定向响应
 * @param destination 目标路径
 * @param statusCode 状态码
 * @returns 响应对象
 */
export function createRedirectResponse(
  destination: string,
  statusCode: 301 | 302 | 303 | 307 | 308 = 302,
): Response {
  return new Response(null, {
    status: statusCode,
    headers: {
      Location: destination,
    },
  });
}

/**
 * 创建 JSON 响应
 * @param data 数据
 * @param status 状态码
 * @returns 响应对象
 */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * 创建 HTML 响应
 * @param html HTML 内容
 * @param status 状态码
 * @returns 响应对象
 */
export function html(htmlContent: string, status = 200): Response {
  return new Response(htmlContent, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/**
 * 创建 404 响应
 * @param message 错误消息
 * @returns 响应对象
 */
export function notFound(message = "Not Found"): Response {
  return new Response(message, {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

// ============================================================================
// 导出类型
// ============================================================================

export type {
  MiddlewareContext as ServerMiddlewareContext,
  MiddlewareFunction as ServerMiddlewareFunction,
  RedirectConfig as ServerRedirectConfig,
  RouteMeta as ServerRouteMeta,
};
