
import React, { useState, useRef, useEffect } from 'react';
import { getDubaiInsights } from '../services/geminiService';
import { ChatMessage } from '../types';

const AiAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Marhaban! I am your AI Dubai Guide. Ask me anything about visas, business setup, or travel regulations, and I will check the latest official sources for you.',
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
    // Split by code blocks first
    const blocks = text.split(/(```[\s\S]*?```)/g);

    return blocks.map((block, blockIndex) => {
      // Code Block
      if (block.startsWith('```') && block.endsWith('```')) {
        const content = block.slice(3, -3).replace(/^[a-z]+\n/, '');
        return (
          <div key={blockIndex} className={`p-3 rounded-lg my-3 font-mono text-xs overflow-x-auto ${isUser ? 'bg-black/20 text-white' : 'bg-gray-800 text-gray-100'}`}>
            <pre>{content}</pre>
          </div>
        );
      }

      // Text Block processing
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
             // Optional: renderedElements.push(<div className="h-2" key={`spacer-${blockIndex}-${lineIndex}`} />);
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
    // Regex matches bold (**text**), code (`text`), and our custom source tag [[Source: domain]]
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
        // Render as a chip resembling the screenshot
        return (
          <span key={i} className={`inline-flex items-center px-1.5 py-0.5 mx-1 rounded-md text-[10px] font-medium align-middle select-none ${
             isUser 
             ? 'bg-white/20 text-white' 
             : 'bg-gray-100 text-gray-500'
          }`}>
             {domain}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col flex-grow border border-gray-100">
        <div className="bg-gradient-to-r from-dubai-blue to-blue-900 p-6">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🧞‍♂️</span> Dubai AI Research Assistant
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Powered by Google Search & Maps Grounding for real-time accuracy.
          </p>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-dubai-gold text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <div className="text-sm leading-relaxed">
                  {renderMarkdown(msg.content, msg.role)}
                </div>
                
                {/* Fallback for general sources if no inline sources are detected or if extra metadata exists */}
                {msg.groundingMetadata?.groundingChunks && !msg.content.includes('[[Source:') && (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center pt-2 border-t border-dashed border-gray-100">
                    {msg.groundingMetadata.groundingChunks.map((chunk, idx) => {
                      const uri = chunk.web?.uri || chunk.maps?.uri;
                      const title = chunk.web?.title || chunk.maps?.title || (uri ? new URL(uri).hostname : 'Source');
                      
                      if (!uri) return null;

                      return (
                        <a 
                          key={idx}
                          href={uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors ${
                             msg.role === 'user' 
                             ? 'bg-white/20 text-white hover:bg-white/30' 
                             : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                           <span className="truncate max-w-[150px]">{title}</span>
                           <svg className="w-2.5 h-2.5 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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
               <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
                 <div className="flex space-x-2">
                   <div className="w-2 h-2 bg-dubai-gold rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-dubai-gold rounded-full animate-bounce delay-75"></div>
                   <div className="w-2 h-2 bg-dubai-gold rounded-full animate-bounce delay-150"></div>
                 </div>
                 <span className="text-xs text-gray-400 mt-2 block">Researching verifiable info...</span>
               </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., What are the requirements for a freelance visa in Dubai 2025?"
              className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-dubai-dark text-white px-6 py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <span>Ask</span>
              <svg className="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-400">
              AI can make mistakes. Always verify critical legal information with official authorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
