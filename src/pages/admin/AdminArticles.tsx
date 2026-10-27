import { useEffect, useState, type FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi, ApiError, type ArticleDto, type CreateArticleRequest } from "../../lib/api";

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/50";
const labelCls = "block text-xs text-[#8b84a8] mb-1";
const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

const EMPTY_FORM: CreateArticleRequest = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  tag: "",
  coverUrl: "",
  published: false,
  titleEn: "",
  titleRu: "",
  excerptEn: "",
  excerptRu: "",
  bodyEn: "",
  bodyRu: "",
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateArticleRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [aiTopic, setAiTopic] = useState("");
  const [aiTag, setAiTag] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await adminApi.articles.list();
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setArticles(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Məqalələr yüklənərkən xəta baş verdi.");
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

  function openEdit(a: ArticleDto) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt ?? "",
      body: a.body,
      tag: a.tag,
      coverUrl: a.coverUrl ?? "",
      published: a.published,
      titleEn: "",
      titleRu: "",
      excerptEn: "",
      excerptRu: "",
      bodyEn: "",
      bodyRu: "",
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload: CreateArticleRequest = {
      ...form,
      slug: form.slug || null,
      excerpt: form.excerpt || null,
      coverUrl: form.coverUrl || null,
      titleEn: form.titleEn || null,
      titleRu: form.titleRu || null,
      excerptEn: form.excerptEn || null,
      excerptRu: form.excerptRu || null,
      bodyEn: form.bodyEn || null,
      bodyRu: form.bodyRu || null,
    };
    try {
      if (editingId) {
        await adminApi.articles.update(editingId, payload);
      } else {
        await adminApi.articles.create(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Məqalə saxlanarkən xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Məqaləni silmək istədiyinizə əminsiniz?")) return;
    setBusyId(id);
    try {
      await adminApi.articles.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Məqalə silinərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublish(a: ArticleDto) {
    setBusyId(a.id);
    try {
      await adminApi.articles.publish(a.id, !a.published);
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, published: !a.published } : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function generateAi() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await adminApi.articles.generateAi({ topic: aiTopic, tag: aiTag || null });
      setEditingId(null);
      setForm({ ...EMPTY_FORM, title: result.title, excerpt: result.excerpt, body: result.body, tag: result.tag });
      setShowForm(true);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : "AI məzmun yaradılarkən xəta baş verdi.");
    } finally {
      setAiLoading(false);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredArticles = articles.filter(
    (a) =>
      (statusFilter === "all" ||
        (statusFilter === "published" ? a.published : !a.published)) &&
      (!q || a.title.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q))
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-3xl">Məqalələr</h1>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
        >
          {showForm ? "Bağla" : "+ Yeni məqalə"}
        </button>
      </div>
      <p className="text-sm text-mist mt-1 mb-5">Qəzet məqalələri, AI ilə yaratma, dərc/qaralama idarəetməsi.</p>

      <div className={cardCls + " mb-6"}>
        <div className="text-sm font-medium text-[#F3EFE6] mb-3">AI ilə məzmun yarat</div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelCls}>Mövzu</label>
            <input
              className={inputCls}
              placeholder="məs. Mars retroqrad dövrü nə deməkdir?"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className={labelCls}>Teq (opsional)</label>
            <input className={inputCls} value={aiTag} onChange={(e) => setAiTag(e.target.value)} />
          </div>
          <button
            onClick={generateAi}
            disabled={aiLoading || !aiTopic.trim()}
            className="px-4 py-2 rounded-xl border border-gold/40 text-gold text-sm hover:bg-gold/10 transition disabled:opacity-50"
          >
            {aiLoading ? "Yaradılır…" : "AI ilə yarat"}
          </button>
        </div>
        {aiError && <div className="mt-3 text-sm text-red-300">{aiError}</div>}
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className={cardCls + " mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          <div className="sm:col-span-2 text-sm font-medium text-[#F3EFE6]">
            {editingId ? "Məqaləni redaktə et" : "Yeni məqalə"}
          </div>
          <div>
            <label className={labelCls}>Başlıq (AZ)</label>
            <input
              className={inputCls}
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Slug (opsional)</label>
            <input
              className={inputCls}
              value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Teq</label>
            <input
              className={inputCls}
              required
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Üz şəkli URL (opsional)</label>
            <input
              className={inputCls}
              value={form.coverUrl ?? ""}
              onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Qısa məzmun</label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.excerpt ?? ""}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Mətn (AZ)</label>
            <textarea
              className={inputCls}
              rows={6}
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2 border-t border-white/10 pt-4 text-xs text-[#8b84a8]">
            Tərcümələr (opsional — boş saxlanarsa, mövcud tərcümə yazılmayacaq/silinəcək, çünki admin siyahısı
            tərcümələri geri qaytarmır)
          </div>
          <div>
            <label className={labelCls}>Başlıq (EN)</label>
            <input
              className={inputCls}
              value={form.titleEn ?? ""}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Başlıq (RU)</label>
            <input
              className={inputCls}
              value={form.titleRu ?? ""}
              onChange={(e) => setForm({ ...form, titleRu: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Qısa məzmun (EN)</label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.excerptEn ?? ""}
              onChange={(e) => setForm({ ...form, excerptEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Qısa məzmun (RU)</label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.excerptRu ?? ""}
              onChange={(e) => setForm({ ...form, excerptRu: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Mətn (EN)</label>
            <textarea
              className={inputCls}
              rows={4}
              value={form.bodyEn ?? ""}
              onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Mətn (RU)</label>
            <textarea
              className={inputCls}
              rows={4}
              value={form.bodyRu ?? ""}
              onChange={(e) => setForm({ ...form, bodyRu: e.target.value })}
            />
          </div>

          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-mist">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Dərc olunsun
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

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-1.5">
          {(["all", "published", "draft"] as const).map((s) => (
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
              {s === "all" ? "Hamısı" : s === "published" ? "Dərc olunub" : "Qaralama"}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Başlıq və ya teqdə axtar…"
          className="px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
        />
      </div>

      <div className={cardCls + " overflow-x-auto"}>
        {loading ? (
          <div className="text-sm text-mist">Yüklənir…</div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-sm text-mist">
            {q || statusFilter !== "all" ? "Bu axtarışa/filtrə uyğun məqalə tapılmadı." : "Məqalə tapılmadı."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#8b84a8] border-b border-white/10">
                <th className="py-2 pr-4">Başlıq</th>
                <th className="py-2 pr-4">Teq</th>
                <th className="py-2 pr-4">Baxış</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredArticles.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 pr-4">{a.title}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{a.tag}</td>
                  <td className="py-2.5 pr-4 text-[#8b84a8]">{a.views}</td>
                  <td className="py-2.5 pr-4">
                    <button
                      onClick={() => togglePublish(a)}
                      disabled={busyId === a.id}
                      className={
                        "px-2.5 py-1 rounded-full text-xs border transition disabled:opacity-50 " +
                        (a.published
                          ? "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
                          : "border-white/15 text-mist hover:border-gold/40")
                      }
                    >
                      {a.published ? "Dərc olunub" : "Qaralama"}
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
