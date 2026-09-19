import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  productContextUsed?: boolean;
  nutritionTargets?: any;
  recommendedProducts?: any[];
}

interface AIContextType {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  messages: AIMessage[];
  activeProductId: string | null;
  activeProductName: string | null;
  activeProductBrand: string | null;
  openChat: (productId?: string, productName?: string, productBrand?: string, initialPrompt?: string) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  setProductContext: (productId: string | null, name?: string, brand?: string) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

const INITIAL_MESSAGE: AIMessage = {
  id: 'welcome-init',
  role: 'assistant',
  content: `Hi! I'm **PackCheck AI** 👋\n\nI can help you understand packaged products, nutrition, healthier alternatives, and personalized diet plans.\n\nYou can ask me things like:\n• *Is this product healthy?*\n• *How much sugar does it contain?*\n• *Can I eat this daily?*\n• *Suggest a healthier alternative from PackCheck.*\n• *Create a full-day diet plan for me.*\n• *Bhai ye product daily khana safe hai kya?*`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([INITIAL_MESSAGE]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeProductName, setActiveProductName] = useState<string | null>(null);
  const [activeProductBrand, setActiveProductBrand] = useState<string | null>(null);

  const openChat = (productId?: string, productName?: string, productBrand?: string, initialPrompt?: string) => {
    setIsOpen(true);
    setIsMinimized(false);

    if (productId) {
      setActiveProductId(productId);
      setActiveProductName(productName || 'Selected Product');
      setActiveProductBrand(productBrand || '');

      // Add a product context greeting if this is the first message about this product
      const hasProductGreeting = messages.some(
        (m) => m.role === 'assistant' && m.content.includes(productName || productId)
      );

      if (!hasProductGreeting && productName) {
        const productIntro: AIMessage = {
          id: `product-intro-${Date.now()}`,
          role: 'assistant',
          content: `You're viewing **${productName}**${productBrand ? ` by ${productBrand}` : ''}. Ask me anything about its nutrition, health score, warnings, compliance, or healthier alternatives!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          productContextUsed: true
        };
        setMessages((prev) => [...prev, productIntro]);
      }
    }

    if (initialPrompt) {
      setTimeout(() => {
        sendMessage(initialPrompt);
      }, 100);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const setProductContext = (productId: string | null, name?: string, brand?: string) => {
    setActiveProductId(productId);
    setActiveProductName(name || null);
    setActiveProductBrand(brand || null);
  };

  const clearChat = () => {
    if (activeProductName) {
      setMessages([
        {
          id: `product-intro-${Date.now()}`,
          role: 'assistant',
          content: `Conversation reset. You're viewing **${activeProductName}**. How can I help you?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          productContextUsed: true
        }
      ]);
    } else {
      setMessages([INITIAL_MESSAGE]);
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    if (!navigator.onLine) {
      const offlineNotice: AIMessage = {
        id: `offline-${Date.now()}`,
        role: 'assistant',
        content: "You're currently offline. PackCheck AI requires an internet connection to process queries. Please reconnect to the internet and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, offlineNotice]);
      setIsLoading(false);
      return;
    }

    try {
      // Build conversation payload for backend
      const conversationHistory = messages
        .filter((m) => m.id !== 'welcome-init' && !m.id.startsWith('product-intro-'))
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content
        }));

      const res = await api.aiChat({
        message: trimmed,
        conversation: conversationHistory,
        productId: activeProductId || undefined
      });

      if (res.success && res.data) {
        const aiMessage: AIMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          productContextUsed: res.data.productContextUsed,
          nutritionTargets: res.data.nutritionTargets,
          recommendedProducts: res.data.recommendedProducts
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(res.error?.message || 'Failed to get AI response');
      }
    } catch (err: any) {
      console.error('[AIContext] Error sending message to PackCheck AI:', err);
      const errorMessage: AIMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, PackCheck AI is temporarily unavailable. Please try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        isOpen,
        isMinimized,
        isLoading,
        messages,
        activeProductId,
        activeProductName,
        activeProductBrand,
        openChat,
        closeChat,
        toggleMinimize,
        sendMessage,
        clearChat,
        setProductContext
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
