import { useEffect, useState, type FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi, ApiError, type AstrologerDto, type AdminUserDto } from "../../lib/api";

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/50";
const labelCls = "block text-xs text-[#8b84a8] mb-1";
const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

interface FormState {
  displayName: string;
  title: string;
  bio: string;
  specialties: string; // vergüllə ayrılmış
  languages: string; // vergüllə ayrılmış
  priceAzn: string;
  avatarUrl: string;
  titleEn: string;
  titleRu: string;
  bioEn: string;
  bioRu: string;
  // DÜZƏLİŞ (2026-10-27): astroloq profilini real istifadəçi hesabına bağlamaq üçün —
  // yalnız bağlı hesab olanda rezervasiya bildirişi həmin astroloqa çatır.
  userId: string;
}

const EMPTY_FORM: FormState = {
  displayName: "",
  title: "",
  bio: "",
  specialties: "",
  languages: "",
  priceAzn: "0",
  avatarUrl: "",
  titleEn: "",
  titleRu: "",
  bioEn: "",
  bioRu: "",
  userId: "",
};

function splitList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminAstrologersPage() {
  const [list, setList] = useState<AstrologerDto[]>([]);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setList(await adminApi.astrologers.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Astroloqlar yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  // DÜZƏLİŞ (2026-10-27): "Bağlı istifadəçi" seçimi üçün istifadəçi siyahısını da yükləyirik.
  async function loadUsers() {
    try {
      setUsers(await adminApi.users.list());
    } catch {
      // sessiz keçirik — bağlama sahəsi olmasa da forma işləməyə davam edir
    }
  }

  useEffect(() => {
    load();
    loadUsers();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(a: AstrologerDto) {
    setEditingId(a.id);
    setForm({
      displayName: a.displayName,
      title: a.title ?? "",
      bio: a.bio ?? "",
      specialties: a.specialties.join(", "),
      languages: a.languages.join(", "),
      priceAzn: String(a.priceAzn),
      avatarUrl: a.avatarUrl ?? "",
      titleEn: a.titleEn ?? "",
      titleRu: a.titleRu ?? "",
      bioEn: a.bioEn ?? "",
      bioRu: a.bioRu ?? "",
      userId: a.userId ?? "",
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const base = {
      displayName: form.displayName,
      title: form.title || null,
      bio: form.bio || null,
      specialties: splitList(form.specialties),
      languages: splitList(form.languages),
      priceAzn: Number(form.priceAzn) || 0,
      avatarUrl: form.avatarUrl || null,
      titleEn: form.titleEn || null,
      titleRu: form.titleRu || null,
      bioEn: form.bioEn || null,
      bioRu: form.bioRu || null,
      userId: form.userId || null,
    };
    try {
      if (editingId) {
        const current = list.find((x) => x.id === editingId);
        await adminApi.astrologers.update(editingId, { ...base, verified: current?.verified ?? null });
      } else {
        await adminApi.astrologers.create(base);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Astroloq saxlanarkən xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Astroloqu silmək istədiyinizə əminsiniz?")) return;
    setBusyId(id);
    try {
      await adminApi.astrologers.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Astroloq silinərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleVerify(a: AstrologerDto) {
    setBusyId(a.id);
    try {
      await adminApi.astrologers.verify(a.id, !a.verified);
      setList((prev) => prev.map((x) => (x.id === a.id ? { ...x, verified: !a.verified } : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Təsdiq statusu dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredList = list.filter(
    (a) => !q || a.displayName.toLowerCase().includes(q) || a.specialties.some((s) => s.toLowerCase().includes(q))
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-3xl">Astroloqlar</h1>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
        >
          {showForm ? "Bağla" : "+ Yeni astroloq"}
        </button>
      </div>
      <p className="text-sm text-mist mt-1 mb-5">Profil, ixtisas, qiymət və təsdiq statusu idarəetməsi.</p>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className={cardCls + " mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          <div className="sm:col-span-2 text-sm font-medium text-[#F3EFE6]">
            {editingId ? "Astroloqu redaktə et" : "Yeni astroloq"}
          </div>
          <div>
            <label className={labelCls}>Ad</label>
            <input
              className={inputCls}
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Ünvan/Titul</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Bio</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Ixtisaslar (vergüllə ayır)</label>
            <input
              className={inputCls}
              placeholder="natal xəritə, tarot, uyğunluq"
              value={form.specialties}
              onChange={(e) => setForm({ ...form, specialties: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Dillər (vergüllə ayır)</label>
            <input
              className={inputCls}
              placeholder="az, en, ru"
              value={form.languages}
              onChange={(e) => setForm({ ...form, languages: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Qiymət (AZN)</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.priceAzn}
              onChange={(e) => setForm({ ...form, priceAzn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Avatar URL</label>
            <input
              className={inputCls}
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Bağlı istifadəçi (opsional)</label>
            <select
              className={inputCls}
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            >
              <option value="" className="bg-ink text-[#F3EFE6]">— seçilməyib —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-ink text-[#F3EFE6]">
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#6b6485]">
              Astroloqun özü sistemdə giriş hesabı varsa, bura bağlayın — yalnız bu halda ona rezervasiya bildirişi
              göndərilir.
            </p>
          </div>

          <div className="sm:col-span-2 border-t border-white/10 pt-4 text-xs text-[#8b84a8]">
            Tərcümələr (opsional)
          </div>
          <div>
            <label className={labelCls}>Ünvan/Titul (EN)</label>
            <input
              className={inputCls}
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Ünvan/Titul (RU)</label>
            <input
              className={inputCls}
              value={form.titleRu}
              onChange={(e) => setForm({ ...form, titleRu: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Bio (EN)</label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.bioEn}
              onChange={(e) => setForm({ ...form, bioEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Bio (RU)</label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.bioRu}
              onChange={(e) => setForm({ ...form, bioRu: e.target.value })}
            />
          </div>

          {formError && <div className="sm:col-span-2 text-sm text-red-300">{formError}</div>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition disabled:opacity-50"
            >
              {saving ? "Saxlanılır…" : editingId ? "Yenilə" : "Yarat"}
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ad və ya ixtisasda axtar…"
          className="mb-4 px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
        />
      )}

      <div className={cardCls + " overflow-x-auto"}>
        {loading ? (
          <div className="text-sm text-mist">Yüklənir…</div>
        ) : filteredList.length === 0 ? (
          <div className="text-sm text-mist">{q ? "Bu axtarışa uyğun astroloq tapılmadı." : "Astroloq tapılmadı."}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#8b84a8] border-b border-white/10">
                <th className="py-2 pr-4">Ad</th>
                <th className="py-2 pr-4">İxtisaslar</th>
                <th className="py-2 pr-4">Qiymət</th>
                <th className="py-2 pr-4">Reytinq</th>
                <th className="py-2 pr-4">Təsdiq</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredList.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 pr-4">{a.displayName}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{a.specialties.join(", ") || "—"}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{a.priceAzn} AZN</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{a.rating.toFixed(1)}</td>
                  <td className="py-2.5 pr-4">
                    <button
                      onClick={() => toggleVerify(a)}
                      disabled={busyId === a.id}
                      className={
                        "px-2.5 py-1 rounded-full text-xs border transition disabled:opacity-50 " +
                        (a.verified
                          ? "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
                          : "border-white/15 text-mist hover:border-gold/40")
                      }
                    >
                      {a.verified ? "Təsdiqlənib" : "Təsdiqlənməyib"}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(a)}
                      className="text-xs text-gold/80 hover:text-gold mr-3"
                    >
                      Redaktə
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={busyId === a.id}
                      className="text-xs text-red-300/80 hover:text-red-300 disabled:opacity-50"
                    >
                      Sil
                    </button>
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
