import { useState, type FormEvent } from "react";
import { contactApi, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

export default function ContactPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await contactApi.submit({ name, email, message });
      setSent(true);
      setName("");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("contact.errSend"));
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/60 focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";
  const cardClass = "rounded-3xl border border-white/10 bg-celestial-card/40 p-7";

  return (
    <Page>
      <PageHeader kicker={t("contact.kicker")} title={t("contact.title")} subtitle={t("contact.subtitle")} />

      {sent ? (
        <div className={cardClass + " text-center"}>
          <p className="text-gold text-base mb-2">{t("contact.sentTitle")}</p>
          <p className="text-sm text-mist">{t("contact.sentBody")}</p>
          <button
            onClick={() => setSent(false)}
            className="mt-5 text-xs px-4 py-1.5 rounded-full border border-white/15 text-mist hover:border-gold/40 transition"
          >
            {t("contact.newMessage")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cardClass + " space-y-4"}>
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}
          <div>
            <label className={labelClass}>{t("contact.name")}</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>{t("contact.email")}</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("contact.message")}</label>
            <textarea
              className={inputClass}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
          >
            {sending ? t("contact.sending") : t("contact.send")}
          </button>
        </form>
      )}
    </Page>
  );
}
