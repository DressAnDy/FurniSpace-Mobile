import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  CUSTOMER_CHAT_CHANNELS,
  CustomerChatTab,
  ProjectChatMessageSentPayload,
  ProjectChatType,
  SALE_CHAT_CHANNELS,
} from "../models/chat.model";
import {
  getProjectChatsApi,
  searchProjectChatMessagesApi,
  updateProjectChatStatusApi,
} from "../services/chat.api";
import { mapProjectChatToListItem } from "../utils/chat.mapper";

export { SALE_CHAT_CHANNELS, CUSTOMER_CHAT_CHANNELS };

type UseProjectChatsOptions = {
  /** When set, only these chat types are returned (stable UI order). */
  visibleTypes?: readonly ProjectChatType[];
};

function filterAndSortChats<T extends { chatType: ProjectChatType }>(
  items: T[],
  visibleTypes?: readonly ProjectChatType[],
): T[] {
  if (!visibleTypes || visibleTypes.length === 0) {
    return items;
  }

  const order = new Map(visibleTypes.map((type, index) => [type, index]));
  return items
    .filter((item) => order.has(item.chatType))
    .sort((left, right) => (order.get(left.chatType) ?? 0) - (order.get(right.chatType) ?? 0));
}

export function useProjectChatsQuery(projectId: string | null, options?: UseProjectChatsOptions) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const visibleKey = options?.visibleTypes?.join("|") ?? "all";

  return useQuery({
    queryKey: [...queryKeys.chat.projectList(projectId ?? "none"), visibleKey],
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: async () => {
      const response = await getProjectChatsApi(projectId!, { page: 1, limit: 20 });
      const mapped = response.items
        .map(mapProjectChatToListItem)
        .filter((item): item is NonNullable<typeof item> => item !== null);
      return filterAndSortChats(mapped, options?.visibleTypes);
    },
  });
}

export function useSaleProjectChatsQuery(projectId: string | null) {
  return useProjectChatsQuery(projectId, { visibleTypes: SALE_CHAT_CHANNELS });
}

export function useCustomerProjectChatsQuery(projectId: string | null) {
  return useProjectChatsQuery(projectId, { visibleTypes: CUSTOMER_CHAT_CHANNELS });
}

export function useProjectChatByTab(projectId: string | null, tab: CustomerChatTab) {
  const chatsQuery = useCustomerProjectChatsQuery(projectId);
  const chat = chatsQuery.data?.find((item) => item.chatType === tab) ?? null;

  return {
    ...chatsQuery,
    chat,
  };
}

export function useChatSearchQuery(projectId: string | null, query: string) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: queryKeys.chat.search(projectId ?? "none", trimmedQuery),
    enabled: isLoggedIn && Boolean(projectId) && trimmedQuery.length >= 2,
    queryFn: async () => {
      const response = await searchProjectChatMessagesApi(projectId!, { q: trimmedQuery, limit: 20 });
      return response.items;
    },
  });
}

export function useCloseProjectChatMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => updateProjectChatStatusApi(chatId, "CLOSED"),
    onSuccess: async () => {
      if (projectId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.chat.projectList(projectId) });
      } else {
        await queryClient.invalidateQueries({ queryKey: ["chat", "project-list"] });
      }
    },
  });
}

export function useInvalidateProjectChats() {
  const queryClient = useQueryClient();

  return async (projectId?: string) => {
    if (projectId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.projectList(projectId) });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["chat", "project-list"] });
  };
}

export function useHandleChatMessageSent(projectId: string | null) {
  const queryClient = useQueryClient();

  return (payload: ProjectChatMessageSentPayload) => {
    if (projectId && payload.projectId === projectId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.projectList(projectId) });
    }
  };
}
