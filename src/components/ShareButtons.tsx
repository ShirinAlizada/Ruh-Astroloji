import { useState } from "react";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın ShareButtons.tsx-inə uyğun — native Web Share API
// (mobil brauzerlərdə), WhatsApp, Telegram və linki kopyala seçimləri.

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.94.56 3.76 1.53 5.3L2 22l4.93-1.6a9.8 9.8 0 0 0 5.11 1.4h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.08h-.01a8.1 8.1 0 0 1-4.15-1.14l-.3-.18-3.08.99 1-2.99-.2-.31a8.1 8.1 0 0 1-1.25-4.33c0-4.5 3.66-8.17 8.18-8.17a8.13 8.13 0 0 1 8.15 8.18c0 4.5-3.66 8.16-8.17 8.16Zm4.48-6.12c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.17.24-.63.8-.78.96-.14.17-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.21-.73-.65-1.22-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.08-.17.04-.31-.04-.43-.08-.13-.57-1.37-.78-1.87-.21-.49-.42-.42-.58-.43-.14-.01-.31-.01-.47-.01-.17 0-.44.06-.67.31-.24.25-.9.88-.9 2.15 0 1.27.92 2.5 1.05 2.67.13.17 1.78 2.72 4.33 3.7 2.55.98 2.55.65 3.01.62.46-.04 1.46-.6 1.67-1.17.2-.57.2-1.07.14-1.17-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 4.5 2.6 11.9c-1.3.5-1.29 1.21-.24 1.53l4.93 1.54 1.9 6.16c.23.63.6.65.98.3l2.66-2.4 4.86 3.58c.9.5 1.52.24 1.74-.83l3.14-14.8c.31-1.33-.5-1.93-1.57-1.5Z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 1 0-5.66-5.66L10 5.34" />
      <path d="M15 12a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 1 0 5.66 5.66L14 18.66" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.7" />
      <circle cx="6" cy="12" r="2.7" />
      <circle cx="18" cy="19" r="2.7" />
      <path d="M8.3 10.7 15.7 6.6M8.3 13.3l7.4 4.1" />
    </svg>
  );
}

const btnCls =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/15 text-mist hover:border-gold/40 hover:text-gold transition";

export function ShareButtons({ title, url }: { title: string; url?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url: shareUrl });
    } catch {
      /* istifadəçi ləğv etdi və ya dəstəklənmir — səssiz keç */
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard əlçatmaz ola bilər — best-effort */
    }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-mist uppercase tracking-wide mr-1">{t("share.label")}</span>
      {hasNativeShare && (
        <button type="button" onClick={handleNativeShare} className={btnCls}>
          <ShareIcon />
          {t("share.native")}
        </button>
      )}
      <a href={waHref} target="_blank" rel="noopener noreferrer" className={btnCls}>
        <WhatsAppIcon />
        WhatsApp
      </a>
      <a href={tgHref} target="_blank" rel="noopener noreferrer" className={btnCls}>
        <TelegramIcon />
        Telegram
      </a>
      <button type="button" onClick={handleCopy} className={btnCls}>
        <LinkIcon />
        {copied ? t("share.copied") : t("share.copyLink")}
      </button>
    </div>
  );
}
