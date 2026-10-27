import { useEffect, useRef, useState, type FormEvent } from "react";
import { chatApi, ApiError, type ChatThreadDto, type ChatMessageDto } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

export default function ChatPage() {
  const { t, lang } = useI18n();
  const SUGGESTIONS = [
    t("chat.suggestion1"),
    t("chat.suggestion2"),
    t("chat.suggestion3"),
    t("chat.suggestion4"),
  ];
  const [threads, setThreads] = useState<ChatThreadDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function refreshThreads(selectId?: string) {
    return chatApi
      .threads()
      .then((list) => {
        const sorted = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setThreads(sorted);
        if (selectId) {
          setActiveId(selectId);
        } else if (!activeId && sorted.length > 0) {
          setActiveId(sorted[0].id);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t("chat.errLoad")));
  }

  useEffect(() => {
    refreshThreads().finally(() => setLoadingThreads(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    chatApi
      .messages(activeId)
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : t("chat.errLoadMessages")))
      .finally(() => setLoadingMessages(false));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  async function newThread() {
    setError(null);
    try {
      const thread = await chatApi.createThread();
      await refreshThreads(thread.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("chat.errNewChat"));
    }
  }

  async function removeThread(id: string) {
    if (!window.confirm(t("chat.deleteChatConfirm"))) return;
    setError(null);
    try {
      await chatApi.deleteThread(id);
      if (activeId === id) setActiveId(null);
      await refreshThreads();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("chat.errDelete"));
    }
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || sending) return;
    setError(null);
    setSending(true);
    setInput("");

    let threadId = activeId;
    try {
      if (!threadId) {
        const thread = await chatApi.createThread();
        threadId = thread.id;
        setActiveId(threadId);
        refreshThreads(threadId);
      }

      // Optimistik: istifadəçinin öz mesajını dərhal göstər.
      const optimistic: ChatMessageDto = {
        id: `temp-${Date.now()}`,
        threadId,
        userId: "",
        role: "user",
        content: clean,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      await chatApi.sendMessage(threadId, clean, lang);
      // Server tərəfi həm istifadəçi, həm də AI cavabını saxlayır — tam siyahını
      // yenidən çəkmək optimistik mesajın həqiqi versiyası ilə üst-üstə düşməsini
      // təmin edir (id/createdAt fərqləri qalmasın deyə).
      const full = await chatApi.messages(threadId);
      setMessages(full);
      refreshThreads(threadId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("chat.errSend"));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  const empty = messages.length === 0 && !loadingMessages;

  return (
    <Page>
      <PageHeader
        kicker={t("chat.kicker")}
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
      />

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-2">
          <button
            type="button"
            onClick={newThread}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
          >
            <span className="text-base leading-none">+</span> {t("chat.newChat")}
          </button>
          {loadingThreads ? (
            <p className="text-center text-mist text-sm py-4">{t("common.loading")}</p>
          ) : (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={
                    "group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition " +
                    (thread.id === activeId ? "border-gold/50 bg-gold/10 text-white" : "border-white/8 text-mist hover:border-gold/30")
                  }
                >
                  <button type="button" onClick={() => setActiveId(thread.id)} className="flex-1 truncate text-left">
                    {thread.title || t("chat.untitledChat")}
                  </button>
                  <button
                    type="button"
                    aria-label={t("chat.deleteChatAria")}
                    onClick={() => removeThread(thread.id)}
                    className="opacity-0 group-hover:opacity-100 text-mist hover:text-red-400 transition shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="lg:col-span-9 rounded-2xl border border-white/5 bg-celestial-card/50 p-5 flex flex-col min-h-[60vh]">
          <div className="flex-1 space-y-5 overflow-y-auto max-h-[55vh] pr-1">
            {loadingMessages ? (
              <p className="text-center text-mist text-sm py-10">{t("common.loading")}</p>
            ) : empty ? (
              <div className="py-10 text-center">
                <span className="text-5xl">☾</span>
                <p className="mt-4 text-mist">{t("chat.emptyPrompt")}</p>
                <div className="mt-5 grid sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="text-left text-sm rounded-xl border border-white/10 px-4 py-3 text-mist hover:border-gold/40 hover:text-white transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl bg-gold text-ink px-4 py-2.5 text-sm whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <span className="size-7 shrink-0 grid place-items-center rounded-full border border-gold/40 text-gold text-xs">
                      ☾
                    </span>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                ),
              )
            )}

            {sending && (
              <div className="flex gap-3">
                <span className="size-7 shrink-0 grid place-items-center rounded-full border border-gold/40 text-gold text-xs">
                  ☾
                </span>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-mist">{t("chat.thinking")}</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={submit} className="mt-4 flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={t("chat.inputPlaceholder")}
              disabled={sending}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm resize-none placeholder:text-mist/70 focus:outline-none focus:border-gold/50"
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              className="size-11 grid place-items-center rounded-full bg-gold text-ink hover:bg-goldsoft transition disabled:opacity-40"
              aria-label={t("chat.sendAria")}
            >
              ➤
            </button>
          </form>
          <p className="mt-2 text-[11px] text-mist">
            {t("chat.disclaimer")}
          </p>
        </section>
      </div>
    </Page>
  );
}
