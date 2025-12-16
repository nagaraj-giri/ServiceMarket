
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, DirectMessage } from '../types';
import { api } from '../services/api';
import { ToastType } from './Toast';
import { Skeleton } from './Skeleton';

interface DirectMessageModalProps {
  recipientName: string;
  recipientId: string;
  currentUser: { id: string, role: UserRole };
  onClose: () => void;
  showToast?: (message: string, type: ToastType) => void;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ recipientName, recipientId, currentUser, onClose, showToast }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const fetchMessages = async (isPolling = false) => {
    if (!currentUser) return;
    try {
      if (!isPolling) setIsLoading(true);
      const msgs = await api.getMessages(currentUser.id, recipientId);
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to fetch messages");
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 2 seconds
    pollingRef.current = setInterval(() => fetchMessages(true), 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentUser.id, recipientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await api.sendMessage(currentUser.id, recipientId, inputText);
      setInputText('');
      fetchMessages(true); // Refresh immediately
    } catch (err) {
      console.error("Failed to send message", err);
      if (showToast) showToast('Failed to send message. Please try again.', 'error');
    }
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
           {isLoading && messages.length === 0 ? (
             <div className="space-y-4">
                <div className="flex justify-start">
                   <Skeleton className="h-10 w-2/3 rounded-2xl rounded-tl-sm" />
                </div>
                <div className="flex justify-end">
                   <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tr-sm" />
                </div>
                <div className="flex justify-start">
                   <Skeleton className="h-8 w-1/2 rounded-2xl rounded-tl-sm" />
                </div>
             </div>
           ) : messages.length === 0 ? (
             <div className="text-center text-xs text-gray-400 my-10">
               <p>Start a conversation with {recipientName}</p>
             </div>
           ) : (
             messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 shadow-sm text-sm ${
                      isMe
                        ? 'bg-dubai-blue text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
             })
           )}
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
