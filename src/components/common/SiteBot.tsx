import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'bot';
  text: string;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ALIGN Assistant — the built-in AI helper for the ALIGN volunteer management platform.

ALIGN is a platform that:
- Matches volunteers to disaster relief and community tasks using AI-powered allocation
- Scores volunteers using skill match (30%), reliability (25%), availability (15%), and proximity (30%)
- Has roles: Super Admin, Org Admin, Org Staff, and Volunteer
- Lets organisations post tasks with urgency levels: Low, High, Critical
- Shows volunteers nearby tasks via geolocation and proximity scoring
- Tracks volunteer performance: reliability score, badges (First Task, Fast Responder, Consistent Volunteer, Trusted Volunteer), completion rate
- Uses Firebase Firestore for live task data, Groq AI for allocation reasoning
- Task statuses: New → Active → Completed
- Volunteers can Accept or Decline tasks; Mark Complete when done
- Admins can run Auto-Allocation which ranks volunteers by suitability score

Navigation:
- Dashboard: overview of assigned/active/completed tasks + nearby tasks
- My Tasks: full task list with filters
- Performance: reliability ring, badges, trust score
- Alerts: notification centre
- Settings: profile, skills, availability, location capture

Behaviour rules:
- Answer questions about ALIGN concisely and helpfully
- Answer small talk naturally (greetings, "how are you", etc.)
- Answer basic maths questions and show working briefly
- Answer basic location questions if the user mentions their city/country (e.g. time zones, distance)
- For anything completely unrelated to the above, politely redirect: "I'm best at helping with ALIGN or quick questions — try me!"
- Keep responses SHORT (2–4 sentences max unless a list is genuinely needed)
- Never hallucinate features that don't exist
- Use plain text only — no markdown headers, no bullet asterisks rendered literally`;

// ─── Groq call ────────────────────────────────────────────────────────────────

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

async function askGroq(history: Message[], userText: string): Promise<string> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: userText },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
  model: 'meta-llama/llama-4-scout-17b-16e-instruct', // ← updated
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.2,
}),
  });

  if (!res.ok) throw new Error('Groq error');
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? 'Sorry, I could not get a response.';
}

// ─── Quick replies ────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  'How does task allocation work?',
  'What are the volunteer badges?',
  'How is my score calculated?',
  'How do I update my location?',
];

// ─── SiteBot ──────────────────────────────────────────────────────────────────

export const SiteBot = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hey! I\'m the ALIGN Assistant. Ask me anything about the platform, your tasks, or just say hi 👋' },
  ]);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askGroq(messages, trimmed);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const showQuickReplies = messages.length === 1;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="w-[calc(100vw-48px)] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-black/6 flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(520px, 80vh)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-brand-primary flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">ALIGN Assistant</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white/70 text-[10px]">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-brand-background/20">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Bot className="w-3 h-3 text-brand-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-primary text-white rounded-tr-sm'
                        : 'bg-white text-brand-text-primary rounded-tl-sm shadow-sm border border-black/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-brand-primary" />
                  </div>
                  <div className="bg-white border border-black/5 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-brand-primary/40"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick replies */}
              {showQuickReplies && !loading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_REPLIES.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="px-2.5 py-1.5 bg-white border border-brand-primary/20 text-brand-primary rounded-full text-[11px] font-medium hover:bg-brand-primary hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-black/5 bg-white flex items-center gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything…"
                disabled={loading}
                className="flex-1 text-[13px] bg-brand-background/60 border border-black/8 rounded-xl px-3.5 py-2 outline-none focus:border-brand-primary/40 transition-colors placeholder:text-brand-text-secondary/50 disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle button ───────────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setIsOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-14 h-14 bg-brand-primary text-white rounded-full shadow-xl flex items-center justify-center relative"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x"  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="mc" initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageCircle className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>

        {/* Unread dot — shows only when closed and bot has replied more than once */}
        {!isOpen && messages.length > 1 && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </div>
  );
};