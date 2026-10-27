import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi, pushApi, type NotificationDto } from "../lib/api";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın NotificationBell.tsx-indən: zəng düyməsi basılanda tam
// səhifəyə getmək əvəzinə kiçik bir açılan panel göstərir. Əsas bildiriş siyahısı
// (/bildirisler) də qalır — drawer menyudan əlçatandır, amma gündəlik istifadə
// üçün bu zəng kifayətdir.

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function formatRelativeTime(iso: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return t("notificationBell.justNow");
  if (mins < 60) return t("notificationBell.minutesAgo", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notificationBell.hoursAgo", { n: hours });
  const days = Math.floor(hours / 24);
  return t("notificationBell.daysAgo", { n: days });
}

export function NotificationBell() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [pushSupported, setPushSupported] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  function refresh() {
    return notificationsApi
      .list()
      .then((data) => setItems([...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushSubscribed(!!sub))
      .catch(() => setPushSupported(false));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function togglePush() {
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await pushApi.unsubscribe(existing.endpoint);
        await existing.unsubscribe();
        setPushSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const { publicKey } = await pushApi.publicKey();
        if (!publicKey) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const subJson = sub.toJSON();
        const p256dh = subJson.keys?.p256dh;
        const auth = subJson.keys?.auth;
        if (!p256dh || !auth) throw new Error("Abunəlik açarları alınmadı");
        await pushApi.subscribe({ endpoint: sub.endpoint, keys: { p256dh, auth } });
        setPushSubscribed(true);
      }
    } catch {
      /* best-effort */
    } finally {
      setPushBusy(false);
    }
  }

  async function handleItemClick(item: NotificationDto) {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      notificationsApi.markRead(item.id).catch(() => refresh());
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      refresh();
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label={t("notificationBell.title")}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-mist hover:text-white transition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-gold text-ink text-[10px] font-semibold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-white/10 bg-ink2/95 backdrop-blur shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-white">{t("notificationBell.title")}</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs text-goldsoft hover:text-gold transition">
                {t("notificationBell.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!loaded && <p className="px-4 py-6 text-center text-xs text-mist">{t("common.loading")}</p>}
            {loaded && items.length === 0 && <p className="px-4 py-6 text-center text-xs text-mist">{t("notificationBell.empty")}</p>}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={"w-full text-left px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition " + (item.isRead ? "opacity-60" : "")}
              >
                <div className="flex items-start gap-2">
                  {!item.isRead && <span className="mt-1.5 size-1.5 rounded-full bg-gold shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-sm text-white">{item.title}</div>
                    {item.body && <div className="text-xs text-mist mt-0.5 line-clamp-2">{item.body}</div>}
                    <div className="text-[10px] text-mist/70 mt-1">{formatRelativeTime(item.createdAt, t)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {pushSupported && (
            <div className="border-t border-white/5 px-4 py-2.5">
              <button
                type="button"
                onClick={togglePush}
                disabled={pushBusy || pushSubscribed === null}
                className="w-full flex items-center gap-2 text-xs text-mist hover:text-goldsoft transition disabled:opacity-50"
              >
                <span>{pushSubscribed ? "🔔" : "🔕"}</span>
                <span>{pushBusy ? "…" : pushSubscribed ? t("notificationBell.pushOn") : t("notificationBell.pushOff")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
