import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın sertler.tsx-inə uyğun — hüquqi mətn bölmələri, i18n
// ilə (köhnə tətbiqdə yalnız AZ idi, burada "hər yerə i18n" tapşırığına görə
// 3 dilə yazılıb).
const SECTION_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <Page>
      <PageHeader kicker={t("legal.terms.kicker")} title={t("legal.terms.title")} subtitle={t("legal.terms.subtitle")} />
      <p className="text-xs text-mist mb-8">{t("legal.updated")}</p>
      <div className="max-w-3xl space-y-8">
        {SECTION_KEYS.map((k) => (
          <section key={k}>
            <h2 className="font-display text-2xl mb-2 text-goldsoft">{t(`legal.terms.${k}h`)}</h2>
            <p className="text-mist leading-relaxed">{t(`legal.terms.${k}b`)}</p>
          </section>
        ))}
      </div>
    </Page>
  );
}
