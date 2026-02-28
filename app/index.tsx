import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat, Conversation } from "@/contexts/ChatContext";
import { useProfile, UserProfile } from "@/contexts/ProfileContext";

function ConversationItem({
  item,
  onDelete,
  isRTL,
}: {
  item: Conversation;
  onDelete: (id: string) => void;
  isRTL: boolean;
}) {
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (days === 1) return isRTL ? "أمس" : "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/chat/[id]", params: { id: item.id } });
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete(item.id);
      }}
      style={({ pressed }) => [
        styles.chatItem,
        pressed && styles.chatItemPressed,
      ]}
    >
      <View style={styles.chatIcon}>
        <MaterialCommunityIcons
          name="shield-check"
          size={22}
          color={Colors.dark.tint}
        />
      </View>
      <View style={[styles.chatContent, isRTL && styles.chatContentRTL]}>
        <View
          style={[styles.chatHeader, isRTL && { flexDirection: "row-reverse" }]}
        >
          <Text
            style={[styles.chatTitle, isRTL && { textAlign: "right" }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.chatTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text
          style={[styles.chatPreview, isRTL && { textAlign: "right" }]}
          numberOfLines={2}
        >
          {item.lastMessage || (isRTL ? "تحليل جديد" : "New analysis")}
        </Text>
      </View>
    </Pressable>
  );
}

function ProfileField({
  label,
  value,
  placeholder,
  onChangeText,
  isRTL,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  isRTL: boolean;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={[styles.fieldLabel, isRTL && { textAlign: "right" }]}>
        {label}
      </Text>
      <TextInput
        style={[styles.fieldInput, isRTL && { textAlign: "right" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.dark.textTertiary}
      />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t, lang, setLang, isRTL } = useLanguage();
  const { conversations, createConversation, deleteConversation, isLoaded } =
    useChat();
  const { profile, updateProfile, hasProfile } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile>({
    name: "",
    jobTitle: "",
    company: "",
    department: "",
    industry: "",
    certifications: "",
    experience: "",
  });

  const handleNewChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const conv = createConversation();
    router.push({ pathname: "/chat/[id]", params: { id: conv.id } });
  }, [createConversation]);

  const handleDelete = useCallback(
    (id: string) => {
      if (Platform.OS === "web") {
        deleteConversation(id);
        return;
      }
      Alert.alert(t.deleteChat, t.deleteChatDesc, [
        { text: t.cancel, style: "cancel" },
        {
          text: t.confirm,
          style: "destructive",
          onPress: () => deleteConversation(id),
        },
      ]);
    },
    [deleteConversation, t],
  );

  const toggleLang = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLang(lang === "en" ? "ar" : "en");
  }, [lang, setLang]);

  const openProfileModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProfile({ ...profile });
    setShowProfileModal(true);
  }, [profile]);

  const saveProfile = useCallback(() => {
    updateProfile(editingProfile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowProfileModal(false);
  }, [editingProfile, updateProfile]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIconContainer}>
          <MaterialCommunityIcons
            name="shield-search"
            size={48}
            color={Colors.dark.tint}
          />
        </View>
        <Text style={[styles.welcomeTitle, isRTL && { textAlign: "right" }]}>
          {t.welcomeTitle}
        </Text>
        <Text style={[styles.welcomeDesc, isRTL && { textAlign: "right" }]}>
          {t.welcomeDesc}
        </Text>

        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: Colors.dark.tintLight },
              ]}
            >
              <MaterialCommunityIcons
                name="hard-hat"
                size={20}
                color={Colors.dark.tint}
              />
            </View>
            <Text style={styles.featureTitle}>{t.feature1}</Text>
            <Text style={styles.featureDesc}>{t.feature1Desc}</Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: Colors.dark.warningLight },
              ]}
            >
              <Ionicons
                name="warning"
                size={20}
                color={Colors.dark.warning}
              />
            </View>
            <Text style={styles.featureTitle}>{t.feature2}</Text>
            <Text style={styles.featureDesc}>{t.feature2Desc}</Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: Colors.dark.accentLight },
              ]}
            >
              <Ionicons
                name="document-text"
                size={20}
                color={Colors.dark.accent}
              />
            </View>
            <Text style={styles.featureTitle}>{t.feature3}</Text>
            <Text style={styles.featureDesc}>{t.feature3Desc}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!isLoaded) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View
        style={[
          styles.header,
          {
            paddingTop:
              (Platform.OS === "web" ? webTopInset : insets.top) + 12,
          },
        ]}
      >
        <View
          style={[
            styles.headerRow,
            isRTL && { flexDirection: "row-reverse" },
          ]}
        >
          <Text style={styles.headerTitle}>{t.appTitle}</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={openProfileModal}
              style={({ pressed }) => [
                styles.profileButton,
                hasProfile && styles.profileButtonActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="person"
                size={18}
                color={hasProfile ? Colors.dark.tint : Colors.dark.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={toggleLang}
              style={({ pressed }) => [
                styles.langButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.langText}>
                {lang === "en" ? "عربي" : "EN"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleNewChat}
              style={({ pressed }) => [
                styles.newChatButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Feather name="plus" size={22} color={Colors.dark.background} />
            </Pressable>
          </View>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            item={item}
            onDelete={handleDelete}
            isRTL={isRTL}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.listEmpty,
          {
            paddingBottom:
              (Platform.OS === "web" ? webBottomInset : insets.bottom) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 12,
                paddingBottom: (Platform.OS === "web" ? webBottomInset : insets.bottom) + 12,
              },
            ]}
          >
            <View style={[styles.modalHeader, isRTL && { flexDirection: "row-reverse" }]}>
              <Pressable
                onPress={() => setShowProfileModal(false)}
                style={({ pressed }) => [pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="close" size={26} color={Colors.dark.textSecondary} />
              </Pressable>
              <Text style={styles.modalTitle}>{t.editProfile}</Text>
              <Pressable
                onPress={saveProfile}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="checkmark" size={24} color={Colors.dark.background} />
              </Pressable>
            </View>

            <Text style={[styles.profileHint, isRTL && { textAlign: "right" }]}>
              {t.profileHint}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.profileForm}
            >
              <ProfileField
                label={t.name}
                value={editingProfile.name}
                placeholder={t.namePlaceholder}
                onChangeText={(v) => setEditingProfile((p) => ({ ...p, name: v }))}
                isRTL={isRTL}
              />
              <ProfileField
                label={t.jobTitle}
                value={editingProfile.jobTitle}
                placeholder={t.jobTitlePlaceholder}
                onChangeText={(v) => setEditingProfile((p) => ({ ...p, jobTitle: v }))}
                isRTL={isRTL}
              />
              <ProfileField
                label={t.company}
                value={editingProfile.company}
                placeholder={t.companyPlaceholder}
                onChangeText={(v) => setEditingProfile((p) => ({ ...p, company: v }))}
                isRTL={isRTL}
              />
              <ProfileField
                label={t.department}
                value={editingProfile.department}
                placeholder={t.departmentPlaceholder}
                onChangeText={(v) => setEditingProfile((p) => ({ ...p, department: v }))}
                isRTL={isRTL}
              />
              <ProfileField
                label={t.industry}
                value={editingProfile.industry}
                placeholder={t.industryPlaceholder}
                onChangeText={(v) => setEditingProfile((p) => ({ ...p, industry: v }))}
                isRTL={isRTL}
              />
              <ProfileField
                label={t.certifications}
                value={editingProfile.certifications}
                placeholder={t.certificationsPlaceholder}
                onChangeText={(v) => setEditingProfile((p) => ({ ...p, certifications: v }))}
                isRTL={isRTL}
              />
              <ProfileField
                label={t.experience}
                value={editingProfile.experience}
                placeholder={t.experiencePlaceholder}
                onChangeText={(v) => setEditingProfile((p) => ({ ...p, experience: v }))}
                isRTL={isRTL}
              />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonActive: {
    borderColor: Colors.dark.tint,
    backgroundColor: Colors.dark.tintLight,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  langText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: 8,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  chatItemPressed: {
    backgroundColor: Colors.dark.surface,
  },
  chatIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.dark.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chatContent: {
    flex: 1,
  },
  chatContentRTL: {
    alignItems: "flex-end",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  chatPreview: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
  welcomeCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.dark.tintLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  featuresGrid: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    textAlign: "center",
  },
  featureDesc: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    textAlign: "center",
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
    lineHeight: 20,
    marginBottom: 16,
  },
  profileForm: {
    flex: 1,
  },
  profileField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
});
