import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { forumApi, ApiError, type ForumTopicDto, type ForumReplyDto } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Page } from "../components/Page";
import { useI18n, pickLocalized } from "../lib/i18n";

export default function ForumTopicPage() {
  const { t, lang, locale } = useI18n();
  const CATEGORY_LABELS: Record<string, string> = {
    ümumi: t("forum.categoryGeneral"),
    "sual-cavab": t("forum.categoryQa"),
    tarot: t("forum.categoryTarot"),
    astrologiya: t("forum.categoryAstrology"),
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topic, setTopic] = useState<ForumTopicDto | null>(null);
  const [replies, setReplies] = useState<ForumReplyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  function refresh() {
    if (!id) return Promise.resolve();
    return Promise.all([forumApi.topic(id), forumApi.replies(id)]).then(([t, r]) => {
      setTopic(t);
      setReplies(r);
    });
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof ApiError ? err.message : t("forumTopic.errLoad")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function sendReply(e: FormEvent) {
    e.preventDefault();
    if (!id || !replyText.trim()) return;
    setError(null);
    setSending(true);
    try {
      await forumApi.createReply(id, { body: replyText });
      setReplyText("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("forumTopic.errReply"));
    } finally {
      setSending(false);
    }
  }

  async function removeTopic() {
    if (!id || !window.confirm(t("forumTopic.deleteConfirmTopic"))) return;
    try {
      await forumApi.deleteTopic(id);
      navigate("/forum");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("forumTopic.errDelete"));
    }
  }

  async function removeReply(replyId: string) {
    if (!window.confirm(t("forumTopic.deleteConfirmReply"))) return;
    try {
      await forumApi.deleteReply(replyId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("forumTopic.errDelete"));
    }
  }

  return (
    <Page>
      <Link to="/forum" className="text-sm text-mist hover:text-goldsoft transition">
        {t("forumTopic.backLink")}
      </Link>

      {loading && <p className="text-mist text-sm mt-5">{t("common.loading")}</p>}

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mt-5">
          {error}
        </p>
      )}

      {!loading && topic && (
        <>
          <article className="mt-5 rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-mist">
                <span className="px-2.5 py-1 rounded-full border border-violet/30 text-violet">
                  {CATEGORY_LABELS[topic.category] ?? topic.category}
                </span>
                <span>{new Date(topic.createdAt).toLocaleString(locale, { hour12: false })}</span>
              </div>
              {topic.userId === user?.userId && (
                <button onClick={removeTopic} className="text-xs text-mist hover:text-red-300 transition">
                  {t("forumTopic.delete")}
                </button>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl mt-3">{pickLocalized(lang, topic.title, topic.titleEn, topic.titleRu)}</h1>
            <p className="text-xs text-mist mt-1">{topic.authorName}</p>
            <p className="mt-4 text-white/85 leading-relaxed whitespace-pre-wrap">{pickLocalized(lang, topic.body, topic.bodyEn, topic.bodyRu)}</p>
          </article>

          <h2 className="font-display text-2xl mt-8 mb-3">{t("forumTopic.repliesTitle")} ({replies.length})</h2>
          <div className="space-y-3">
            {replies.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white/5 border border-white/5 p-4">
                <div className="flex justify-between text-xs text-mist">
                  <span>{r.authorName}</span>
                  <div className="flex items-center gap-2">
                    <span>{new Date(r.createdAt).toLocaleDateString(locale)}</span>
                    {r.userId === user?.userId && (
                      <button onClick={() => removeReply(r.id)} className="text-mist hover:text-red-300 transition">
                        {t("forumTopic.delete")}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/85 whitespace-pre-wrap">{r.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {user ? (
              <form onSubmit={sendReply} className="space-y-3">
                <label className="block text-xs text-mist">{t("forumTopic.yourReply")}</label>
                <textarea
                  rows={4}
                  value={replyText}
                  maxLength={2000}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-gold/50"
                  required
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-6 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
                >
                  {sending ? t("forumTopic.sending") : t("forumTopic.send")}
                </button>
              </form>
            ) : (
              <p className="text-sm text-mist">
                {t("forumTopic.loginToReply")}{" "}
                <Link to="/giris" className="text-goldsoft hover:text-gold">
                  {t("forumTopic.loginLink")}
                </Link>
                .
              </p>
            )}
          </div>
        </>
      )}
    </Page>
  );
}
