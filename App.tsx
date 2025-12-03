
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import AiAssistant from './components/AiAssistant';
import RequestForm from './components/RequestForm';
import Dashboard from './components/Dashboard';
import ProviderProfile from './components/ProviderProfile';
import DirectMessageModal from './components/DirectMessageModal';
import QuoteAcceptanceModal from './components/QuoteAcceptanceModal';
import ProfileSettings from './components/ProfileSettings';
import SubmitQuoteModal from './components/SubmitQuoteModal';
import QuoteDetailsModal from './components/QuoteDetailsModal';
import AuthPage from './components/AuthPage';
import Toast from './components/Toast';
import MessagesPage from './components/MessagesPage';
import { UserRole, ServiceRequest, ProviderProfile as IProviderProfile, Quote, User, Conversation, Notification, ServiceCategory } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestCategory, setRequestCategory] = useState<ServiceCategory | undefined>(undefined);
  
  // Data State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providers, setProviders] = useState<IProviderProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [ignoredRequestIds, setIgnoredRequestIds] = useState<string[]>([]);
  const [quoteRequest, setQuoteRequest] = useState<string | null>(null); 
  const [activeChat, setActiveChat] = useState<{name: string, id: string} | null>(null);
  const [quoteToAccept, setQuoteToAccept] = useState<{ requestId: string, quote: Quote } | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  // Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [prevLeadCount, setPrevLeadCount] = useState(0);
  const [prevNotifCount, setPrevNotifCount] = useState(0);

  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const [fetchedRequests, fetchedProviders] = await Promise.all([
        api.getRequests(),
        api.getProviders()
      ]);
      setRequests(fetchedRequests);
      setProviders(fetchedProviders);
      
      if (currentUser) {
         const chats = await api.getConversations(currentUser.id);
         setConversations(chats);
         
         const notifs = await api.getNotifications(currentUser.id);
         setNotifications(notifs);

         if (notifs.length > prevNotifCount && prevNotifCount > 0) {
            const newest = notifs[0];
            if (!newest.read) {
               setToastMessage(`${newest.title}: ${newest.message}`);
            }
         }
         setPrevNotifCount(notifs.length);
         
         if (currentUser.role === UserRole.PROVIDER) {
            const me = fetchedProviders.find(p => p.id === currentUser.id);
            if (me && me.location) {
               const matchedLeads = fetchedRequests.filter(r => {
                  const isAvailable = r.status === 'open' && !r.quotes.some(q => q.providerId === me.id);
                  if (!isAvailable) return false;
                  
                  if (r.locality) {
                     const reqLoc = r.locality.toLowerCase().trim();
                     const provLoc = me.location.toLowerCase().trim();
                     return provLoc.includes(reqLoc) || reqLoc.includes(provLoc);
                  }
                  return false;
               });

               if (matchedLeads.length > prevLeadCount && prevLeadCount > 0) {
                  const newLead = matchedLeads[0];
                  setToastMessage(`New Lead Received: ${newLead.title} in ${newLead.locality}`);
               }
               setPrevLeadCount(matchedLeads.length);
            }
         }
      }
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
        await fetchData();
      } catch (err) {
        console.error("Init error", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (currentUser) {
      pollingInterval.current = setInterval(fetchData, 3000);
    }
    const handleStorageChange = (e: StorageEvent) => {
       if (e.key && e.key.startsWith('dubailink_')) {
          fetchData();
       }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, prevLeadCount, prevNotifCount]);

  const handleLoginSuccess = async () => {
    const user = await api.getCurrentUser();
    setCurrentUser(user);
    setCurrentPage('dashboard');
    fetchData();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentPage('home');
    setPrevLeadCount(0);
    setPrevNotifCount(0);
  };

  const openRequestForm = (category?: ServiceCategory) => {
      if (!currentUser) {
          setCurrentPage('dashboard'); // Redirect to auth if not logged in
      } else {
          setRequestCategory(category);
          setShowRequestForm(true);
      }
  };

  const handleCreateRequest = async (requestData: any) => {
    try {
      await api.createRequest({
        ...requestData,
        userId: currentUser?.id
      });
      setShowRequestForm(false);
      fetchData();
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Failed to create request", error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
       await api.permanentDeleteRequest(requestId);
       await fetchData(); 
    } catch (error) {
       console.error("Failed to delete request", error);
    }
  };

  const handleSubmitQuote = async (quoteData: any) => {
    if (!quoteRequest || !currentUser) return;
    try {
      const myProfile = providers.find(p => p.id === currentUser.id);
      if (myProfile) {
        await api.submitQuote(quoteRequest, myProfile, quoteData);
        setQuoteRequest(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to submit quote", error);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quoteToAccept) return;
    try {
      await api.acceptQuote(quoteToAccept.requestId, quoteToAccept.quote.id);
      fetchData();
    } catch (error) {
      console.error("Failed to accept quote", error);
    }
  };

  const handlePaymentCompleted = async (method: 'online' | 'offline') => {
    if (!quoteToAccept) return;
    try {
       await api.completeOrder(quoteToAccept.requestId);
       setQuoteToAccept(null);
       fetchData();
    } catch (error) {
       console.error("Failed to complete order", error);
    }
  };

  const handleProfileUpdate = async (data: any) => {
    if (currentUser?.role === UserRole.PROVIDER) {
      await api.updateProvider(currentUser.id, {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        services: data.services,
        location: data.location
      });
    }
    setCurrentPage('dashboard');
    fetchData();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dubai-gold"></div>
        </div>
      );
    }

    if (!currentUser && currentPage === 'dashboard') {
       return <AuthPage onSuccess={handleLoginSuccess} />;
    }

    if (currentPage === 'messages' && currentUser) {
      return (
        <MessagesPage 
          conversations={conversations}
          onOpenChat={(id, name) => setActiveChat({ id, name })}
        />
      );
    }

    if (currentPage === 'profile-settings' && currentUser) {
      return (
        <ProfileSettings 
          role={currentUser.role}
          initialData={currentUser.role === UserRole.PROVIDER ? providers.find(p => p.id === currentUser.id) : { name: currentUser.name, email: currentUser.email }}
          onSave={handleProfileUpdate}
          onCancel={() => setCurrentPage('dashboard')}
          onPreview={() => {
             setSelectedProviderId(currentUser.id);
             setCurrentPage('provider-profile');
          }}
        />
      );
    }
    
    if (currentPage === 'provider-profile' && selectedProviderId) {
       const provider = providers.find(p => p.id === selectedProviderId);
       if (provider) {
         return (
           <ProviderProfile 
             provider={provider} 
             onBack={() => setCurrentPage('dashboard')}
             onSubmitReview={async (id, review) => {
               await api.addReview(id, review);
               fetchData();
             }}
             onRequestQuote={() => {
               setCurrentPage('home');
               setShowRequestForm(true);
             }}
           />
         );
       }
    }

    if (currentPage === 'ai-assistant') {
       return (
         <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <p>Please use the Ask AI Guide button in the menu.</p>
            <button onClick={() => setCurrentPage('home')} className="mt-4 text-dubai-blue underline">Go Home</button>
         </div>
       );
    }

    if (currentPage === 'dashboard') {
      let visibleRequests = requests;
      if (currentUser?.role === UserRole.USER) {
        visibleRequests = requests.filter(r => r.userId === currentUser.id);
      } else if (currentUser?.role === UserRole.PROVIDER) {
        visibleRequests = requests.filter(r => !ignoredRequestIds.includes(r.id));
      }

      const currentProviderProfile = currentUser?.role === UserRole.PROVIDER 
        ? providers.find(p => p.id === currentUser.id) 
        : undefined;

      return (
        <Dashboard 
          role={currentUser!.role}
          requests={visibleRequests}
          conversations={conversations}
          currentProvider={currentProviderProfile}
          currentProviderId={currentUser?.id}
          onViewProvider={(id) => {
            setSelectedProviderId(id);
            setCurrentPage('provider-profile');
          }}
          onAcceptQuote={(requestId, quoteId) => {
             const req = requests.find(r => r.id === requestId);
             const quote = req?.quotes.find(q => q.id === quoteId);
             if (req && quote) {
                setQuoteToAccept({ requestId, quote });
             }
          }}
          onChatWithProvider={(providerId, providerName) => {
             setActiveChat({ name: providerName, id: providerId });
          }}
          onChatWithUser={(userId, userName) => {
             setActiveChat({ name: userName, id: userId });
          }}
          onSubmitQuote={(requestId) => setQuoteRequest(requestId)}
          onIgnoreRequest={(requestId) => setIgnoredRequestIds(prev => [...prev, requestId])}
          onViewQuote={(quote) => setViewingQuote(quote)}
          onDeleteRequest={handleDeleteRequest}
        />
      );
    }

    // =================================================================================
    // HOME PAGE
    // =================================================================================
    return (
      <div className="bg-white">
        
        {/* MOBILE LAYOUT (App Style) */}
        <div className="md:hidden min-h-[80vh] bg-gray-50 pb-8">
           {/* Greeting Header */}
           <div className="bg-white px-5 py-6 rounded-b-3xl shadow-sm border-b border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                 <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Welcome</p>
                    <h1 className="text-2xl font-bold text-gray-900">
                       Marhaba, {currentUser ? currentUser.name.split(' ')[0] : 'Guest'}
                    </h1>
                 </div>
                 {/* Decorative Icon */}
                 <div className="w-10 h-10 rounded-full bg-dubai-gold/10 flex items-center justify-center text-dubai-gold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
              </div>

              {/* Search Pill */}
              <div 
                 onClick={() => setIsAiOpen(true)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 flex items-center gap-3 text-gray-400 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                 <svg className="w-5 h-5 text-dubai-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 <span className="text-sm font-medium">Ask AI about visas, setup...</span>
              </div>
           </div>

           {/* Mobile Content */}
           <div className="px-5 space-y-6">
              
              {/* Promo Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dubai-dark to-gray-800 text-white shadow-lg p-5">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                 <div className="relative z-10">
                    <span className="text-[10px] font-bold bg-dubai-gold/20 text-dubai-gold px-2 py-0.5 rounded uppercase tracking-wide">Trending</span>
                    <h2 className="text-lg font-bold mt-2 mb-1">Golden Visa 🇦🇪</h2>
                    <p className="text-gray-300 text-xs mb-4 max-w-[80%]">Secure your 10-year residency today with expert guidance.</p>
                    <button 
                       onClick={() => openRequestForm(ServiceCategory.VISA)}
                       className="bg-dubai-gold text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                       Post Request
                    </button>
                 </div>
              </div>

              {/* Service Categories Grid */}
              <div>
                 <h3 className="text-sm font-bold text-gray-900 mb-3">Browse Services</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {/* Visa */}
                    <div 
                       onClick={() => openRequestForm(ServiceCategory.VISA)}
                       className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors"
                    >
                       <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                       </div>
                       <span className="text-sm font-bold text-gray-800">Visas</span>
                       <span className="text-[10px] text-gray-400">Residency & Entry</span>
                    </div>

                    {/* Business */}
                    <div 
                       onClick={() => openRequestForm(ServiceCategory.BUSINESS)}
                       className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors"
                    >
                       <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                       </div>
                       <span className="text-sm font-bold text-gray-800">Business</span>
                       <span className="text-[10px] text-gray-400">Setup & License</span>
                    </div>

                    {/* Travel */}
                    <div 
                       onClick={() => openRequestForm(ServiceCategory.TRAVEL)}
                       className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors"
                    >
                       <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                       </div>
                       <span className="text-sm font-bold text-gray-800">Travel</span>
                       <span className="text-[10px] text-gray-400">Tours & Hotels</span>
                    </div>

                    {/* Ask AI */}
                    <div 
                       onClick={() => setIsAiOpen(true)}
                       className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors"
                    >
                       <div className="w-10 h-10 rounded-full bg-dubai-gold/10 text-dubai-gold flex items-center justify-center mb-2">
                          <span className="text-lg">✨</span>
                       </div>
                       <span className="text-sm font-bold text-gray-800">Ask AI</span>
                       <span className="text-[10px] text-gray-400">Instant Guide</span>
                    </div>
                 </div>
              </div>

              {/* Recent Activity Placeholder */}
              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Recent</h3>
                    <button onClick={() => setCurrentPage('dashboard')} className="text-xs text-dubai-gold font-medium">View All</button>
                 </div>
                 {requests.length > 0 ? (
                    <div onClick={() => setCurrentPage('dashboard')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:bg-gray-50 transition-colors">
                       <div>
                          <p className="text-sm font-bold text-gray-900">{requests[0].title}</p>
                          <p className="text-xs text-gray-400">{requests[0].quotes.length} Quotes • {requests[0].status}</p>
                       </div>
                       <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                 ) : (
                    <div className="text-center py-6 bg-white rounded-xl border border-gray-100 border-dashed text-gray-400 text-xs">
                       No recent requests
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* DESKTOP LAYOUT (Original) */}
        <div className="hidden md:block">
          <div className="relative bg-dubai-dark text-white overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1512453979798-5ea904ac6605?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                alt="Dubai Skyline" 
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-dubai-dark to-transparent"></div>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-start">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Dubai Services, <span className="text-dubai-gold">Simplified.</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mb-10">
                Connect with verified PROs, Business Consultants, and Travel Agencies. Get accurate quotes, compare prices, and handle everything online.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => openRequestForm()}
                  className="bg-dubai-gold text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-600 transition-colors shadow-lg"
                >
                  Post a Request
                </button>
                <button 
                  onClick={() => setIsAiOpen(true)}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <span>✨</span> Research with AI
                </button>
              </div>
            </div>
          </div>
          
          {/* Services Section */}
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Visa Services */}
                <div 
                   onClick={() => openRequestForm(ServiceCategory.VISA)}
                   className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">Visa Services</h3>
                    <p className="text-gray-500 mb-6">Golden Visa, Freelance, Family & Tourist Visas.</p>
                    <span className="text-dubai-blue text-sm font-bold group-hover:underline">Post Request &rarr;</span>
                </div>

                {/* Business Setup */}
                <div 
                   onClick={() => openRequestForm(ServiceCategory.BUSINESS)}
                   className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">Business Setup</h3>
                    <p className="text-gray-500 mb-6">Mainland & Freezone Company Formation.</p>
                    <span className="text-dubai-blue text-sm font-bold group-hover:underline">Post Request &rarr;</span>
                </div>

                {/* Travel Packages */}
                <div 
                   onClick={() => openRequestForm(ServiceCategory.TRAVEL)}
                   className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">Travel Packages</h3>
                    <p className="text-gray-500 mb-6">Hotel Bookings, Flights & Desert Safaris.</p>
                    <span className="text-dubai-blue text-sm font-bold group-hover:underline">Post Request &rarr;</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout 
      user={currentUser} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage} 
      onLogout={handleLogout}
      onLoginClick={() => setCurrentPage('dashboard')}
      onPostRequest={() => { setRequestCategory(undefined); setShowRequestForm(true); }}
      notifications={notifications}
      onMarkRead={(id) => api.markNotificationAsRead(id).then(fetchData)}
      onMarkAllRead={() => currentUser && api.markAllNotificationsAsRead(currentUser.id).then(fetchData)}
      onToggleAi={() => setIsAiOpen(!isAiOpen)}
    >
      {renderContent()}

      <Toast 
        message={toastMessage || ''} 
        isVisible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

      {isAiOpen && (
        <AiAssistant onClose={() => setIsAiOpen(false)} />
      )}

      {showRequestForm && (
        <RequestForm 
          onSubmit={handleCreateRequest}
          onCancel={() => setShowRequestForm(false)}
          initialCategory={requestCategory}
        />
      )}

      {activeChat && currentUser && (
        <DirectMessageModal 
          recipientName={activeChat.name}
          recipientId={activeChat.id}
          currentUser={{ id: currentUser.id, role: currentUser.role }}
          onClose={() => setActiveChat(null)}
        />
      )}

      {quoteRequest && (
        <SubmitQuoteModal
          requestTitle={requests.find(r => r.id === quoteRequest)?.title || 'Service Request'}
          onClose={() => setQuoteRequest(null)}
          onSubmit={handleSubmitQuote}
        />
      )}

      {quoteToAccept && (
        <QuoteAcceptanceModal 
          quote={quoteToAccept.quote}
          requestStatus={requests.find(r => r.id === quoteToAccept.requestId)?.status || 'quoted'}
          onAccept={handleAcceptQuote}
          onPaymentComplete={handlePaymentCompleted}
          onClose={() => setQuoteToAccept(null)}
        />
      )}

      {viewingQuote && (
        <QuoteDetailsModal
          quote={viewingQuote}
          onClose={() => setViewingQuote(null)}
        />
      )}
    </Layout>
  );
};

export default App;
