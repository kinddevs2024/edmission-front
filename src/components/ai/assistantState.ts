import type {
  AssistantButton,
  AssistantMessage,
  AssistantRequest,
  AssistantSession,
} from "@/services/websiteAssistant";
/** Hide transport commands and feedback controls; callback payloads never become visible copy. */
export function assistantButtons(
  message: AssistantMessage,
): AssistantButton[][] {
  return (message.options?.reply_markup?.inline_keyboard || [])
    .map((row) =>
      row.filter(
        (button) =>
          button.text &&
          button.callback_data &&
          !button.callback_data.startsWith("fb:") &&
          !button.text.trim().startsWith("/"),
      ),
    )
    .filter((row) => row.length);
}
export function mergeAssistantMessages(
  older: AssistantMessage[],
  newer: AssistantMessage[],
) {
  const rows = new Map<string, AssistantMessage>();
  for (const message of [...older, ...newer]) {
    const previous = rows.get(String(message.id));
    const previousTime = Date.parse(
      previous?.editedAt || previous?.createdAt || "",
    );
    const incomingTime = Date.parse(
      message.editedAt || message.createdAt || "",
    );
    if (
      !previous ||
      !Number.isFinite(previousTime) ||
      !Number.isFinite(incomingTime) ||
      incomingTime >= previousTime
    )
      rows.set(String(message.id), message);
  }
  return [...rows.values()];
}
export function readAssistantPending(
  value: string | null,
): AssistantRequest | null {
  try {
    const request = JSON.parse(value || "null");
    if (
      !request ||
      typeof request.requestId !== "string" ||
      !/^[a-z\d-]{20,64}$/i.test(request.requestId)
    )
      return null;
    if (
      typeof request.text === "string" &&
      request.text.trim() &&
      request.text.length <= 4000
    )
      return { requestId: request.requestId, text: request.text };
    if (
      typeof request.data === "string" &&
      request.data.length <= 200 &&
      (typeof request.messageId === "string" ||
        typeof request.messageId === "number")
    )
      return {
        requestId: request.requestId,
        data: request.data,
        messageId: request.messageId,
      };
  } catch {
    /* Invalid browser state is not a request. */
  }
  return null;
}

export function assistantReplyKeyboard(messages: AssistantMessage[]) {
  let keyboard: (AssistantButton | string)[][] | undefined;
  for (const message of messages) {
    if (message.direction !== "out") continue;
    const markup = message.options?.reply_markup;
    if (markup?.remove_keyboard) keyboard = undefined;
    else if (markup?.keyboard) keyboard = markup.keyboard;
  }
  return keyboard;
}

export function mergeAssistantSession(
  old: AssistantSession | null,
  snapshot: AssistantSession,
  prepend = false,
): AssistantSession {
  if (!snapshot.lead) return { ...snapshot, messages: [], nextCursor: null };
  if (!old?.lead || old.lead.id !== snapshot.lead.id) return snapshot;
  return {
    ...snapshot,
    messages: prepend
      ? mergeAssistantMessages(snapshot.messages, old.messages)
      : mergeAssistantMessages(old.messages, snapshot.messages),
    nextCursor: prepend
      ? snapshot.nextCursor
      : old.nextCursor === undefined
        ? snapshot.nextCursor
        : old.nextCursor,
  };
}
