/**
 * @module @dreamer/router
 *
 * 文件路由系统，提供统一的文件路由接口，支持服务端路由匹配（SSR）和 API 路由。
 *
 * 功能特性：
 * - 文件路由系统：基于文件系统自动生成路由，文件结构即路由结构
 * - 路由类型支持：静态路由、动态路由、通配符路由、可选参数路由
 * - API 路由支持：RESTful 形式（HTTP 方法）和操作方法形式（函数名）
 * - 特殊文件处理：_app.tsx、_layout.tsx、_404.tsx、_error.tsx、_middleware.ts
 * - 服务端路由匹配：路由参数解析、查询参数解析、SSR 支持
 *
 * @example
 * ```typescript
 * import { createRouter } from "jsr:@dreamer/router";
 *
 * const router = createRouter({
 *   routesDir: "./src/routes",
 *   framework: "preact",
 *   ssr: true,
 *   apiMode: "restful",
 * });
 *
 * await router.scan();
 * const match = router.match("/user/123");
 * ```
 */

/**
 * 路由配置选项
 */
export interface RouterOptions {
  /** 路由文件目录 */
  routesDir: string;
  /** 框架类型（preact 或 react，默认：preact） */
  framework?: "preact" | "react";
  /** 是否启用 SSR（默认：true） */
  ssr?: boolean;
  /** API 路由形式（restful 或 action，默认：restful） */
  apiMode?: "restful" | "action";
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
  /** 是否为 API 路由 */
  isApi: boolean;
  /** API 处理函数（如果是 API 路由） */
  handlers?: Record<
    string,
    (request: Request, context?: any) => Promise<Response> | Response
  >;
}

/**
 * 文件路由路由器类
 * 提供文件路由扫描、匹配等功能
 */
export class Router {
  private routes: Route[] = [];
  private options: Required<RouterOptions>;
  private specialFiles: Map<string, string> = new Map();

  /**
   * 创建路由器实例
   * @param options 路由配置选项
   */
  constructor(options: RouterOptions) {
    this.options = {
      framework: options.framework || "preact",
      ssr: options.ssr !== false,
      apiMode: options.apiMode || "restful",
      routesDir: options.routesDir,
    };
  }

  /**
   * 扫描路由文件
   * 使用 Deno 文件系统 API 扫描 routesDir 目录，生成路由配置
   */
  async scan(): Promise<void> {
    this.routes = [];
    this.specialFiles.clear();

    try {
      await this.scanDirectory(this.options.routesDir, "");
    } catch (error) {
      throw new Error(
        `扫描路由文件失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // 验证 _app.tsx 是否存在
    if (!this.specialFiles.has("_app")) {
      throw new Error(
        `缺少必需的特殊文件: _app.tsx（必须在 ${this.options.routesDir} 目录下）`,
      );
    }
  }

  /**
   * 递归扫描目录
   * @param dirPath 目录路径
   * @param relativePath 相对路径（用于构建路由路径）
   */
  private async scanDirectory(
    dirPath: string,
    relativePath: string,
  ): Promise<void> {
    try {
      const entries = await Array.fromAsync(Deno.readDir(dirPath));

      for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`;
        const stat = await Deno.stat(fullPath);

        if (stat.isDirectory) {
          // 递归扫描子目录
          await this.scanDirectory(
            fullPath,
            relativePath ? `${relativePath}/${entry.name}` : entry.name,
          );
        } else if (stat.isFile) {
          // 处理文件
          this.processFile(fullPath, relativePath, entry.name);
        }
      }
    } catch (error) {
      // 目录不存在时忽略错误（允许空目录）
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  /**
   * 处理路由文件
   * @param fullPath 完整文件路径
   * @param relativePath 相对路径
   * @param fileName 文件名
   */
  private processFile(
    fullPath: string,
    relativePath: string,
    fileName: string,
  ): void {
    // 检查是否为特殊文件
    if (fileName.startsWith("_")) {
      const specialType = this.getSpecialFileType(fileName);
      if (specialType) {
        this.specialFiles.set(specialType, fullPath);
      }
      return; // 特殊文件不生成路由
    }

    // 检查是否为路由文件（.tsx 或 .ts）
    const isRouteFile = fileName.endsWith(".tsx") || fileName.endsWith(".ts");
    if (!isRouteFile) {
      return;
    }

    // 判断是否为 API 路由
    const isApi = relativePath.startsWith("api/") ||
      relativePath.split("/").includes("api");

    // 解析路由路径和类型
    const routeInfo = this.parseRoutePath(relativePath, fileName, isApi);

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
   * @param fileName 文件名
   * @returns 特殊文件类型或 undefined
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
   * 解析路由路径
   * @param relativePath 相对路径
   * @param fileName 文件名
   * @param _isApi 是否为 API 路由
   * @returns 路由信息
   */
  private parseRoutePath(
    relativePath: string,
    fileName: string,
    _isApi: boolean,
  ): { path: string; file: string; type: RouteType } {
    // 移除文件扩展名
    const nameWithoutExt = fileName.replace(/\.(tsx|ts)$/, "");

    // 处理 index 文件
    if (nameWithoutExt === "index") {
      const path = relativePath
        ? `/${relativePath.replace(/\/index$/, "")}`
        : "/";
      return {
        path: path || "/",
        file: relativePath ? `${relativePath}/${fileName}` : fileName,
        type: "static",
      };
    }

    // 构建文件路径（用于路由匹配）
    const filePath = relativePath ? `${relativePath}/${fileName}` : fileName;

    // 解析路由路径
    let routePath = relativePath ? `/${relativePath}` : "";
    routePath = `${routePath}/${nameWithoutExt}`;

    // 检测路由类型
    let routeType: RouteType = "static";

    // 动态路由：[id]
    if (nameWithoutExt.startsWith("[") && nameWithoutExt.endsWith("]")) {
      const paramName = nameWithoutExt.slice(1, -1);
      if (paramName.startsWith("...")) {
        // 通配符路由：[...slug]
        routeType = "wildcard";
        routePath = routePath.replace(
          `/${nameWithoutExt}`,
          "/*",
        );
      } else if (
        nameWithoutExt.startsWith("[[") && nameWithoutExt.endsWith("]]")
      ) {
        // 可选参数路由：[[slug]]
        routeType = "optional";
        const paramName = nameWithoutExt.slice(2, -2);
        routePath = routePath.replace(
          `/${nameWithoutExt}`,
          `/:${paramName}?`,
        );
      } else {
        // 动态路由：[id]
        routeType = "dynamic";
        routePath = routePath.replace(
          `/${nameWithoutExt}`,
          `/:${paramName}`,
        );
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
   * 匹配路由
   * @param pathname 路径（如 /user/123）
   * @param options 匹配选项
   * @returns 路由匹配结果或 null
   */
  async match(
    pathname: string,
    options?: { method?: string },
  ): Promise<RouteMatch | null> {
    // 解析查询参数
    const url = new URL(pathname, "http://localhost");
    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    const cleanPath = url.pathname;

    // 先尝试匹配 API 路由
    if (options?.method || cleanPath.startsWith("/api/")) {
      const apiMatch = await this.matchApiRoute(cleanPath, options?.method);
      if (apiMatch) {
        return {
          ...apiMatch,
          query,
        };
      }
    }

    // 匹配普通路由
    for (const route of this.routes) {
      if (route.isApi) continue;

      const match = this.matchRoute(route, cleanPath);
      if (match) {
        return {
          route,
          params: match.params,
          query,
          isApi: false,
        };
      }
    }

    return null;
  }

  /**
   * 匹配 API 路由
   * @param pathname 路径
   * @param method HTTP 方法
   * @returns 路由匹配结果或 null
   */
  private async matchApiRoute(
    pathname: string,
    method?: string,
  ): Promise<RouteMatch | null> {
    for (const route of this.routes) {
      if (!route.isApi) continue;

      const match = this.matchRoute(route, pathname);
      if (match) {
        // 加载 API 处理函数
        const handlers = await this.loadApiHandlers(route.fullPath);
        if (!handlers) continue;

        // 如果是 RESTful 模式，检查 HTTP 方法
        if (this.options.apiMode === "restful") {
          if (method && handlers[method.toUpperCase()]) {
            return {
              route,
              params: match.params,
              query: {},
              isApi: true,
              handlers: {
                [method.toUpperCase()]: handlers[method.toUpperCase()],
              },
            };
          }
        } else {
          // 操作方法模式：所有方法都返回所有处理函数
          return {
            route,
            params: match.params,
            query: {},
            isApi: true,
            handlers,
          };
        }
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
    route: Route,
    pathname: string,
  ): { params: Record<string, string> } | null {
    const routePath = route.path;
    const params: Record<string, string> = {};

    // 静态路由
    if (route.type === "static") {
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
   * 加载 API 处理函数
   * @param filePath 文件路径
   * @returns 处理函数映射或 null
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
      // 动态导入模块
      // 注意：filePath 需要转换为 file:// URL 格式
      const moduleUrl = filePath.startsWith("file://")
        ? filePath
        : `file://${Deno.cwd()}/${filePath}`;

      const module = await import(moduleUrl);

      // 根据 apiMode 提取处理函数
      if (this.options.apiMode === "restful") {
        // RESTful 模式：提取 HTTP 方法函数（GET、POST、PUT、DELETE、PATCH 等）
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
        // 操作方法模式：提取所有导出的函数（排除默认导出和特殊函数）
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
      // 模块加载失败时返回 null
      console.warn(
        `加载 API 处理函数失败: ${filePath}, ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * 获取所有路由
   * @returns 路由列表
   */
  getRoutes(): Route[] {
    return [...this.routes];
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
}

/**
 * 创建路由器实例
 * @param options 路由配置选项
 * @returns 路由器实例
 */
export function createRouter(options: RouterOptions): Router {
  return new Router(options);
}
