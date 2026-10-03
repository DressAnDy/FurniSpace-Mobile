import React, { useCallback, useEffect, useRef, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { fileTextIconDefinition, paperclipIconDefinition } from "../../../icons/file/definitions";
import { sendIconDefinition } from "../../../icons/communication/definitions";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { KeyboardSafeView } from "../../../shared/components/KeyboardSafe";
import { useChatActions, useVisibleChatMessages } from "../hooks/useChatMessages";
import { useProjectChatRealtime } from "../hooks/useProjectChatRealtime";
import { ChatAttachmentDto, ChatMessageListItem } from "../models/chat.model";
import { mapChatMessageToListItem, getInitials } from "../utils/chat.mapper";
import { styles } from "./MessageChatScreen.styles";

type MessageChatRoute = RouteProp<RootStackParamList, "MessageChat" | "SaleChat" | "DesignerChat">;

export function MessageChatScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MessageChatRoute>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { chatId, projectId, title, staffName, status } = route.params;
  const isSaleShell = route.name === "SaleChat";
  const isDesignerShell = route.name === "DesignerChat";
  const textOnlyComposer = isSaleShell;
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessageListItem>>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());

  const messagesQuery = useVisibleChatMessages(chatId);
  const { sendTextMutation, sendFileMutation, appendMessageToCache } = useChatActions(
    chatId,
    projectId,
    messagesQuery.setMessages,
  );
  const displayMessages = [...messagesQuery.messages].reverse();

  const isChatOpen = status === "OPEN";
  const isSendingFile = sendFileMutation.isPending;
  const headerInitials = getInitials(staffName || title);
  const composerBottomPadding = Math.max(insets.bottom, 10);

  useEffect(() => {
    for (const message of messagesQuery.messages) {
      knownMessageIdsRef.current.add(message.id);
    }
  }, [messagesQuery.messages]);

  const handleRealtimeMessage = useCallback(
    (payload: {
      projectId: string;
      chatId: string;
      message: Parameters<typeof mapChatMessageToListItem>[0];
    }) => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.chat.projectList(projectId) });
      }

      if (knownMessageIdsRef.current.has(payload.message.messageId)) {
        return;
      }

      knownMessageIdsRef.current.add(payload.message.messageId);
      appendMessageToCache(payload.message);
    },
    [appendMessageToCache, projectId, queryClient],
  );

  useProjectChatRealtime(chatId, handleRealtimeMessage);

  const handleSendText = () => {
    const content = draft.trim();
    if (!content || !isChatOpen) {
      return;
    }

    setDraft("");

    sendTextMutation.mutate(content, {
      onSuccess: (message) => {
        knownMessageIdsRef.current.add(message.messageId);
      },
      onError: (error, failedContent) => {
        setDraft((current) => (current.trim() ? current : failedContent));
        Alert.alert("Unable to send message", getErrorMessage(error, "Please try again."));
      },
    });
  };

  const handlePickFile = async () => {
    if (!isChatOpen || isSendingFile) {
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      sendFileMutation.mutate(
        {
          file: {
            uri: asset.uri,
            name: asset.name ?? "attachment",
            type: asset.mimeType ?? "application/octet-stream",
            size: asset.size,
          },
          content: draft.trim() || undefined,
        },
        {
          onSuccess: (message) => {
            knownMessageIdsRef.current.add(message.messageId);
            setDraft("");
          },
          onError: (error) => {
            Alert.alert("Unable to send file", getErrorMessage(error, "Please try again."));
          },
        },
      );
    } catch {
      Alert.alert("Unable to pick file", "Please try again.");
    }
  };

  const handleLoadOlder = () => {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      void messagesQuery.fetchNextPage();
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessageListItem; index: number }) => {
    // displayMessages is newest-first; with inverted list, chronological previous is at index + 1.
    const previous = displayMessages[index + 1];
    const showSender = !item.isMine && (!previous || previous.senderId !== item.senderId);

    return <MessageBubble item={item} showSender={showSender} />;
  };

  const chatContent = (
    <>
      {messagesQuery.isLoading || (messagesQuery.isFetching && displayMessages.length === 0) ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#C9A86A" />
        </View>
      ) : messagesQuery.isError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{getErrorMessage(messagesQuery.error, "Unable to load messages.")}</Text>
        </View>
      ) : displayMessages.length === 0 ? (
        <View style={styles.emptyThreadState}>
          <Text style={styles.emptyThreadTitle}>Start the conversation</Text>
          <Text style={styles.emptyThreadText}>Say hello to your team member.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          inverted
          style={styles.chatList}
          data={displayMessages}
          keyExtractor={(item) => item.clientKey}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onEndReached={handleLoadOlder}
          onEndReachedThreshold={0.2}
          removeClippedSubviews={false}
          ListHeaderComponent={
            messagesQuery.isFetchingNextPage ? (
              <View style={styles.loadMoreState}>
                <ActivityIndicator color="#C9A86A" size="small" />
              </View>
            ) : null
          }
        />
      )}

      <View style={[styles.composerWrap, { paddingBottom: composerBottomPadding }]}>
        <View style={styles.composer}>
          {!textOnlyComposer ? (
            <Pressable
              disabled={!isChatOpen || isSendingFile}
              style={[styles.composerIconButton, !isChatOpen && styles.composerDisabled]}
              onPress={() => void handlePickFile()}
            >
              <AppIcon definition={paperclipIconDefinition} size={16} color="#7A6F68" />
            </Pressable>
          ) : null}

          <View
            style={[
              styles.composerInputWrap,
              !isChatOpen && styles.composerDisabled,
              textOnlyComposer ? { marginLeft: 0 } : null,
            ]}
          >
            <TextInput
              editable={isChatOpen}
              multiline
              maxLength={4000}
              placeholder={isChatOpen ? "Type a message..." : "Chat closed"}
              placeholderTextColor="rgba(122,111,104,0.55)"
              style={styles.composerInput}
              textAlignVertical="center"
              value={draft}
              onChangeText={setDraft}
              onFocus={() => {
                requestAnimationFrame(() => {
                  listRef.current?.scrollToOffset({ offset: 0, animated: true });
                });
              }}
            />
          </View>

          <Pressable
            disabled={!isChatOpen || !draft.trim()}
            style={[styles.sendButton, (!isChatOpen || !draft.trim()) && styles.sendButtonDisabled]}
            onPress={handleSendText}
          >
            <AppIcon definition={sendIconDefinition} size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerCircleButton}
          onPress={() => {
            if (isSaleShell) {
              navigation.navigate("SaleMessages");
              return;
            }
            if (isDesignerShell) {
              navigation.navigate("DesignerMessages");
              return;
            }
            navigation.navigate("Messages", { projectId });
          }}
        >
          <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{headerInitials}</Text>
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerName} numberOfLines={1}>
            {staffName || title}
          </Text>
          <View style={styles.headerStatusRow}>
            {isChatOpen ? <View style={styles.onlineDot} /> : null}
            <Text style={styles.headerStatus} numberOfLines={1}>
              {title}
            </Text>
            <View style={[styles.statusPill, isChatOpen ? styles.statusPillOpen : styles.statusPillClosed]}>
              <Text style={[styles.statusPillText, isChatOpen && styles.statusPillTextOpen]}>
                {isChatOpen ? "Open" : "Closed"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {!isChatOpen ? (
        <View style={styles.closedBanner}>
          <Text style={styles.closedBannerText}>This chat is closed. You can read messages but cannot send new ones.</Text>
        </View>
      ) : null}

      <KeyboardSafeView style={styles.chatArea}>{chatContent}</KeyboardSafeView>
    </View>
  );
}

function formatAttachmentSize(bytes: number): string {
  if (!bytes || bytes < 0) return "FILE";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentTypeLabel(fileName: string, mimeType: string): string {
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toUpperCase() : null;
  if (extension && extension.length <= 5) return extension;
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "FILE";
}

function AttachmentCard({
  attachment,
  isMine,
  hasContent,
}: Readonly<{
  attachment: ChatAttachmentDto;
  isMine: boolean;
  hasContent: boolean;
}>): React.JSX.Element {
  const openAttachment = async () => {
    if (!attachment.fileUrl) {
      Alert.alert("File unavailable", "This attachment does not have a valid download URL.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(attachment.fileUrl);
      if (!supported) throw new Error("Unsupported URL");
      await Linking.openURL(attachment.fileUrl);
    } catch {
      Alert.alert("Unable to open file", "Please try again later.");
    }
  };

  return (
    <Pressable
      style={[styles.filePreview, hasContent ? styles.filePreviewWithContent : null]}
      onPress={() => void openAttachment()}
    >
      <View style={[styles.fileIconWrap, isMine ? styles.fileIconWrapOutgoing : null]}>
        <AppIcon definition={fileTextIconDefinition} size={20} color="#B58E49" strokeWidth={1.7} />
      </View>
      <View style={styles.fileDetails}>
        <Text style={styles.fileName} numberOfLines={2}>
          {attachment.originalFileName || "Attached file"}
        </Text>
        <View style={styles.fileMetaRow}>
          <Text style={styles.fileMeta}>
            {getAttachmentTypeLabel(attachment.originalFileName, attachment.mimeType)}
            {" · "}
            {formatAttachmentSize(attachment.fileSizeBytes)}
          </Text>
          <Text style={styles.fileOpenLabel}>OPEN</Text>
        </View>
      </View>
    </Pressable>
  );
}

const MessageBubble = React.memo(function MessageBubble({
  item,
  showSender,
}: Readonly<{
  item: ChatMessageListItem;
  showSender: boolean;
}>): React.JSX.Element {
  if (item.isDeleted) {
    return (
      <View style={styles.deletedWrap}>
        <Text style={styles.deletedText}>Message deleted</Text>
      </View>
    );
  }

  if (item.messageType === "SYSTEM") {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.systemText}>{item.content ?? "System message"}</Text>
      </View>
    );
  }

  return (
    <View style={item.isMine ? styles.outgoingWrap : styles.messageBlock}>
      {!item.isMine && showSender ? <Text style={styles.senderLabel}>{item.senderName}</Text> : null}

      <View style={item.isMine ? styles.outgoingBubble : styles.incomingBubble}>
        {item.isMine ? <View style={styles.outgoingAccent} /> : null}

        {item.messageType === "FILE" && item.attachment ? (
          <AttachmentCard attachment={item.attachment} isMine={item.isMine} hasContent={Boolean(item.content)} />
        ) : null}

        {item.content ? (
          <Text style={item.isMine ? styles.outgoingText : styles.incomingText}>{item.content}</Text>
        ) : null}
      </View>

      <Text style={item.isMine ? styles.timeRight : styles.timeLeft}>{item.timeLabel}</Text>
    </View>
  );
});
