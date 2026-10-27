import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { az, type Dict } from "./az";
import { en } from "./en";
import { ru } from "./ru";

// Yüngül, xüsusi i18n qatı — react-i18next əvəzinə. Üç statik lüğət
// (az.ts/en.ts/ru.ts) + localStorage-a yazılan seçim. Backend-dən gələn
// dinamik məzmun (Məqalə/Mağaza/Forum/Abunəlik) üçün `pickLocalized` istifadə
// olunur — DTO-larda artıq *En/*Ru bacı sahələri var (bax api.ts).

export type Lang = "az" | "en" | "ru";

const DICTS: Record<Lang, Dict> = { az, en, ru };
const STORAGE_KEY = "ruh_lang_v1";
export const LOCALE_MAP: Record<Lang, string> = { az: "az-AZ", en: "en-US", ru: "ru-RU" };

function resolvePath(dict: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function loadLang(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "az" || raw === "en" || raw === "ru") return raw;
  } catch {
    /* best-effort — localStorage əlçatmaz ola bilər */
  }
  return "az";
}

// `useI18n().t()`-in əsas məntiqi — React hook-undan AYRILIB, çünki `api.ts`
// kimi sadə (komponent olmayan) funksiyalarda da istifadə oluna bilsin (bax
// aşağıdakı `tStatic`). Hook versiyası (`t` aşağıda, I18nProvider daxilində)
// sadəcə bunu `lang` state-i ilə çağırır.
function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let value = resolvePath(DICTS[lang], key);
  if (typeof value !== "string") value = resolvePath(DICTS.az, key);
  if (typeof value !== "string") return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = (value as string).replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value as string;
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* best-effort */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  function t(key: string, vars?: Record<string, string | number>): string {
    return translate(lang, key, vars);
  }

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangState, t, locale: LOCALE_MAP[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// Backend DTO-larında *En/*Ru bacı sahələri olan dinamik məzmun üçün (Məqalə,
// Mağaza məhsulu, Forum mövzusu, Abunəlik planı) — cari dilə uyğun sahəni
// seçir, yoxdursa AZ-a (əsas sahəyə) geri qayıdır.
export function pickLocalized(lang: Lang, azText: string, enText?: string | null, ruText?: string | null): string {
  if (lang === "en" && enText) return enText;
  if (lang === "ru" && ruText) return ruText;
  return azText;
}

/**
 * React hook-undan KƏNAR tərcümə üçün (məs. `lib/api.ts`-dəki sadə fetch
 * köməkçiləri — bunlar component deyil, `useI18n()` çağıra bilməzlər).
 * Cari dili birbaşa localStorage-dan oxuyur. `useI18n().t()`-dən fərqli
 * olaraq dil dəyişəndə render-i YENİLƏMİR (hook deyil) — ona görə yalnız
 * React ağacından kənar, bir-dəfəlik mətnlər üçün (məs. tutulan xəta
 * mesajları) istifadə olunmalıdır, JSX-də deyil.
 */
export function tStatic(key: string, vars?: Record<string, string | number>): string {
  return translate(loadLang(), key, vars);
}
