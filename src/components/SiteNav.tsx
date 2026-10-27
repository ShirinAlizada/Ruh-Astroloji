import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { isAdminRole } from "./AdminRoute";
import { isAstrologerRole } from "./AstrologerRoute";
import { useMenu } from "../hooks/useMenu";
import { useI18n } from "../lib/i18n";
import { NotificationBell } from "./NotificationBell";
import { CartDropdown } from "./CartDropdown";
import { WishlistDropdown } from "./WishlistDropdown";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BrandMark } from "./BrandMark";
import { SearchDropdown } from "./SearchDropdown";

// destiny-reads-app-ın SiteNav.tsx + Sidebar.tsx-indən köçürülüb: yığcam yuxarı
// zolaq (loqo + hamburger + axtarış/bildiriş/giriş-çıxış) və bütün keçidlərin
// yaşadığı çəkmə (drawer) menyusu — sabit/həmişəaçıq panel yoxdur, tək giriş
// nöqtəsi hamburger düyməsidir.

// Sıra 5-ci referans şəkildəki hədəf drawer-ə uyğundur: Natal Xəritə artıq
// burada yoxdur (Profilə köçürülüb, bax ProfilPage), Əlaqə/Bildirişlər/
// Görüşlərim siyahıdan çıxarılıb (Bildirişlər artıq top-bar dropdown-dur,
// Görüşlərim Profildəki "Rezervasiyalarım" düyməsinə köçüb). Marşrut
// (`to`) dəyərləri əsasən dəyişdirilməyib — yalnız görünən etiketlər
// yeniləndi ki, mövcud keçidlər/bookmark-lar pozulmasın. İSTİSNA: loqo
// (BrandMark) linki əvvəllər "/" hələ məzmunsuz olduğu (Profilə redirect
// etdiyi) üçün birbaşa "/profil"-ə gedirdi — "/" indi öz əsas səhifəsinə
// (HomePage) malik olduğundan, loqo da digər saytlardakı adət üzrə "/"-ə
// aparır (istifadəçi hesabatı: loqoya basanda yenə Profilə atılırdı).
function usePrimaryLinks(t: (key: string) => string) {
  return [
    { to: "/burc-proqnozu", label: t("nav.horoscope") },
    { to: "/uygunluq", label: t("nav.compatibility") },
    { to: "/numerologiya", label: t("nav.numerology") },
    { to: "/gunun-beledcisi", label: t("nav.dailyGuide") },
    { to: "/astroloqlar", label: t("nav.astrologers") },
    { to: "/forum", label: t("nav.forum") },
    { to: "/qezet", label: t("nav.articles") },
    { to: "/abuneler", label: t("nav.packages") },
    { to: "/magaza", label: t("nav.shop") },
  ];
}

// DÜZƏLİŞ (2026-10-28): astroloq rolu olan istifadəçi üçün "Profil" keçidi
// "Astroloq Panelim"-ə ("/astroloq-panelim") çevrilir — App.tsx-dəki
// ProfilOrDashboard yönləndirməsi ilə eyni məntiq, naviqasiyada da əks olunsun.
function useUserLinks(t: (key: string) => string, isAstrologer: boolean) {
  return [
    { to: "/ai-sohbet", label: t("nav.aiChat") },
    { to: "/jurnal", label: t("nav.journal") },
    isAstrologer
      ? { to: "/astroloq-panelim", label: t("nav.astrologerPanel") }
      : { to: "/profil", label: t("nav.profile") },
  ];
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function SidebarLinks({ links, onNavigate }: { links: Array<{ to: string; label: string }>; onNavigate: () => void }) {
  return (
    <>
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onNavigate}
          className="rounded-xl px-3.5 py-2.5 text-sm text-mist hover:text-white hover:bg-white/5 transition"
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}

export function SiteNav() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const isAdmin = isAdminRole(user?.role);
  const isAstrologer = isAstrologerRole(user?.role);
  const navigate = useNavigate();
  const { open, visible: menuVisible, openMenu, closeMenu } = useMenu();
  const primaryLinks = usePrimaryLinks(t);
  const userLinks = useUserLinks(t, isAstrologer);

  async function signOut() {
    await logout();
    navigate("/giris");
  }

  return (
    <nav className="mx-auto max-w-7xl px-6 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t("nav.menuAria")}
            onClick={openMenu}
            className="p-2 -ml-2 text-mist hover:text-white transition"
          >
            <MenuIcon />
          </button>
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <span className="size-6 grid place-items-center rounded-full border border-gold/40 text-gold text-[11px]">
              ☾
            </span>
            <BrandMark className="font-display text-lg tracking-wide" />
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <SearchDropdown />
          {user && (
            <>
              <WishlistDropdown />
              <CartDropdown />
              <NotificationBell />
            </>
          )}
          <LanguageSwitcher />
          <span className="hidden sm:block h-4 w-px bg-white/10 mx-0.5" />
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full border border-gold/50 text-goldsoft hover:bg-gold/10 transition"
            >
              {t("nav.signOut")}
            </button>
          ) : (
            <Link
              to="/giris"
              className="whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full bg-gold text-ink font-semibold hover:bg-goldsoft transition"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className={`w-72 h-full bg-ink2 border-r border-white/10 p-5 flex flex-col gap-1 overflow-y-auto transition-all duration-200 ease-out ${
              menuVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Link to="/" onClick={closeMenu} className="flex items-center gap-1.5">
                <span className="size-6 grid place-items-center rounded-full border border-gold/40 text-gold text-[11px]">
                  ☾
                </span>
                <BrandMark className="font-display text-lg" />
              </Link>
              <button type="button" aria-label={t("nav.closeAria")} onClick={closeMenu} className="text-mist p-1">
                <CloseIcon />
              </button>
            </div>
            <div className="mb-3">
              <LanguageSwitcher variant="full" />
            </div>
            <nav className="flex flex-col gap-1">
              <SidebarLinks links={primaryLinks} onNavigate={closeMenu} />
              {user && (
                <>
                  <div className="h-px bg-white/10 my-2" />
                  <SidebarLinks links={userLinks} onNavigate={closeMenu} />
                </>
              )}
              {isAdmin && (
                <>
                  <div className="h-px bg-white/10 my-2" />
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="rounded-xl px-3.5 py-2.5 text-sm text-goldsoft hover:text-gold hover:bg-white/5 transition"
                  >
                    {t("nav.admin")}
                  </Link>
                </>
              )}
            </nav>
          </div>
          <button
            type="button"
            aria-label={t("nav.closeAria")}
            className={`flex-1 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out ${
              menuVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMenu}
          />
        </div>
      )}
    </nav>
  );
}
