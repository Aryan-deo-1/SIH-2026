import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../context/AIContext';
import {
  Bot,
  Sparkles,
  X,
  Minus,
  Maximize2,
  Send,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Package,
  ArrowRight,
  ExternalLink,
  Flame,
  ChevronDown,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PackCheckAI: React.FC = () => {
  const {
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
  } = useAI();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages or loading
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    sendMessage(promptText);
  };

  // Helper to render markdown-like formatted text simply and cleanly
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Headers (### ...)
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-heading font-bold text-sm text-brand-dark-text mt-2 mb-1">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      // Divider (---)
      if (trimmed === '---') {
        return <hr key={idx} className="my-2 border-[#F1E5D7]" />;
      }

      // Bullet points
      const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
      const cleanLine = isBullet ? trimmed.replace(/^[•\-\*]\s+/, '') : trimmed;

      // Bold text formatting helper
      const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-brand-dark-text">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={pIdx} className="italic text-gray-700">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 text-xs text-brand-dark-text leading-relaxed">
            <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
            <div>{formattedParts}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs text-brand-dark-text my-1 leading-relaxed">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. Floating Action Button (Always visible unless chat is fully open on mobile) */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => openChat()}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-heading font-bold text-xs sm:text-sm px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            aria-label="Ask PackCheck AI"
          >
            <div className="relative">
              <Bot className="w-5 h-5 transition-transform group-hover:rotate-12 duration-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            <span className="tracking-wide">Ask PackCheck AI</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </button>
        ) : null}
      </div>

      {/* 2. Floating Chatbot Window / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out ${
            isMinimized
              ? 'bottom-5 right-5 w-80 sm:w-96 rounded-2xl shadow-xl'
              : 'bottom-2 right-2 sm:bottom-5 sm:right-5 w-[calc(100vw-1rem)] sm:w-[420px] max-w-[440px] h-[calc(100vh-2rem)] sm:h-[620px] max-h-[720px] rounded-2xl shadow-2xl flex flex-col'
          } bg-[#FFFDFB] border border-[#F1E5D7] overflow-hidden`}
          style={{ boxShadow: '0 12px 40px -8px rgba(217, 119, 6, 0.18), 0 4px 16px -2px rgba(0, 0, 0, 0.08)' }}
        >
          {/* Header - Soft warm yellow */}
          <div className="bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#FEF3C7] border-b border-[#F1E5D7] px-4 py-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm text-brand-dark-text">PackCheck AI</h3>
                  <span className="bg-amber-100/90 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-amber-300">
                    Assistant
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 font-medium">Your smart nutrition & product assistant</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                title="Clear Conversation"
                className="p-1.5 rounded-lg text-amber-900 hover:bg-amber-200/60 transition-colors"
                aria-label="Clear chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleMinimize}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 rounded-lg text-amber-900 hover:bg-amber-200/60 transition-colors"
                aria-label="Toggle minimize"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={closeChat}
                title="Close"
                className="p-1.5 rounded-lg text-amber-900 hover:bg-amber-200/60 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Product Context Banner */}
          {!isMinimized && activeProductName && (
            <div className="bg-[#FFFBEB] border-b border-amber-200/70 px-3.5 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-amber-950 font-medium truncate">
                  Context: <strong className="font-bold">{activeProductName}</strong> {activeProductBrand && `(${activeProductBrand})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProductContext(null)}
                className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold px-1.5 py-0.5 rounded-md hover:bg-amber-100 transition-colors shrink-0"
                title="Clear product context"
              >
                Clear
              </button>
            </div>
          )}

          {/* Chat Messages Body */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FAF6F0]/40">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs transition-all ${
                        isUser
                          ? 'bg-[#FDE68A] text-amber-950 rounded-tr-none border border-amber-300 font-medium'
                          : 'bg-white text-brand-dark-text rounded-tl-none border border-[#F1E5D7]'
                      }`}
                    >
                      {/* Product context indicator tag */}
                      {msg.productContextUsed && !isUser && (
                        <div className="inline-flex items-center gap-1 mb-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>PackCheck Verified Product Data</span>
                        </div>
                      )}

                      {/* Message Content */}
                      <div>{renderMessageContent(msg.content)}</div>

                      {/* Deterministic Nutrition Target Badges (if present) */}
                      {msg.nutritionTargets && (
                        <div className="mt-2.5 pt-2 border-t border-amber-100 bg-[#FFFBEB] p-2 rounded-xl">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">Macro Breakdown</span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                              {msg.nutritionTargets.targetCalories} kcal
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="bg-white p-1 rounded-lg border border-amber-200">
                              <div className="text-gray-500">Protein</div>
                              <div className="font-bold text-amber-900">{msg.nutritionTargets.protein.grams}g</div>
                            </div>
                            <div className="bg-white p-1 rounded-lg border border-amber-200">
                              <div className="text-gray-500">Carbs</div>
                              <div className="font-bold text-amber-900">{msg.nutritionTargets.carbs.grams}g</div>
                            </div>
                            <div className="bg-white p-1 rounded-lg border border-amber-200">
                              <div className="text-gray-500">Fats</div>
                              <div className="font-bold text-amber-900">{msg.nutritionTargets.fat.grams}g</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommended Packaged Products Cards */}
                      {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#F1E5D7] space-y-1.5">
                          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">PackCheck Product Matches:</p>
                          {msg.recommendedProducts.slice(0, 2).map((prod: any, pIdx: number) => (
                            <Link
                              key={pIdx}
                              to={`/product/${prod.id}`}
                              onClick={() => closeChat()}
                              className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-200 hover:border-amber-400 hover:bg-amber-100/60 transition-all text-brand-dark-text group"
                            >
                              <div className="truncate pr-2">
                                <div className="font-bold text-xs truncate group-hover:text-amber-700">{prod.name}</div>
                                <div className="text-[10px] text-brand-secondary-text">{prod.brand} • {prod.reason || 'Healthier choice'}</div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-brand-secondary-text px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Typing / Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 bg-white border border-[#F1E5D7] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-amber-900 w-fit shadow-xs animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-medium">PackCheck AI is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Suggestion Chips */}
          {!isMinimized && (
            <div className="px-3 py-2 bg-[#FAF6F0] border-t border-[#F1E5D7] overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
              {activeProductName ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Is this product healthy?')}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100 border border-[#F1E5D7] hover:border-amber-300 text-brand-dark-text px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    Is this healthy?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('How much sugar does it contain?')}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100 border border-[#F1E5D7] hover:border-amber-300 text-brand-dark-text px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    Sugar amount?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Suggest a healthier alternative')}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100 border border-[#F1E5D7] hover:border-amber-300 text-brand-dark-text px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    Healthier alternative
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Explain legal compliance status')}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100 border border-[#F1E5D7] hover:border-amber-300 text-brand-dark-text px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    Legal compliance?
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Make me a high-protein diet plan')}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100 border border-[#F1E5D7] hover:border-amber-300 text-brand-dark-text px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    High-protein diet plan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt("My weight is 68 kg and height is 5'9. Give me a full day diet plan.")}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100 border border-[#F1E5D7] hover:border-amber-300 text-brand-dark-text px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    Personalized diet plan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Bhai healthy Indian snacks suggest karo')}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100 border border-[#F1E5D7] hover:border-amber-300 text-brand-dark-text px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    Healthy snacks (Hinglish)
                  </button>
                </>
              )}
            </div>
          )}

          {/* Input Box Area */}
          {!isMinimized && (
            <div className="p-3 bg-white border-t border-[#F1E5D7]">
              <div className="flex items-end gap-2 bg-[#FAF6F0] border border-[#F1E5D7] rounded-xl px-3 py-2 focus-within:border-amber-400 focus-within:bg-white transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about nutrition, products, or diet plans..."
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-brand-dark-text placeholder-gray-400 resize-none focus:outline-hidden max-h-24 leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                    input.trim() && !isLoading
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-gray-600 font-medium">
                <span>Supports English, Hindi, Hinglish</span>
                <span>Press Enter to send</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
