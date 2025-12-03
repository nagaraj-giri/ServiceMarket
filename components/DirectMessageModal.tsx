import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';

interface DirectMessageModalProps {
  recipientName: string;
  currentUserRole: UserRole;
  onClose: () => void;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ recipientName, currentUserRole, onClose }) => {
  // Initial messages depend on who is viewing
  // If User is viewing, they see a message FROM provider.
  // If Provider is viewing, they see a message FROM user.
  const [messages, setMessages] = useState<{id: number, sender: 'user' | 'provider', text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mock conversation
    if (currentUserRole === UserRole.USER) {
      setMessages([
        { id: 1, sender: 'provider', text: `Hello! Regarding your request. How can I assist you today?` }
      ]);
    } else {
      setMessages([
        { id: 1, sender: 'user', text: `Hi, I saw your quote. Can we discuss the timeline?` }
      ]);
    }
  }, [currentUserRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // "Me" depends on the role
    const mySenderType = currentUserRole === UserRole.USER ? 'user' : 'provider';
    const otherSenderType = currentUserRole === UserRole.USER ? 'provider' : 'user';

    setMessages(prev => [...prev, { id: Date.now(), sender: mySenderType, text: inputText }]);
    setInputText('');

    // Mock auto-reply
    setTimeout(() => {
      const replyText = currentUserRole === UserRole.USER 
        ? "Thank you for the message. I'll review this and get back to you shortly."
        : "Thanks for the update. That sounds good.";
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: otherSenderType, 
        text: replyText 
      }]);
    }, 1500);
  };

  // Helper to determine if the message is from "Me"
  const isMe = (sender: 'user' | 'provider') => {
    if (currentUserRole === UserRole.USER) return sender === 'user';
    return sender === 'provider';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px] border border-gray-200">
        
        {/* Header */}
        <div className="bg-dubai-dark p-4 flex justify-between items-center text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-dubai-gold to-yellow-600 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
                {recipientName.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dubai-dark rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold leading-none">{recipientName}</h3>
              <span className="text-xs text-gray-400 font-medium">Online</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
           <div className="text-center text-xs text-gray-400 my-4">
             <span>Today</span>
           </div>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${isMe(msg.sender) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 shadow-sm text-sm ${
                isMe(msg.sender)
                  ? 'bg-dubai-blue text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <button type="button" className="text-gray-400 hover:text-dubai-gold transition-colors p-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 focus:ring-2 focus:ring-dubai-gold focus:bg-white transition-all outline-none text-sm"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="bg-dubai-gold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 transform rotate-90 translate-x-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectMessageModal;