import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { articlesApi, ApiError, type ArticleDto } from "../lib/api";
import { Page } from "../components/Page";
import { ShareButtons } from "../components/ShareButtons";
import { useI18n } from "../lib/i18n";

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export default function ArticleDetailPage() {
  const { t, locale, lang } = useI18n();
  // `Articles.tsx`-dəki `TAG_LABELS`/`tagLabel` ilə eyni naxış — DÜZƏLİŞ
  // (2026-10-27): əvvəllər `article.tag` xam AZ dəyər kimi göstərilirdi.
  const TAG_LABELS: Record<string, string> = {
    astrologiya: t("articles.tagAstrology"),
    numerologiya: t("articles.tagNumerology"),
    tarot: t("articles.tagTarot"),
    uyğunluq: t("articles.tagCompatibility"),
    ruhaniyyat: t("articles.tagSpirituality"),
  };
  const tagLabel = (tg: string) => TAG_LABELS[tg] ?? tg;
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [progress, setProgress] = useState(0);

  // Baxış sayğacının yalnız hər slug üçün BİR DƏFƏ artırılmasını təmin edir —
  // aşağıdaki effekt indi `lang` dəyişəndə də (tərcümə üçün) yenidən fetch
  // edir, amma bu, baxış sayını TƏKRAR artırmamalıdır.
  const viewCountedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    articlesApi
      .bySlug(slug, lang)
      .then((a) => {
        setArticle(a);
        if (viewCountedRef.current !== slug) {
          viewCountedRef.current = slug;
          // Baxış sayğacı — best-effort, nəticəsini gözləmədən.
          articlesApi.incrementView(slug).catch(() => {});
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err instanceof ApiError ? err.message : t("articleDetail.errLoad"));
      })
      .finally(() => setLoading(false));
    // DÜZƏLİŞ (2026-10-27): `lang` əlavə olundu — əvvəllər dil dəyişəndə
    // məqalə mətni yenidən yüklənmirdi, HƏMİŞƏ AZ qalırdı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, lang]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <Page>
        <p className="text-mist py-16">{t("common.loading")}</p>
      </Page>
    );
  }

  if (notFound || error) {
    return (
      <Page>
        <div className="py-20">
          {notFound ? (
            <h1 className="font-display text-4xl">{t("articleDetail.notFound")}</h1>
          ) : (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 inline-block">
              {error}
            </p>
          )}
          <Link to="/qezet" className="mt-4 block text-goldsoft hover:text-gold transition">
            {t("articleDetail.backLink")}
          </Link>
        </div>
      </Page>
    );
  }

  if (!article) return null;

  const paragraphs = article.body.split(/\n{2,}/);

  return (
    <Page>
      <div className="fixed left-0 top-0 h-[3px] bg-gold z-50 transition-[width]" style={{ width: `${progress}%` }} />
      <article className="py-6 max-w-3xl">
        <Link to="/qezet" className="text-sm text-mist hover:text-goldsoft transition">
          {t("articleDetail.backLink")}
        </Link>
        <p className="mt-6 text-gold text-xs tracking-[0.35em] uppercase">{tagLabel(article.tag)}</p>
        <h1 className="font-display text-4xl md:text-5xl mt-3 leading-tight">{article.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-mist">
          {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString(locale)}</span>}
          <span>·</span>
          <span>{readingTime(article.body)} {t("articleDetail.readingTimeSuffix")}</span>
          <span>·</span>
          <span>{article.views} {t("articleDetail.viewsSuffix")}</span>
        </div>

        {article.excerpt && <p className="mt-6 text-lg text-mist leading-relaxed">{article.excerpt}</p>}

        <div className="mt-8 space-y-4 text-[17px] leading-relaxed text-white/90">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <ShareButtons title={article.title} />
        </div>
      </article>
    </Page>
  );
}
