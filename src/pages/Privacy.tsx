import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın mexfilik.tsx-inə uyğun — 3 dilə yazılıb (bax Terms.tsx).
const SECTION_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"];

export default function PrivacyPage() {
  const { t } = useI18n();
  return (
    <Page>
      <PageHeader kicker={t("legal.privacy.kicker")} title={t("legal.privacy.title")} subtitle={t("legal.privacy.subtitle")} />
      <p className="text-xs text-mist mb-8">{t("legal.updated")}</p>
      <div className="max-w-3xl space-y-8">
        {SECTION_KEYS.map((k) => (
          <section key={k}>
            <h2 className="font-display text-2xl mb-2 text-goldsoft">{t(`legal.privacy.${k}h`)}</h2>
            <p className="text-mist leading-relaxed">{t(`legal.privacy.${k}b`)}</p>
          </section>
        ))}
      </div>
    </Page>
  );
}
