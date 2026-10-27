import { useEffect, useState, type FormEvent } from "react";
import { journalApi, ApiError, type JournalEntryDto } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function JournalPage() {
  const { t, locale } = useI18n();
  const [entries, setEntries] = useState<JournalEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState(todayStr());
  const [mood, setMood] = useState(3);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [transitNote, setTransitNote] = useState("");

  function resetForm() {
    setEditingId(null);
    setEntryDate(todayStr());
    setMood(3);
    setTitle("");
    setContent("");
    setTransitNote("");
  }

  function refresh() {
    return journalApi
      .list()
      .then((list) => setEntries([...list].sort((a, b) => b.entryDate.localeCompare(a.entryDate))))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("journal.errLoad")));
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  function startEdit(entry: JournalEntryDto) {
    setEditingId(entry.id);
    setEntryDate(entry.entryDate.slice(0, 10));
    setMood(entry.mood);
    setTitle(entry.title ?? "");
    setContent(entry.content);
    setTransitNote(entry.transitNote ?? "");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        entryDate,
        mood,
        title: title || null,
        content,
        transitNote: transitNote || null,
      };
      if (editingId) {
        await journalApi.update(editingId, payload);
      } else {
        await journalApi.create(payload);
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("journal.errSave"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("journal.deleteConfirm"))) return;
    setError(null);
    try {
      await journalApi.remove(id);
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("journal.errDelete"));
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/60 focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";
  const cardClass = "rounded-3xl border border-white/10 bg-celestial-card/40 p-7";

  return (
    <Page>
      <PageHeader kicker={t("journal.kicker")} title={t("journal.title")} subtitle={t("journal.subtitle")} />

      <form onSubmit={submit} className={cardClass + " mb-6 space-y-4"}>
          <h2 className="font-display text-xl mb-1">{editingId ? t("journal.editEntry") : t("journal.newEntry")}</h2>

          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("journal.date")}</label>
              <input
                type="date"
                className={inputClass}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t("journal.mood")}</label>
              <div className="flex gap-1.5">
                {MOODS.map((emoji, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMood(value)}
                      className={
                        "flex-1 text-lg py-1.5 rounded-xl border transition " +
                        (mood === value
                          ? "border-gold/60 bg-gold/10"
                          : "border-white/10 bg-white/[0.02] opacity-60 hover:opacity-100")
                      }
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("journal.titleOptional")}</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>{t("journal.content")}</label>
            <textarea
              className={inputClass}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>{t("journal.transitNote")}</label>
            <input
              className={inputClass}
              placeholder={t("journal.transitNotePlaceholder")}
              value={transitNote}
              onChange={(e) => setTransitNote(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !content}
              className="flex-1 px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
            >
              {saving ? t("journal.saving") : editingId ? t("journal.update") : t("journal.add")}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-full border border-white/15 text-sm text-mist hover:border-white/30 transition"
              >
                {t("journal.cancel")}
              </button>
            )}
          </div>
      </form>

      {loading && <p className="text-center text-mist text-sm">{t("common.loading")}</p>}

      {!loading && entries.length === 0 && (
        <p className="text-center text-mist text-sm">{t("journal.empty")}</p>
      )}

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className={cardClass + " py-5"}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{MOODS[entry.mood - 1] ?? "😐"}</span>
                <div>
                  <p className="text-sm text-mist/70">
                    {new Date(entry.entryDate).toLocaleDateString(locale)}
                  </p>
                  {entry.title && <h3 className="font-display text-base text-[#F3EFE6]">{entry.title}</h3>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(entry)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-mist hover:border-gold/40 hover:text-gold transition"
                >
                  {t("journal.edit")}
                </button>
                <button
                  onClick={() => remove(entry.id)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-mist hover:border-red-400/40 hover:text-red-300 transition"
                >
                  {t("journal.delete")}
                </button>
              </div>
            </div>
            <p className="text-sm text-[#F3EFE6] mt-3 whitespace-pre-wrap">{entry.content}</p>
            {entry.transitNote && <p className="text-xs text-mist/70 mt-2">✦ {entry.transitNote}</p>}
          </div>
        ))}
      </div>
    </Page>
  );
}
