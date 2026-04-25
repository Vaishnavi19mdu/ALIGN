import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from './Button';

export const SiteBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am ALIGN Bot. How can I help you today?' }
  ]);

  const handleSend = () => {
    setMessages(prev => [...prev, 
      { role: 'user', text: 'How do I allocate tasks?' },
      { role: 'bot', text: 'You can run auto allocation from the dashboard or navigate to the Allocation tab for detailed matching logic.' }
    ]);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[calc(100vw-32px)] sm:w-80 h-[500px] sm:h-96 bg-white rounded-2xl shadow-2xl border border-black/5 flex flex-col overflow-hidden max-h-[80vh]"
          >
            <div className="p-4 bg-brand-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="font-heading font-medium">ALIGN Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-brand-background/30">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white text-brand-text-primary rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-black/5 flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 text-sm bg-brand-background/50 border-none focus:ring-0 rounded-lg px-3"
              />
              <Button size="icon" className="w-9 h-9" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};
