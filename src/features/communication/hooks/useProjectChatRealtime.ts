import { useEffect, useMemo, useRef } from "react";
import { joinProjectChat, leaveProjectChat, subscribeProjectChatHub } from "../../../core/realtime/projectChatHub";
import { useAuthStore } from "../../auth/store/auth.store";
import { ProjectChatMessageSentPayload } from "../models/chat.model";

function normalizeChatIds(chatIds: string | string[] | null | undefined): string[] {
  if (!chatIds) {
    return [];
  }
  const list = Array.isArray(chatIds) ? chatIds : [chatIds];
  return [...new Set(list.map((id) => id.trim()).filter(Boolean))];
}

/**
 * JoinChat for live messages. Pass one chatId or many (e.g. all Sales channels).
 * On chat switch / unmount: LeaveChat(old) then JoinChat(new).
 */
export function useProjectChatRealtime(
  chatIds: string | string[] | null,
  onMessageSent: (payload: ProjectChatMessageSentPayload) => void,
): void {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const handlerRef = useRef(onMessageSent);
  const ids = useMemo(() => normalizeChatIds(chatIds), [chatIds]);
  const idsKey = ids.join("|");

  useEffect(() => {
    handlerRef.current = onMessageSent;
  }, [onMessageSent]);

  useEffect(() => {
    if (!isLoggedIn || ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);
    const unsubscribe = subscribeProjectChatHub((payload) => {
      if (!idSet.has(payload.chatId)) {
        return;
      }
      handlerRef.current(payload);
    });

    for (const chatId of ids) {
      void joinProjectChat(chatId).catch(() => undefined);
    }

    return () => {
      unsubscribe();
      for (const chatId of ids) {
        void leaveProjectChat(chatId);
      }
    };
  }, [idsKey, isLoggedIn, ids]);
}
