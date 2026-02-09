/**
 * @module @dreamer/router/client/components
 *
 * 路由导航组件，提供 Link 和 NavLink 组件用于声明式导航。
 * 这些组件是框架无关的，可以在 Preact、React 或其他框架中使用。
 *
 * @example
 * ```typescript
 * import { Link, NavLink } from "@dreamer/router/client";
 *
 * // 基本链接
 * <Link to="/about">关于</Link>
 *
 * // 带预取的链接
 * <Link to="/about" prefetch>关于</Link>
 *
 * // 替换历史记录
 * <Link to="/about" replace>关于</Link>
 *
 * // 导航链接（自动添加活跃状态）
 * <NavLink to="/about" activeClass="active">关于</NavLink>
 * ```
 */

import { getGlobalRouter } from "./mod.ts";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Link 组件属性
 */
export interface LinkProps {
  /** 目标路径 */
  to: string;
  /** 是否替换历史记录 */
  replace?: boolean;
  /** 是否预取目标组件 */
  prefetch?: boolean;
  /** 导航状态数据 */
  state?: any;
  /** CSS 类名 */
  class?: string;
  /** CSS 类名（React 风格） */
  className?: string;
  /** 内联样式 */
  style?: Record<string, string | number>;
  /** 子元素 */
  children?: unknown;
  /** 点击回调 */
  onClick?: (event: Event) => void;
  /** 鼠标进入回调（用于预取） */
  onMouseEnter?: (event: Event) => void;
  /** target 属性 */
  target?: string;
  /** rel 属性 */
  rel?: string;
  /** title 属性 */
  title?: string;
  /** aria-label 属性 */
  "aria-label"?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 其他属性 */
  [key: string]: unknown;
}

/**
 * NavLink 组件属性
 */
export interface NavLinkProps extends LinkProps {
  /** 活跃状态的 CSS 类名 */
  activeClass?: string;
  /** 活跃状态的内联样式 */
  activeStyle?: Record<string, string | number>;
  /** 是否精确匹配 */
  exact?: boolean;
  /** 自定义是否活跃的判断函数 */
  isActive?: (match: boolean) => boolean;
}

/**
 * 创建链接属性的结果
 */
export interface LinkAttributes {
  /** href 属性 */
  href: string;
  /** 点击事件处理器 */
  onClick: (event: Event) => void;
  /** 鼠标进入事件处理器 */
  onMouseEnter?: (event: Event) => void;
  /** 其他属性 */
  [key: string]: unknown;
}

/**
 * 创建导航链接属性的结果
 */
export interface NavLinkAttributes extends LinkAttributes {
  /** CSS 类名 */
  class?: string;
  /** CSS 类名（React 风格） */
  className?: string;
  /** 内联样式 */
  style?: Record<string, string | number>;
  /** 是否活跃 */
  "data-active"?: boolean;
  /** aria-current 属性 */
  "aria-current"?: "page" | undefined;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 创建 Link 组件的属性
 * 这个函数返回一个对象，包含所有需要传递给 <a> 标签的属性
 *
 * @param props Link 组件属性
 * @returns 链接属性对象
 *
 * @example
 * ```typescript
 * // 在 Preact 中使用
 * function MyLink(props: LinkProps) {
 *   const attrs = createLinkProps(props);
 *   return <a {...attrs}>{props.children}</a>;
 * }
 *
 * // 在 React 中使用
 * function MyLink(props: LinkProps) {
 *   const attrs = createLinkProps(props);
 *   return <a {...attrs}>{props.children}</a>;
 * }
 * ```
 */
export function createLinkProps(props: LinkProps): LinkAttributes {
  const {
    to,
    replace = false,
    prefetch = false,
    state,
    onClick,
    onMouseEnter,
    target,
    disabled,
    // 提取不需要传递给 <a> 的属性
    children: _children,
    ...rest
  } = props;

  const router = getGlobalRouter();

  // 解析完整路径
  const href = router ? router.resolvePath(to) : to;

  // 创建点击处理器
  const handleClick = (event: Event) => {
    // 调用用户的 onClick
    if (onClick) {
      onClick(event);
    }

    // 如果禁用或已阻止默认行为，不处理
    if (disabled || event.defaultPrevented) {
      return;
    }

    // 如果有 target 属性且不是 _self，不拦截
    if (target && target !== "_self") {
      return;
    }

    // 检查修饰键
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

    // 阻止默认行为并使用路由器导航
    event.preventDefault();

    if (router) {
      router.navigate(to, { replace, state });
    }
  };

  // 创建鼠标进入处理器（用于预取）
  const handleMouseEnter = (event: Event) => {
    // 调用用户的 onMouseEnter
    if (onMouseEnter) {
      onMouseEnter(event);
    }

    // 如果启用预取，加载目标组件
    if (prefetch && router) {
      router.prefetch(to);
    }
  };

  const attrs: LinkAttributes = {
    href,
    onClick: handleClick,
    target,
    ...rest,
  };

  // 只在需要预取或有用户回调时添加 onMouseEnter
  if (prefetch || onMouseEnter) {
    attrs.onMouseEnter = handleMouseEnter;
  }

  return attrs;
}

/**
 * 创建 NavLink 组件的属性
 * 这个函数返回一个对象，包含所有需要传递给 <a> 标签的属性，
 * 并根据当前路由状态添加活跃样式
 *
 * @param props NavLink 组件属性
 * @returns 导航链接属性对象
 *
 * @example
 * ```typescript
 * // 在 Preact 中使用
 * function MyNavLink(props: NavLinkProps) {
 *   const attrs = createNavLinkProps(props);
 *   return <a {...attrs}>{props.children}</a>;
 * }
 * ```
 */
export function createNavLinkProps(props: NavLinkProps): NavLinkAttributes {
  const {
    to,
    activeClass = "active",
    activeStyle,
    exact = false,
    isActive: customIsActive,
    class: className,
    className: reactClassName,
    style,
    ...rest
  } = props;

  // 获取基础 Link 属性
  const linkAttrs = createLinkProps({
    to,
    class: className,
    className: reactClassName,
    style,
    ...rest,
  });

  const router = getGlobalRouter();

  // 检查是否活跃
  let isActiveResult = false;
  if (router) {
    isActiveResult = router.isActive(to, exact);
  }

  // 使用自定义判断函数
  if (customIsActive) {
    isActiveResult = customIsActive(isActiveResult);
  }

  // 构建类名
  const baseClass = className || reactClassName || "";
  const finalClass = isActiveResult
    ? `${baseClass} ${activeClass}`.trim()
    : baseClass;

  // 构建样式
  const finalStyle = isActiveResult && activeStyle
    ? { ...style, ...activeStyle }
    : style;

  const attrs: NavLinkAttributes = {
    ...linkAttrs,
    "data-active": isActiveResult || undefined,
    "aria-current": isActiveResult ? "page" : undefined,
  };

  // 设置类名
  if (finalClass) {
    if (reactClassName !== undefined) {
      attrs.className = finalClass;
    } else {
      attrs.class = finalClass;
    }
  }

  // 设置样式
  if (finalStyle && Object.keys(finalStyle).length > 0) {
    attrs.style = finalStyle;
  }

  return attrs;
}

/**
 * 检查路径是否匹配当前路由
 *
 * @param path 要检查的路径
 * @param exact 是否精确匹配
 * @returns 是否匹配
 */
export function isPathActive(path: string, exact = false): boolean {
  const router = getGlobalRouter();
  if (!router) {
    return false;
  }
  return router.isActive(path, exact);
}

/**
 * 导航到指定路径
 *
 * @param to 目标路径
 * @param options 导航选项
 */
export function navigate(
  to: string,
  options: { replace?: boolean; state?: any } = {},
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

// ============================================================================
// Preact/React 组件工厂
// ============================================================================

/**
 * 创建 Link 组件的工厂函数
 * 用于在特定框架中创建 Link 组件
 *
 * @param h createElement 函数（如 Preact 的 h 或 React 的 createElement）
 * @returns Link 组件
 *
 * @example
 * ```typescript
 * // Preact
 * import { h } from "preact";
 * import { createLinkComponent } from "@dreamer/router/client";
 *
 * const Link = createLinkComponent(h);
 *
 * // React
 * import { createElement } from "react";
 * import { createLinkComponent } from "@dreamer/router/client";
 *
 * const Link = createLinkComponent(createElement);
 * ```
 */
export function createLinkComponent(
  h: (type: string, props: any, ...children: any[]) => any,
): (props: LinkProps) => any {
  return function Link(props: LinkProps) {
    const attrs = createLinkProps(props);
    return h("a", attrs, props.children);
  };
}

/**
 * 创建 NavLink 组件的工厂函数
 * 用于在特定框架中创建 NavLink 组件
 *
 * @param h createElement 函数
 * @returns NavLink 组件
 */
export function createNavLinkComponent(
  h: (type: string, props: any, ...children: any[]) => any,
): (props: NavLinkProps) => any {
  return function NavLink(props: NavLinkProps) {
    const attrs = createNavLinkProps(props);
    return h("a", attrs, props.children);
  };
}

// ============================================================================
// 导出
// ============================================================================

export type {
  LinkProps as LinkComponentProps,
  NavLinkProps as NavLinkComponentProps,
};
