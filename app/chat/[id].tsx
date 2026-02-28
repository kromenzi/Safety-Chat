import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  Image,
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { fetch } from "expo/fetch";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat, Message, generateId } from "@/contexts/ChatContext";
import { useProfile } from "@/contexts/ProfileContext";
import { getApiUrl } from "@/lib/query-client";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const {
    getConversation,
    addMessage,
    updateLastMessage,
    updateConversationTitle,
  } = useChat();
  const { profile } = useProfile();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && id) {
      const conv = getConversation(id);
      if (conv?.messages) {
        setMessages(conv.messages);
      }
      initializedRef.current = true;
    }
  }, [id, getConversation]);

  const pickImage = useCallback(
    async (source: "camera" | "gallery") => {
      try {
        let result: ImagePicker.ImagePickerResult;

        if (source === "camera") {
          const { status } =
            await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") return;
          result = await ImagePicker.launchCameraAsync({
            base64: true,
            quality: 0.7,
            allowsEditing: true,
          });
        } else {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") return;
          result = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.7,
            allowsEditing: true,
          });
        }

        if (!result.canceled && result.assets[0]) {
          setSelectedImage(result.assets[0].uri);
          setSelectedImageBase64(result.assets[0].base64 || null);
          setSelectedFile(null);
        }
      } catch (error) {
        console.error("Image picker error:", error);
      }
    },
    [],
  );

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/plain",
          "text/csv",
          "text/html",
          "application/json",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        let fileContent = "";

        try {
          if (
            asset.mimeType?.startsWith("text/") ||
            asset.mimeType === "application/json"
          ) {
            fileContent = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.UTF8,
            });
          } else {
            const base64Content = await FileSystem.readAsStringAsync(
              asset.uri,
              {
                encoding: FileSystem.EncodingType.Base64,
              },
            );
            fileContent = `[Binary file: ${asset.name}, size: ${asset.size ? Math.round(asset.size / 1024) + "KB" : "unknown"}, type: ${asset.mimeType || "unknown"}]\n\nBase64 content available for analysis. This is a ${asset.mimeType} file named "${asset.name}".`;
          }
        } catch {
          fileContent = `[File: ${asset.name}, type: ${asset.mimeType || "unknown"}, size: ${asset.size ? Math.round(asset.size / 1024) + "KB" : "unknown"}]`;
        }

        setSelectedFile({
          name: asset.name,
          content: fileContent,
        });
        setSelectedImage(null);
        setSelectedImageBase64(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Document picker error:", error);
    }
  }, []);

  const showAttachOptions = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t.cancel, t.camera, t.gallery, t.attachFile],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) pickImage("camera");
          if (index === 2) pickImage("gallery");
          if (index === 3) pickDocument();
        },
      );
    } else {
      Alert.alert(t.analyzeImage, "", [
        { text: t.camera, onPress: () => pickImage("camera") },
        { text: t.gallery, onPress: () => pickImage("gallery") },
        { text: t.attachFile, onPress: () => pickDocument() },
        { text: t.cancel, style: "cancel" },
      ]);
    }
  }, [pickImage, pickDocument, t]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    const imageB64 = selectedImageBase64;
    const imageUri = selectedImage;
    const file = selectedFile;

    if (!text && !imageB64 && !file) return;
    if (isStreaming) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentMessages = [...messages];

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text,
      image: imageUri || undefined,
      fileName: file?.name,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    addMessage(id!, userMessage);
    setInputText("");
    setSelectedImage(null);
    setSelectedImageBase64(null);
    setSelectedFile(null);
    setIsStreaming(true);
    setShowTyping(true);

    if (currentMessages.length === 0) {
      const title = text
        ? text.slice(0, 40)
        : file
          ? file.name
          : isRTL
            ? "تحليل صورة"
            : "Image Analysis";
      updateConversationTitle(id!, title);
    }

    try {
      const baseUrl = getApiUrl();
      const chatHistory = [
        ...currentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "user" as const,
          content:
            text ||
            (file
              ? isRTL
                ? "حلل هذا الملف من ناحية السلامة"
                : "Analyze this file for safety compliance"
              : isRTL
                ? "حلل هذه الصورة للسلامة"
                : "Analyze this image for safety compliance"),
          image: imageB64 || undefined,
          fileContent: file?.content || undefined,
          fileName: file?.name || undefined,
        },
      ];

      const response = await fetch(`${baseUrl}api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ messages: chatHistory, userProfile: profile }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;

              if (!assistantAdded) {
                setShowTyping(false);
                const assistantMsg: Message = {
                  id: generateId(),
                  role: "assistant",
                  content: fullContent,
                  timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                assistantAdded = true;
              } else {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullContent,
                  };
                  return updated;
                });
              }
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (fullContent) {
        const finalMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: fullContent,
          timestamp: Date.now(),
        };
        addMessage(id!, finalMsg);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setShowTyping(false);
      const errMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: isRTL
          ? "حدث خطأ، يرجى المحاولة مرة أخرى."
          : "An error occurred. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }, [
    inputText,
    selectedImageBase64,
    selectedImage,
    selectedFile,
    isStreaming,
    messages,
    id,
    addMessage,
    updateConversationTitle,
    isRTL,
  ]);

  const reversedMessages = [...messages].reverse();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View
        style={[
          styles.header,
          {
            paddingTop:
              (Platform.OS === "web" ? webTopInset : insets.top) + 8,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={26}
            color={Colors.dark.tint}
          />
        </Pressable>
        <View style={styles.headerCenter}>
          <MaterialCommunityIcons
            name="shield-check"
            size={20}
            color={Colors.dark.tint}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t.safetyExpert}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isRTL={isRTL} />
          )}
          inverted={messages.length > 0}
          ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={styles.emptyChatIcon}>
                <MaterialCommunityIcons
                  name="shield-search"
                  size={40}
                  color={Colors.dark.tint}
                />
              </View>
              <Text
                style={[
                  styles.emptyChatTitle,
                  isRTL && { textAlign: "right" },
                ]}
              >
                {t.welcomeTitle}
              </Text>
              <Text
                style={[
                  styles.emptyChatDesc,
                  isRTL && { textAlign: "right" },
                ]}
              >
                {t.welcomeDesc}
              </Text>
            </View>
          }
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.messagesEmpty,
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[
            styles.inputArea,
            {
              paddingBottom:
                (Platform.OS === "web" ? webBottomInset : insets.bottom) + 8,
            },
          ]}
        >
          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
              <Pressable
                onPress={() => {
                  setSelectedImage(null);
                  setSelectedImageBase64(null);
                }}
                style={styles.removeAttachment}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </Pressable>
            </View>
          )}
          {selectedFile && (
            <View style={styles.filePreview}>
              <Ionicons
                name="document-text"
                size={20}
                color={Colors.dark.tint}
              />
              <Text style={styles.filePreviewName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Pressable
                onPress={() => setSelectedFile(null)}
                style={styles.removeFileBtn}
              >
                <Ionicons name="close-circle" size={20} color={Colors.dark.danger} />
              </Pressable>
            </View>
          )}
          <View
            style={[
              styles.inputRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Pressable
              onPress={showAttachOptions}
              disabled={isStreaming}
              style={({ pressed }) => [
                styles.attachButton,
                pressed && { opacity: 0.7 },
                isStreaming && { opacity: 0.4 },
              ]}
            >
              <Ionicons
                name="add-circle-outline"
                size={26}
                color={Colors.dark.textSecondary}
              />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={[styles.input, isRTL && { textAlign: "right" }]}
              placeholder={t.typeMessage}
              placeholderTextColor={Colors.dark.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
              blurOnSubmit={false}
              editable={!isStreaming}
            />
            <Pressable
              onPress={() => {
                handleSend();
                inputRef.current?.focus();
              }}
              disabled={
                isStreaming ||
                (!inputText.trim() && !selectedImageBase64 && !selectedFile)
              }
              style={({ pressed }) => [
                styles.sendButton,
                (inputText.trim() || selectedImageBase64 || selectedFile) &&
                !isStreaming
                  ? styles.sendButtonActive
                  : styles.sendButtonInactive,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
            >
              {isStreaming ? (
                <ActivityIndicator size="small" color={Colors.dark.tint} />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={
                    inputText.trim() || selectedImageBase64 || selectedFile
                      ? Colors.dark.background
                      : Colors.dark.textTertiary
                  }
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  headerRight: {
    width: 40,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  messagesEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyChat: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyChatIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.dark.tintLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    textAlign: "center",
  },
  emptyChatDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  imagePreview: {
    marginBottom: 8,
    position: "relative",
    alignSelf: "flex-start",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
  },
  removeAttachment: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filePreviewName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  removeFileBtn: {
    padding: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: Colors.dark.tint,
  },
  sendButtonInactive: {
    backgroundColor: Colors.dark.surface,
  },
});
