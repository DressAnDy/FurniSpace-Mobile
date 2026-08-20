import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { CustomerChatTab, ProjectChatMessageSentPayload } from "../models/chat.model";
import { getProjectChatsApi, searchProjectChatMessagesApi } from "../services/chat.api";
import { mapProjectChatToListItem } from "../utils/chat.mapper";

export function useProjectChatsQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.chat.projectList(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: async () => {
      const response = await getProjectChatsApi(projectId!);
      return response.items.map(mapProjectChatToListItem);
    },
  });
}

export function useProjectChatByTab(projectId: string | null, tab: CustomerChatTab) {
  const chatsQuery = useProjectChatsQuery(projectId);
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
