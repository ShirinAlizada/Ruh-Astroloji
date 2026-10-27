import { useEffect, useState, type FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import { isSuperAdminRole } from "../../components/AdminRoute";
import { useAuth } from "../../lib/auth-context";
import { adminApi, ApiError, type AdminUserDto } from "../../lib/api";

const ROLES = ["user", "astrologer", "admin", "superadmin"];

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/50";
const labelCls = "block text-xs text-[#8b84a8] mb-1";
const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const canManage = isSuperAdminRole(me?.role);

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "user" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await adminApi.users.list();
      setUsers(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "İstifadəçilər yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await adminApi.users.create(form.email, form.password, form.fullName, form.role);
      setForm({ email: "", password: "", fullName: "", role: "user" });
      setShowCreate(false);
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "İstifadəçi yaradılarkən xəta baş verdi.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(id: string, role: string) {
    setBusyId(id);
    try {
      await adminApi.users.updateRole(id, role);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rol dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStatus(id: string) {
    setBusyId(id);
    try {
      await adminApi.users.toggleStatus(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("İstifadəçini silmək istədiyinizə əminsiniz?")) return;
    setBusyId(id);
    try {
      await adminApi.users.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "İstifadəçi silinərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredUsers = users.filter(
    (u) =>
      (roleFilter === "all" || u.role.toLowerCase() === roleFilter) &&
      (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-3xl">İstifadəçilər</h1>
        {canManage && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
          >
            {showCreate ? "Bağla" : "+ Yeni istifadəçi"}
          </button>
        )}
      </div>
      <p className="text-sm text-mist mt-1 mb-5">Qeydiyyatdan keçmiş bütün istifadəçilər, {users.length} nəfər.</p>

      {!canManage && (
        <div className="mb-5 rounded-2xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-gold/90">
          Yaratma, silmə və rol dəyişikliyi yalnız SuperAdmin üçün açıqdır. Status dəyişikliyi bütün adminlərə
          açıqdır.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showCreate && canManage && (
        <form onSubmit={handleCreate} className={cardCls + " mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          <div>
            <label className={labelCls}>Ad Soyad</label>
            <input
              className={inputCls}
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>E-poçt</label>
            <input
              type="email"
              className={inputCls}
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Şifrə</label>
            <input
              type="password"
              className={inputCls}
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Rol</label>
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-ink text-[#F3EFE6]">
                  {r}
                </option>
              ))}
            </select>
          </div>
          {createError && <div className="sm:col-span-2 text-sm text-red-300">{createError}</div>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition disabled:opacity-50"
            >
              {creating ? "Yaradılır…" : "Yarat"}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ad və ya e-poçtda axtar…"
          className="px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-mist focus:outline-none focus:border-gold/40"
        >
          <option value="all" className="bg-ink text-[#F3EFE6]">Bütün rollar</option>
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-ink text-[#F3EFE6]">
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className={cardCls + " overflow-x-auto"}>
        {loading ? (
          <div className="text-sm text-mist">Yüklənir…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-sm text-mist">
            {q || roleFilter !== "all" ? "Bu axtarışa/filtrə uyğun istifadəçi tapılmadı." : "İstifadəçi tapılmadı."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#8b84a8] border-b border-white/10">
                <th className="py-2 pr-4">Ad Soyad</th>
                <th className="py-2 pr-4">E-poçt</th>
                <th className="py-2 pr-4">Doğum</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Qeydiyyat</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 pr-4">{u.fullName}</td>
                  <td className="py-2.5 pr-4 text-mist">{u.email}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{u.sunSign ?? "—"}</td>
                  <td className="py-2.5 pr-4">
                    {canManage ? (
                      <select
                        className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs"
                        value={u.role.toLowerCase()}
                        disabled={busyId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="bg-ink text-[#F3EFE6]">
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full border border-white/15 text-xs">{u.role}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      disabled={busyId === u.id}
                      className={
                        "px-2.5 py-1 rounded-full text-xs border transition disabled:opacity-50 " +
                        (u.isActive
                          ? "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
                          : "border-red-400/40 text-red-300 hover:bg-red-400/10")
                      }
                    >
                      {u.isActive ? "Aktiv" : "Bloklanıb"}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">
                    {new Date(u.createdAt).toLocaleDateString("az-AZ")}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    {canManage && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={busyId === u.id}
                        className="text-xs text-red-300/80 hover:text-red-300 disabled:opacity-50"
                      >
                        Sil
                      </button>
                    )}
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
