import { useState, type FormEvent } from "react";
import { searchApi, ApiError, type SearchHitDto } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

const KIND_ICONS: Record<string, string> = {
  article: "📰",
  astrologer: "✦",
  product: "🛍",
  forum: "💬",
};

export default function SearchPage() {
  const { t } = useI18n();
  const KIND_LABELS: Record<string, string> = {
    article: t("search.kindArticle"),
    astrologer: t("search.kindAstrologer"),
    product: t("search.kindProduct"),
    forum: t("search.kindForum"),
  };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHitDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError(t("search.errTooShort"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await searchApi.search(q);
      setResults(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("search.errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader kicker={t("search.kicker")} title={t("search.title")} subtitle={t("search.subtitle")} />

      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 mb-6">
        <div className="flex gap-3">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm placeholder:text-mist/70 focus:outline-none focus:border-gold/50"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
          >
            {loading ? "…" : t("search.submit")}
          </button>
        </div>
      </form>

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-6">
          {error}
        </p>
      )}

      {results && results.length === 0 && !error && (
        <p className="text-center text-mist text-sm">{t("common.notFound")}</p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-2.5">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3.5"
            >
              <span className="text-lg shrink-0">{KIND_ICONS[r.kind] ?? "•"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F3EFE6] truncate">{r.title}</p>
                <p className="text-[11px] text-mist/70">{KIND_LABELS[r.kind] ?? r.kind}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
