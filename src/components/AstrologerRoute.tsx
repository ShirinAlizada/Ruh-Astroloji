import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";

// DÜZƏLİŞ (2026-10-28): "astroloq rolunu kimə vermişəmsə onun profil hissəsini astroloq
// kimi dəyiş" — AdminRoute.tsx-dəki eyni naxış, amma rol=Astrologer üçün. Admin/SuperAdmin
// bura DAXİL DEYİL — onlar artıq tam ayrıca /admin panelinə malikdir, bu məhdud paneldən
// keçmirlər (rol sistemi tək-rollu olduğu üçün bu təbii şəkildə belədir).
export function isAstrologerRole(role: string | null | undefined): boolean {
  return (role ?? "").toLowerCase() === "astrologer";
}

export default function AstrologerRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink grid place-items-center text-mist text-sm">
        Yüklənir…
      </div>
    );
  }

  if (!user) return <Navigate to="/giris" replace />;
  if (!isAstrologerRole(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
