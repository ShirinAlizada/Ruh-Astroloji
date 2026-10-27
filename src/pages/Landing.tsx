import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { articlesApi, ApiError, type ArticleDto } from "../lib/api";
import { BrandMark } from "../components/BrandMark";
import { useI18n } from "../lib/i18n";

function useModules(t: (key: string) => string) {
  return [
    { titleKey: "moduleNatalTitle", textKey: "moduleNatalText", to: "/profil" },
    { titleKey: "moduleHoroscopeTitle", textKey: "moduleHoroscopeText", to: "/burc-proqnozu" },
    { titleKey: "moduleSynastryTitle", textKey: "moduleSynastryText", to: "/uygunluq" },
    { titleKey: "moduleAstrologersTitle", textKey: "moduleAstrologersText", to: "/astroloqlar" },
    { titleKey: "moduleNumerologyTitle", textKey: "moduleNumerologyText", to: "/numerologiya" },
    { titleKey: "moduleJournalTitle", textKey: "moduleJournalText", to: "/jurnal" },
  ].map((m) => ({ title: t(`landing.${m.titleKey}`), text: t(`landing.${m.textKey}`), to: m.to }));
}

function ArticleCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-celestial-card/40 p-6">
      <div className="h-3 w-16 rounded-full bg-white/10 mb-4" />
      <div className="h-5 w-4/5 rounded bg-white/10 mb-2" />
      <div className="h-3 w-full rounded bg-white/5" />
    </div>
  );
}

export default function LandingPage() {
  const { t } = useI18n();
  const MODULES = useModules(t);
  const [articles, setArticles] = useState<ArticleDto[] | null>(null);

  useEffect(() => {
    articlesApi
      .list({ pageSize: 3 })
      .then((r) => setArticles(r.items))
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
        setArticles([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-ink text-[#F3EFE6] relative z-10">
      {/* Nav */}
      <header className="px-6 pt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-9 grid place-items-center rounded-full border border-gold/40 text-gold">
              ☾
            </span>
            <BrandMark className="font-display text-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/giris"
              className="px-4 py-2 rounded-full text-sm text-mist hover:text-[#F3EFE6] transition"
            >
              {t("landing.login")}
            </Link>
            <Link
              to="/giris"
              className="px-4 py-2 rounded-full bg-gold text-ink text-sm font-semibold hover:bg-goldsoft transition"
            >
              {t("landing.signup")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-[clamp(2rem,5vw,3.2rem)] leading-[1.15] font-semibold text-balance">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-6 text-mist text-lg max-w-xl leading-relaxed">{t("landing.heroBody")}</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/giris"
              className="px-7 py-3.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
            >
              {t("landing.ctaStart")}
            </Link>
            <Link
              to="/giris"
              className="px-7 py-3.5 rounded-full border border-white/15 text-sm text-mist hover:border-gold/40 hover:text-gold transition"
            >
              {t("landing.ctaHaveAccount")}
            </Link>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl mb-8">{t("landing.modulesTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((m) => (
              <Link
                key={m.title}
                to={m.to}
                className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 hover:border-gold/30 transition block"
              >
                <h3 className="font-display text-lg mb-2">{m.title}</h3>
                <p className="text-sm text-mist leading-relaxed">{m.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Real astronomy callout */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto rounded-3xl border border-gold/20 bg-gold/[0.04] p-9 sm:p-11 grid sm:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <h2 className="font-display text-2xl mb-3">{t("landing.calcTitle")}</h2>
            <p className="text-mist leading-relaxed">{t("landing.calcBody")}</p>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            {[t("landing.calcSun"), t("landing.calcMoon"), t("landing.calcAscendant")].map((label) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center min-w-[90px]"
              >
                <p className="text-[10px] text-mist/70 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-gold">{t("landing.calcComputing")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest articles */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl">{t("landing.articlesTitle")}</h2>
            <Link to="/qezet" className="text-sm text-gold hover:text-goldsoft transition">
              {t("landing.articlesViewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {articles === null &&
              Array.from({ length: 3 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
            {articles?.length === 0 && (
              <p className="text-sm text-mist/70 sm:col-span-3">{t("landing.articlesEmpty")}</p>
            )}
            {articles?.map((a) => (
              <Link
                key={a.id}
                to={`/qezet/${a.slug}`}
                className="rounded-3xl border border-white/10 bg-celestial-card/40 p-6 hover:border-gold/30 transition block"
              >
                <p className="text-[11px] text-mist/70 uppercase tracking-wide mb-3">{a.tag}</p>
                <h3 className="font-display text-base mb-2 leading-snug">{a.title}</h3>
                {a.excerpt && (
                  <p className="text-sm text-mist leading-relaxed line-clamp-2">{a.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl mb-4">{t("landing.finalTitle")}</h2>
          <Link
            to="/giris"
            className="inline-block px-8 py-3.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
          >
            {t("landing.ctaStart")}
          </Link>
        </div>
      </section>

      <footer className="px-6 py-10 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-mist/70">
          <span>☾ Virgo Astrology</span>
          <div className="flex gap-5">
            <Link to="/qezet" className="hover:text-mist transition">
              {t("landing.footerArticles")}
            </Link>
            <Link to="/magaza" className="hover:text-mist transition">
              {t("landing.footerShop")}
            </Link>
            <Link to="/elaqe" className="hover:text-mist transition">
              {t("landing.footerContact")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
