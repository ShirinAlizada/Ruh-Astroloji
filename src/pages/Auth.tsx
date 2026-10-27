import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { authApi, ApiError } from "../lib/api";
import { BrandMark } from "../components/BrandMark";
import { useI18n } from "../lib/i18n";

// DÜZƏLİŞ (2026-10-27): "confirm" — qeydiyyatdan sonra e-poçta göndərilən kodu daxil edib
// hesabı aktivləşdirmə mərhələsi (bax AuthService.RegisterAsync/ConfirmEmailAsync).
type Mode = "login" | "signup" | "forgot" | "confirm";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, confirmEmail, resendConfirmationCode } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResetSent(false);
    setResendDone(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await register(email, password, fullName);
        setCode("");
        setResendDone(false);
        setMode("confirm");
      } else {
        await login(email, password);
        navigate("/profil");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function submitConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await confirmEmail(email, code);
      navigate("/profil");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setError(null);
    setResendDone(false);
    setBusy(true);
    try {
      await resendConfirmationCode(email);
      setResendDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function submitForgot(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.forgotPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/70 focus:outline-none focus:border-gold/50";

  return (
    <div className="min-h-screen bg-ink text-[#F3EFE6] grid place-items-center px-6 py-14 relative z-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <span className="size-9 grid place-items-center rounded-full border border-gold/40 text-gold">
            ☾
          </span>
          <BrandMark className="font-display text-2xl" />
        </Link>

        <div className="rounded-3xl border border-white/10 bg-celestial-card/60 p-7">
          <h1 className="font-display text-3xl text-center">
            {mode === "login"
              ? t("auth.titleLogin")
              : mode === "signup"
                ? t("auth.titleSignup")
                : mode === "confirm"
                  ? t("auth.titleConfirm")
                  : t("auth.titleForgot")}
          </h1>
          <p className="text-mist text-sm text-center mt-2">
            {mode === "login"
              ? t("auth.subtitleLogin")
              : mode === "signup"
                ? t("auth.subtitleSignup")
                : mode === "confirm"
                  ? t("auth.subtitleConfirm")
                  : t("auth.subtitleForgot")}
          </p>

          {error && (
            <p className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          {mode === "confirm" ? (
            <form onSubmit={submitConfirm} className="mt-6 space-y-4">
              <p className="text-sm text-mist text-center">
                {t("auth.confirmSentPrefix")} <span className="text-white">{email}</span>
              </p>
              <div>
                <label className="block text-xs text-mist mb-1.5">{t("auth.confirmCodeLabel")}</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={inputClass + " text-center text-lg tracking-[0.5em]"}
                  placeholder="000000"
                />
              </div>
              {resendDone && (
                <p className="text-xs text-emerald-300 text-center">{t("auth.confirmResendDone")}</p>
              )}
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
              >
                {busy ? t("auth.waiting") : t("auth.confirmSubmit")}
              </button>
              <button
                type="button"
                onClick={resendCode}
                disabled={busy}
                className="w-full text-sm text-mist hover:text-goldsoft transition disabled:opacity-60"
              >
                {t("auth.confirmResend")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full text-sm text-mist hover:text-goldsoft transition"
              >
                {t("auth.backToLogin")}
              </button>
            </form>
          ) : mode === "forgot" ? (
            resetSent ? (
              <div className="mt-6 text-center space-y-4">
                <p className="text-sm text-mist">
                  {t("auth.resetSentPrefix")} <span className="text-white">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-sm text-gold hover:text-goldsoft transition"
                >
                  {t("auth.backToLogin")}
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs text-mist mb-1.5">{t("auth.email")}</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="siz@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
                >
                  {busy ? t("auth.sending") : t("auth.sendResetLink")}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="w-full text-sm text-mist hover:text-goldsoft transition"
                >
                  {t("auth.backToLogin")}
                </button>
              </form>
            )
          ) : (
            <>
              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs text-mist mb-1.5">{t("auth.fullName")}</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={80}
                      className={inputClass}
                      placeholder={t("auth.fullNamePlaceholder")}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-mist mb-1.5">{t("auth.email")}</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="siz@example.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-mist">{t("auth.password")}</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-mist hover:text-goldsoft transition"
                      >
                        {t("auth.forgotPassword")}
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
                >
                  {busy ? t("auth.waiting") : mode === "login" ? t("auth.login") : t("auth.signup")}
                </button>
              </form>

              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="mt-5 w-full text-sm text-mist hover:text-goldsoft transition"
              >
                {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("confirm")}
                  className="mt-2 w-full text-sm text-mist hover:text-goldsoft transition"
                >
                  {t("auth.haveCodeLink")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
