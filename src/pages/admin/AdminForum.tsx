import { useEffect, useState, type FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  forumApi,
  adminApi,
  ApiError,
  type ForumTopicDto,
  type ForumReplyDto,
} from "../../lib/api";

const CATEGORIES = ["ümumi", "sual-cavab", "tarot", "astrologiya"];

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/50";
const labelCls = "block text-xs text-[#8b84a8] mb-1";
const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

export default function AdminForumPage() {
  const [category, setCategory] = useState("");
  const [topics, setTopics] = useState<ForumTopicDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [replies, setReplies] = useState<ForumReplyDto[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ authorName: "", category: "ümumi", title: "", body: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await forumApi.topics(category || undefined, 1, 100);
      setTopics(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mövzular yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function toggleOpenReplies(topicId: string) {
    if (openTopicId === topicId) {
      setOpenTopicId(null);
      return;
    }
    setOpenTopicId(topicId);
    setRepliesLoading(true);
    try {
      setReplies(await forumApi.replies(topicId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rəylər yüklənərkən xəta baş verdi.");
    } finally {
      setRepliesLoading(false);
    }
  }

  async function hideTopic(t: ForumTopicDto) {
    setBusyId(t.id);
    try {
      await adminApi.forum.hideTopic(t.id, !t.isHidden);
      setTopics((prev) => prev.map((x) => (x.id === t.id ? { ...x, isHidden: !t.isHidden } : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gizlilik dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTopic(id: string) {
    if (!confirm("Mövzunu silmək istədiyinizə əminsiniz?")) return;
    setBusyId(id);
    try {
      await forumApi.deleteTopic(id);
      if (openTopicId === id) setOpenTopicId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mövzu silinərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function hideReply(r: ForumReplyDto) {
    setBusyId(r.id);
    try {
      await adminApi.forum.hideReply(r.id, !r.isHidden);
      setReplies((prev) => prev.map((x) => (x.id === r.id ? { ...x, isHidden: !r.isHidden } : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gizlilik dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteReply(id: string, topicId: string) {
    if (!confirm("Rəyi silmək istədiyinizə əminsiniz?")) return;
    setBusyId(id);
    try {
      await forumApi.deleteReply(id);
      setReplies((prev) => prev.filter((x) => x.id !== id));
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, replyCount: Math.max(0, t.replyCount - 1) } : t)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rəy silinərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await adminApi.forum.createTopic(form);
      setForm({ authorName: "", category: "ümumi", title: "", body: "" });
      setShowCreate(false);
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Mövzu yaradılarkən xəta baş verdi.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-3xl">Forum moderasiyası</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
        >
          {showCreate ? "Bağla" : "+ Admin adından mövzu"}
        </button>
      </div>
      <p className="text-sm text-mist mt-1 mb-5">Mövzu və rəyləri gizlət, admin adından məzmun əlavə et.</p>

      <div className="mb-5 rounded-2xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-gold/90">
        Qeyd: bu siyahı istifadəçilərin gördüyü eyni ümumi mövzu siyahısıdır — backend-də yalnız admin üçün
        "bütün mövzular (gizlilər daxil)" ayrıca endpoint yoxdur. Gizlədilmiş mövzu bu siyahıda görünmürsə,
        onu birbaşa buradan geri aça bilmərik.
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className={cardCls + " mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          <div>
            <label className={labelCls}>Müəllif adı</label>
            <input
              className={inputCls}
              required
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Kateqoriya</label>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-ink text-[#F3EFE6]">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Başlıq</label>
            <input
              className={inputCls}
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Mətn</label>
            <textarea
              className={inputCls}
              rows={4}
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
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

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={
                "px-3 py-1.5 rounded-full text-sm border transition " +
                (category === c
                  ? "border-gold/50 text-gold bg-gold/10"
                  : "border-white/15 text-mist hover:border-gold/40")
              }
            >
              {c === "" ? "Hamısı" : c}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Başlıq və ya müəllifdə axtar…"
          className="px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
        />
      </div>

      <div className="grid gap-3">
        {(() => {
          const q = query.trim().toLowerCase();
          const filteredTopics = topics.filter(
            (t) => !q || t.title.toLowerCase().includes(q) || t.authorName.toLowerCase().includes(q)
          );
          if (loading) return <div className="text-sm text-mist">Yüklənir…</div>;
          if (filteredTopics.length === 0)
            return <div className="text-sm text-mist">{q ? "Bu axtarışa uyğun mövzu tapılmadı." : "Mövzu tapılmadı."}</div>;
          return filteredTopics.map((t) => (
            <div key={t.id} className={cardCls + (t.isHidden ? " opacity-60" : "")}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <div className="font-medium text-[#F3EFE6]">{t.title}</div>
                  <div className="text-xs text-[#8b84a8]">
                    {t.authorName} · {t.category} · {new Date(t.createdAt).toLocaleDateString("az-AZ")} ·{" "}
                    {t.replyCount} rəy
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {t.isHidden && (
                    <span className="px-2 py-0.5 rounded-full border border-red-400/40 text-red-300 text-xs">
                      Gizli
                    </span>
                  )}
                  <button
                    onClick={() => toggleOpenReplies(t.id)}
                    className="text-xs text-mist hover:text-[#F3EFE6]"
                  >
                    Rəylər ({t.replyCount})
                  </button>
                  <button
                    onClick={() => hideTopic(t)}
                    disabled={busyId === t.id}
                    className="text-xs text-gold/80 hover:text-gold disabled:opacity-50"
                  >
                    {t.isHidden ? "Göstər" : "Gizlət"}
                  </button>
                  <button
                    onClick={() => deleteTopic(t.id)}
                    disabled={busyId === t.id}
                    className="text-xs text-red-300/80 hover:text-red-300 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
              <p className="text-sm text-mist whitespace-pre-wrap">{t.body}</p>

              {openTopicId === t.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  {repliesLoading ? (
                    <div className="text-xs text-[#8b84a8]">Yüklənir…</div>
                  ) : replies.length === 0 ? (
                    <div className="text-xs text-[#8b84a8]">Rəy yoxdur.</div>
                  ) : (
                    <div className="grid gap-2">
                      {replies.map((r) => (
                        <div
                          key={r.id}
                          className={
                            "rounded-xl border border-white/10 bg-white/[0.02] p-3" +
                            (r.isHidden ? " opacity-60" : "")
                          }
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                            <span className="text-xs text-[#8b84a8]">
                              {r.authorName} · {new Date(r.createdAt).toLocaleDateString("az-AZ")}
                              {r.isHidden && <span className="ml-2 text-red-300">(Gizli)</span>}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => hideReply(r)}
                                disabled={busyId === r.id}
                                className="text-xs text-gold/80 hover:text-gold disabled:opacity-50"
                              >
                                {r.isHidden ? "Göstər" : "Gizlət"}
                              </button>
                              <button
                                onClick={() => deleteReply(r.id, t.id)}
                                disabled={busyId === r.id}
                                className="text-xs text-red-300/80 hover:text-red-300 disabled:opacity-50"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-mist">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ));
        })()}
      </div>
    </AdminLayout>
  );
}
