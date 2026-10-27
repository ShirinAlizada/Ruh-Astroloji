import { useEffect, useState } from "react";
import { notificationsApi, pushApi, ApiError, type NotificationDto } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// VAPID açarı backend-dən URL-safe base64 kimi gəlir, PushManager.subscribe isə
// Uint8Array/BufferSource gözləyir — standart çevirmə naxışı.
// Qeyd: qayıtma tipi aydın "Uint8Array<ArrayBuffer>" olaraq verilib — daha yeni TS/@types/web
// versiyalarında çılpaq "Uint8Array" "Uint8Array<ArrayBufferLike>"-ə enişir (SharedArrayBuffer da daxil
// ola bilər), bu isə pushManager.subscribe-ın gözlədiyi "BufferSource"-a uyğun gəlmir (tsc -b səhvi verirdi).
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const [list, setList] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pushSupported, setPushSupported] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

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

  async function togglePush() {
    setPushError(null);
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
        if (permission !== "granted") {
          setPushError(t("notifications.errPermission"));
          return;
        }
        const { publicKey } = await pushApi.publicKey();
        if (!publicKey) {
          setPushError(t("notifications.errServerConfig"));
          return;
        }
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
    } catch (err) {
      setPushError(err instanceof ApiError ? err.message : t("notifications.errGeneric"));
    } finally {
      setPushBusy(false);
    }
  }

  function refresh() {
    return notificationsApi
      .list()
      .then((data) => setList([...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("notifications.errLoad")));
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationsApi.markRead(id);
    } catch {
      refresh();
    }
  }

  async function markAllRead() {
    setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      refresh();
    }
  }

  const unreadCount = list.filter((n) => !n.isRead).length;
  const cardClass = "rounded-3xl border border-white/10 bg-celestial-card/40 p-7";

  return (
    <Page>
      <PageHeader kicker={t("notifications.kicker")} title={t("notifications.title")} subtitle={unreadCount > 0 ? `${unreadCount} ${t("notifications.unreadSuffix")}` : undefined} />

      {pushSupported && (
        <div className={cardClass + " mb-6 flex items-center justify-between gap-4"}>
          <div>
            <h3 className="text-sm text-[#F3EFE6]">{t("notifications.browserTitle")}</h3>
            <p className="text-xs text-mist/70 mt-0.5">
              {pushSubscribed ? t("notifications.browserOnDesc") : t("notifications.browserOffDesc")}
            </p>
            {pushError && <p className="text-xs text-red-300 mt-1.5">{pushError}</p>}
          </div>
          <button
            onClick={togglePush}
            disabled={pushBusy || pushSubscribed === null}
            className={
              "shrink-0 text-xs px-5 py-2 rounded-full border font-medium transition disabled:opacity-60 " +
              (pushSubscribed
                ? "border-white/15 text-mist hover:border-red-400/40 hover:text-red-300"
                : "border-gold/40 text-gold hover:bg-gold/10")
            }
          >
            {pushBusy ? "…" : pushSubscribed ? t("notifications.toggleOff") : t("notifications.toggleOn")}
          </button>
        </div>
      )}

      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={markAllRead}
            className="text-xs px-4 py-1.5 rounded-full border border-gold/30 text-gold hover:bg-gold/10 transition"
          >
            {t("notifications.markAllRead")}
          </button>
        </div>
      )}

      {loading && <p className="text-center text-mist text-sm">{t("common.loading")}</p>}

      {!loading && error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
      )}

      {!loading && list.length === 0 && <p className="text-center text-mist text-sm">{t("notifications.empty")}</p>}

      <div className="space-y-2.5">
        {list.map((n) => (
          <div
            key={n.id}
            className={"rounded-2xl border px-5 py-4 " + (n.isRead ? "border-white/10 bg-white/[0.02]" : "border-gold/30 bg-gold/5")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {!n.isRead && <span className="size-1.5 rounded-full bg-gold" />}
                  <h3 className="text-sm text-[#F3EFE6]">{n.title}</h3>
                </div>
                {n.body && <p className="text-sm text-mist mt-1">{n.body}</p>}
                <p className="text-[11px] text-mist/70 mt-1.5">{new Date(n.createdAt).toLocaleString(locale)}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-mist hover:border-gold/40 hover:text-gold transition shrink-0"
                >
                  {t("notifications.markRead")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
