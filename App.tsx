
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import RequestForm from './components/RequestForm';
import ProviderLeadsPage from './components/ProviderLeadsPage';
import SubmitQuoteModal from './components/SubmitQuoteModal';
import QuoteAcceptanceModal from './components/QuoteAcceptanceModal';
import ProfileSettings from './components/ProfileSettings';
import QuoteDetailsModal from './components/QuoteDetailsModal';
import AdminDashboard from './components/AdminDashboard';
import VerifyEmailPage from './components/VerifyEmailPage';
import Toast, { ToastType } from './components/Toast';
import AiAssistant from './components/AiAssistant';
import MessagesPage from './components/MessagesPage';
import DirectMessageModal from './components/DirectMessageModal';
import ProviderProfileView from './components/ProviderProfile';

import { User, UserRole, ServiceRequest, ProviderProfile, Notification, Quote, ServiceType, ServiceCategory, Conversation, AdminSection, SiteSettings } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  // Authentication & User State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [currentPage, setCurrentPage] = useState('home');
  const [adminSection, setAdminSection] = useState<AdminSection>('overview');

  // Data State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'DubaiLink',
    contactEmail: '',
    maintenanceMode: false,
    allowNewRegistrations: true,
    heroTitle: 'Golden Visa AE',
    heroSubtitle: 'Secure your 10-year residency today with expert guidance.',
    heroButtonText: 'Post Request'
  });

  // UI State (Modals, Drawers)
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  // Store pending request data for guests
  const [pendingRequestData, setPendingRequestData] = useState<Omit<ServiceRequest, 'id' | 'quotes' | 'status' | 'createdAt'> | null>(null);
  
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [activeRequestForQuote, setActiveRequestForQuote] = useState<string | null>(null);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [activeQuoteForAcceptance, setActiveQuoteForAcceptance] = useState<{ quote: Quote, reqStatus: ServiceRequest['status'] } | null>(null);

  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [activeQuoteDetail, setActiveQuoteDetail] = useState<Quote | null>(null);

  const [viewingProviderId, setViewingProviderId] = useState<string | null>(null);
  
  const [chatUser, setChatUser] = useState<{id: string, name: string} | null>(null);
  
  const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({ message: '', type: 'info', isVisible: false });
  const [showAi, setShowAi] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        const types = await api.getServiceTypes();
        setServiceTypes(types);

        const settings = await api.getSettings();
        setSiteSettings(settings);

        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
           await loadUserData(currentUser);
        }
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- DATA LOADING ---
  const loadUserData = async (currentUser: User) => {
    try {
      const msgs = await api.getConversations(currentUser.id);
      setConversations(msgs);
      const notifs = await api.getNotifications(currentUser.id);
      setNotifications(notifs);

      if (currentUser.role === UserRole.USER) {
         const reqs = await api.getRequests(currentUser);
         setRequests(reqs);
      } else if (currentUser.role === UserRole.PROVIDER) {
         // Load all requests (leads will be filtered in component)
         const allReqs = await api.getRequests({ role: UserRole.ADMIN } as User); 
         setRequests(allReqs);
         const myProfile = await api.getProviders();
         setProviders(myProfile); // Load all to find self
      } else if (currentUser.role === UserRole.ADMIN) {
         const allReqs = await api.getRequests({ role: UserRole.ADMIN } as User);
         setRequests(allReqs);
         const allUsers = await api.getAllUsers();
         setAdminUsers(allUsers);
         const allProvs = await api.getProviders();
         setProviders(allProvs);
      }
    } catch (e) {
      console.error("Failed to load user data", e);
    }
  };

  // --- ACTIONS ---
  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCurrentPage('home');
    setRequests([]);
    setNotifications([]);
    setConversations([]);
  };

  const showToastMessage = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const openRequestForm = (category?: string) => {
     setActiveCategory(category);
     setShowRequestForm(true);
  };

  const refreshData = async () => {
    if (user) await loadUserData(user);
    // Also refresh settings in case admin updated them
    const settings = await api.getSettings();
    setSiteSettings(settings);
  };

  const handleLoginSuccess = async () => {
    setLoading(true);
    try {
        const u = await api.getCurrentUser();
        setUser(u);
        if (u) {
            await loadUserData(u);
            
            // Check for pending request submission from guest flow
            if (pendingRequestData) {
                await api.createRequest({ ...pendingRequestData, userId: u.id });
                setPendingRequestData(null); // Clear pending
                showToastMessage('Request submitted successfully!', 'success');
                // Force a data refresh to show the new request immediately
                const updatedReqs = await api.getRequests(u);
                setRequests(updatedReqs);
                setCurrentPage('dashboard');
            } else {
                setCurrentPage('dashboard');
            }
        } else {
            // Fallback if getCurrentUser fails but login succeeded (rare)
            setCurrentPage('home');
        }
    } catch (e) {
        console.error("Post-login data fetch failed", e);
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
         <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-dubai-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm font-medium">Loading DubaiLink...</p>
         </div>
      </div>
    );
  }

  // Auth Page Standalone
  if (currentPage === 'auth' && !user) {
     return <AuthPage onSuccess={handleLoginSuccess} showToast={showToastMessage} />;
  }

  // Verification Gate
  if (user && !user.emailVerified && user.role !== UserRole.ADMIN && currentPage !== 'home') {
     return (
        <VerifyEmailPage 
           user={user} 
           onLogout={handleLogout} 
           onVerificationCheck={async () => {
               const u = await api.refreshUserAuth();
               if(u && u.emailVerified) {
                   setUser(u);
                   await loadUserData(u);
               }
           }} 
        />
     );
  }

  return (
    <Layout 
      user={user} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage} 
      onLogout={handleLogout}
      onLoginClick={() => setCurrentPage('auth')}
      onPostRequest={() => openRequestForm()}
      notifications={notifications}
      onMarkRead={async (id) => {
         await api.markNotificationAsRead(id);
         setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
      }}
      onMarkAllRead={async () => {
         if(user) {
            await api.markAllNotificationsAsRead(user.id);
            setNotifications(prev => prev.map(n => ({...n, read: true})));
         }
      }}
      onToggleAi={() => setShowAi(true)}
      siteSettings={siteSettings}
      adminSection={adminSection}
      setAdminSection={setAdminSection}
    >
       {/* HOME PAGE (Mobile & Desktop) */}
       {currentPage === 'home' && (
        <div className="min-h-[80vh] bg-gray-50 pb-8 pt-6">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dubai-dark to-gray-800 text-white shadow-lg p-6 sm:p-10 min-h-[280px] flex items-center">
                 {siteSettings.heroImage && (
                    <>
                        <div className="absolute inset-0 bg-black/40 z-0"></div>
                        <img src={siteSettings.heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover -z-10" />
                    </>
                 )}
                 {!siteSettings.heroImage && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                 )}
                 <div className="relative z-10 max-w-lg">
                    <span className="text-[10px] font-bold bg-dubai-gold/20 text-dubai-gold px-2 py-0.5 rounded uppercase tracking-wide">Trending</span>
                    <h2 className="text-2xl sm:text-4xl font-bold mt-2 mb-2">{siteSettings.heroTitle || "Golden Visa AE"}</h2>
                    <p className="text-gray-300 text-sm sm:text-base mb-6">{siteSettings.heroSubtitle || "Secure your 10-year residency today with expert guidance."}</p>
                    <button 
                       onClick={() => openRequestForm(ServiceCategory.VISA)}
                       className="bg-dubai-gold text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg"
                    >
                       {siteSettings.heroButtonText || "Post Request"}
                    </button>
                 </div>
              </div>

              {/* Service Categories */}
              <div>
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Browse Services</h3>
                 
                 {/* Desktop View */}
                 <div className="hidden md:grid grid-cols-4 gap-4">
                    {serviceTypes.length > 0 ? serviceTypes.filter(s => s.isActive).map(s => (
                        <div key={s.id} onClick={() => openRequestForm(s.name)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:bg-gray-50 cursor-pointer transition-all hover:-translate-y-1">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                               s.name.toLowerCase().includes('visa') ? 'bg-blue-50 text-blue-600' :
                               s.name.toLowerCase().includes('business') ? 'bg-purple-50 text-purple-600' :
                               'bg-green-50 text-green-600'
                           }`}>
                               {s.name.toLowerCase().includes('visa') ? (
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                               ) : s.name.toLowerCase().includes('business') ? (
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                               ) : (
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                               )}
                           </div>
                           <span className="text-sm font-bold text-gray-900">{s.name}</span>
                           <span className="text-xs text-gray-500 mt-1">{s.description}</span>
                        </div>
                    )) : (
                        // Static Fallback
                        <>
                           <div onClick={() => openRequestForm(ServiceCategory.VISA)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:bg-gray-50 cursor-pointer">
                              <span className="text-sm font-bold">Visas</span>
                           </div>
                           <div onClick={() => openRequestForm(ServiceCategory.BUSINESS)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:bg-gray-50 cursor-pointer">
                              <span className="text-sm font-bold">Business Setup</span>
                           </div>
                        </>
                    )}
                 </div>

                 {/* Mobile View - 2 Row Horizontal Scroll */}
                 <div className="md:hidden grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
                    {serviceTypes.length > 0 ? serviceTypes.filter(s => s.isActive).map(s => (
                        <div key={s.id} onClick={() => openRequestForm(s.name)} className="w-[160px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors snap-start cursor-pointer">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                               s.name.toLowerCase().includes('visa') ? 'bg-blue-50 text-blue-600' :
                               s.name.toLowerCase().includes('business') ? 'bg-purple-50 text-purple-600' :
                               'bg-green-50 text-green-600'
                           }`}>
                               {s.name.toLowerCase().includes('visa') ? (
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                               ) : s.name.toLowerCase().includes('business') ? (
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                               ) : (
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                               )}
                           </div>
                           <span className="text-sm font-bold text-gray-800 line-clamp-1 w-full">{s.name}</span>
                           <span className="text-[10px] text-gray-400 line-clamp-1 w-full">{s.description}</span>
                        </div>
                    )) : (
                        // Static Fallback Mobile
                        <>
                           <div onClick={() => openRequestForm(ServiceCategory.VISA)} className="w-[160px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors snap-start cursor-pointer">
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                              <span className="text-sm font-bold text-gray-800">Visas</span>
                              <span className="text-[10px] text-gray-400">Residency & Entry</span>
                           </div>
                           <div onClick={() => openRequestForm(ServiceCategory.BUSINESS)} className="w-[160px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors snap-start cursor-pointer">
                              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                              <span className="text-sm font-bold text-gray-800">Business</span>
                              <span className="text-[10px] text-gray-400">Setup & License</span>
                           </div>
                        </>
                    )}
                 </div>
              </div>

              {/* Recent Activity */}
              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                    <button onClick={() => user ? setCurrentPage('dashboard') : setCurrentPage('auth')} className="text-sm text-dubai-gold font-bold hover:underline">View All</button>
                 </div>
                 {user && requests.length > 0 ? (
                    <div onClick={() => setCurrentPage('dashboard')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                       <div>
                          <p className="font-bold text-gray-900">{requests[0].title}</p>
                          <p className="text-sm text-gray-500">{requests[0].quotes.length} Quotes • <span className="uppercase text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">{requests[0].status}</span></p>
                       </div>
                       <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                 ) : (
                    <div className="text-center py-8 bg-white rounded-xl border border-gray-100 border-dashed text-gray-400">
                       <p className="text-sm">{user ? 'No active requests.' : 'Sign in to see your activity.'}</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
       )}
       
       {/* DASHBOARD */}
       {currentPage === 'dashboard' && user && (
         user.role === UserRole.ADMIN ? (
             <AdminDashboard 
                requests={requests} 
                providers={providers} 
                users={adminUsers} 
                onDeleteRequest={async (id) => { await api.permanentDeleteRequest(id); refreshData(); showToastMessage('Request deleted', 'success'); }} 
                onToggleVerifyProvider={async (id) => { await api.toggleProviderVerification(id); refreshData(); showToastMessage('Verification updated', 'success'); }} 
                activeSection={adminSection}
                showToast={showToastMessage}
             />
         ) : (
             <Dashboard 
                role={user.role} 
                requests={requests} 
                conversations={conversations}
                currentProvider={user.role === UserRole.PROVIDER ? providers.find(p => p.id === user.id) : undefined}
                currentProviderId={user.id}
                onViewProvider={(id) => { setViewingProviderId(id); setCurrentPage('provider-view'); }}
                onAcceptQuote={(reqId, quoteId) => { 
                    const r = requests.find(r => r.id === reqId); 
                    const q = r?.quotes.find(q => q.id === quoteId); 
                    if(q && r) { setActiveQuoteForAcceptance({quote: q, reqStatus: r.status}); setShowAcceptModal(true); } 
                }}
                onChatWithProvider={(pId, pName) => setChatUser({id: pId, name: pName})}
                onChatWithUser={(uId, uName) => setChatUser({id: uId, name: uName})}
                onSubmitQuote={(reqId) => { setActiveRequestForQuote(reqId); setShowQuoteModal(true); }}
                onViewQuote={(q) => { setActiveQuoteDetail(q); setShowQuoteDetails(true); }}
                onDeleteRequest={async (id) => { await api.permanentDeleteRequest(id); refreshData(); showToastMessage('Request deleted', 'success'); }}
                onPostRequest={() => openRequestForm()}
                onIgnoreRequest={(id) => { /* Implement ignore logic if needed */ }}
             />
         )
       )}

       {/* MESSAGES */}
       {currentPage === 'messages' && (
          <MessagesPage 
            conversations={conversations} 
            onOpenChat={(uid, uname) => setChatUser({id: uid, name: uname})} 
          />
       )}

       {/* PROVIDER LEADS */}
       {currentPage === 'provider-leads' && user?.role === UserRole.PROVIDER && (
          <ProviderLeadsPage 
             requests={requests.filter(r => !r.quotes.some(q => q.providerId === user.id))} // Leads not quoted
             allRequests={requests} // All requests for matching
             currentProviderId={user.id}
             currentProvider={providers.find(p => p.id === user.id)}
             onSubmitQuote={(reqId) => { setActiveRequestForQuote(reqId); setShowQuoteModal(true); }}
          />
       )}
       
       {/* PROVIDER PROFILE VIEW (Public) */}
       {currentPage === 'provider-view' && viewingProviderId && (
          <ProviderProfileView 
             provider={providers.find(p => p.id === viewingProviderId) || {id: viewingProviderId, name: 'Provider', services: [], rating: 0, reviewCount: 0, badges: [], description: '', location: '', serviceTypes: [], isVerified: false, reviews: []} as ProviderProfile}
             onBack={() => setCurrentPage('dashboard')}
             onSubmitReview={async (pid, rev) => { await api.addReview(pid, rev); showToastMessage('Review submitted', 'success'); refreshData(); }}
             onRequestQuote={() => { showToastMessage('Please post a request to get quotes', 'info'); openRequestForm(); }}
             showToast={showToastMessage}
          />
       )}

       {/* PROFILE SETTINGS */}
       {currentPage === 'profile-settings' && user && (
          <ProfileSettings 
             role={user.role} 
             initialData={user.role === UserRole.PROVIDER ? providers.find(p => p.id === user.id) : user} 
             onSave={async (data) => {
                 if(user.role === UserRole.PROVIDER) {
                     await api.updateProvider(user.id, data);
                     await api.updateUser({ ...user, name: data.name, email: data.email });
                 } else {
                     await api.updateUser({ ...user, ...data });
                 }
                 showToastMessage('Profile updated successfully', 'success');
                 refreshData();
             }}
             onCancel={() => setCurrentPage('dashboard')}
             onPreview={() => { 
                if(user.role === UserRole.PROVIDER) { 
                   setViewingProviderId(user.id); 
                   setCurrentPage('provider-view'); 
                } 
             }}
          />
       )}
       
       {/* --- MODALS --- */}

       {showRequestForm && (
         <RequestForm 
           initialCategory={activeCategory}
           serviceTypes={serviceTypes}
           onSubmit={async (data) => {
             if(user) {
                 await api.createRequest({ ...data, userId: user.id });
                 setShowRequestForm(false);
                 showToastMessage('Request posted successfully!', 'success');
                 refreshData();
             } else {
                 // Guest Flow: Save data pending login
                 setPendingRequestData(data);
                 setShowRequestForm(false);
                 setCurrentPage('auth');
                 showToastMessage('Please sign in to submit your request.', 'info');
             }
           }}
           onCancel={() => setShowRequestForm(false)}
         />
       )}

       {showQuoteModal && activeRequestForQuote && user && (
          <SubmitQuoteModal 
             requestTitle={requests.find(r => r.id === activeRequestForQuote)?.title || 'Request'}
             onClose={() => setShowQuoteModal(false)}
             onSubmit={async (quoteData) => {
                 const providerProfile = providers.find(p => p.id === user.id);
                 if (providerProfile) {
                    await api.submitQuote(activeRequestForQuote, providerProfile, quoteData);
                    setShowQuoteModal(false);
                    showToastMessage('Quote submitted!', 'success');
                    refreshData();
                 }
             }}
          />
       )}

       {showAcceptModal && activeQuoteForAcceptance && (
          <QuoteAcceptanceModal 
             quote={activeQuoteForAcceptance.quote}
             requestStatus={activeQuoteForAcceptance.reqStatus}
             onAccept={async () => {
                 const q = activeQuoteForAcceptance.quote;
                 const r = requests.find(req => req.quotes.some(qu => qu.id === q.id));
                 if(r) {
                     await api.acceptQuote(r.id, q.id);
                     showToastMessage('Quote accepted!', 'success');
                     refreshData();
                     // Update local state immediately for UX
                     setActiveQuoteForAcceptance({...activeQuoteForAcceptance, reqStatus: 'accepted'});
                 }
             }}
             onPaymentComplete={async () => {
                 const q = activeQuoteForAcceptance.quote;
                 const r = requests.find(req => req.quotes.some(qu => qu.id === q.id));
                 if(r) {
                     await api.completeOrder(r.id);
                     setShowAcceptModal(false);
                     showToastMessage('Order completed!', 'success');
                     refreshData();
                 }
             }}
             onClose={() => setShowAcceptModal(false)}
          />
       )}

       {showQuoteDetails && activeQuoteDetail && (
           <QuoteDetailsModal quote={activeQuoteDetail} onClose={() => setShowQuoteDetails(false)} />
       )}

       {showAi && (
           <AiAssistant currentUser={user} onClose={() => setShowAi(false)} />
       )}

       {chatUser && user && (
           <DirectMessageModal 
              recipientId={chatUser.id}
              recipientName={chatUser.name}
              currentUser={user}
              onClose={() => setChatUser(null)}
              showToast={showToastMessage}
           />
       )}
       
       <Toast 
          message={toast.message} 
          type={toast.type} 
          isVisible={toast.isVisible} 
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
       />
    </Layout>
  );
};

export default App;
