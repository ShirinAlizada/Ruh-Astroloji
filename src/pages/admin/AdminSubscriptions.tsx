import { useEffect, useState, type FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  adminApi,
  ApiError,
  type AdminSubscriptionPlanDto,
  type CreateSubscriptionPlanRequest,
} from "../../lib/api";

const BILLING_PERIODS = ["monthly", "yearly"];

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/50";
const labelCls = "block text-xs text-[#8b84a8] mb-1";
const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

interface FormState {
  key: string;
  name: string;
  tagline: string;
  taglineEn: string;
  taglineRu: string;
  priceAzn: string;
  billingPeriod: string;
  features: string; // sətir-sətir
  featuresEn: string;
  featuresRu: string;
  aiMessagesPerDay: string; // boşdursa limitsiz/yoxdur
  synastryFullDetail: boolean;
  bookingDiscountPct: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  key: "",
  name: "",
  tagline: "",
  taglineEn: "",
  taglineRu: "",
  priceAzn: "0",
  billingPeriod: "monthly",
  features: "",
  featuresEn: "",
  featuresRu: "",
  aiMessagesPerDay: "",
  synastryFullDetail: false,
  bookingDiscountPct: "0",
  sortOrder: "0",
  isActive: true,
};

function toLines(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<AdminSubscriptionPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await adminApi.subscriptions.list();
      setPlans(list.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Paketlər yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: AdminSubscriptionPlanDto) {
    setEditingId(p.id);
    setForm({
      key: p.key,
      name: p.name,
      tagline: p.tagline ?? "",
      taglineEn: p.taglineEn ?? "",
      taglineRu: p.taglineRu ?? "",
      priceAzn: String(p.priceAzn),
      billingPeriod: p.billingPeriod,
      features: p.features.join("\n"),
      featuresEn: (p.featuresEn ?? []).join("\n"),
      featuresRu: (p.featuresRu ?? []).join("\n"),
      aiMessagesPerDay: p.aiMessagesPerDay != null ? String(p.aiMessagesPerDay) : "",
      synastryFullDetail: p.synastryFullDetail,
      bookingDiscountPct: String(p.bookingDiscountPct),
      sortOrder: String(p.sortOrder),
      isActive: p.isActive,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload: CreateSubscriptionPlanRequest = {
      key: form.key,
      name: form.name,
      tagline: form.tagline || null,
      taglineEn: form.taglineEn || null,
      taglineRu: form.taglineRu || null,
      priceAzn: Number(form.priceAzn) || 0,
      billingPeriod: form.billingPeriod,
      features: toLines(form.features),
      featuresEn: form.featuresEn ? toLines(form.featuresEn) : null,
      featuresRu: form.featuresRu ? toLines(form.featuresRu) : null,
      aiMessagesPerDay: form.aiMessagesPerDay ? Number(form.aiMessagesPerDay) : null,
      synastryFullDetail: form.synastryFullDetail,
      bookingDiscountPct: Number(form.bookingDiscountPct) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await adminApi.subscriptions.update(editingId, payload);
      } else {
        await adminApi.subscriptions.create(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Paket saxlanarkən xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Paketi silmək istədiyinizə əminsiniz?")) return;
    setBusyId(id);
    try {
      await adminApi.subscriptions.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Paket silinərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-3xl">Abunəlik paketləri</h1>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
        >
          {showForm ? "Bağla" : "+ Yeni paket"}
        </button>
      </div>
      <p className="text-sm text-mist mt-1 mb-5">Paket qiymət, dövriyyə və xüsusiyyətlərinin idarəetməsi.</p>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className={cardCls + " mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          <div className="sm:col-span-2 text-sm font-medium text-[#F3EFE6]">
            {editingId ? "Paketi redaktə et" : "Yeni paket"}
          </div>
          <div>
            <label className={labelCls}>Açar (key, unikal)</label>
            <input
              className={inputCls}
              required
              disabled={!!editingId}
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Ad</label>
            <input
              className={inputCls}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            <label className={labelCls}>Dövriyyə</label>
            <select
              className={inputCls}
              value={form.billingPeriod}
              onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}
            >
              {BILLING_PERIODS.map((b) => (
                <option key={b} value={b} className="bg-ink text-[#F3EFE6]">
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Tagline (AZ)</label>
            <input
              className={inputCls}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Xüsusiyyətlər (AZ, hər sətirdə bir xüsusiyyət)</label>
            <textarea
              className={inputCls}
              rows={4}
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Gündəlik AI mesaj limiti (boş = limit yoxdur)</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.aiMessagesPerDay}
              onChange={(e) => setForm({ ...form, aiMessagesPerDay: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Görüş endirimi (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              className={inputCls}
              value={form.bookingDiscountPct}
              onChange={(e) => setForm({ ...form, bookingDiscountPct: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Sıralama</label>
            <input
              type="number"
              className={inputCls}
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-mist">
              <input
                type="checkbox"
                checked={form.synastryFullDetail}
                onChange={(e) => setForm({ ...form, synastryFullDetail: e.target.checked })}
              />
              Tam sinastriya detalı
            </label>
          </div>

          <div className="sm:col-span-2 border-t border-white/10 pt-4 text-xs text-[#8b84a8]">
            Tərcümələr (opsional)
          </div>
          <div>
            <label className={labelCls}>Tagline (EN)</label>
            <input
              className={inputCls}
              value={form.taglineEn}
              onChange={(e) => setForm({ ...form, taglineEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Tagline (RU)</label>
            <input
              className={inputCls}
              value={form.taglineRu}
              onChange={(e) => setForm({ ...form, taglineRu: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Xüsusiyyətlər (EN, hər sətirdə bir)</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.featuresEn}
              onChange={(e) => setForm({ ...form, featuresEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Xüsusiyyətlər (RU, hər sətirdə bir)</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.featuresRu}
              onChange={(e) => setForm({ ...form, featuresRu: e.target.value })}
            />
          </div>

          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-mist">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Aktiv (satışda göstərilsin)
          </label>

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

      <div className={cardCls + " overflow-x-auto"}>
        {loading ? (
          <div className="text-sm text-mist">Yüklənir…</div>
        ) : plans.length === 0 ? (
          <div className="text-sm text-mist">Paket tapılmadı.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#8b84a8] border-b border-white/10">
                <th className="py-2 pr-4">Ad</th>
                <th className="py-2 pr-4">Açar</th>
                <th className="py-2 pr-4">Qiymət</th>
                <th className="py-2 pr-4">Dövriyyə</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plans.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-4">{p.name}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{p.key}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{p.priceAzn} AZN</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{p.billingPeriod}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={
                        "px-2 py-0.5 rounded-full border text-xs " +
                        (p.isActive
                          ? "border-emerald-400/40 text-emerald-300"
                          : "border-white/15 text-mist")
                      }
                    >
                      {p.isActive ? "Aktiv" : "Deaktiv"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs text-gold/80 hover:text-gold mr-3"
                    >
                      Redaktə
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={busyId === p.id}
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
