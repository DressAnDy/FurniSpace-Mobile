import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { chevronRightIconDefinition, searchIconDefinition } from "../../../icons/navigation/definitions";
import { chatIconDefinition } from "../../../icons/communication/definitions";
import { projectIconDefinition } from "../../../icons/project/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
import { useProjectsQuery } from "../../project/hooks/useProjects";
import { useProjectStore } from "../../project/store/project.store";
import { pickDefaultActiveProject } from "../../project/utils/project.mapper";
import { useChatSearchQuery, useProjectChatsQuery } from "../hooks/useProjectChats";
import { ChatListItem, CustomerChatTab } from "../models/chat.model";
import { formatChatTime, getCustomerTabLabel } from "../utils/chat.mapper";
import { styles } from "./MessagesScreen.styles";

type MessagesRoute = RouteProp<RootStackParamList, "Messages">;

export function MessagesScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MessagesRoute>();
  const { scrollPaddingBottom } = useBottomNavMetrics();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);
  const projectsQuery = useProjectsQuery({ limit: 100 });
  const projectId = activeProjectId;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const chatsQuery = useProjectChatsQuery(projectId);
  const searchResultsQuery = useChatSearchQuery(projectId, debouncedSearchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const projects = projectsQuery.data?.items ?? [];
  const selectedProject = projects.find((project) => project.projectId === projectId) ?? null;

  useEffect(() => {
    if (activeProjectId || !route.params?.projectId) {
      return;
    }

    setActiveProjectId(route.params.projectId);
  }, [activeProjectId, route.params?.projectId, setActiveProjectId]);

  useEffect(() => {
    if (activeProjectId || projectsQuery.isLoading || projects.length === 0) {
      return;
    }

    const defaultProject = pickDefaultActiveProject(projects);
    if (defaultProject) {
      setActiveProjectId(defaultProject.projectId);
    }
  }, [activeProjectId, projects, projectsQuery.isLoading, setActiveProjectId]);

  const handleSelectProject = (nextProjectId: string) => {
    setActiveProjectId(nextProjectId);
    navigation.setParams({ projectId: nextProjectId });
  };

  const salesChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "SALES") ?? null,
    [chatsQuery.data],
  );
  const designChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "DESIGNER") ?? null,
    [chatsQuery.data],
  );

  const isSearching = debouncedSearchQuery.trim().length >= 2;

  const handleOpenChat = (chat: ChatListItem) => {
    navigation.navigate("MessageChat", {
      chatId: chat.chatId,
      projectId: chat.projectId,
      title: chat.title,
      staffName: chat.staffName,
      chatType: chat.chatType,
      status: chat.status,
    });
  };

  const handleOpenSearchResult = (chatId: string, title: string) => {
    const chat = chatsQuery.data?.find((item) => item.chatId === chatId);
    if (!chat || !projectId) {
      return;
    }

    navigation.navigate("MessageChat", {
      chatId,
      projectId,
      title: chat.title || title,
      staffName: chat.staffName,
      chatType: chat.chatType,
      status: chat.status,
    });
  };

  const handleRefresh = useCallback(() => {
    void projectsQuery.refetch();
    void chatsQuery.refetch();
    if (isSearching) {
      void searchResultsQuery.refetch();
    }
  }, [chatsQuery, isSearching, projectsQuery, searchResultsQuery]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>FURNISPACE</Text>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.searchBox}>
          <AppIcon definition={searchIconDefinition} size={14} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Search messages in project..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {projects.length > 1 ? (
        <View style={styles.projectPickerSection}>
          <View style={styles.projectPickerCard}>
            <View style={styles.projectPickerHeader}>
              <View style={styles.projectPickerTitleRow}>
                <View style={styles.projectPickerIconWrap}>
                  <AppIcon definition={projectIconDefinition} size={15} color="#C9A86A" strokeWidth={1.8} />
                </View>
                <View style={styles.projectPickerTitleWrap}>
                  <Text style={styles.projectPickerTitle}>Your Projects</Text>
                  {selectedProject ? (
                    <Text style={styles.projectPickerSubtitle} numberOfLines={1}>
                      Viewing {selectedProject.projectName}
                    </Text>
                  ) : (
                    <Text style={styles.projectPickerSubtitle}>Select a project to view chats</Text>
                  )}
                </View>
              </View>
              <View style={styles.projectCountBadge}>
                <Text style={styles.projectCountText}>{projects.length}</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.projectPickerRow}
            >
              {projects.map((project) => {
                const isActive = projectId === project.projectId;

                return (
                  <Pressable
                    key={project.projectId}
                    style={[styles.projectChip, isActive && styles.projectChipActive]}
                    onPress={() => handleSelectProject(project.projectId)}
                  >
                    {isActive ? <View style={styles.projectChipDot} /> : null}
                    <View style={styles.projectChipContent}>
                      <Text
                        style={[styles.projectChipText, isActive && styles.projectChipTextActive]}
                        numberOfLines={1}
                      >
                        {project.projectName}
                      </Text>
                      <Text
                        style={[styles.projectChipCode, isActive && styles.projectChipCodeActive]}
                        numberOfLines={1}
                      >
                        {project.projectCode}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={chatsQuery.isRefetching} onRefresh={handleRefresh} />}
      >
        <View style={styles.content}>
          {projectsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#C9A86A" />
            </View>
          ) : projectsQuery.isError ? (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>{getErrorMessage(projectsQuery.error, "Unable to load projects.")}</Text>
              <Pressable style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <AppIcon definition={chatIconDefinition} size={20} color="#C9A86A" strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyText}>You have no projects yet. Create a project to start chatting with your team.</Text>
            </View>
          ) : (
            <>
              {projects.length === 1 && selectedProject ? (
                <View style={styles.singleProjectMeta}>
                  <Text style={styles.sectionLabel}>PROJECT</Text>
                  <Text style={styles.singleProjectName}>{selectedProject.projectName}</Text>
                  <Text style={styles.singleProjectCode}>{selectedProject.projectCode}</Text>
                </View>
              ) : null}

              {!projectId ? (
                <View style={styles.centerState}>
                  <Text style={styles.emptyText}>Select a project to view chats.</Text>
                </View>
              ) : chatsQuery.isLoading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color="#C9A86A" />
                </View>
              ) : chatsQuery.isError ? (
                <View style={styles.centerState}>
                  <Text style={styles.emptyText}>{getErrorMessage(chatsQuery.error, "Unable to load chats.")}</Text>
                  <Pressable style={styles.retryButton} onPress={handleRefresh}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                </View>
              ) : isSearching ? (
                <SearchResults
                  isLoading={searchResultsQuery.isLoading}
                  isError={searchResultsQuery.isError}
                  results={searchResultsQuery.data ?? []}
                  onOpenResult={handleOpenSearchResult}
                />
              ) : (
                <>
                  <ChatSection tab="SALES" chat={salesChat} onOpenChat={handleOpenChat} />
                  <ChatSection tab="DESIGNER" chat={designChat} onOpenChat={handleOpenChat} />
                </>
              )}

              {!isSearching && chatsQuery.data && chatsQuery.data.length > 0 ? (
                <Text style={styles.footerText}>{chatsQuery.data.length} chat(s) in this project</Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <AppBottomNav activeTab="chat" />
    </View>
  );
}

function ChatSection({
  tab,
  chat,
  onOpenChat,
}: {
  tab: CustomerChatTab;
  chat: ChatListItem | null;
  onOpenChat: (chat: ChatListItem) => void;
}): React.JSX.Element {
  const label = `${getCustomerTabLabel(tab).toUpperCase()} CHAT`;
  const emptyMessage =
    tab === "DESIGNER"
      ? "Design chat will appear after a designer is assigned."
      : "Sales chat will appear after your project is accepted.";

  return (
    <View style={styles.chatSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {chat ? (
        <ConversationCard item={chat} onPress={() => onOpenChat(chat)} />
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <AppIcon definition={chatIconDefinition} size={18} color="#C9A86A" strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
}

function SearchResults({
  results,
  isLoading,
  isError,
  onOpenResult,
}: {
  results: Array<{
    messageId: string;
    chatId: string;
    senderName: string;
    content: string;
    createdAt: string;
  }>;
  isLoading: boolean;
  isError: boolean;
  onOpenResult: (chatId: string, title: string) => void;
}): React.JSX.Element {
  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#C9A86A" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyText}>Unable to search messages.</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyText}>No messages matched your search.</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
      {results.map((item) => (
        <Pressable
          key={item.messageId}
          style={styles.card}
          onPress={() => onOpenResult(item.chatId, item.senderName)}
        >
          <View style={styles.cardAccent} />
          <View style={styles.cardTop}>
            <View style={styles.nameWrap}>
              <Text style={styles.name}>{item.senderName}</Text>
              <Text style={styles.role}>{formatChatTime(item.createdAt)}</Text>
            </View>
          </View>
          <Text style={styles.searchResultContent} numberOfLines={3}>
            {item.content}
          </Text>
        </Pressable>
      ))}
    </>
  );
}

function ConversationCard({ item, onPress }: { item: ChatListItem; onPress?: () => void }): React.JSX.Element {
  return (
    <Pressable style={[styles.card, !item.isOpen && styles.cardClosed]} onPress={onPress}>
      {item.isOpen ? <View style={styles.cardAccent} /> : null}

      <View style={styles.cardTop}>
        <View style={styles.leftInfo}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
            <Text style={styles.avatarText}>{item.initials}</Text>
          </View>
          <View style={styles.nameWrap}>
            <Text style={styles.name}>{item.staffName || item.title}</Text>
            <Text style={styles.role}>{item.roleLabel}</Text>
          </View>
        </View>
        <View style={styles.rightInfo}>
          <Text style={styles.time}>{item.timeLabel}</Text>
          {item.isOpen ? (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Open</Text>
            </View>
          ) : (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>Closed</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.previewBox}>
        <View style={styles.messageRow}>
          {item.isOpen ? <View style={styles.onlineDot} /> : null}
          <Text style={styles.message} numberOfLines={2}>
            {item.preview}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.tapHint}>Open conversation</Text>
        <AppIcon definition={chevronRightIconDefinition} size={14} color="#C9A86A" strokeWidth={2} />
      </View>
    </Pressable>
  );
}
