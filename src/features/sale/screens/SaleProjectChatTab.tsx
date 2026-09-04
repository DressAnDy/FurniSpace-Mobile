import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { paperclipIconDefinition } from "../../../icons/file/definitions";
import { sendIconDefinition } from "../../../icons/communication/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { useChatActions, useVisibleChatMessages } from "../../communication/hooks/useChatMessages";
import { useCloseProjectChatMutation, useProjectChatsQuery } from "../../communication/hooks/useProjectChats";
import { useProjectChatRealtime } from "../../communication/hooks/useProjectChatRealtime";
import type { ChatListItem, ChatMessageListItem, CustomerChatTab } from "../../communication/models/chat.model";
import { mapChatMessageToListItem } from "../../communication/utils/chat.mapper";
import { styles as chatStyles } from "../../communication/screens/MessageChatScreen.styles";
import { SALE, saleStyles as s } from "../styles/sale.styles";

type SaleProjectChatTabProps = {
  projectId: string | null;
};

function formatSaleChatSubtitle(chat: {
  chatType: string;
  roleLabel: string;
  staffName: string;
}): string {
  const typeLabel = chat.chatType === "DESIGNER" ? "Designer" : "Sales";
  const name = chat.staffName?.trim();
  if (!name) {
    return typeLabel;
  }
  const normalizedName = name.toLowerCase();
  if (
    normalizedName === typeLabel.toLowerCase() ||
    normalizedName === chat.roleLabel.toLowerCase() ||
    (normalizedName.includes("consultant") && chat.chatType === "SALES")
  ) {
    return typeLabel;
  }
  return `${typeLabel} · ${name}`;
}

function MessageBubble({
  item,
  showSender,
}: {
  item: ChatMessageListItem;
  showSender: boolean;
}): React.JSX.Element {
  if (item.isDeleted) {
    return (
      <View style={chatStyles.deletedWrap}>
        <Text style={chatStyles.deletedText}>Message deleted</Text>
      </View>
    );
  }

  if (item.messageType === "SYSTEM") {
    return (
      <View style={chatStyles.systemWrap}>
        <Text style={chatStyles.systemText}>{item.content ?? "System message"}</Text>
      </View>
    );
  }

  const openAttachment = () => {
    if (item.attachment?.fileUrl) {
      void Linking.openURL(item.attachment.fileUrl);
    }
  };

  return (
    <View style={item.isMine ? chatStyles.outgoingWrap : chatStyles.messageBlock}>
      {!item.isMine && showSender ? <Text style={chatStyles.senderLabel}>{item.senderName}</Text> : null}

      <View style={item.isMine ? chatStyles.outgoingBubble : chatStyles.incomingBubble}>
        {item.isMine ? <View style={chatStyles.outgoingAccent} /> : null}

        {item.messageType === "FILE" && item.attachment ? (
          <Pressable style={chatStyles.filePreview} onPress={openAttachment}>
            <View style={chatStyles.fileIconWrap}>
              <AppIcon definition={paperclipIconDefinition} size={13} color="#C9A86A" />
            </View>
            <Text style={chatStyles.fileName} numberOfLines={2}>
              {item.attachment.originalFileName}
            </Text>
          </Pressable>
        ) : null}

        {item.content ? (
          <Text style={item.isMine ? chatStyles.outgoingText : chatStyles.incomingText}>{item.content}</Text>
        ) : null}
      </View>

      <Text style={item.isMine ? chatStyles.timeRight : chatStyles.timeLeft}>{item.timeLabel}</Text>
    </View>
  );
}

export function SaleProjectChatTab({ projectId }: SaleProjectChatTabProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const chatsQuery = useProjectChatsQuery(projectId);
  const closeChatMutation = useCloseProjectChatMutation(projectId);
  const [activeType, setActiveType] = useState<CustomerChatTab>("SALES");
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessageListItem>>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());

  const salesChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "SALES") ?? null,
    [chatsQuery.data],
  );
  const designerChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "DESIGNER") ?? null,
    [chatsQuery.data],
  );

  useEffect(() => {
    if (activeType === "SALES" && !salesChat && designerChat) {
      setActiveType("DESIGNER");
      return;
    }
    if (activeType === "DESIGNER" && !designerChat && salesChat) {
      setActiveType("SALES");
    }
  }, [activeType, designerChat, salesChat]);

  const activeChat: ChatListItem | null = activeType === "DESIGNER" ? designerChat : salesChat;
  const chatId = activeChat?.chatId ?? null;
  const isChatOpen = activeChat?.status === "OPEN";

  const messagesQuery = useVisibleChatMessages(chatId);
  const { sendTextMutation, sendFileMutation, appendMessageToCache } = useChatActions(
    chatId,
    projectId,
    messagesQuery.setMessages,
  );
  const displayMessages = [...messagesQuery.messages].reverse();
  const isSendingFile = sendFileMutation.isPending;

  useEffect(() => {
    for (const message of messagesQuery.messages) {
      knownMessageIdsRef.current.add(message.id);
    }
  }, [messagesQuery.messages]);

  const handleRealtimeMessage = useCallback(
    (payload: { message: Parameters<typeof mapChatMessageToListItem>[0] }) => {
      if (knownMessageIdsRef.current.has(payload.message.messageId)) {
        return;
      }
      knownMessageIdsRef.current.add(payload.message.messageId);
      appendMessageToCache(payload.message);
    },
    [appendMessageToCache],
  );

  useProjectChatRealtime(chatId, handleRealtimeMessage);

  const handleSendText = () => {
    const content = draft.trim();
    if (!content || !isChatOpen || !chatId) {
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
    if (!isChatOpen || isSendingFile || !chatId) {
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

  const handleCloseChat = () => {
    if (!chatId || !isChatOpen) {
      return;
    }

    Alert.alert("Close chat", "Close this conversation? You can still read history afterward.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close",
        style: "destructive",
        onPress: () => {
          closeChatMutation.mutate(chatId, {
            onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to close chat.")),
          });
        },
      },
    ]);
  };

  const handleLoadOlder = () => {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      void messagesQuery.fetchNextPage();
    }
  };

  if (!projectId) {
    return <Text style={s.centerMuted}>Select a project to view chats.</Text>;
  }

  if (chatsQuery.isLoading) {
    return (
      <View style={[chatStyles.centerState, { flex: 1 }]}>
        <ActivityIndicator color={SALE.gold} />
      </View>
    );
  }

  if (chatsQuery.isError) {
    return (
      <View style={[chatStyles.centerState, { flex: 1, paddingHorizontal: 24 }]}>
        <Text style={chatStyles.errorText}>{getErrorMessage(chatsQuery.error, "Unable to load chats.")}</Text>
      </View>
    );
  }

  if (!salesChat && !designerChat) {
    return (
      <View style={[chatStyles.centerState, { flex: 1, paddingHorizontal: 24 }]}>
        <Text style={chatStyles.emptyThreadTitle}>No chats yet</Text>
        <Text style={chatStyles.emptyThreadText}>
          Sales chat is created when the project is claimed. Designer chat appears after assigning a designer.
        </Text>
      </View>
    );
  }

  const composerBottomPadding = Math.max(insets.bottom, 10);

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {salesChat ? (
            <Pressable
              style={[s.typeOption, activeType === "SALES" && s.chipActive, { flex: 1 }]}
              onPress={() => setActiveType("SALES")}
            >
              <Text style={[s.chipText, activeType === "SALES" && s.chipTextActive]}>Sales</Text>
            </Pressable>
          ) : null}
          {designerChat ? (
            <Pressable
              style={[s.typeOption, activeType === "DESIGNER" && s.chipActive, { flex: 1 }]}
              onPress={() => setActiveType("DESIGNER")}
            >
              <Text style={[s.chipText, activeType === "DESIGNER" && s.chipTextActive]}>Designer</Text>
            </Pressable>
          ) : null}
        </View>

        {activeChat ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              backgroundColor: SALE.white,
              borderWidth: 1,
              borderColor: SALE.border,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: SALE.ink, fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
                {activeChat.title}
              </Text>
              <Text style={{ color: SALE.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {formatSaleChatSubtitle(activeChat)}
              </Text>
            </View>
            <View
              style={[
                chatStyles.statusPill,
                isChatOpen ? chatStyles.statusPillOpen : chatStyles.statusPillClosed,
              ]}
            >
              <Text style={[chatStyles.statusPillText, isChatOpen && chatStyles.statusPillTextOpen]}>
                {isChatOpen ? "Open" : "Closed"}
              </Text>
            </View>
            {isChatOpen ? (
              <Pressable
                style={[s.buttonSecondary, { height: 34, paddingHorizontal: 12, flex: undefined }]}
                disabled={closeChatMutation.isPending}
                onPress={handleCloseChat}
              >
                <Text style={[s.buttonSecondaryText, { fontSize: 11 }]}>
                  {closeChatMutation.isPending ? "Closing…" : "Close"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {!isChatOpen && activeChat ? (
        <View style={chatStyles.closedBanner}>
          <Text style={chatStyles.closedBannerText}>
            This chat is closed. You can read messages but cannot send new ones.
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        {messagesQuery.isLoading ? (
          <View style={chatStyles.centerState}>
            <ActivityIndicator color={SALE.gold} />
          </View>
        ) : messagesQuery.isError ? (
          <View style={chatStyles.centerState}>
            <Text style={chatStyles.errorText}>
              {getErrorMessage(messagesQuery.error, "Unable to load messages.")}
            </Text>
          </View>
        ) : displayMessages.length === 0 ? (
          <View style={chatStyles.emptyThreadState}>
            <Text style={chatStyles.emptyThreadTitle}>Start the conversation</Text>
            <Text style={chatStyles.emptyThreadText}>Send a message to the customer or designer thread.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            inverted
            style={chatStyles.chatList}
            data={displayMessages}
            keyExtractor={(item) => item.clientKey}
            contentContainerStyle={chatStyles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onEndReached={handleLoadOlder}
            onEndReachedThreshold={0.2}
            removeClippedSubviews={false}
            ListHeaderComponent={
              messagesQuery.isFetchingNextPage ? (
                <View style={chatStyles.loadMoreState}>
                  <ActivityIndicator color={SALE.gold} size="small" />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const originalIndex = messagesQuery.messages.findIndex((message) => message.id === item.id);
              const previous = originalIndex > 0 ? messagesQuery.messages[originalIndex - 1] : undefined;
              const showSender = !item.isMine && (!previous || previous.senderId !== item.senderId);
              return <MessageBubble item={item} showSender={showSender} />;
            }}
          />
        )}
      </View>

      <View style={[chatStyles.composerWrap, { paddingBottom: composerBottomPadding }]}>
        <View style={chatStyles.composer}>
          <Pressable
            disabled={!isChatOpen || isSendingFile}
            style={[chatStyles.composerIconButton, !isChatOpen && chatStyles.composerDisabled]}
            onPress={() => void handlePickFile()}
          >
            <AppIcon definition={paperclipIconDefinition} size={16} color="#7A6F68" />
          </Pressable>

          <View style={[chatStyles.composerInputWrap, !isChatOpen && chatStyles.composerDisabled]}>
            <TextInput
              editable={isChatOpen}
              multiline
              maxLength={4000}
              placeholder={isChatOpen ? "Type a message..." : "Chat closed"}
              placeholderTextColor="rgba(122,111,104,0.55)"
              style={chatStyles.composerInput}
              textAlignVertical="center"
              value={draft}
              onChangeText={setDraft}
            />
          </View>

          <Pressable
            disabled={!isChatOpen || !draft.trim()}
            style={[chatStyles.sendButton, (!isChatOpen || !draft.trim()) && chatStyles.sendButtonDisabled]}
            onPress={handleSendText}
          >
            <AppIcon definition={sendIconDefinition} size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
