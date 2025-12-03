
import React, { useState } from 'react';
import { UserRole, User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
  onLoginClick: () => void;
  notifications?: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentPage, setCurrentPage, onLogout, onLoginClick, notifications = [], onMarkRead, onMarkAllRead }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="w-8 h-8 bg-dubai-gold rounded-lg mr-2 flex items-center justify-center text-white font-bold">D</div>
              <span className="text-xl font-bold text-dubai-dark tracking-tight">Dubai<span className="text-dubai-gold">Link</span></span>
            </div>
            
            <div className="hidden sm:flex items-center space-x-8">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`${currentPage === 'home' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setCurrentPage('ai-assistant')}
                className={`${currentPage === 'ai-assistant' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16 flex items-center gap-1`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Ask AI Guide
              </button>
              {user && (
                <>
                  <button 
                    onClick={() => setCurrentPage('dashboard')}
                    className={`${currentPage === 'dashboard' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16`}
                  >
                    My Dashboard
                  </button>
                  <button 
                    onClick={() => setCurrentPage('messages')}
                    className={`${currentPage === 'messages' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16`}
                  >
                    Messages
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button 
                      className="p-2 text-gray-400 hover:text-gray-600 relative"
                      onClick={() => setShowNotifMenu(!showNotifMenu)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                      )}
                    </button>

                    {showNotifMenu && (
                       <>
                         <div className="fixed inset-0 z-10" onClick={() => setShowNotifMenu(false)}></div>
                         <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5 animate-in fade-in duration-150 overflow-hidden">
                           <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                             <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Notifications</h3>
                             {unreadCount > 0 && onMarkAllRead && (
                               <button onClick={onMarkAllRead} className="text-xs text-dubai-blue hover:underline">Mark all read</button>
                             )}
                           </div>
                           <div className="max-h-80 overflow-y-auto">
                             {notifications.length > 0 ? (
                               notifications.map(notif => (
                                 <div 
                                   key={notif.id} 
                                   className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                   onClick={() => {
                                      if(!notif.read && onMarkRead) onMarkRead(notif.id);
                                      if(notif.link === 'dashboard') setCurrentPage('dashboard');
                                      setShowNotifMenu(false);
                                   }}
                                 >
                                   <div className="flex justify-between items-start mb-1">
                                     <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                                     <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                       {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                     </span>
                                   </div>
                                   <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                                 </div>
                               ))
                             ) : (
                               <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications</div>
                             )}
                           </div>
                         </div>
                       </>
                    )}
                  </div>

                  {/* Profile */}
                  <div className="relative">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                       <div className="w-8 h-8 rounded-full bg-dubai-gold text-white flex items-center justify-center font-bold text-sm">
                         {user.name.charAt(0)}
                       </div>
                       <div className="hidden md:block text-left">
                         <p className="text-sm font-medium text-gray-700 leading-none">{user.name}</p>
                         <p className="text-xs text-gray-500 mt-0.5 capitalize">{user.role.toLowerCase()}</p>
                       </div>
                       <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5 animate-in fade-in duration-150">
                          <button 
                            onClick={() => { setShowProfileMenu(false); setCurrentPage('profile-settings'); }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            {user.role === UserRole.PROVIDER ? 'Storefront Settings' : 'Profile Settings'}
                          </button>
                          <button 
                            onClick={() => { setShowProfileMenu(false); setCurrentPage('dashboard'); }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Dashboard
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button 
                            onClick={() => { setShowProfileMenu(false); onLogout(); }}
                            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          >
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={onLoginClick}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={onLoginClick}
                    className="bg-dubai-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dubai-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-dubai-gold mb-4">DubaiLink</h3>
              <p className="text-gray-400 text-sm">
                The trusted marketplace for premium services in Dubai. Visas, Business Setup, and Travel made simple.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Golden Visa Assistance</li>
                <li>Freezone Company Setup</li>
                <li>Mainland Licensing</li>
                <li>Luxury Travel Concierge</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400 text-sm">
                Downtown Dubai, UAE<br/>
                support@dubailink.uae
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; 2025 DubaiLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
