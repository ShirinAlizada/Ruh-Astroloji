import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { articlesApi, ApiError, type ArticleDto } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

const TAGS = ["", "astrologiya", "numerologiya", "tarot", "uyğunluq", "ruhaniyyat"];
const PAGE_SIZE = 10;

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export default function ArticlesPage() {
  const { t, locale, lang } = useI18n();
  // DÜZƏLİŞ (2026-10-27): əvvəllər bu etiketlər (filter düymələri) birbaşa xam
  // AZ `tg` sözünü göstərirdi (`{tg || t("articles.tagAll")}`) — UI dili EN/RU
  // olsa belə dəyişmirdi. `tg` özü backend sorğusu üçün açar olaraq AZ qalır
  // (dəyişməz), yalnız GÖSTƏRİLƏN etiket indi `TAG_LABELS` ilə tərcümə olunur —
  // `Forum.tsx`-dəki `CATEGORY_LABELS` ilə eyni naxış.
  const TAG_LABELS: Record<string, string> = {
    astrologiya: t("articles.tagAstrology"),
    numerologiya: t("articles.tagNumerology"),
    tarot: t("articles.tagTarot"),
    uyğunluq: t("articles.tagCompatibility"),
    ruhaniyyat: t("articles.tagSpirituality"),
  };
  const tagLabel = (tg: string) => TAG_LABELS[tg] ?? tg;
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh(p: number, tagParam: string, s: string) {
    setLoading(true);
    setError(null);
    articlesApi
      .list({ tag: tagParam || undefined, search: s || undefined, page: p, pageSize: PAGE_SIZE, lang })
      .then((res) => {
        setArticles(res.items);
        setTotalPages(Math.max(1, res.totalPages));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t("articles.errLoad")))
      .finally(() => setLoading(false));
  }

  const mountedRef = useRef(false);

  useEffect(() => {
    refresh(1, "", "");
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DÜZƏLİŞ (2026-10-27): dil dəyişəndə siyahı yenidən yüklənsin ki,
  // başlıq/xülasə həmin andaca yeni dildə görünsün (əks halda növbəti
  // tag/səhifə dəyişikliyinə qədər köhnə dildə qalırdı). `mountedRef` ilk
  // mount zamanı yuxarıdaki effekt ilə İKİ DƏFƏ fetch olunmasının qarşısını alır.
  useEffect(() => {
    if (!mountedRef.current) return;
    refresh(page, tag, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    refresh(1, tag, searchInput);
  }

  function changeTag(tagParam: string) {
    setTag(tagParam);
    setPage(1);
    refresh(1, tagParam, search);
  }

  function changePage(p: number) {
    setPage(p);
    refresh(p, tag, search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const [lead, ...rest] = articles;
  const popular = [...articles].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <Page>
      <PageHeader kicker={t("articles.kicker")} title={t("articles.title")} subtitle={t("articles.subtitle")} />

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {TAGS.map((tg) => (
          <button
            key={tg}
            onClick={() => changeTag(tg)}
            className={
              "text-sm px-4 py-2 rounded-full border transition " +
              (tag === tg ? "border-gold bg-gold/15 text-goldsoft" : "border-white/10 text-mist hover:border-gold/40")
            }
          >
            {tg ? tagLabel(tg) : t("articles.tagAll")}
          </button>
        ))}
        <form onSubmit={onSearchSubmit} className="ml-auto flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("articles.searchPlaceholder")}
            className="w-44 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm placeholder:text-mist/70 focus:outline-none focus:border-gold/50"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
          >
            {t("articles.search")}
          </button>
        </form>
      </div>

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-6">
          {error}
        </p>
      )}

      {loading && <p className="text-mist text-sm">{t("common.loading")}</p>}
      {!loading && articles.length === 0 && <p className="text-mist">{t("articles.empty")}</p>}

      {!loading && articles.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
          <div>
            {lead && (
              <Link
                to={`/qezet/${lead.slug}`}
                className="block rounded-3xl border border-white/8 bg-celestial-card/60 p-8 hover:border-gold/40 transition"
              >
                <span className="text-xs tracking-widest uppercase text-gold">{tagLabel(lead.tag)}</span>
                <h2 className="font-display text-3xl md:text-4xl mt-3 max-w-3xl leading-tight">{lead.title}</h2>
                {lead.excerpt && <p className="mt-4 text-mist max-w-2xl leading-relaxed">{lead.excerpt}</p>}
                <p className="mt-5 text-xs text-mist/80">
                  {lead.publishedAt ? new Date(lead.publishedAt).toLocaleDateString(locale) : ""} · {readingTime(lead.body)} {t("articles.readingTimeSuffix")} · {lead.views} {t("articles.viewsSuffix")}
                </p>
                <span className="mt-4 inline-block text-sm text-goldsoft">{t("articles.readMore")}</span>
              </Link>
            )}

            <div className="mt-6 grid md:grid-cols-2 gap-5">
              {rest.map((a) => (
                <Link
                  key={a.id}
                  to={`/qezet/${a.slug}`}
                  className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6 hover:border-gold/30 transition flex flex-col"
                >
                  <span className="text-xs tracking-widest uppercase text-gold">{tagLabel(a.tag)}</span>
                  <h3 className="font-display text-2xl mt-3 leading-tight">{a.title}</h3>
                  {a.excerpt && <p className="mt-3 text-sm text-mist leading-relaxed line-clamp-2">{a.excerpt}</p>}
                  <p className="mt-4 text-xs text-mist/80">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(locale) : ""} · {a.views} {t("articles.viewsSuffix")}
                  </p>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => changePage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-4 py-1.5 rounded-full text-sm border border-white/15 text-mist hover:border-gold/40 disabled:opacity-40 transition"
                >
                  {t("articles.prev")}
                </button>
                <span className="text-sm text-mist/70 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => changePage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-1.5 rounded-full text-sm border border-white/15 text-mist hover:border-gold/40 disabled:opacity-40 transition"
                >
                  {t("articles.next")}
                </button>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-white/8 bg-celestial-card/40 p-6 lg:sticky lg:top-24">
            <h4 className="text-xs tracking-[0.3em] uppercase text-gold">{t("articles.mostRead")}</h4>
            <ol className="mt-4 space-y-4">
              {popular.map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <span className="font-display text-xl text-gold/60">{i + 1}</span>
                  <Link to={`/qezet/${a.slug}`} className="text-sm leading-snug hover:text-goldsoft transition">
                    {a.title}
                    <span className="block text-xs text-mist/70 mt-1">{a.views} {t("articles.viewsSuffix")}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </Page>
  );
}
