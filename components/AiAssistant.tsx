
import React, { useState, useRef, useEffect } from 'react';
import { getDubaiInsights } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AiAssistantProps {
  onClose?: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Marhaban! I am your AI Dubai Guide. Ask me anything about visas, business setup, or travel regulations.',
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    const { text, groundingChunks } = await getDubaiInsights(userMsg.content);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: text,
      timestamp: Date.now(),
      groundingMetadata: { groundingChunks }
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  // Helper function to render Markdown content including inline citations
  const renderMarkdown = (text: string, role: 'user' | 'model') => {
    const isUser = role === 'user';
    const blocks = text.split(/(```[\s\S]*?```)/g);

    return blocks.map((block, blockIndex) => {
      if (block.startsWith('```') && block.endsWith('```')) {
        const content = block.slice(3, -3).replace(/^[a-z]+\n/, '');
        return (
          <div key={blockIndex} className={`p-3 rounded-lg my-3 font-mono text-xs overflow-x-auto ${isUser ? 'bg-black/20 text-white' : 'bg-gray-800 text-gray-100'}`}>
            <pre>{content}</pre>
          </div>
        );
      }
      const lines = block.split('\n');
      const renderedElements: React.ReactNode[] = [];
      let listBuffer: React.ReactNode[] = [];
      let isOrdered = false;

      const flushList = () => {
        if (listBuffer.length > 0) {
          const ListTag = isOrdered ? 'ol' : 'ul';
          renderedElements.push(
            <ListTag key={`list-${blockIndex}-${renderedElements.length}`} className={`mb-4 pl-5 ${isOrdered ? 'list-decimal' : 'list-disc'} space-y-1 ${isUser ? 'marker:text-white/70' : 'marker:text-gray-400'}`}>
              {listBuffer}
            </ListTag>
          );
          listBuffer = [];
        }
      };

      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const isNumber = /^\d+\.\s/.test(trimmed);

        if (isBullet || isNumber) {
          if (listBuffer.length > 0 && ((isOrdered && isBullet) || (!isOrdered && isNumber))) {
            flushList();
          }
          isOrdered = isNumber;
          const content = isBullet ? trimmed.slice(2) : trimmed.replace(/^\d+\.\s/, '');
          listBuffer.push(
            <li key={`li-${blockIndex}-${lineIndex}`}>
              {formatInline(content, isUser)}
            </li>
          );
        } else {
          flushList();
          if (trimmed === '') {
          } else if (trimmed.startsWith('### ')) {
            renderedElements.push(<h4 key={`h4-${blockIndex}-${lineIndex}`} className={`text-base font-bold mt-4 mb-2 ${isUser ? 'text-white' : 'text-gray-900'}`}>{formatInline(trimmed.slice(4), isUser)}</h4>);
          } else if (trimmed.startsWith('## ')) {
            renderedElements.push(<h3 key={`h3-${blockIndex}-${lineIndex}`} className={`text-lg font-bold mt-5 mb-2 ${isUser ? 'text-white' : 'text-gray-900'}`}>{formatInline(trimmed.slice(3), isUser)}</h3>);
          } else if (trimmed.startsWith('# ')) {
            renderedElements.push(<h2 key={`h2-${blockIndex}-${lineIndex}`} className={`text-xl font-bold mt-6 mb-3 ${isUser ? 'text-white' : 'text-gray-900'}`}>{formatInline(trimmed.slice(2), isUser)}</h2>);
          } else {
            renderedElements.push(<p key={`p-${blockIndex}-${lineIndex}`} className="mb-2 last:mb-0 min-h-[1.25rem]">{formatInline(line, isUser)}</p>);
          }
        }
      });
      flushList();
      return <div key={blockIndex}>{renderedElements}</div>;
    });
  };

  const formatInline = (text: string, isUser: boolean): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|\[\[Source:.*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={`font-bold ${isUser ? 'text-white' : 'text-gray-900'}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className={`px-1.5 py-0.5 rounded text-xs font-mono border ${isUser ? 'bg-white/20 text-white border-white/30' : 'bg-gray-100 text-pink-600 border-gray-200'}`}>{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('[[Source:') && part.endsWith(']]')) {
        const domain = part.slice(9, -2).trim();
        return (
          <span key={i} className={`inline-flex items-center px-1.5 py-0.5 mx-1 rounded-md text-[10px] font-medium align-middle select-none ${isUser ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
             {domain}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      {/* Backdrop (clickable) */}
      <div 
        className="absolute inset-0 bg-black/20 pointer-events-auto backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Drawer Container - Right Aligned, 75% width on mobile, max-w-md on desktop */}
      <div className="relative w-[75%] sm:max-w-md h-full bg-white shadow-2xl pointer-events-auto flex flex-col border-l border-gray-100 animate-slide-in-right transform transition-transform">
        
        {/* Header */}
        <div className="bg-dubai-dark p-4 flex justify-between items-center text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧞‍♂️</span>
            <div>
               <h2 className="font-bold text-base leading-none">Dubai AI Guide</h2>
               <p className="text-[10px] text-gray-400 mt-0.5">Powered by Google Gemini</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-xl p-3 shadow-sm text-sm ${msg.role === 'user' ? 'bg-dubai-gold text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                <div className="leading-relaxed">
                  {renderMarkdown(msg.content, msg.role)}
                </div>
                {msg.groundingMetadata?.groundingChunks && !msg.content.includes('[[Source:') && (
                  <div className="mt-2 flex flex-wrap gap-1 pt-2 border-t border-dashed border-gray-100/50">
                    {msg.groundingMetadata.groundingChunks.map((chunk, idx) => {
                      const uri = chunk.web?.uri || chunk.maps?.uri;
                      const title = chunk.web?.title || chunk.maps?.title || (uri ? new URL(uri).hostname : 'Source');
                      if (!uri) return null;
                      return (
                        <a key={idx} href={uri} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors ${msg.role === 'user' ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                           <span className="truncate max-w-[100px]">{title}</span>
                           <svg className="w-2 h-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none p-3 shadow-sm">
                 <div className="flex space-x-1">
                   <div className="w-1.5 h-1.5 bg-dubai-gold rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-dubai-gold rounded-full animate-bounce delay-75"></div>
                   <div className="w-1.5 h-1.5 bg-dubai-gold rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0 safe-area-pb">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              className="flex-grow px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none transition-all text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-dubai-dark text-white p-2.5 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
