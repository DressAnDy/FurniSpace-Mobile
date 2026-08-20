import React, { useCallback, useEffect, useRef, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
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
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { paperclipIconDefinition } from "../../../icons/file/definitions";
import { sendIconDefinition } from "../../../icons/communication/definitions";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { useChatActions, useVisibleChatMessages } from "../hooks/useChatMessages";
import { useProjectChatRealtime } from "../hooks/useProjectChatRealtime";
import { ChatMessageListItem } from "../models/chat.model";
import { mapChatMessageToListItem, getInitials } from "../utils/chat.mapper";
import { styles } from "./MessageChatScreen.styles";

type MessageChatRoute = RouteProp<RootStackParamList, "MessageChat">;

function resolveAndroidKeyboardOffset(
  event: { endCoordinates: { height: number; screenY: number } },
  baselineWindowHeight: number,
): number {
  const currentWindowHeight = Dimensions.get("window").height;
  const windowShrunk = baselineWindowHeight - currentWindowHeight > 48;

  if (windowShrunk) {
    return 0;
  }

  const keyboardTop = event.endCoordinates.screenY;
  const insetFromTop = Math.max(0, currentWindowHeight - keyboardTop);

  return insetFromTop > 0 ? insetFromTop : event.endCoordinates.height;
}

export function MessageChatScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MessageChatRoute>();
  const insets = useSafeAreaInsets();
  const { chatId, projectId, title, staffName, status } = route.params;
  const [draft, setDraft] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList<ChatMessageListItem>>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const baselineWindowHeightRef = useRef(Dimensions.get("window").height);

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
  const composerBottomPadding = keyboardVisible ? 8 : Math.max(insets.bottom, 10);
  const androidKeyboardOffset =
    Platform.OS === "android" && keyboardVisible ? keyboardHeight : 0;

  useEffect(() => {
    for (const message of messagesQuery.messages) {
      knownMessageIdsRef.current.add(message.id);
    }
  }, [messagesQuery.messages]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const frameEvent = Platform.OS === "android" ? "keyboardDidChangeFrame" : null;

    const handleKeyboardShow = (event: { endCoordinates: { height: number; screenY: number } }) => {
      setKeyboardVisible(true);

      if (Platform.OS === "android") {
        setKeyboardHeight(resolveAndroidKeyboardOffset(event, baselineWindowHeightRef.current));
      }
    };

    const handleKeyboardHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      baselineWindowHeightRef.current = Dimensions.get("window").height;
    };

    const showSub = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, handleKeyboardHide);
    const frameSub = frameEvent ? Keyboard.addListener(frameEvent, handleKeyboardShow) : null;

    return () => {
      showSub.remove();
      hideSub.remove();
      frameSub?.remove();
    };
  }, []);

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

  const renderMessage = ({ item }: { item: ChatMessageListItem }) => {
    const originalIndex = messagesQuery.messages.findIndex((message) => message.id === item.id);
    const previous = originalIndex > 0 ? messagesQuery.messages[originalIndex - 1] : undefined;
    const showSender = !item.isMine && (!previous || previous.senderId !== item.senderId);

    return <MessageBubble item={item} showSender={showSender} />;
  };

  const chatContent = (
    <>
      {messagesQuery.isLoading ? (
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
          <Pressable
            disabled={!isChatOpen || isSendingFile}
            style={[styles.composerIconButton, !isChatOpen && styles.composerDisabled]}
            onPress={() => void handlePickFile()}
          >
            <AppIcon definition={paperclipIconDefinition} size={16} color="#7A6F68" />
          </Pressable>

          <View style={[styles.composerInputWrap, !isChatOpen && styles.composerDisabled]}>
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
        <Pressable style={styles.headerCircleButton} onPress={() => navigation.navigate("Messages", { projectId })}>
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

      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView style={styles.chatArea} behavior="padding" keyboardVerticalOffset={0}>
          {chatContent}
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.chatArea, androidKeyboardOffset > 0 ? { marginBottom: androidKeyboardOffset } : null]}>
          {chatContent}
        </View>
      )}
    </View>
  );
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

  const openAttachment = () => {
    if (item.attachment?.fileUrl) {
      void Linking.openURL(item.attachment.fileUrl);
    }
  };

  return (
    <View style={item.isMine ? styles.outgoingWrap : styles.messageBlock}>
      {!item.isMine && showSender ? <Text style={styles.senderLabel}>{item.senderName}</Text> : null}

      <View style={item.isMine ? styles.outgoingBubble : styles.incomingBubble}>
        {item.isMine ? <View style={styles.outgoingAccent} /> : null}

        {item.messageType === "FILE" && item.attachment ? (
          <Pressable style={styles.filePreview} onPress={openAttachment}>
            <View style={styles.fileIconWrap}>
              <AppIcon definition={paperclipIconDefinition} size={13} color="#C9A86A" />
            </View>
            <Text style={styles.fileName} numberOfLines={2}>
              {item.attachment.originalFileName}
            </Text>
          </Pressable>
        ) : null}

        {item.content ? (
          <Text style={item.isMine ? styles.outgoingText : styles.incomingText}>{item.content}</Text>
        ) : null}
      </View>

      <Text style={item.isMine ? styles.timeRight : styles.timeLeft}>{item.timeLabel}</Text>
    </View>
  );
}
