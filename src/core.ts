/**
 * 路由路径匹配核心（服务端 Router 与客户端 ClientRouter 共用），
 * 避免两套逻辑漂移；支持 scan/构造阶段预计算分段，减少请求热路径上的 split/正则。
 *
 * @module
 */

/**
 * 与 Route.type / ClientRoute.type 对齐；undefined 表示客户端「缺省即 static」
 */
export type MatchRouteType =
  | "static"
  | "dynamic"
  | "wildcard"
  | "optional"
  | undefined;

/**
 * 预计算数据：供 matchRoutePattern 复用
 */
export interface RouteMatchPrep {
  /** route.path 按 `/` 切分且去空 */
  routeParts: string[];
  /** wildcard：去掉末尾 `/*` 后的前缀 */
  wildcardPrefix?: string;
  /** optional：去掉末尾 `/:param?` 的基路径 */
  optionalBasePath?: string;
}

/**
 * 在注册路由时构建匹配预计算数据；静态路由无需缓存，返回 null。
 *
 * @param routePath 模式路径（如 `/user/:id`）
 * @param routeType 路由类型
 * @returns 预计算对象，静态为 null
 */
export function buildRouteMatchPrep(
  routePath: string,
  routeType: MatchRouteType,
): RouteMatchPrep | null {
  if (routeType === "static" || routeType === undefined) {
    return null;
  }

  const routeParts = routePath.split("/").filter(Boolean);

  if (routeType === "wildcard") {
    return {
      routeParts,
      wildcardPrefix: routePath.replace("/*", ""),
    };
  }

  if (routeType === "optional") {
    return {
      routeParts,
      optionalBasePath: routePath.replace(/\/:[^?]+(\?)?$/, ""),
    };
  }

  return { routeParts };
}

/**
 * 将 pathname 与路由模式匹配；成功返回路径参数对象（可为空对象），失败返回 null。
 *
 * @param routePath 路由模式路径
 * @param pathname 实际路径（无 query）
 * @param routeType 类型；undefined 按 static 处理（与客户端一致）
 * @param prep buildRouteMatchPrep 的结果，静态传 null
 */
export function matchRoutePattern(
  routePath: string,
  pathname: string,
  routeType: MatchRouteType,
  prep: RouteMatchPrep | null,
): Record<string, string> | null {
  const params: Record<string, string> = {};
  const effectiveType = routeType === undefined ? "static" : routeType;

  if (effectiveType === "static") {
    return routePath === pathname ? params : null;
  }

  const routeParts = prep?.routeParts ?? routePath.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (effectiveType === "wildcard") {
    const prefix = prep?.wildcardPrefix ?? routePath.replace("/*", "");
    if (pathname.startsWith(prefix)) {
      params["*"] = pathname.slice(prefix.length);
      return params;
    }
    return null;
  }

  if (effectiveType === "optional") {
    const basePath = prep?.optionalBasePath ??
      routePath.replace(/\/:[^?]+(\?)?$/, "");
    if (pathname === basePath) {
      return params;
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

  return params;
}

// ============================================================================
// scan() 后路由排序：更具体（静态字面量优先）的路由排在前面，避免依赖文件系统遍历顺序
// ============================================================================

/**
 * 用于特异性排序的最小路由形状（服务端 Route 在 scan 后满足此结构）
 */
export interface RouteLikeForSort {
  path: string;
  type: "static" | "dynamic" | "wildcard" | "optional";
  isApi: boolean;
}

/**
 * 单段路径的「具体程度」：字面量 > 可选参数 > 必填动态 > 通配 `*`
 * 数值越大越优先匹配（与 scan 排序「高特异性在前」一致）
 */
function segmentSpecificityRank(segment: string): number {
  if (segment === "*") return 0;
  if (segment.startsWith(":") && segment.endsWith("?")) return 2;
  if (segment.startsWith(":")) return 1;
  return 3;
}

/**
 * 路由类型在排序中的优先级：静态 > 动态(必填段) > 可选 > 通配
 */
function routeTypePriority(
  t: "static" | "dynamic" | "wildcard" | "optional",
): number {
  switch (t) {
    case "static":
      return 5;
    case "dynamic":
      return 4;
    case "optional":
      return 3;
    case "wildcard":
      return 1;
    default:
      return 0;
  }
}

/**
 * 构建用于字典序比较的特异性元组：首位为类型优先级，随后为各段 rank；越长且前缀相同则更长者更具体。
 *
 * @param path 路由模式 path（如 `/blog/:id`）
 * @param type 路由类型
 */
export function buildRouteSpecificityTuple(
  path: string,
  type: "static" | "dynamic" | "wildcard" | "optional",
): number[] {
  const segs = path.split("/").filter(Boolean);
  const ranks = [routeTypePriority(type)];
  for (const s of segs) {
    ranks.push(segmentSpecificityRank(s));
  }
  return ranks;
}

/**
 * 比较两个特异性元组：a 应排在 b 前（a 更具体）时返回负数。
 *
 * @param a 路由 a 的元组
 * @param b 路由 b 的元组
 */
export function compareSpecificityTuples(a: number[], b: number[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const va = i < a.length ? a[i]! : -1;
    const vb = i < b.length ? b[i]! : -1;
    if (va !== vb) return vb - va;
  }
  return 0;
}

/**
 * `scan()` 结束后对路由表排序用的比较函数：页面路由块在前、API 块在后（与分别遍历习惯一致）；
 * 同块内按路径特异性降序，路径字符串作稳定兜底。
 *
 * @returns 传给 `Array.prototype.sort` 的比较值
 */
export function compareRoutesForScanOrder(
  a: RouteLikeForSort,
  b: RouteLikeForSort,
): number {
  if (a.isApi !== b.isApi) {
    return a.isApi ? 1 : -1;
  }
  const ta = buildRouteSpecificityTuple(a.path, a.type);
  const tb = buildRouteSpecificityTuple(b.path, b.type);
  const cmp = compareSpecificityTuples(ta, tb);
  if (cmp !== 0) return cmp;
  return a.path.localeCompare(b.path);
}
