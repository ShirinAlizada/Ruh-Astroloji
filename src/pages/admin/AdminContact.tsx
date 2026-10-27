import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi, ApiError, type ContactMessageDto } from "../../lib/api";

const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-6";

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await adminApi.contactMessages.list();
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mesajlar yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRead(m: ContactMessageDto) {
    setBusyId(m.id);
    try {
      await adminApi.contactMessages.markRead(m.id, !m.isRead);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, isRead: !m.isRead } : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const shown = (filter === "unread" ? messages.filter((m) => !m.isRead) : messages).filter(
    (m) =>
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
  );
  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Əlaqə mesajları</h1>
        <p className="text-sm text-mist mt-1">Saytdakı əlaqə formasından daxil olan mesajlar.</p>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={
              "px-3 py-1.5 rounded-full text-sm border transition " +
              (filter === "all"
                ? "border-gold/50 text-gold bg-gold/10"
                : "border-white/15 text-mist hover:border-gold/40")
            }
          >
            Hamısı ({messages.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={
              "px-3 py-1.5 rounded-full text-sm border transition " +
              (filter === "unread"
                ? "border-gold/50 text-gold bg-gold/10"
                : "border-white/15 text-mist hover:border-gold/40")
            }
          >
            Oxunmamış ({unreadCount})
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ad, e-poçt və ya mətndə axtar…"
          className="px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
        />
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-mist">Yüklənir…</div>
      ) : shown.length === 0 ? (
        <div className={cardCls + " text-center text-sm text-mist"}>
          {q || filter === "unread" ? "Bu axtarışa/filtrə uyğun mesaj tapılmadı." : "Hələ heç bir mesaj yoxdur."}
        </div>
      ) : (
        <div className="grid gap-3">
          {shown.map((m) => (
            <div
              key={m.id}
              className={cardCls + (m.isRead ? "" : " border-gold/30 bg-gold/[0.04]")}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <div className="font-medium text-[#F3EFE6]">{m.name}</div>
                  <div className="text-xs text-[#8b84a8]">{m.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8b84a8]">
                    {new Date(m.createdAt).toLocaleString("az-AZ")}
                  </span>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: Virgo Astrology əlaqə mesajı")}`}
                    className="px-2.5 py-1 rounded-full text-xs border border-white/15 text-mist hover:border-gold/40 hover:text-gold transition"
                  >
                    Cavabla
                  </a>
                  <button
                    onClick={() => toggleRead(m)}
                    disabled={busyId === m.id}
                    className={
                      "px-2.5 py-1 rounded-full text-xs border transition disabled:opacity-50 " +
                      (m.isRead
                        ? "border-white/15 text-mist hover:border-gold/40 hover:text-gold"
                        : "border-gold/40 text-gold hover:bg-gold/10")
                    }
                  >
                    {m.isRead ? "Oxunmamış et" : "Oxunmuş kimi işarələ"}
                  </button>
                </div>
              </div>
              <p className="text-sm text-mist whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
