import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, SparklesIcon, BotIcon, UserIcon, Loader2Icon, CheckIcon, XIcon, PanelRightCloseIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  onClose?: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help you create or modify diagrams. Just tell me what you need.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeDiagramId, diagrams, updateDiagram } = useStore();
  const activeDiagram = diagrams.find(d => d.id === activeDiagramId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentCode: activeDiagram?.mermaidCode || ''
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCode = (code: string) => {
    if (activeDiagramId) {
      updateDiagram(activeDiagramId, { mermaidCode: code });
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-sidebar border-l border-white/10 w-80">
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-2 bg-brand-sidebar/50 backdrop-blur">
        <SparklesIcon className="w-4 h-4 text-brand-accent shrink-0" />
        <h2 className="text-sm font-bold tracking-tight flex-1">AI Diagram Assistant</h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors lg:hidden">
            <PanelRightCloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider`}>
              {msg.role === 'assistant' ? <BotIcon className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
              {msg.role}
            </div>
            <div className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-brand-accent text-white rounded-tr-none' 
                : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
            }`}>
              <div className="markdown-body prose prose-invert prose-xs max-w-none">
                <Markdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');
                      
                      if (!inline && match && match[1] === 'mermaid') {
                        return (
                          <div className="my-2 space-y-2">
                            <pre className="p-2 bg-black/40 rounded border border-white/10 text-[10px] overflow-x-auto">
                              <code>{codeContent}</code>
                            </pre>
                            <button
                              onClick={() => applyCode(codeContent)}
                              className="w-full py-1.5 bg-brand-accent/20 hover:bg-brand-accent text-brand-accent hover:text-white border border-brand-accent/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                              <CheckIcon className="w-3 h-3" />
                              Apply to Editor
                            </button>
                          </div>
                        );
                      }
                      return <code className={className} {...props}>{children}</code>;
                    }
                  }}
                >
                  {msg.content}
                </Markdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest p-2">
            <Loader2Icon className="w-3 h-3 animate-spin" />
            AI is thinking...
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-brand-sidebar/50">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your request..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent/50 resize-none h-20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute bottom-3 right-3 p-2 bg-brand-accent hover:bg-brand-accent-hover rounded-lg text-white disabled:opacity-50 transition-all shadow-lg shadow-brand-accent/20"
          >
            <SendIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
