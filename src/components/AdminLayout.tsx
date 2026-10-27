import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { isSuperAdminRole } from "./AdminRoute";

export function Icon({ d, children }: { d?: string; children?: ReactNode }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export const ICONS: Record<string, ReactNode> = {
  overview: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  users: (
    <Icon>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20v-.8a6 6 0 0 1 6-6h1a6 6 0 0 1 6 6v.8" />
      <circle cx="17.5" cy="8.5" r="2.3" />
      <path d="M20.2 20v-.6a4.3 4.3 0 0 0-2.7-4" />
    </Icon>
  ),
  mail: (
    <Icon>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 7 8 6a2 2 0 0 0 2 0l8-6" />
    </Icon>
  ),
  article: (
    <Icon>
      <path d="M14 2.5H7a1.8 1.8 0 0 0-1.8 1.8v15.4A1.8 1.8 0 0 0 7 21.5h10a1.8 1.8 0 0 0 1.8-1.8V8z" />
      <path d="M14 2.5V8h4.8" />
      <path d="M8.5 13h7M8.5 16.5h7" />
    </Icon>
  ),
  star: (
    <Icon d="M12 3.3l2.5 5.4 6 .6-4.5 4 1.4 5.9-5.4-3.3-5.4 3.3 1.4-5.9-4.5-4 6-.6z" />
  ),
  moon: <Icon d="M20.5 13.4A8.5 8.5 0 1 1 10.6 3.5a6.6 6.6 0 0 0 9.9 9.9z" />,
  forum: <Icon d="M20.5 14.5a2 2 0 0 1-2 2H8l-4 4V5.5a2 2 0 0 1 2-2h12.5a2 2 0 0 1 2 2z" />,
  shop: (
    <Icon>
      <path d="M6.5 2.5 3.5 7v12.5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7l-3-4.5z" />
      <path d="M3.5 7h17" />
      <path d="M15.5 11a3.5 3.5 0 0 1-7 0" />
    </Icon>
  ),
  card: (
    <Icon>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
    </Icon>
  ),
  calendar: (
    <Icon>
      <rect x="2.5" y="4.5" width="19" height="17" rx="2" />
      <path d="M2.5 9.5h19M8 2.5v4M16 2.5v4" />
    </Icon>
  ),
  package: (
    <Icon>
      <path d="M12 2.5 3 7v10l9 4.5 9-4.5V7z" />
      <path d="M3 7l9 4.5M21 7l-9 4.5v8.5M3 7l9-4.5" />
    </Icon>
  ),
  coin: (
    <Icon>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v10M9 9.3c0-1.3 1.3-2.3 3-2.3s3 1 3 2.3-1.3 2-3 2-3 .9-3 2.2 1.3 2.3 3 2.3 3-1 3-2.3" />
    </Icon>
  ),
};

interface NavLink {
  to: string;
  label: string;
  icon: keyof typeof ICONS;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: "Ümumi", links: [{ to: "/admin", label: "Ümumi baxış", icon: "overview" }] },
  {
    label: "Məzmun",
    links: [
      { to: "/admin/articles", label: "Məqalələr", icon: "article" },
      { to: "/admin/astrologers", label: "Astroloqlar", icon: "star" },
      { to: "/admin/bookings", label: "Rezervasiyalar", icon: "calendar" },
      { to: "/admin/horoscopes", label: "Horoskoplar", icon: "moon" },
      { to: "/admin/forum", label: "Forum moderasiyası", icon: "forum" },
    ],
  },
  {
    label: "Ticarət",
    links: [
      { to: "/admin/shop", label: "Mağaza", icon: "shop" },
      { to: "/admin/subscriptions", label: "Abunəlik paketləri", icon: "card" },
    ],
  },
  {
    label: "İstifadəçilər",
    links: [
      { to: "/admin/users", label: "İstifadəçilər", icon: "users" },
      { to: "/admin/contact", label: "Mesajlar", icon: "mail" },
    ],
  },
];

const ALL_LINKS = NAV_GROUPS.flatMap((g) => g.links);

function isActive(pathname: string, to: string): boolean {
  return pathname === to || (to !== "/admin" && pathname.startsWith(to + "/"));
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/giris");
  }

  const roleLabel = isSuperAdminRole(user?.role) ? "SuperAdmin" : "Admin";

  return (
    <div className="min-h-screen bg-ink text-[#F3EFE6]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/8 bg-ink2/50">
        <div className="px-5 py-6 border-b border-white/5 flex items-center gap-2.5">
          <span className="size-9 grid place-items-center rounded-full border border-gold/40 text-gold shrink-0">⚙</span>
          <div className="min-w-0">
            <div className="text-lg font-display leading-tight truncate">Admin Panel</div>
            <div className="text-[11px] text-[#8b84a8] truncate">{roleLabel}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 text-[10px] tracking-[0.18em] uppercase text-[#6b6485] mb-1.5">{group.label}</div>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const active = isActive(location.pathname, link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition " +
                        (active ? "bg-gold/10 text-gold" : "text-mist hover:bg-white/5 hover:text-[#F3EFE6]")
                      }
                    >
                      {ICONS[link.icon]}
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
          <div className="px-3 py-1 text-[11px] text-[#6b6485] truncate">{user?.email}</div>
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-mist hover:bg-white/5 hover:text-gold transition"
          >
            <Icon d="M19 12H5M11 18l-6-6 6-6" />
            Tətbiqə qayıt
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-mist hover:bg-red-400/10 hover:text-red-300 transition"
          >
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            Çıxış
          </button>
        </div>
      </aside>

      {/* Mobile header + horizontal nav */}
      <div className="lg:hidden border-b border-white/8 bg-ink2/50 sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-8 grid place-items-center rounded-full border border-gold/40 text-gold text-sm shrink-0">⚙</span>
            <div className="text-base font-display leading-tight">Admin Panel</div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-full border border-white/15 text-xs text-mist hover:border-gold/40 hover:text-gold transition"
            >
              ← Tətbiqə qayıt
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-white/15 text-xs text-mist hover:border-red-400/40 hover:text-red-300 transition"
            >
              Çıxış
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-1.5 overflow-x-auto px-4 pb-3 [&::-webkit-scrollbar]:hidden">
          {ALL_LINKS.map((link) => {
            const active = isActive(location.pathname, link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={
                  "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition border " +
                  (active
                    ? "border-gold/50 text-gold bg-gold/10"
                    : "border-white/15 text-mist hover:border-gold/40 hover:text-gold")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div key={location.pathname} className="max-w-6xl mx-auto px-5 sm:px-8 py-8 animate-page-enter">
          {children}
        </div>
      </div>
    </div>
  );
}
