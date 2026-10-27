import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forumApi, ApiError, type ForumTopicDto } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Page, PageHeader } from "../components/Page";
import { useI18n, pickLocalized } from "../lib/i18n";

const CATEGORIES = ["ümumi", "sual-cavab", "tarot", "astrologiya"];

export default function ForumPage() {
  const { t, lang, locale } = useI18n();
  const CATEGORY_LABELS: Record<string, string> = {
    ümumi: t("forum.categoryGeneral"),
    "sual-cavab": t("forum.categoryQa"),
    tarot: t("forum.categoryTarot"),
    astrologiya: t("forum.categoryAstrology"),
  };
  const { user } = useAuth();
  const [topics, setTopics] = useState<ForumTopicDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const [newCategory, setNewCategory] = useState("ümumi");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [saving, setSaving] = useState(false);

  function refresh(cat?: string) {
    setLoading(true);
    return forumApi
      .topics(cat || undefined)
      .then((res) => setTopics(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("forum.errLoad")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createTopic(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await forumApi.createTopic({ category: newCategory, title: newTitle, body: newBody });
      setNewTitle("");
      setNewBody("");
      await refresh(filter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("forum.errCreate"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <PageHeader kicker={t("forum.kicker")} title={t("forum.title")} subtitle={t("forum.subtitle")} />

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-6">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {["", ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setFilter(c);
              refresh(c);
            }}
            className={
              "text-xs px-4 py-2 rounded-full border transition " +
              (filter === c ? "border-gold bg-gold/15 text-goldsoft" : "border-white/10 text-mist hover:border-gold/40")
            }
          >
            {c ? CATEGORY_LABELS[c] ?? c : t("common.all")}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          {loading && <p className="text-mist text-sm">{t("common.loading")}</p>}
          {!loading && topics.length === 0 && <p className="text-mist">{t("forum.noTopics")}</p>}
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/forum/${topic.id}`}
              className="block rounded-2xl bg-celestial-card/60 border border-white/5 p-5 hover:border-gold/30 transition"
            >
              <div className="flex items-center gap-3 text-xs text-mist">
                <span className="px-2.5 py-1 rounded-full border border-violet/30 text-violet">
                  {CATEGORY_LABELS[topic.category] ?? topic.category}
                </span>
                <span>{new Date(topic.createdAt).toLocaleDateString(locale)}</span>
                <span>· {topic.replyCount} {t("forum.repliesSuffix")}</span>
              </div>
              <h2 className="font-display text-2xl mt-2">{pickLocalized(lang, topic.title, topic.titleEn, topic.titleRu)}</h2>
              <p className="text-xs text-mist mt-3">{topic.authorName}</p>
            </Link>
          ))}
        </div>

        <aside className="lg:col-span-5 h-fit rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
          <h2 className="font-display text-2xl mb-4">{t("forum.newTopic")}</h2>
          {user ? (
            <form onSubmit={createTopic} className="space-y-4">
              <div>
                <label className="block text-xs text-mist mb-1.5">{t("forum.category")}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-ink">
                      {CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-mist mb-1.5">{t("forum.topicTitle")}</label>
                <input
                  value={newTitle}
                  maxLength={140}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-mist mb-1.5">{t("forum.bodyText")}</label>
                <textarea
                  rows={5}
                  value={newBody}
                  maxLength={3000}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-gold/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
              >
                {saving ? t("forum.publishing") : t("forum.publish")}
              </button>
            </form>
          ) : (
            <div className="text-sm text-mist">
              {t("forum.loginToPost")}{" "}
              <Link to="/giris" className="text-goldsoft hover:text-gold">
                {t("forum.loginLink")}
              </Link>
              .
            </div>
          )}
        </aside>
      </div>
    </Page>
  );
}
