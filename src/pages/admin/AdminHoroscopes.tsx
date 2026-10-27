import { useState, type FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import { horoscopeApi, adminApi, ApiError, type HoroscopeDto } from "../../lib/api";
import { SIGN_LABELS, signLabel } from "../../lib/signs";

const SIGNS = Object.keys(SIGN_LABELS);
const PERIODS: Array<[string, string]> = [
  ["daily", "Gündəlik"],
  ["weekly", "Həftəlik"],
  ["monthly", "Aylıq"],
];

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/50";
const labelCls = "block text-xs text-[#8b84a8] mb-1";
const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

interface FormState {
  periodStart: string;
  content: string;
  love: number;
  career: number;
  finance: number;
  contentEn: string;
  contentRu: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM: FormState = {
  periodStart: today(),
  content: "",
  love: 5,
  career: 5,
  finance: 5,
  contentEn: "",
  contentRu: "",
};

export default function AdminHoroscopesPage() {
  const [sign, setSign] = useState(SIGNS[0]);
  const [period, setPeriod] = useState("daily");

  const [lookupResult, setLookupResult] = useState<HoroscopeDto | null>(null);
  const [lookupNotFound, setLookupNotFound] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function doLookup(e?: FormEvent) {
    e?.preventDefault();
    setLookupError(null);
    setLookupNotFound(false);
    setLookupResult(null);
    setShowForm(false);
    setLookupLoading(true);
    try {
      const data = await horoscopeApi.current(sign, period);
      setLookupResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLookupNotFound(true);
      } else {
        setLookupError(err instanceof ApiError ? err.message : "Axtarış zamanı xəta baş verdi.");
      }
    } finally {
      setLookupLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, periodStart: today() });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit() {
    if (!lookupResult) return;
    setEditingId(lookupResult.id);
    setForm({
      periodStart: lookupResult.periodStart.slice(0, 10),
      content: lookupResult.content,
      love: lookupResult.love,
      career: lookupResult.career,
      finance: lookupResult.finance,
      contentEn: "",
      contentRu: "",
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await adminApi.horoscopes.update(editingId, {
          content: form.content,
          love: form.love,
          career: form.career,
          finance: form.finance,
          contentEn: form.contentEn || null,
          contentRu: form.contentRu || null,
        });
      } else {
        await adminApi.horoscopes.create({
          sign,
          period,
          periodStart: form.periodStart,
          content: form.content,
          love: form.love,
          career: form.career,
          finance: form.finance,
          contentEn: form.contentEn || null,
          contentRu: form.contentRu || null,
        });
      }
      setShowForm(false);
      await doLookup();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Horoskop saxlanarkən xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!lookupResult) return;
    if (!confirm("Bu horoskop yazısını silmək istədiyinizə əminsiniz?")) return;
    setSaving(true);
    try {
      await adminApi.horoscopes.remove(lookupResult.id);
      setShowForm(false);
      await doLookup();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Silinərkən xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Horoskoplar</h1>
        <p className="text-sm text-mist mt-1">
          Bürc və dövr seçərək mövcud horoskopu tap, redaktə et və ya yeni yaz.
        </p>
      </div>

      <form onSubmit={doLookup} className={cardCls + " mb-6 flex flex-wrap gap-3 items-end"}>
        <div className="w-48">
          <label className={labelCls}>Bürc</label>
          <select className={inputCls} value={sign} onChange={(e) => setSign(e.target.value)}>
            {SIGNS.map((s) => (
              <option key={s} value={s} className="bg-ink text-[#F3EFE6]">
                {signLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className={labelCls}>Dövr</label>
          <select className={inputCls} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map(([v, l]) => (
              <option key={v} value={v} className="bg-ink text-[#F3EFE6]">
                {l}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={lookupLoading}
          className="px-4 py-2 rounded-xl border border-gold/40 text-gold text-sm hover:bg-gold/10 transition disabled:opacity-50"
        >
          {lookupLoading ? "Axtarılır…" : "Axtar"}
        </button>
      </form>

      {lookupError && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {lookupError}
        </div>
      )}

      {lookupNotFound && (
        <div className={cardCls + " mb-6"}>
          <p className="text-sm text-mist mb-4">
            {signLabel(sign)} üçün {PERIODS.find(([v]) => v === period)?.[1].toLowerCase()} horoskop tapılmadı.
          </p>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
          >
            + Yeni yarat
          </button>
        </div>
      )}

      {lookupResult && !showForm && (
        <div className={cardCls + " mb-6"}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="text-sm font-medium text-[#F3EFE6]">
              {signLabel(sign)} · {PERIODS.find(([v]) => v === period)?.[1]} ·{" "}
              {new Date(lookupResult.periodStart).toLocaleDateString("az-AZ")}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={openEdit} className="text-xs text-gold/80 hover:text-gold">
                Redaktə et
              </button>
              <button onClick={handleDelete} className="text-xs text-red-300/80 hover:text-red-300">
                Sil
              </button>
            </div>
          </div>
          <p className="text-sm text-mist whitespace-pre-wrap mb-3">{lookupResult.content}</p>
          <div className="flex gap-4 text-xs text-[#8b84a8]">
            <span>Sevgi: {lookupResult.love}/10</span>
            <span>Karyera: {lookupResult.career}/10</span>
            <span>Maliyyə: {lookupResult.finance}/10</span>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className={cardCls + " grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          <div className="sm:col-span-2 text-sm font-medium text-[#F3EFE6]">
            {editingId ? "Horoskopu redaktə et" : "Yeni horoskop"} — {signLabel(sign)} ·{" "}
            {PERIODS.find(([v]) => v === period)?.[1]}
          </div>
          {!editingId && (
            <div>
              <label className={labelCls}>Dövrün başlanğıcı</label>
              <input
                type="date"
                className={inputCls}
                required
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className={labelCls}>Mətn (AZ)</label>
            <textarea
              className={inputCls}
              rows={4}
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Sevgi (1–10)</label>
            <input
              type="number"
              min={1}
              max={10}
              className={inputCls}
              value={form.love}
              onChange={(e) => setForm({ ...form, love: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelCls}>Karyera (1–10)</label>
            <input
              type="number"
              min={1}
              max={10}
              className={inputCls}
              value={form.career}
              onChange={(e) => setForm({ ...form, career: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelCls}>Maliyyə (1–10)</label>
            <input
              type="number"
              min={1}
              max={10}
              className={inputCls}
              value={form.finance}
              onChange={(e) => setForm({ ...form, finance: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2 border-t border-white/10 pt-4 text-xs text-[#8b84a8]">
            Tərcümələr (opsional — boş saxlanarsa mövcud tərcümə yenilənməyəcək/silinəcək)
          </div>
          <div>
            <label className={labelCls}>Mətn (EN)</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.contentEn}
              onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Mətn (RU)</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.contentRu}
              onChange={(e) => setForm({ ...form, contentRu: e.target.value })}
            />
          </div>

          {formError && <div className="sm:col-span-2 text-sm text-red-300">{formError}</div>}
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition disabled:opacity-50"
            >
              {saving ? "Saxlanılır…" : editingId ? "Yenilə" : "Yarat"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-mist hover:text-[#F3EFE6]"
            >
              Ləğv et
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
