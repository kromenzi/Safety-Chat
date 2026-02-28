import React, { memo, useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { Message } from "@/contexts/ChatContext";

interface Props {
  message: Message;
  isRTL: boolean;
}

function formatContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith("### ")) {
      parts.push(
        <Text key={`h3-${i}`} style={styles.heading3}>
          {line.slice(4)}
        </Text>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      parts.push(
        <Text key={`h2-${i}`} style={styles.heading2}>
          {line.slice(3)}
        </Text>,
      );
      continue;
    }
    if (line.startsWith("# ")) {
      parts.push(
        <Text key={`h1-${i}`} style={styles.heading1}>
          {line.slice(2)}
        </Text>,
      );
      continue;
    }

    if (line.startsWith("---") || line.startsWith("***")) {
      parts.push(<View key={`hr-${i}`} style={styles.divider} />);
      continue;
    }

    const isBullet =
      line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line);
    if (isBullet) {
      const isNumbered = /^\d+\.\s/.test(line);
      const bulletText = isNumbered
        ? line.replace(/^\d+\.\s/, "")
        : line.slice(2);
      const bullet = isNumbered ? line.match(/^\d+/)?.[0] + "." : "\u2022";

      parts.push(
        <View key={`bullet-${i}`} style={styles.bulletRow}>
          <Text style={styles.bulletMarker}>{bullet}</Text>
          <Text style={styles.bulletText} selectable>
            {renderInlineFormatting(bulletText, i)}
          </Text>
        </View>,
      );
      continue;
    }

    if (line.startsWith("  - ") || line.startsWith("  * ")) {
      parts.push(
        <View key={`sub-${i}`} style={styles.subBulletRow}>
          <Text style={styles.bulletMarker}>{"\u2022"}</Text>
          <Text style={styles.bulletText} selectable>
            {renderInlineFormatting(line.slice(4), i)}
          </Text>
        </View>,
      );
      continue;
    }

    if (line.trim() === "") {
      parts.push(<View key={`sp-${i}`} style={styles.spacer} />);
      continue;
    }

    parts.push(
      <Text key={`line-${i}`} style={styles.lineText} selectable>
        {renderInlineFormatting(line, i)}
      </Text>,
    );
  }

  return parts;
}

function renderInlineFormatting(
  text: string,
  lineIndex: number,
): React.ReactNode[] {
  const segments: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*|`(.*?)`/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(
        <Text key={`t-${lineIndex}-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </Text>,
      );
    }
    if (match[1] !== undefined) {
      segments.push(
        <Text key={`b-${lineIndex}-${match.index}`} style={styles.boldText}>
          {match[1]}
        </Text>,
      );
    } else if (match[2] !== undefined) {
      segments.push(
        <Text key={`c-${lineIndex}-${match.index}`} style={styles.codeText}>
          {match[2]}
        </Text>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(
      <Text key={`e-${lineIndex}-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Text>,
    );
  }

  return segments;
}

function MessageBubbleInner({ message, isRTL }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(message.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name="shield-check"
            size={16}
            color={Colors.dark.tint}
          />
        </View>
      )}
      <View
        style={[styles.bubbleWrapper, isUser && { alignItems: "flex-end" }]}
      >
        {message.image && (
          <Image
            source={{ uri: message.image }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        {message.fileName && (
          <View style={styles.fileAttachment}>
            <Ionicons
              name="document-text"
              size={18}
              color={Colors.dark.tint}
            />
            <Text style={styles.fileName} numberOfLines={1}>
              {message.fileName}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {isUser ? (
            <Text
              style={[
                styles.userText,
                isRTL && { textAlign: "right", writingDirection: "rtl" },
              ]}
              selectable
            >
              {message.content}
            </Text>
          ) : (
            <View style={[isRTL && { alignItems: "flex-end" }]}>
              {formatContent(message.content)}
            </View>
          )}
        </View>
        {!isUser && message.content.length > 0 && (
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.copyButton,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={14}
              color={copied ? Colors.dark.tint : Colors.dark.textTertiary}
            />
            <Text
              style={[
                styles.copyText,
                copied && { color: Colors.dark.tint },
              ]}
            >
              {copied ? (isRTL ? "تم النسخ" : "Copied") : (isRTL ? "نسخ" : "Copy")}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const MessageBubble = memo(MessageBubbleInner);
export default MessageBubble;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  assistantContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.dark.tintLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bubbleWrapper: {
    maxWidth: "80%",
    gap: 6,
  },
  messageImage: {
    width: 220,
    height: 165,
    borderRadius: 14,
    backgroundColor: Colors.dark.surface,
  },
  fileAttachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  fileName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: Colors.dark.userBubble,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.dark.aiBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  userText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.userBubbleText,
    lineHeight: 22,
  },
  lineText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.aiBubbleText,
    lineHeight: 23,
    marginBottom: 2,
  },
  boldText: {
    fontFamily: "Inter_700Bold",
    color: Colors.dark.tint,
  },
  codeText: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontSize: 13,
    color: Colors.dark.accent,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  heading1: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    marginBottom: 8,
    marginTop: 4,
  },
  heading2: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    marginBottom: 6,
    marginTop: 4,
  },
  heading3: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.tint,
    marginBottom: 4,
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 4,
    marginBottom: 4,
  },
  subBulletRow: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 20,
    marginBottom: 3,
  },
  bulletMarker: {
    fontSize: 15,
    color: Colors.dark.tint,
    fontFamily: "Inter_600SemiBold",
    width: 16,
  },
  bulletText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.aiBubbleText,
    lineHeight: 23,
    flex: 1,
  },
  spacer: {
    height: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 8,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  copyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
});
