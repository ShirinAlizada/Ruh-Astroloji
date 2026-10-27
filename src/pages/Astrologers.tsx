import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { astrologersApi, ApiError, type AstrologerDto } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n, pickLocalized } from "../lib/i18n";
import { translateSpecialty, translateLanguageTag } from "../lib/astrologer-tags";

// destiny-reads-app-ın routes/astroloq.tsx-indəki dizayn: 3 sütunlu kart grid-i.

const API_ORIGIN = "https://localhost:7168";

function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

export default function AstrologersPage() {
  const { t, lang } = useI18n();
  const [list, setList] = useState<AstrologerDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    astrologersApi
      .list()
      .then(setList)
      .catch((err) => setError(err instanceof ApiError ? err.message : t("astrologers.errLoad")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page>
      <PageHeader
        kicker={t("astrologers.kicker")}
        title={t("astrologers.title")}
        subtitle={t("astrologers.subtitle")}
      />

      {loading && <p className="text-mist">{t("common.loading")}</p>}

      {!loading && error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
      )}

      {!loading && list && list.length === 0 && <p className="text-mist">{t("astrologers.noneYet")}</p>}

      <div className="grid md:grid-cols-3 gap-5">
        {list?.map((a) => {
          const avatar = avatarSrc(a.avatarUrl);
          return (
            <article key={a.id} className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6 flex flex-col">
              <div className="size-14 rounded-full grid place-items-center border border-gold/40 text-gold text-xl overflow-hidden">
                {avatar ? <img src={avatar} alt={a.displayName} className="size-full object-cover" /> : a.displayName.charAt(0)}
              </div>
              <h2 className="font-display text-2xl mt-4">{a.displayName}</h2>
              {/* DÜZƏLİŞ (2026-10-27): title/bio əvvəllər HƏMİŞƏ AZ göstərilirdi — indi
                  pickLocalized ilə UI dilinə uyğun (EN/RU boş olarsa AZ-a geri qayıdır). */}
              {a.title && (
                <p className="text-gold text-xs tracking-widest uppercase mt-1">
                  {pickLocalized(lang, a.title, a.titleEn, a.titleRu)}
                </p>
              )}
              {a.bio && (
                <p className="text-sm text-mist mt-3 leading-relaxed flex-1 line-clamp-4">
                  {pickLocalized(lang, a.bio, a.bioEn, a.bioRu)}
                </p>
              )}

              {a.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {a.specialties.map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-violet/30 text-violet">
                      {translateSpecialty(s, lang)}
                    </span>
                  ))}
                </div>
              )}
              {a.languages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {a.languages.map((l) => (
                    <span key={l} className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-mist">
                      {translateLanguageTag(l, lang)}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                <span className="flex items-center gap-1 text-sm text-goldsoft">★ {a.rating.toFixed(1)}</span>
                <span className="text-sm text-white">{a.priceAzn} ₼ {t("astrologers.perSession")}</span>
              </div>
              <Link
                to={`/goruslerim?astrologerId=${a.id}`}
                className="mt-4 w-full text-center px-5 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
              >
                {t("astrologers.bookButton")}
              </Link>
            </article>
          );
        })}
      </div>
    </Page>
  );
}
