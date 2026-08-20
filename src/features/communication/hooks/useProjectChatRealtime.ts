import { useEffect, useRef } from "react";
import { joinProjectChat, leaveProjectChat, subscribeProjectChatHub } from "../../../core/realtime/projectChatHub";
import { useAuthStore } from "../../auth/store/auth.store";
import { ProjectChatMessageSentPayload } from "../models/chat.model";

export function useProjectChatRealtime(
  chatId: string | null,
  onMessageSent: (payload: ProjectChatMessageSentPayload) => void,
): void {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const handlerRef = useRef(onMessageSent);

  useEffect(() => {
    handlerRef.current = onMessageSent;
  }, [onMessageSent]);

  useEffect(() => {
    if (!isLoggedIn || !chatId) {
      return;
    }

    const unsubscribe = subscribeProjectChatHub((payload) => {
      if (payload.chatId !== chatId) {
        return;
      }

      handlerRef.current(payload);
    });

    void joinProjectChat(chatId).catch(() => undefined);

    return () => {
      unsubscribe();
      void leaveProjectChat(chatId);
    };
  }, [chatId, isLoggedIn]);
}
