import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SiteNav } from "./SiteNav";
import { useMenu } from "../hooks/useMenu";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın Page.tsx-indən köçürülüb. Sabit sol panel yoxdur —
// naviqasiya yalnız SiteNav-ın menyu düyməsi ilə açılır. Menyu açıq olanda
// əsas məzmun sola sürüşüb solğunlaşır, bağlananda geri qayıdır (useMenu).
export function Page({ children }: { children: ReactNode }) {
  const { open: menuOpen } = useMenu();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const contentClass = `mx-auto max-w-7xl px-6 transition-all duration-200 ease-out ${
    menuOpen ? "-translate-x-8 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
  }`;
  return (
    <div className="min-h-screen bg-ink text-[#F3EFE6] font-sans antialiased overflow-x-hidden relative">
      <SiteNav />
      <div className={contentClass}>
        {/* pathname açarı hər naviqasiyada yeni DOM node yaradır, bu da
            page-enter animasiyasını hər səhifə keçidində təzədən işə salır. */}
        <main key={pathname} className="min-w-0 pb-20 animate-page-enter">
          {children}
        </main>
      </div>
      <footer
        className={`border-t border-white/5 mt-10 transition-all duration-200 ease-out ${
          menuOpen ? "-translate-x-8 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-mist flex flex-col sm:flex-row gap-3 sm:gap-6 justify-between items-start sm:items-center">
          <span>© {new Date().getFullYear()} Virgo Astrology</span>
          <span className="sm:flex-1 sm:text-center">{t("footer.tagline")}</span>
          <span className="flex gap-4 shrink-0">
            <Link to="/sertler" className="hover:text-goldsoft transition">{t("legal.footerTerms")}</Link>
            <Link to="/mexfilik" className="hover:text-goldsoft transition">{t("legal.footerPrivacy")}</Link>
            <Link to="/elaqe" className="hover:text-goldsoft transition">{t("footer.contact")}</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="pt-2 pb-8">
      <p className="text-gold text-xs tracking-[0.35em] uppercase mb-3">{kicker}</p>
      <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-3 text-mist max-w-2xl leading-relaxed">{subtitle}</p>}
    </header>
  );
}
