import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  fileName?: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messages: Message[];
}

let messageCounter = 0;
function generateId(): string {
  messageCounter++;
  return `${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

interface ChatContextValue {
  conversations: Conversation[];
  createConversation: () => Conversation;
  deleteConversation: (id: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  addMessage: (conversationId: string, message: Message) => void;
  updateLastMessage: (conversationId: string, content: string) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  isLoaded: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const STORAGE_KEY = "safeguard_conversations";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setConversations(JSON.parse(data));
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  const saveToStorage = useCallback((convs: Conversation[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const toSave = convs.map((c) => ({
        ...c,
        messages: c.messages.map((m) => ({
          ...m,
          image: undefined,
        })),
      }));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }, 500);
  }, []);

  const createConversation = useCallback(() => {
    const conv: Conversation = {
      id: generateId(),
      title: "New Analysis",
      lastMessage: "",
      timestamp: Date.now(),
      messages: [],
    };
    setConversations((prev) => {
      const updated = [conv, ...prev];
      saveToStorage(updated);
      return updated;
    });
    return conv;
  }, [saveToStorage]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const getConversation = useCallback(
    (id: string) => {
      return conversations.find((c) => c.id === id);
    },
    [conversations],
  );

  const addMessage = useCallback(
    (conversationId: string, message: Message) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: [...c.messages, message],
              lastMessage:
                message.content.slice(0, 100) ||
                (message.image ? "Image analysis" : message.fileName ? "File: " + message.fileName : ""),
              timestamp: message.timestamp,
            };
          }
          return c;
        });
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const updateLastMessage = useCallback(
    (conversationId: string, content: string) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === conversationId) {
            const msgs = [...c.messages];
            if (msgs.length > 0) {
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
            }
            return { ...c, messages: msgs };
          }
          return c;
        });
        return updated;
      });
    },
    [],
  );

  const updateConversationTitle = useCallback(
    (conversationId: string, title: string) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === conversationId) {
            return { ...c, title };
          }
          return c;
        });
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const value = useMemo(
    () => ({
      conversations,
      createConversation,
      deleteConversation,
      getConversation,
      addMessage,
      updateLastMessage,
      updateConversationTitle,
      isLoaded,
    }),
    [
      conversations,
      createConversation,
      deleteConversation,
      getConversation,
      addMessage,
      updateLastMessage,
      updateConversationTitle,
      isLoaded,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}

export { generateId };
