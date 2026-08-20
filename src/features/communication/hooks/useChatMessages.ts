import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { ChatMessageDto, ChatMessageListItem } from "../models/chat.model";
import { getChatMessagesApi, sendChatFileMessageApi, sendChatTextMessageApi } from "../services/chat.api";
import { formatMessageTime, mapChatMessageToListItem, sortMessagesAscending } from "../utils/chat.mapper";
import { normalizeChatMessageDto } from "../utils/chatMessage.normalize";

export const CHAT_MESSAGES_PAGE_SIZE = 30;

type ChatMessagesPage = {
  items: ChatMessageListItem[];
  page: number;
  limit: number;
  total: number;
};

function mergeMessageLists(current: ChatMessageListItem[], incoming: ChatMessageListItem[]): ChatMessageListItem[] {
  const byId = new Map<string, ChatMessageListItem>();
  const byClientKey = new Map<string, ChatMessageListItem>();

  for (const message of current) {
    byId.set(message.id, message);
    byClientKey.set(message.clientKey, message);
  }

  for (const message of incoming) {
    const existingById = byId.get(message.id);
    const existingByClientKey = byClientKey.get(message.clientKey);

    // Prefer confirming a temp row in-place instead of creating a duplicate bubble.
    const tempMatch =
      message.isMine && message.content
        ? current.find((item) => item.id.startsWith("temp-") && item.content === message.content)
        : undefined;

    const target = tempMatch ?? existingById ?? existingByClientKey;
    if (target) {
      const merged: ChatMessageListItem = {
        ...message,
        clientKey: target.clientKey.startsWith("temp-") ? target.clientKey : message.clientKey,
        createdAt: target.id.startsWith("temp-") ? target.createdAt : message.createdAt,
        timeLabel: target.id.startsWith("temp-") ? target.timeLabel : message.timeLabel,
        isMine: target.isMine || message.isMine,
      };

      byId.delete(target.id);
      byClientKey.delete(target.clientKey);
      byId.set(merged.id, merged);
      byClientKey.set(merged.clientKey, merged);
      continue;
    }

    byId.set(message.id, message);
    byClientKey.set(message.clientKey, message);
  }

  return sortMessagesAscending([...byId.values()]);
}

function toInfiniteData(messages: ChatMessageListItem[], total = messages.length): InfiniteData<ChatMessagesPage> {
  const newestFirst = [...messages].reverse();

  return {
    pageParams: [1],
    pages: [
      {
        items: newestFirst,
        page: 1,
        limit: Math.max(CHAT_MESSAGES_PAGE_SIZE, newestFirst.length),
        total,
      },
    ],
  };
}

function readCacheMessages(data: InfiniteData<ChatMessagesPage> | undefined): ChatMessageListItem[] {
  if (!data?.pages?.length) {
    return [];
  }

  return sortMessagesAscending(data.pages.flatMap((page) => page.items));
}

function writeCacheMessages(
  existing: InfiniteData<ChatMessagesPage> | undefined,
  messages: ChatMessageListItem[],
): InfiniteData<ChatMessagesPage> {
  const total = Math.max(existing?.pages[0]?.total ?? 0, messages.length);
  return toInfiniteData(messages, total);
}

export function useChatMessagesQuery(chatId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUserId = useAuthStore((state) => state.user?.accountId ?? null);

  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages(chatId ?? "none"),
    enabled: isLoggedIn && Boolean(chatId),
    initialPageParam: 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: async ({ pageParam }) => {
      const response = await getChatMessagesApi(chatId!, {
        page: pageParam,
        limit: CHAT_MESSAGES_PAGE_SIZE,
        sort: "DESC",
      });

      const items = response.items
        .map((item) => normalizeChatMessageDto(item))
        .filter((item): item is ChatMessageDto => item !== null)
        .map((item) => mapChatMessageToListItem(item, currentUserId));

      return {
        items,
        page: response.page,
        limit: response.limit,
        total: response.total,
      };
    },
    getNextPageParam: (lastPage) => {
      const loadedCount = lastPage.page * lastPage.limit;
      return loadedCount < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useVisibleChatMessages(chatId: string | null) {
  const messagesQuery = useChatMessagesQuery(chatId);
  const [messages, setMessages] = useState<ChatMessageListItem[]>([]);
  const chatIdRef = useRef(chatId);

  useEffect(() => {
    if (chatIdRef.current !== chatId) {
      chatIdRef.current = chatId;
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    const serverMessages = readCacheMessages(messagesQuery.data);
    if (serverMessages.length === 0) {
      return;
    }

    setMessages((current) => mergeMessageLists(current, serverMessages));
  }, [messagesQuery.data]);

  return {
    ...messagesQuery,
    messages,
    setMessages,
  };
}

export function useChatActions(
  chatId: string | null,
  projectId: string | null,
  setMessages?: Dispatch<SetStateAction<ChatMessageListItem[]>>,
) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.accountId ?? null;

  const patchMessagesCache = useCallback(
    (updater: (current: ChatMessageListItem[]) => ChatMessageListItem[]) => {
      if (!chatId) {
        return;
      }

      const key = queryKeys.chat.messages(chatId);
      const existing = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(key);
      const current = readCacheMessages(existing);
      const next = updater(current);

      queryClient.setQueryData(key, writeCacheMessages(existing, next));
      setMessages?.(next);
    },
    [chatId, queryClient, setMessages],
  );

  const appendMessageToCache = useCallback(
    (message: ChatMessageDto) => {
      const normalized = normalizeChatMessageDto(message);
      if (!chatId || !normalized) {
        return;
      }

      const mapped = mapChatMessageToListItem(normalized, currentUserId);
      patchMessagesCache((current) => mergeMessageLists(current, [mapped]));
    },
    [chatId, currentUserId, patchMessagesCache],
  );

  const sendTextMutation = useMutation({
    mutationFn: async (content: string) => {
      const message = await sendChatTextMessageApi(chatId!, content);
      const normalized = normalizeChatMessageDto(message);
      if (!normalized) {
        throw new Error("Invalid send message response.");
      }
      return normalized;
    },
    onMutate: async (content) => {
      if (!chatId) {
        return { tempId: null as string | null };
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nowIso = new Date().toISOString();
      const optimistic: ChatMessageListItem = {
        id: tempId,
        clientKey: tempId,
        chatId,
        senderId: currentUserId ?? "me",
        senderName: currentUser?.fullName ?? "You",
        isMine: true,
        messageType: "TEXT",
        content,
        attachment: null,
        timeLabel: formatMessageTime(nowIso),
        createdAt: nowIso,
        isDeleted: false,
      };

      patchMessagesCache((current) => mergeMessageLists(current, [optimistic]));
      return { tempId };
    },
    onSuccess: (message, _content, context) => {
      const mapped = mapChatMessageToListItem(message, currentUserId);
      const confirmed: ChatMessageListItem = {
        ...mapped,
        clientKey: context?.tempId ?? mapped.clientKey,
        isMine: true,
      };

      patchMessagesCache((current) => {
        if (!context?.tempId) {
          return mergeMessageLists(current, [confirmed]);
        }

        const withoutDup = current.filter((item) => item.id !== confirmed.id || item.clientKey === context.tempId);
        const replaced = withoutDup.map((item) =>
          item.id === context.tempId || item.clientKey === context.tempId
            ? {
                ...confirmed,
                clientKey: item.clientKey,
                createdAt: item.createdAt,
                timeLabel: item.timeLabel,
                isMine: true,
              }
            : item,
        );

        if (replaced.some((item) => item.clientKey === context.tempId || item.id === confirmed.id)) {
          return sortMessagesAscending(replaced);
        }

        return mergeMessageLists(current, [confirmed]);
      });

      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.chat.projectList(projectId),
          refetchType: "inactive",
        });
      }
    },
    onError: (_error, _content, context) => {
      if (!context?.tempId) {
        return;
      }

      patchMessagesCache((current) =>
        current.filter((item) => item.id !== context.tempId && item.clientKey !== context.tempId),
      );
    },
  });

  const sendFileMutation = useMutation({
    mutationFn: async (payload: { file: { uri: string; name: string; type: string }; content?: string }) => {
      const message = await sendChatFileMessageApi(chatId!, payload.file, payload.content);
      const normalized = normalizeChatMessageDto(message);
      if (!normalized) {
        throw new Error("Invalid send file response.");
      }
      return normalized;
    },
    onSuccess: (message) => {
      appendMessageToCache(message);

      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.chat.projectList(projectId),
          refetchType: "inactive",
        });
      }
    },
  });

  return {
    sendTextMutation,
    sendFileMutation,
    appendMessageToCache,
  };
}
