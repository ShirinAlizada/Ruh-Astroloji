import { useEffect, useRef, useState } from "react";
import { useI18n, type Lang } from "../lib/i18n";

// Əvvəllər yalnız vizual idi (AZ aktiv, EN/RU "tezliklə" deaktiv) — indi
// `useI18n()` vasitəsilə əsl dil seçimini idarə edir (bax src/lib/i18n/).

const LANGUAGES: Array<{ code: Lang; short: string }> = [
  { code: "az", short: "AZ" },
  { code: "en", short: "EN" },
  { code: "ru", short: "RU" },
];

export function LanguageSwitcher({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (variant === "full") {
    return (
      <div className="flex items-center gap-1.5">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            title={t(`languageSwitcher.${l.code}`)}
            onClick={() => setLang(l.code)}
            className={
              "px-2.5 py-1 rounded-full text-xs border transition " +
              (l.code === lang ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-mist hover:border-white/25")
            }
          >
            {l.short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("languageSwitcher.aria")}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-white/10 bg-ink2/60 px-2 py-1 text-[11px] text-mist hover:text-white transition"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20Z" />
        </svg>
        {lang.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-ink2/95 backdrop-blur p-1.5 shadow-xl z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={
                "w-full text-left rounded-xl px-3 py-2 text-sm transition " +
                (l.code === lang ? "text-gold bg-white/5" : "text-mist hover:text-white hover:bg-white/5")
              }
            >
              {t(`languageSwitcher.${l.code}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
