/**
 * @module @dreamer/router/i18n
 *
 * Server-side i18n for @dreamer/router: error and log messages.
 * Uses $tr + module instance, no install(); locale auto-detected from env
 * (LANGUAGE/LC_ALL/LANG) when not set.
 */

import {
  createI18n,
  type I18n,
  type TranslationData,
  type TranslationParams,
} from "@dreamer/i18n";
import { getEnv } from "@dreamer/runtime-adapter";
import enUS from "./locales/en-US.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };

/** Supported locale. */
export type Locale = "en-US" | "zh-CN";

/** Default locale when detection fails. */
export const DEFAULT_LOCALE: Locale = "en-US";

const ROUTER_LOCALES: Locale[] = ["en-US", "zh-CN"];

const LOCALE_DATA: Record<string, TranslationData> = {
  "en-US": enUS as TranslationData,
  "zh-CN": zhCN as TranslationData,
};

/** Module-scoped i18n instance for router; not installed globally. */
let routerI18n: I18n | null = null;

/**
 * Detect locale (server-side): LANGUAGE > LC_ALL > LANG.
 */
export function detectLocale(): Locale {
  const langEnv = getEnv("LANGUAGE") || getEnv("LC_ALL") || getEnv("LANG");
  if (!langEnv) return "en-US";
  const first = langEnv.split(/[:\s]/)[0]?.trim();
  if (!first) return "en-US";
  const match = first.match(/^([a-z]{2})[-_]([A-Z]{2})/i);
  if (match) {
    const normalized = `${match[1].toLowerCase()}-${
      match[2].toUpperCase()
    }` as Locale;
    if (ROUTER_LOCALES.includes(normalized)) return normalized;
  }
  const primary = first.substring(0, 2).toLowerCase();
  if (primary === "zh") return "zh-CN";
  if (primary === "en") return "en-US";
  return "en-US";
}

/** 内部初始化，导入 i18n 时自动执行，不导出 */
function initRouterI18n(): void {
  if (routerI18n) return;
  const i18n = createI18n({
    defaultLocale: DEFAULT_LOCALE,
    fallbackBehavior: "default",
    locales: [...ROUTER_LOCALES],
    translations: LOCALE_DATA as Record<string, TranslationData>,
  });
  i18n.setLocale(detectLocale());
  routerI18n = i18n;
}

initRouterI18n();

/**
 * Translate by key (server-side). Uses module instance; when lang is not passed, uses current locale.
 * When init not called, returns key.
 */
export function $tr(
  key: string,
  params?: Record<string, string | number>,
  lang?: Locale,
): string {
  if (!routerI18n) initRouterI18n();
  if (!routerI18n) return key;
  if (lang !== undefined) {
    const prev = routerI18n.getLocale();
    routerI18n.setLocale(lang);
    try {
      return routerI18n.t(key, params as TranslationParams);
    } finally {
      routerI18n.setLocale(prev);
    }
  }
  return routerI18n.t(key, params as TranslationParams);
}
