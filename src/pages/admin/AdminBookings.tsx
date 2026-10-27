import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi, ApiError, type BookingDto, type AdminUserDto } from "../../lib/api";

// DÜZƏLİŞ (2026-10-28): açarlar KİÇİK hərflə — backend `BookingDto.Status`/`SessionType`-i
// `.ToString().ToLower()` ilə qaytarır (bax BookingService.cs), əvvəlki böyük-hərfli açarlar
// heç vaxt uyğun gəlmirdi (status filtr düymələri heç nəyi süzmürdü, badge həmişə defolt
// rəngdə görünürdü).
const STATUS_LABELS: Record<string, string> = {
  pending: "Gözləyir",
  confirmed: "Təsdiqləndi",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
};
const STATUS_CLASS: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  confirmed: "border-gold/40 text-goldsoft bg-gold/5",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-white/15 bg-white/[0.02] text-mist",
};
const STATUSES = Object.keys(STATUS_LABELS);
const SESSION_TYPE_LABELS: Record<string, string> = {
  live: "Canlı seans",
  written: "Yazılı təhlil",
};

const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [b, u] = await Promise.all([adminApi.bookings.list(), adminApi.users.list()]);
        setBookings(b.sort((a, c) => new Date(c.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()));
        setUsers(u);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Rezervasiyalar yüklənərkən xəta baş verdi.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userById = new Map(users.map((u) => [u.id, u]));

  function clientLabel(userId: string): string {
    const u = userById.get(userId);
    return u ? u.fullName : userId;
  }

  const q = query.trim().toLowerCase();
  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (!q) return true;
    const client = userById.get(b.userId);
    return (
      b.astrologerName.toLowerCase().includes(q) ||
      (client?.fullName.toLowerCase().includes(q) ?? false) ||
      (client?.email.toLowerCase().includes(q) ?? false)
    );
  });

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Rezervasiyalar</h1>
        <p className="text-sm text-mist mt-1">
          Bütün istifadəçi-astroloq görüşlərinə baxış, {bookings.length} rezervasiya
          {pendingCount > 0 ? ` · ${pendingCount} gözləyir` : ""}.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-gold/90">
        Qeyd: bu siyahı yalnız göstərmə məqsədlidir — backend-də admin üçün status dəyişmə endpoint-i
        yoxdur (rezervasiyanı ancaq sahibi özü ləğv/idarə edə bilər).
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                "px-3 py-1.5 rounded-full text-sm border transition " +
                (statusFilter === s
                  ? "border-gold/50 text-gold bg-gold/10"
                  : "border-white/15 text-mist hover:border-gold/40")
              }
            >
              {s === "all" ? "Hamısı" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Astroloq və ya müştəri adında axtar…"
          className="px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
        />
      </div>

      <div className={cardCls + " overflow-x-auto"}>
        {loading ? (
          <div className="text-sm text-mist">Yüklənir…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-mist">
            {q || statusFilter !== "all" ? "Bu axtarışa/filtrə uyğun rezervasiya tapılmadı." : "Rezervasiya tapılmadı."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#8b84a8] border-b border-white/10">
                <th className="py-2 pr-4">Müştəri</th>
                <th className="py-2 pr-4">Astroloq</th>
                <th className="py-2 pr-4">Növ</th>
                <th className="py-2 pr-4">Tarix</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Qeyd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="py-2.5 pr-4">{clientLabel(b.userId)}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">
                    {b.astrologerName}
                    {b.astrologerTitle ? <span className="text-[#6b6485]"> · {b.astrologerTitle}</span> : null}
                  </td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{SESSION_TYPE_LABELS[b.sessionType] ?? b.sessionType}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{new Date(b.scheduledAt).toLocaleString("az-AZ")}</td>
                  <td className="py-2.5 pr-4">
                    <span className={"px-2.5 py-1 rounded-full text-xs border " + (STATUS_CLASS[b.status] ?? "border-white/15 text-mist")}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-mist max-w-[16rem] truncate" title={b.note ?? ""}>
                    {b.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
