
import React, { useState } from 'react';
import { UserRole, User, Notification, SiteSettings, AdminSection } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onPostRequest?: () => void;
  notifications?: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onToggleAi?: () => void;
  siteSettings?: SiteSettings;
  adminSection?: AdminSection;
  setAdminSection?: (section: AdminSection) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentPage, setCurrentPage, onLogout, onLoginClick, onPostRequest, notifications = [], onMarkRead, onMarkAllRead, onToggleAi, siteSettings, adminSection, setAdminSection }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const siteName = siteSettings?.siteName || 'DubaiLink';

  const SidebarLink = ({ page, label, icon, onClick, badge, isAdminLink, adminSectionKey }: { page?: string, label: string, icon: React.ReactNode, onClick?: () => void, badge?: number, isAdminLink?: boolean, adminSectionKey?: AdminSection }) => {
    let isActive = false;
    
    if (isAdminLink && adminSectionKey && setAdminSection) {
       isActive = currentPage === 'dashboard' && adminSection === adminSectionKey;
    } else {
       isActive = page === currentPage;
    }

    return (
      <button
        onClick={() => {
          if (onClick) onClick();
          else if (isAdminLink && adminSectionKey && setAdminSection) {
             setCurrentPage('dashboard');
             setAdminSection(adminSectionKey);
          }
          else if (page) setCurrentPage(page);
        }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
          isActive 
            ? 'bg-dubai-gold text-white shadow-md' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title={label}
      >
        <div className="flex items-center gap-3">
          <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-dubai-gold'}`}>
            {icon}
          </div>
          <span>{label}</span>
        </div>
        {badge && badge > 0 ? (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
            {badge}
          </span>
        ) : null}
      </button>
    );
  };

  const MobileTab = ({ label, icon, onClick, active, badge }: { label: string, icon: React.ReactNode, onClick: () => void, active: boolean, badge?: number }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors relative ${active ? 'text-dubai-gold' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* =================================================================================
          DESKTOP HEADER (Fixed Top)
      ================================================================================= */}
      <header className="hidden md:flex h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 items-center px-6 justify-between shadow-sm">
        {/* Left: Sidebar Toggle, Logo & Site Name */}
        <div className="flex items-center w-64">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="mr-4 text-gray-400 hover:text-dubai-gold transition-colors p-1 rounded-md hover:bg-gray-100"
            title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="w-8 h-8 bg-dubai-gold rounded-lg mr-3 flex items-center justify-center text-white font-bold text-lg">
              {siteName.charAt(0)}
            </div>
            <span className="text-xl font-bold text-dubai-dark tracking-tight">{siteName}</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
           <div className="relative group">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-dubai-gold transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </span>
             <input 
               type="text" 
               placeholder="Search for services, providers, or requests..." 
               className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none transition-all text-sm"
             />
           </div>
        </div>

        {/* Right: Actions (Notification & Profile) */}
        <div className="flex items-center gap-4">
           {/* Post Request Icon (Visible to guests and non-providers) */}
           {onPostRequest && (!user || user.role === UserRole.USER) && (
             <button 
               onClick={onPostRequest}
               className="p-2 text-gray-400 hover:text-dubai-gold hover:bg-gray-100 rounded-full transition-colors"
               title="Post New Request"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
             </button>
           )}

           {user ? (
             <>
               {/* Notifications */}
               <div className="relative">
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors"
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-1 z-50 ring-1 ring-black ring-opacity-5 animate-in fade-in duration-150 overflow-hidden border border-gray-100">
                       <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                         <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Notifications</h3>
                         {unreadCount > 0 && onMarkAllRead && (
                           <button onClick={onMarkAllRead} className="text-xs text-dubai-blue hover:underline font-medium">Mark all read</button>
                         )}
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                         {notifications.length > 0 ? (
                           notifications.map(notif => (
                             <div 
                               key={notif.id} 
                               className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/40' : ''}`}
                               onClick={() => {
                                  if(!notif.read && onMarkRead) onMarkRead(notif.id);
                                  if(notif.link === 'dashboard') setCurrentPage('dashboard');
                                  setShowNotifMenu(false);
                               }}
                             >
                               <div className="flex justify-between items-start mb-1">
                                 <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                                 <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                   {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                               </div>
                               <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                             </div>
                           ))
                         ) : (
                           <div className="px-4 py-12 text-center text-gray-500 text-sm">No notifications</div>
                         )}
                       </div>
                    </div>
                  )}
               </div>

               {/* Profile Dropdown */}
               <div className="relative">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-full pr-4 transition-colors border border-transparent hover:border-gray-200"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                     <div className="w-9 h-9 rounded-full bg-dubai-gold text-white flex items-center justify-center font-bold text-sm shadow-sm">
                       {user.name.charAt(0)}
                     </div>
                     <div className="text-left hidden lg:block">
                       <p className="text-sm font-bold text-gray-700 leading-none">{user.name}</p>
                       <p className="text-[10px] text-gray-500 mt-0.5 capitalize tracking-wide">{user.role.toLowerCase()}</p>
                     </div>
                     <svg className="w-4 h-4 text-gray-400 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-20 ring-1 ring-black ring-opacity-5 animate-in fade-in duration-150 border border-gray-100">
                        <button 
                          onClick={() => { setShowProfileMenu(false); setCurrentPage('profile-settings'); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {user.role === UserRole.PROVIDER ? 'Storefront Settings' : 'Profile Settings'}
                        </button>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <button 
                          onClick={() => { setShowProfileMenu(false); onLogout(); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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
                 className="text-gray-600 hover:text-gray-900 text-sm font-medium px-2"
               >
                 Sign In
               </button>
               <button 
                 onClick={onPostRequest || onLoginClick}
                 className="bg-dubai-dark text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-sm"
               >
                 Get Started
               </button>
             </div>
           )}
        </div>
      </header>

      {/* =================================================================================
          DESKTOP SIDEBAR (Left Navigation)
      ================================================================================= */}
      <aside 
        className={`hidden md:flex flex-col w-64 h-[calc(100vh-64px)] fixed left-0 top-16 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out ${
          isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
           {user && (
             <>
               <div className="mb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                 {user.role === UserRole.ADMIN ? 'Administration' : 'Main Menu'}
               </div>
               
               {user.role === UserRole.ADMIN ? (
                 <>
                   <SidebarLink isAdminLink adminSectionKey="overview" label="Overview" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="users" label="Users & Roles" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="requests" label="Leads & Requests" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="services" label="Service Types" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="ai-insights" label="AI Insights" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="reviews" label="Reviews & Trust" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="settings" label="Site Settings" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="security" label="Security & Comms" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
                   <SidebarLink isAdminLink adminSectionKey="audit" label="Audit Logs" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                   
                   <div className="mt-4 mb-2 px-4 border-t border-gray-100 pt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                     Global
                   </div>
                 </>
               ) : (
                 <SidebarLink 
                    page="dashboard" 
                    label="Dashboard" 
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                 />
               )}
               
               {user.role === UserRole.PROVIDER && (
                  <SidebarLink
                    page="provider-leads"
                    label="Leads & Quotes"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                  />
               )}

               <SidebarLink 
                  page="messages" 
                  label="Messages" 
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
               />
               
               <SidebarLink 
                  page="home" 
                  label="Marketplace" 
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
               />
               <SidebarLink 
                  label="Ask AI Guide" 
                  onClick={onToggleAi}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
               />

               <div className="mt-8 pt-6 border-t border-gray-100">
                  {user.role === UserRole.USER && onPostRequest && (
                    <button
                      onClick={onPostRequest}
                      className="w-full bg-dubai-gold hover:bg-yellow-600 text-white py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <span>Post Request</span>
                    </button>
                  )}
               </div>
             </>
           )}
           
           {!user && (
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                 <p className="text-sm text-gray-500 mb-3">Please sign in to access dashboard features.</p>
                 <button onClick={onLoginClick} className="w-full py-2 bg-dubai-dark text-white rounded-lg text-sm font-bold">Sign In</button>
              </div>
           )}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 text-xs text-center text-gray-400">
           &copy; 2025 {siteName}
        </div>
      </aside>

      {/* =================================================================================
          MOBILE TOP NAVIGATION (Hidden on Desktop)
      ================================================================================= */}
      <nav className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm h-16 w-full">
        {/* ... Mobile Nav Content ... */}
        {/* Simplified for brevity as modifications were mostly desktop sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="w-8 h-8 bg-dubai-gold rounded-lg mr-2 flex items-center justify-center text-white font-bold">
                {siteName.charAt(0)}
              </div>
              <span className="text-xl font-bold text-dubai-dark tracking-tight">{siteName}</span>
            </div>
            <div className="flex items-center space-x-2">
              {user && (
                <div className="relative">
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors"
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
                         <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-1 z-20 ring-1 ring-black ring-opacity-5 animate-in fade-in duration-150 overflow-hidden border border-gray-100">
                           <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                             <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Notifications</h3>
                             {unreadCount > 0 && onMarkAllRead && (
                               <button onClick={onMarkAllRead} className="text-xs text-dubai-blue hover:underline font-medium">Mark all read</button>
                             )}
                           </div>
                           <div className="max-h-80 overflow-y-auto">
                             {notifications.length > 0 ? (
                               notifications.map(notif => (
                                 <div 
                                   key={notif.id} 
                                   className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/40' : ''}`}
                                   onClick={() => {
                                      if(!notif.read && onMarkRead) onMarkRead(notif.id);
                                      if(notif.link === 'dashboard') setCurrentPage('dashboard');
                                      setShowNotifMenu(false);
                                   }}
                                 >
                                   <div className="flex justify-between items-start mb-1">
                                     <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                                     <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                       {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                     </span>
                                   </div>
                                   <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                                 </div>
                               ))
                             ) : (
                               <div className="px-4 py-12 text-center text-gray-500 text-sm">No notifications</div>
                             )}
                           </div>
                         </div>
                       </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out md:pt-16 ${isSidebarCollapsed ? 'md:pl-0' : 'md:pl-64'}`}>
        <main className="flex-grow pb-32 md:pb-0">
          {children}
        </main>
        
        {/* Footer hidden on mobile */}
        <footer className="hidden md:block bg-dubai-dark text-white py-12">
          {/* ... footer content ... */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-dubai-gold mb-4">{siteName}</h3>
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
                  {siteSettings?.contactEmail || 'support@dubailink.uae'}
                </p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
              &copy; 2025 {siteName}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation (Sticky Footer) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 items-center px-1 h-[70px]">
        {/* ... mobile tabs ... */}
        <MobileTab 
          label="Home" 
          active={currentPage === 'home' || currentPage === 'dashboard'} 
          onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
        />
        <MobileTab 
            label="Messages" 
            active={currentPage === 'messages'} 
            onClick={() => { 
                if(user) setCurrentPage('messages'); 
                else onLoginClick();
                setIsMobileMenuOpen(false); 
            }}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
        />
        <div className="relative h-full flex items-center justify-center">
             <button
                onClick={() => {
                    if (onPostRequest) {
                        if (user && user.role === UserRole.PROVIDER) {
                            // Do nothing or show message for provider
                        } else {
                            onPostRequest();
                        }
                    } else if (!user) {
                        onLoginClick();
                    }
                }}
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-dubai-gold text-white rounded-full shadow-lg border-4 border-gray-50 flex items-center justify-center transition-transform active:scale-95"
             >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             </button>
             <span className="absolute bottom-2 text-[10px] font-medium text-gray-400 pointer-events-none">Post</span>
        </div>
        <MobileTab 
          label="AI Guide" 
          active={false}
          onClick={() => { if(onToggleAi) onToggleAi(); setIsMobileMenuOpen(false); }}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <MobileTab 
          label="Profile" 
          active={isMobileMenuOpen} 
          onClick={() => {
              if (user) setIsMobileMenuOpen(!isMobileMenuOpen);
              else onLoginClick();
          }}
          icon={
            user ? (
              <div className="w-6 h-6 rounded-full bg-dubai-gold text-white flex items-center justify-center font-bold text-[10px]">
                {user.name.charAt(0)}
              </div>
            ) : (
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )
          }
        />
        </div>
      </div>

      {/* Mobile Slide-Up Menu (triggered by Profile/Menu tab) */}
      {isMobileMenuOpen && user && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-[60]" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div 
            className="md:hidden fixed left-2 right-2 bg-white rounded-2xl z-[70] animate-in slide-in-from-bottom duration-200 border border-gray-100 shadow-2xl mb-2"
            style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
          >
            <div className="px-6 py-4">
              <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
                 <div className="h-12 w-12 rounded-full bg-dubai-gold text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {user.name.charAt(0)}
                 </div>
                 <div className="ml-4">
                    <div className="text-lg font-bold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                 </div>
              </div>
              <div className="space-y-2">
                 <button onClick={() => { setCurrentPage('dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 font-medium text-gray-800 flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    My Dashboard
                 </button>
                 {user.role === UserRole.PROVIDER && (
                   <button onClick={() => { setCurrentPage('provider-leads'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 font-medium text-gray-800 flex items-center gap-3">
                     <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                     Leads & Quotes
                   </button>
                 )}
                 <button onClick={() => { setCurrentPage('profile-settings'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 font-medium text-gray-800 flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {user.role === UserRole.PROVIDER ? 'Storefront Settings' : 'Profile Settings'}
                 </button>
                 <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 font-medium text-red-600 flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign out
                 </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;
