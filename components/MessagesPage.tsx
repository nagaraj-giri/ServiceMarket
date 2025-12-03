
import React from 'react';
import { Conversation } from '../types';

interface MessagesPageProps {
  conversations: Conversation[];
  onOpenChat: (userId: string, userName: string) => void;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ conversations, onOpenChat }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {conversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <div 
                key={conv.otherUserId} 
                onClick={() => onOpenChat(conv.otherUserId, conv.otherUserName)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-dubai-gold/10 text-dubai-gold flex items-center justify-center font-bold text-lg">
                  {conv.otherUserName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-bold text-gray-900 truncate">{conv.otherUserName}</h3>
                    <span className="text-xs text-gray-500">
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
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
            <p className="mt-1 text-sm">Conversations will appear here once you chat with a provider.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
