import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { isAdminRole } from "./AdminRoute";

const NAV_LINKS = [
  { to: "/profil", label: "Profil" },
  { to: "/natal-xerite", label: "Natal Xəritə" },
  { to: "/numerologiya", label: "Numerologiya" },
  { to: "/gunun-beledcisi", label: "Günün Bələdçisi" },
  { to: "/burc-proqnozu", label: "Bürc Proqnozu" },
  { to: "/astroloqlar", label: "Astroloqlar" },
  { to: "/uygunluq", label: "Uyğunluq" },
  { to: "/jurnal", label: "Jurnal" },
  { to: "/bildirisler", label: "Bildirişlər" },
  { to: "/goruslerim", label: "Görüşlərim" },
  { to: "/ai-sohbet", label: "AI Söhbət" },
  { to: "/axtaris", label: "Axtarış" },
  { to: "/forum", label: "Forum" },
  { to: "/magaza", label: "Mağaza" },
  { to: "/qezet", label: "Qəzet" },
  { to: "/abuneler", label: "Abunəliklər" },
  { to: "/elaqe", label: "Əlaqə" },
];

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/giris");
  }

  return (
    <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
      <Link to="/profil" className="flex items-center gap-2.5">
        <span className="size-9 grid place-items-center rounded-full border border-[#D4AF6A]/40 text-[#D4AF6A]">
          ☾
        </span>
        <span className="text-2xl font-serif">Ruh Astrolojiya</span>
      </Link>

      <nav className="flex items-center gap-1.5 flex-wrap">
        {NAV_LINKS.map((link) => {
          // "/forum" linki "/forum/abc123" kimi alt-səhifələrdə də aktiv görünsün.
          const active = location.pathname === link.to || location.pathname.startsWith(link.to + "/");
          return (
            <Link
              key={link.to}
              to={link.to}
              className={
                "px-4 py-1.5 rounded-full text-sm transition border " +
                (active
                  ? "border-[#D4AF6A]/50 text-[#D4AF6A] bg-[#D4AF6A]/10"
                  : "border-white/15 text-[#ABA3C2] hover:border-[#D4AF6A]/40 hover:text-[#D4AF6A]")
              }
            >
              {link.label}
            </Link>
          );
        })}
        {isAdminRole(user?.role) && (
          <Link
            to="/admin"
            className="px-4 py-1.5 rounded-full text-sm transition border border-[#D4AF6A]/40 text-[#D4AF6A] hover:bg-[#D4AF6A]/10"
          >
            ⚙ Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 rounded-full border border-white/15 text-sm text-[#ABA3C2] hover:border-red-400/40 hover:text-red-300 transition"
        >
          Çıxış
        </button>
      </nav>
    </div>
  );
}
