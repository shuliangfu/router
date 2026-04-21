/**
 * 导航高亮用的路径规范化与匹配（无路由器上下文依赖，SSR / CSR 共用）。
 *
 * 与典型「顶栏链接」语义一致：`/` 仅精确匹配，其余路径前缀匹配子路由。
 *
 * @module
 */

/**
 * 将 pathname 规范为去掉末尾 `/`（根仍为 `/`），与浏览器 `location.pathname`、
 * `@dreamer/dweb` 在 `LoadContext` 上注入的 `pathname` 字段对齐。
 *
 * @param pathname - URL 的 pathname 段（可含或未含尾 `/`）
 * @returns 规范化后的 pathname
 */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * 判断「当前规范化 pathname」是否视为与链接 `href` 同属一条导航分支。
 *
 * - `href === '/'`：仅当 `currentPathname === '/'` 时为活跃（避免 `/dashboard`
 *   也高亮首页）。
 * - 其它：`currentPathname` 等于 `href`，或以其为前缀且下一字符为 `/`。
 *
 * @param href - 导航目标路径，如 `/dashboard`
 * @param currentPathname - 当前请求的规范化 pathname（建议使用 load 注入值）
 * @returns 是否视为当前导航项活跃
 */
export function isNavActive(href: string, currentPathname: string): boolean {
  const h = normalizePathname(href);
  const cur = normalizePathname(currentPathname);
  if (h === "/") return cur === "/";
  return cur === h || cur.startsWith(`${h}/`);
}
