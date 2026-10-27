import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authApi, ApiError } from "../lib/api";
import { BrandMark } from "../components/BrandMark";
import { useI18n } from "../lib/i18n";

// AstroBackend-in göndərdiyi sıfırlama e-poçtundakı link bura
// (/sifre-sifirla?email=...&token=...) işarə edir — bax AuthService.ForgotPasswordAsync.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const missingLink = !email || !token;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t("resetPassword.errTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("resetPassword.errMismatch"));
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword(email, token, password);
      setDone(true);
      setTimeout(() => navigate("/giris"), 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("resetPassword.errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/70 focus:outline-none focus:border-gold/50";

  return (
    <div className="min-h-screen bg-ink text-white font-sans antialiased grid place-items-center px-6 py-14 relative z-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <span className="size-9 grid place-items-center rounded-full border border-gold/40 text-gold">☾</span>
          <BrandMark className="font-display text-2xl" />
        </Link>

        <div className="rounded-3xl border border-white/10 bg-celestial-card/60 p-7">
          <h1 className="font-display text-3xl text-center">{t("resetPassword.title")}</h1>

          {missingLink ? (
            <p className="text-mist text-sm text-center mt-4">{t("resetPassword.missingLink")}</p>
          ) : done ? (
            <p className="text-mist text-sm text-center mt-4">{t("resetPassword.done")}</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-xs text-mist mb-1.5">{t("resetPassword.newPassword")}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••"
                />
              </div>
              <div>
                <label className="block text-xs text-mist mb-1.5">{t("resetPassword.newPasswordConfirm")}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="••••••"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
              >
                {busy ? t("resetPassword.updating") : t("resetPassword.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
