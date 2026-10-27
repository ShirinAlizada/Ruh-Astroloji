import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";

// Backend ICurrentUserService.Role ClaimTypes.Role claim-indən gəlir; dəqiq
// hərf registri (Admin/SuperAdmin PascalCase olmalıdır) JWT yaradılan yerdə
// təyin olunur, amma frontend tərəfdə riski azaltmaq üçün həmişə kiçik hərflə
// müqayisə edirik.
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "superadmin";
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return (role ?? "").toLowerCase() === "superadmin";
}

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink grid place-items-center text-mist text-sm">
        Yüklənir…
      </div>
    );
  }

  if (!user) return <Navigate to="/giris" replace />;
  if (!isAdminRole(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
