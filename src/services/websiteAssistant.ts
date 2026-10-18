import { api } from "./api";
export interface AssistantButton {
  text: string;
  callback_data?: string;
  request_contact?: boolean;
}
export interface AssistantMessage {
  id: string | number;
  direction: "in" | "out" | "staff";
  text: string;
  createdAt?: string;
  editedAt?: string;
  options?: {
    reply_markup?: {
      inline_keyboard?: AssistantButton[][];
      remove_keyboard?: boolean;
      keyboard?: (AssistantButton | string)[][];
    };
  };
}
export interface AssistantSession {
  lead: { id: string; language: "ru" | "en" | "uz"; name?: string } | null;
  language?: string;
  messages: AssistantMessage[];
  typing?: boolean;
  processing?: boolean;
  nextCursor?: string | null;
}
export type AssistantRequest =
  | { requestId: string; text: string }
  | { requestId: string; data: string; messageId: string | number };
export const websiteAssistant = {
  session: (before?: string, signal?: AbortSignal) =>
    api
      .get<AssistantSession>("/admissions/web/session", {
        params: { before },
        signal,
      })
      .then((r) => r.data),
  send: (request: AssistantRequest) =>
    api
      .post<AssistantSession>(
        "text" in request
          ? "/admissions/web/messages"
          : "/admissions/web/actions",
        request,
        { timeout: 90000 },
      )
      .then((r) => r.data),
};
