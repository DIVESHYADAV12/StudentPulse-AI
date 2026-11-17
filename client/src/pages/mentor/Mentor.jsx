import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Bot, 
  Sparkles, 
  Send, 
  User, 
  RotateCcw, 
  Lightbulb, 
  ArrowRight,
  Compass
} from 'lucide-react';

const SUGGESTED_CHIPS = [
  "What project should I build next to improve my score?",
  "What are the biggest gaps in my current profile?",
  "How should I explain my projects in a technical interview?",
  "Recommend resources to learn Docker & Cloud deployment"
];

export const Mentor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I'm **PulseMentor**, your 24/7 AI Career Companion. I have full context on your verified skills, portfolio projects, and target roles.\n\nHow can I help you accelerate your career preparation today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [followUps, setFollowUps] = useState(SUGGESTED_CHIPS);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/mentor/chat', {
        message: messageText.trim(),
        conversation_id: conversationId
      });

      setConversationId(res.data.conversation_id);
      setFollowUps(res.data.suggested_follow_ups || []);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Mentor chat failed", err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Sorry, I ran into an issue connecting to the mentoring engine. Please check your network and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setConversationId(null);
    setFollowUps(SUGGESTED_CHIPS);
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Fresh session started! What technical or career topic would you like to explore?`
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 flex flex-col h-[calc(100vh-12rem)] min-h-[550px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cream-200/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-900 text-white flex items-center justify-center shadow-premium">
            <Bot className="w-6 h-6 text-forest-300" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-navy-950 flex items-center gap-2">
              AI Career Guidance Mentor
              <span className="badge-forest text-[10px] py-0.5">24/7 Context-Aware</span>
            </h1>
            <p className="text-xs text-navy-800/60 font-medium">
              Grounded in your profile, skills, and target roles
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          title="Start fresh conversation"
          className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Chat
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                isUser 
                  ? 'bg-forest-700 text-white shadow-sm' 
                  : 'bg-white border border-cream-300 text-forest-800 shadow-sm'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-soft ${
                isUser
                  ? 'bg-forest-900 text-white rounded-tr-none'
                  : 'bg-white text-navy-900 border border-cream-200/90 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap font-normal">
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-cream-300 text-forest-800 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-cream-200 rounded-2xl rounded-tl-none p-4 shadow-soft">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up Chips */}
      {followUps.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-bold text-navy-800/50 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Prompts:
          </span>
          {followUps.slice(0, 3).map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-cream-300 hover:border-forest-400 hover:bg-forest-50 text-navy-800 transition-all whitespace-nowrap shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="shrink-0 relative"
      >
        <input
          type="text"
          placeholder="Ask PulseMentor about career paths, interview framing, system design..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="w-full pl-5 pr-14 py-3.5 bg-white border border-cream-300 rounded-2xl text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-forest-500 shadow-premium"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-forest-700 hover:bg-forest-800 text-white flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
