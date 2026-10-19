import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface ChatWidgetProps {
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

const SUGGESTED_PROMPTS = [
  'How can I reduce expenses this month?',
  'Am I within my budget limits?',
  'What is my top spending category?',
  'Give me 3 practical savings tips for Bangladesh.',
];

const STORAGE_KEY = 'finai_assistant_pos';
const WIDGET_SIZE = 56; // 56px x 56px (h-14 w-14)
const PADDING = 10;

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpenExternal,
  onCloseExternal,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  // Controlled or uncontrolled isOpen
  const isOpen = isOpenExternal !== undefined ? (isOpenExternal || internalOpen) : internalOpen;

  // Position state (null before initial layout calculation)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  // Drag tracking refs
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const positionRef = useRef<{ x: number; y: number }>({ x: 20, y: 300 });

  // Chat window element ref for outside click detection
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Calculate default position immediately above Settings
  const computeDefaultPosition = useCallback((): { x: number; y: number } => {
    const maxX = Math.max(PADDING, window.innerWidth - WIDGET_SIZE - PADDING);
    const maxY = Math.max(PADDING, window.innerHeight - WIDGET_SIZE - PADDING);

    // 1. Desktop sidebar anchor check
    if (window.innerWidth >= 1024) {
      const anchor =
        document.getElementById('ai-assistant-default-anchor-desktop') ||
        document.getElementById('nav-settings-desktop');

      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const posX = Math.round(rect.left + (rect.width - WIDGET_SIZE) / 2);
          const posY = Math.round(rect.top + (rect.height - WIDGET_SIZE) / 2);
          return {
            x: Math.min(Math.max(PADDING, posX), maxX),
            y: Math.min(Math.max(PADDING, posY), maxY),
          };
        }
      }
      // Fallback in sidebar area
      return {
        x: Math.min(Math.max(PADDING, 96), maxX),
        y: Math.min(Math.max(PADDING, window.innerHeight - 150), maxY),
      };
    }

    // 2. Mobile bottom bar check
    const mobileAnchor = document.getElementById('nav-settings-mobile');
    if (mobileAnchor) {
      const rect = mobileAnchor.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const posX = Math.round(rect.left + (rect.width - WIDGET_SIZE) / 2);
        const posY = Math.round(rect.top - WIDGET_SIZE - 12);
        return {
          x: Math.min(Math.max(PADDING, posX), maxX),
          y: Math.min(Math.max(PADDING, posY), maxY),
        };
      }
    }

    // Fallback default position
    return {
      x: maxX,
      y: Math.min(Math.max(PADDING, window.innerHeight - 140), maxY),
    };
  }, []);

  // Initialize position from localStorage or default
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          const maxX = Math.max(PADDING, window.innerWidth - WIDGET_SIZE - PADDING);
          const maxY = Math.max(PADDING, window.innerHeight - WIDGET_SIZE - PADDING);
          const valid = {
            x: Math.min(Math.max(PADDING, parsed.x), maxX),
            y: Math.min(Math.max(PADDING, parsed.y), maxY),
          };
          setPosition(valid);
          positionRef.current = valid;
          return;
        }
      }
    } catch {
      // ignore JSON parse errors
    }

    // Compute default position after render
    const rafId = requestAnimationFrame(() => {
      const defaultPos = computeDefaultPosition();
      setPosition(defaultPos);
      positionRef.current = defaultPos;
    });
    return () => cancelAnimationFrame(rafId);
  }, [computeDefaultPosition]);

  // Handle window resizing to keep widget strictly within viewport bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return computeDefaultPosition();
        const maxX = Math.max(PADDING, window.innerWidth - WIDGET_SIZE - PADDING);
        const maxY = Math.max(PADDING, window.innerHeight - WIDGET_SIZE - PADDING);
        const clamped = {
          x: Math.min(Math.max(PADDING, prev.x), maxX),
          y: Math.min(Math.max(PADDING, prev.y), maxY),
        };
        positionRef.current = clamped;
        return clamped;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [computeDefaultPosition]);

  // Robust close handler (fixes the close button bug!)
  const handleClose = useCallback(() => {
    setInternalOpen(false);
    if (onCloseExternal) {
      onCloseExternal();
    }
  }, [onCloseExternal]);

  const handleOpen = useCallback(() => {
    setInternalOpen(true);
  }, []);

  // Keyboard accessibility: Escape key closes the chat
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Outside click closes the chat
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDownOutside);
      document.addEventListener('touchstart', handlePointerDownOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isOpen, handleClose]);

  // Pointer drag handlers for desktop mouse & mobile finger
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only respond to primary mouse click or touch
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position?.x ?? 20,
      origY: position?.y ?? 300,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Movement threshold (> 6px) to reliably distinguish drag from click
    if (!hasMovedRef.current && Math.hypot(dx, dy) > 6) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      const maxX = Math.max(PADDING, window.innerWidth - WIDGET_SIZE - PADDING);
      const maxY = Math.max(PADDING, window.innerHeight - WIDGET_SIZE - PADDING);
      const nextX = Math.min(Math.max(PADDING, dragStartRef.current.origX + dx), maxX);
      const nextY = Math.min(Math.max(PADDING, dragStartRef.current.origY + dy), maxY);

      const nextPos = { x: nextX, y: nextY };
      setPosition(nextPos);
      positionRef.current = nextPos;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (hasMovedRef.current) {
      // Drag completed: persist the new position to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positionRef.current));
      } catch {
        // ignore
      }
    } else {
      // Clean click: open chat interface
      handleOpen();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Chat message & interaction state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am Finance AI, your personal financial assistant. You can ask me anything about your category budgets, cash and online wallet balances, or recent expenses.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(userText);
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: `Error connecting to Finance AI: ${err.message || 'Please check backend server connection.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const pos = position || { x: 20, y: 300 };

  return (
    <>
      {/* 1. Floating Draggable AI Assistant Widget */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            zIndex: 45,
            touchAction: 'none',
          }}
          className="select-none transition-shadow"
        >
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#E5484D] to-[#FF6B6B] hover:from-[#D63A3F] hover:to-[#E5484D] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group relative cursor-grab active:cursor-grabbing border-2 border-white/40"
            aria-label="Open Finance AI Assistant (Drag to move)"
            title="Finance AI Assistant (Drag to move, click to chat)"
          >
            <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform drop-shadow-xs" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white" />
            </span>
          </button>
        </div>
      )}

      {/* 2. Chat Interface Modal / Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-end sm:justify-end sm:p-6 bg-slate-900/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <div
            ref={chatWindowRef}
            className="w-[calc(100vw-24px)] sm:w-[420px] h-[580px] max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-label="Finance AI Chat Advisor"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#07241C] to-[#0E382C] px-5 py-4 text-white flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5">
                    <span>Finance AI</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-emerald-200/80 font-medium">
                    English Default • Real Wallet Context
                  </p>
                </div>
              </div>

              {/* CRITICAL: Working Close Button with High Z-Index & Reliable State Update */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer shrink-0"
                aria-label="Close Finance AI Chat"
                title="Close chat (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8F9FA] text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'bot' && (
                    <div className="h-7 w-7 rounded-xl bg-[#0F382C] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-2xs leading-relaxed whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-[#E5484D] text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1.5 text-right ${
                        m.sender === 'user' ? 'text-rose-200' : 'text-slate-400'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                  {m.sender === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-center text-slate-500 text-xs italic">
                  <div className="h-7 w-7 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-[#E5484D]" />
                  </div>
                  <span>Finance AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {messages.length <= 2 && (
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {SUGGESTED_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(p)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your budget, cash, or spending..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 focus:border-[#0F382C]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#E5484D] hover:bg-[#D63A3F] disabled:opacity-50 text-white transition-colors shrink-0 cursor-pointer shadow-xs"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};