import React, { useState } from 'react';
import { Conversation } from '../types';

interface MessagesPageProps {
  conversations: Conversation[];
  onOpenChat: (userId: string, userName: string) => void;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ conversations, onOpenChat }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv => 
    conv.otherUserName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
           <input 
             type="text" 
             placeholder="Search chats..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-dubai-gold outline-none text-sm shadow-sm"
           />
           <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-[50vh]">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conv) => (
              <div 
                key={conv.otherUserId} 
                onClick={() => onOpenChat(conv.otherUserId, conv.otherUserName)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-dubai-gold/10 text-dubai-gold flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {conv.otherUserName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-bold text-gray-900 truncate">{conv.otherUserName}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {new Date(conv.timestamp).toLocaleDateString()} {new Date(conv.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate max-w-[80%] ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
               {searchTerm ? 'No matches found' : 'No messages yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              {searchTerm 
                ? `No conversations match "${searchTerm}".` 
                : "Connect with providers by requesting quotes. Once you receive a quote, you can start chatting here to discuss details."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;