
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
    // We run requests in parallel but catch errors independently so one failure (e.g. notifications index error)
    // does not prevent the other data (e.g. requests) from loading.
    
    // 1. Conversations
    api.getConversations(currentUser.id)
      .then(setConversations)
      .catch(e => console.error("Failed to load conversations:", e));

    // 2. Notifications
    api.getNotifications(currentUser.id)
      .then(setNotifications)
      .catch(e => console.error("Failed to load notifications (Check indexes):", e));

    // 3. Requests & Role Specific Data
    if (currentUser.role === UserRole.USER) {
       await api.getRequests(currentUser)
         .then(setRequests)
         .catch(e => console.error("Failed to load requests:", e));
    } else if (currentUser.role === UserRole.PROVIDER) {
       // Load all requests (leads will be filtered in component)
       api.getRequests({ role: UserRole.ADMIN } as User)
         .then(setRequests)
         .catch(e => console.error("Failed to load provider requests:", e));
         
       api.getProviders()
         .then(setProviders) // Load all to find self
         .catch(e => console.error("Failed to load providers:", e));
    } else if (currentUser.role === UserRole.ADMIN) {
       api.getRequests({ role: UserRole.ADMIN } as User)
         .then(setRequests)
         .catch(e => console.error("Failed to load admin requests:", e));
       
       api.getAllUsers()
         .then(setAdminUsers)
         .catch(e => console.error("Failed to load users:", e));
       
       api.getProviders()
         .then(setProviders)
         .catch(e => console.error("Failed to load providers:", e));
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
              <div className="relative overflow-hidden rounded-2xl bg-dubai-dark text-white shadow-lg p-8 sm:p-12 min-h-[300px] flex items-center">
                 {siteSettings.heroImage && (
                    <>
                        <div className="absolute inset-0 bg-black/50 z-0"></div>
                        <img src={siteSettings.heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover -z-10" />
                    </>
                 )}
                 {!siteSettings.heroImage && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                 )}
                 <div className="relative z-10 max-w-2xl">
                    {/* Trending Tag */}
                    <div className="mb-4">
                        <span className="bg-[#3D3525] text-[#C5A059] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Trending</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">{siteSettings.heroTitle || "Golden Visa AE"}</h2>
                    <p className="text-gray-200 text-lg mb-8 max-w-xl leading-relaxed">{siteSettings.heroSubtitle || "Secure your 10-year residency today with expert guidance."}</p>
                    <div className="flex gap-3">
                        <button 
                           onClick={() => openRequestForm(ServiceCategory.VISA)}
                           className="bg-dubai-gold text-white text-base font-bold px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors shadow-lg"
                        >
                           {siteSettings.heroButtonText || "Post Request"}
                        </button>
                    </div>
                 </div>
              </div>

              {/* Service Categories - Matching Screenshot */}
              <div className="py-4">
                 <h3 className="text-xl font-bold text-gray-900 mb-6">Browse Services</h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {serviceTypes.length > 0 && serviceTypes.filter(s => s.isActive).map(s => {
                        const name = s.name.toLowerCase();
                        
                        // Icon mapping based on text matching
                        let icon = null;
                        let colorClass = 'text-green-600 bg-green-50'; // Default Green (as per screenshot mostly)

                        if (name.includes('visa')) {
                            // Blue Card Icon
                            colorClass = 'text-blue-600 bg-blue-50';
                            icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />;
                        } else if (name.includes('tour') || name.includes('travel')) {
                            // Triangle / Tree Icon (Green)
                            icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />;
                        } else if (name.includes('car') || name.includes('lift') || name.includes('rent')) {
                            // Triangle / Navigation Icon (Green)
                            icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />;
                        } else if (name.includes('insurance')) {
                            // Triangle Icon (Green)
                            icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />;
                        } else if (name.includes('pack') || name.includes('mover')) {
                            // Triangle Icon (Green)
                            icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />;
                        } else {
                            // Default Triangle Icon (Green)
                            icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />;
                        }

                        return (
                            <div key={s.id} onClick={() => openRequestForm(s.name)} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md h-full justify-center">
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       {icon}
                                   </svg>
                               </div>
                               <span className="text-base font-bold text-gray-900 mb-2">{s.name}</span>
                               <span className="text-xs text-gray-500 leading-relaxed line-clamp-3">{s.description}</span>
                            </div>
                        );
                    })}
                 </div>
              </div>

              {/* Recent Activity */}
              {user && requests.length > 0 && (
                <div className="py-4 border-t border-gray-200 mt-8">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                      <button onClick={() => setCurrentPage('dashboard')} className="text-sm text-dubai-gold font-bold hover:underline">View All</button>
                   </div>
                   <div className="space-y-3">
                        {requests.slice(0, 3).map(req => (
                            <div key={req.id} onClick={() => setCurrentPage('dashboard')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{req.category}</span>
                                        <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{req.title}</p>
                                    <p className="text-sm text-gray-500 mt-1">{req.quotes.length} Quotes Received</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    req.status === 'open' ? 'bg-blue-50 text-blue-700' : 
                                    req.status === 'quoted' ? 'bg-yellow-50 text-yellow-700' : 
                                    'bg-green-50 text-green-700'
                                }`}>
                                    {req.status}
                                </div>
                            </div>
                        ))}
                   </div>
                </div>
              )}
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
