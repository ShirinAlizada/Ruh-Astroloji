import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchApi, type SearchHitDto } from "../lib/api";
import { useI18n } from "../lib/i18n";

// İstifadəçinin tələbi: axtarış ikonuna basanda ayrı səhifəyə atmasın, balaca
// bir panel açılsın və yazdıqca (hər hərfdə) canlı nəticə göstərsin — Cart/
// Wishlist/Notification dropdown-ları ilə eyni naxış. `SearchHitDto.url`
// köhnə (Supabase) tətbiqin marşrutları ilə uyğundur, bu tətbiqinki ilə yox
// (bax api.ts şərhi) — ona görə nəticəyə basanda item-in öz detallı
// səhifəsinə yox, aid olduğu bölmənin ümumi səhifəsinə yönləndirilir.

const KIND_ICONS: Record<string, string> = {
  article: "📰",
  astrologer: "✦",
  product: "🛍",
  forum: "💬",
};

const KIND_HUB_ROUTE: Record<string, string> = {
  article: "/qezet",
  astrologer: "/astroloqlar",
  product: "/magaza",
  forum: "/forum",
};

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function SearchDropdown() {
  const { t } = useI18n();
  const KIND_LABELS: Record<string, string> = {
    article: t("searchDropdown.kindArticle"),
    astrologer: t("searchDropdown.kindAstrologer"),
    product: t("searchDropdown.kindProduct"),
    forum: t("searchDropdown.kindForum"),
  };
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHitDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      // panel açılan kimi fokusla
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchApi
        .search(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  function goToHub(kind: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    navigate(KIND_HUB_ROUTE[kind] ?? "/axtaris");
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label={t("searchDropdown.aria")}
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-mist hover:text-white transition"
      >
        <SearchIcon />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-white/10 bg-ink2/95 backdrop-blur shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2">
              <span className="text-mist/70 shrink-0">
                <SearchIcon />
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchDropdown.placeholder")}
                className="flex-1 min-w-0 bg-transparent text-sm placeholder:text-mist/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query.trim().length < 2 && (
              <p className="px-4 py-6 text-center text-xs text-mist">{t("searchDropdown.minChars")}</p>
            )}
            {query.trim().length >= 2 && loading && (
              <p className="px-4 py-6 text-center text-xs text-mist">{t("searchDropdown.searching")}</p>
            )}
            {query.trim().length >= 2 && !loading && results && results.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-mist">{t("common.notFound")}</p>
            )}
            {!loading &&
              results?.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToHub(r.kind)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 text-left hover:bg-white/5 transition"
                >
                  <span className="text-base shrink-0">{KIND_ICONS[r.kind] ?? "•"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{r.title}</p>
                    <p className="text-[11px] text-mist/70">{KIND_LABELS[r.kind] ?? r.kind}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
