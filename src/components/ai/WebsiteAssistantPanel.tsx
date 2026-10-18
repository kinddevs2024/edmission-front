import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  websiteAssistant,
  type AssistantMessage,
  type AssistantRequest,
  type AssistantSession,
} from "@/services/websiteAssistant";
import {
  assistantButtons,
  assistantReplyKeyboard,
  mergeAssistantSession,
  readAssistantPending,
} from "./assistantState";
import { assistantWords } from "./assistantCopy";
export function WebsiteAssistantPanel({
  userId,
  locale,
  open,
  onLanguageChange,
}: {
  userId: string;
  locale: keyof typeof assistantWords;
  open: boolean;
  onLanguageChange: (language: keyof typeof assistantWords) => void;
}) {
  const storageKey = `edmission-assistant-pending:${userId}`;
  const [session, setSession] = useState<AssistantSession | null>(null);
  const language = session?.lead?.language || session?.language || locale;
  const chosenLanguage =
    language === "ru" || language === "uz" || language === "en"
      ? language
      : locale;
  const l = assistantWords[chosenLanguage];
  useEffect(
    () => onLanguageChange(chosenLanguage),
    [chosenLanguage, onLanguageChange],
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState<AssistantRequest | null>(() => {
    try {
      return readAssistantPending(sessionStorage.getItem(storageKey));
    } catch {
      return null;
    }
  });
  const [text, setText] = useState("");
  const [olderBusy, setOlderBusy] = useState(false);
  const busyRef = useRef(false);
  const transcript = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef<AssistantSession | null>(null);
  const preserveScroll = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const apply = useCallback(
    (snapshot: AssistantSession, prepend = false) =>
      setSession((old) => {
        const result = mergeAssistantSession(old, snapshot, prepend);
        sessionRef.current = result;
        return result;
      }),
    [],
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const current = ++generation.current;
    setLoading(!sessionRef.current);
    setError(false);
    websiteAssistant
      .session(undefined, controller.signal)
      .then((snapshot) => {
        if (!controller.signal.aborted && current === generation.current)
          apply(snapshot);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    input.current?.focus();
    return () => controller.abort();
  }, [open, apply]);
  useEffect(() => {
    if (!open || (!sending && !session?.processing && !session?.typing)) return;
    let active = true;
    let polling = false;
    const controller = new AbortController();
    const timer = setInterval(() => {
      if (polling) return;
      polling = true;
      const current = generation.current;
      websiteAssistant
        .session(undefined, controller.signal)
        .then((snapshot) => {
          if (active && current === generation.current) apply(snapshot);
        })
        .catch(() => {})
        .finally(() => {
          polling = false;
        });
    }, 2000);
    return () => {
      active = false;
      clearInterval(timer);
      controller.abort();
    };
  }, [open, sending, session?.processing, session?.typing, apply]);
  useEffect(() => {
    if (preserveScroll.current) {
      preserveScroll.current = false;
      return;
    }
    if (open)
      transcript.current?.scrollTo({
        top: transcript.current.scrollHeight,
        behavior: "smooth",
      });
  }, [session?.messages, sending, open]);
  const savePending = (request: AssistantRequest | null) => {
    setPending(request);
    try {
      if (request) sessionStorage.setItem(storageKey, JSON.stringify(request));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* Server history remains authoritative. */
    }
  };
  const send = async (request: AssistantRequest) => {
    if (busyRef.current || session?.processing) return;
    busyRef.current = true;
    generation.current++;
    setSending(true);
    setError(false);
    savePending(request);
    try {
      const snapshot = await websiteAssistant.send(request);
      if (!mounted.current) return;
      generation.current++;
      apply(snapshot);
      savePending(null);
      if ("text" in request || !snapshot.lead) setText("");
    } catch (failure) {
      if (mounted.current) {
        const status = isAxiosError(failure)
          ? failure.response?.status
          : undefined;
        const mismatch =
          isAxiosError(failure) &&
          failure.response?.data?.error ===
            "Request identifier belongs to different content";
        if (status === 400 || status === 404 || status === 503 || mismatch) {
          savePending(null);
          try {
            apply(await websiteAssistant.session());
          } catch {
            /* Keep the last known transcript. */
          }
        }
        setError(true);
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setSending(false);
    }
  };
  const submit = () => {
    if (text.trim() && !pending)
      void send({ text: text.trim(), requestId: crypto.randomUUID() });
  };
  const action = (message: AssistantMessage, data: string) => {
    if (!pending)
      void send({
        data,
        messageId: message.id,
        requestId: crypto.randomUUID(),
      });
  };
  const disabled =
    loading ||
    !session ||
    sending ||
    Boolean(session?.processing) ||
    Boolean(pending);
  const older = async () => {
    if (!session?.nextCursor || olderBusy) return;
    setOlderBusy(true);
    preserveScroll.current = true;
    const current = generation.current;
    try {
      const snapshot = await websiteAssistant.session(session.nextCursor);
      if (mounted.current && current === generation.current) apply(snapshot, true);
      else preserveScroll.current = false;
    } catch {
      setError(true);
    } finally {
      setOlderBusy(false);
    }
  };
  const menu = assistantReplyKeyboard(session?.messages || []);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--color-border)] p-2">
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={disabled || loading}
          onClick={() =>
            void send({
              text: l.bookingRequest,
              requestId: crypto.randomUUID(),
            })
          }
        >
          {l.book}
        </Button>
      </div>
      <div
        ref={transcript}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
        role="log"
        aria-label={l.title}
      >
        {loading && (
          <p role="status" className="text-sm">
            {l.loading}
          </p>
        )}
        {session?.nextCursor && (
          <Button
            size="sm"
            variant="ghost"
            disabled={olderBusy}
            onClick={older}
          >
            {l.earlier}
          </Button>
        )}
        {!loading && !session?.messages.length && (
          <p className="text-sm text-[var(--color-text-muted)]">{l.empty}</p>
        )}
        {session?.messages.map((message) => (
          <article
            key={String(message.id)}
            className={`max-w-[95%] rounded-xl border border-[var(--color-border)] p-2.5 text-sm ${message.direction === "in" ? "ml-auto bg-primary-accent/10" : "mr-auto bg-[var(--color-bg)]"}`}
          >
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
            {assistantButtons(message).map((row, index) => (
              <div key={index} className="mt-2 flex gap-1">
                {row.map((button, column) => (
                  <button
                    key={column}
                    type="button"
                    disabled={disabled}
                    onClick={() => action(message, button.callback_data!)}
                    className="min-h-9 min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-1 py-1.5 text-xs font-medium hover:bg-primary-accent/15 focus:outline-none focus:ring-2 focus:ring-primary-accent disabled:opacity-50"
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            ))}
          </article>
        ))}
        {(sending || session?.typing || session?.processing) && (
          <p role="status" className="text-xs text-[var(--color-text-muted)]">
            {l.typing}
          </p>
        )}
      </div>
      {error && (
        <div
          role="alert"
          className="border-t border-[var(--color-border)] p-2 text-sm"
        >
          <p>{l.error}</p>
          <Button
            size="sm"
            variant="ghost"
            disabled={sending}
            onClick={() =>
              pending
                ? void send(pending)
                : websiteAssistant
                    .session()
                    .then((snapshot) => {
                      apply(snapshot);
                      setError(false);
                    })
                    .catch(() => setError(true))
            }
          >
            {l.retry}
          </Button>
        </div>
      )}
      {pending && !sending && !error && (
        <div className="border-t border-[var(--color-border)] p-2 text-sm">
          <p>{l.unread}</p>
          <Button
            size="sm"
            variant="ghost"
            disabled={Boolean(session?.processing)}
            onClick={() => void send(pending)}
          >
            {l.retry}
          </Button>
        </div>
      )}
      {menu && (
        <div className="flex flex-wrap gap-1 border-t border-[var(--color-border)] p-2">
          {menu.flat().map((button, index) => {
            const label = typeof button === "string" ? button : button.text;
            return label &&
              (typeof button === "string" || !button.request_contact) &&
              !label.trim().startsWith("/") ? (
              <Button
                key={index}
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() =>
                  void send({ text: label, requestId: crypto.randomUUID() })
                }
              >
                {label}
              </Button>
            ) : null;
          })}
        </div>
      )}
      <form
        className="flex items-end gap-2 border-t border-[var(--color-border)] p-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          ref={input}
          rows={2}
          maxLength={4000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          aria-label={l.input}
          placeholder={l.input}
          className="max-h-28 min-h-11 min-w-0 flex-1 resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-primary-accent"
        />
        <Button type="submit" size="sm" disabled={disabled || !text.trim()}>
          {l.send}
        </Button>
      </form>
    </div>
  );
}
