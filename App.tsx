
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
import Toast, { ToastType } from './components/Toast';
import MessagesPage from './components/MessagesPage';
import AdminDashboard from './components/AdminDashboard'; 
import ProviderLeadsPage from './components/ProviderLeadsPage';
import { UserRole, ServiceRequest, ProviderProfile as IProviderProfile, Quote, User, Conversation, Notification, ServiceCategory, SiteSettings, AdminSection } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestCategory, setRequestCategory] = useState<ServiceCategory | undefined>(undefined);
  
  // Admin State
  const [adminSection, setAdminSection] = useState<AdminSection>('overview');

  // Data State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providerLeads, setProviderLeads] = useState<ServiceRequest[]>([]); // New State for Provider Leads
  const [providers, setProviders] = useState<IProviderProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>();
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
  const [toastConfig, setToastConfig] = useState<{ message: string, type: ToastType } | null>(null);
  const [prevLeadCount, setPrevLeadCount] = useState(0);
  const [prevNotifCount, setPrevNotifCount] = useState(0);

  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to show toasts
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastConfig({ message, type });
  };

  // Fetch data - Separated logic for authenticated vs public data
  const fetchData = async (userOverride?: User | null) => {
    try {
      // 1. Always fetch public data (Providers, Settings)
      // Use Promise.allSettled to handle potential permission failures gracefully
      const results = await Promise.allSettled([
        api.getProviders(),
        api.getSettings()
      ]);

      if (results[0].status === 'fulfilled') {
        setProviders(results[0].value);
      }
      if (results[1].status === 'fulfilled') {
        setSiteSettings(results[1].value);
      }
      
      const user = userOverride === undefined ? currentUser : userOverride;

      if (user) {
         // 2. Fetch Protected Data (Only if logged in)
         const fetchedRequests = await api.getRequests(user);
         setRequests(fetchedRequests);

         // Role specific fetches
         if (user.role === UserRole.ADMIN) {
            const users = await api.getAllUsers();
            setAllUsers(users);
         } else {
             const chats = await api.getConversations(user.id);
             setConversations(chats);
             
             const notifs = await api.getNotifications(user.id);
             setNotifications(notifs);

             if (notifs.length > prevNotifCount && prevNotifCount > 0) {
                const newest = notifs[0];
                if (!newest.read) {
                   showToast(`${newest.title}: ${newest.message}`, 'info');
                }
             }
             setPrevNotifCount(notifs.length);
         }
         
         // Provider specific logic
         if (user.role === UserRole.PROVIDER) {
            const myLeads = await api.getProviderLeads(user.id);
            setProviderLeads(myLeads);

            if (myLeads.length > prevLeadCount && prevLeadCount > 0) {
               const newLead = myLeads[myLeads.length - 1]; 
               if(newLead) showToast(`New Lead: ${newLead.title}`, 'info');
            }
            setPrevLeadCount(myLeads.length);
         }
      } else {
         // If guest, ensure sensitive data is cleared
         setRequests([]);
         setConversations([]);
         setNotifications([]);
         setProviderLeads([]);
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
        // Pass user directly to avoid stale state in first fetch
        await fetchData(user);
      } catch (err) {
        console.error("Init error", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    // Only poll if a user is logged in
    if (currentUser) {
      pollingInterval.current = setInterval(() => fetchData(currentUser), 3000);
    } else {
       if (pollingInterval.current) clearInterval(pollingInterval.current);
    }

    const handleStorageChange = (e: StorageEvent) => {
       if (e.key && e.key.startsWith('dubailink_')) {
          fetchData(currentUser);
       }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, prevLeadCount, prevNotifCount]);

  const handleLoginSuccess = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
      setCurrentPage('dashboard');
      await fetchData(user); // Immediate fetch with new user
      showToast(`Welcome back, ${user?.name}!`, 'success');
    } catch (e) {
       showToast('Failed to load user profile.', 'error');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentPage('home');
    setPrevLeadCount(0);
    setPrevNotifCount(0);
    setRequests([]); // Clear data on logout
    showToast('Signed out successfully.', 'success');
  };

  const openRequestForm = (category?: ServiceCategory) => {
      if (!currentUser) {
          setCurrentPage('dashboard'); // Redirect to auth if not logged in
          showToast('Please sign in to post a request.', 'info');
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
      fetchData(currentUser);
      setCurrentPage('dashboard');
      showToast('Service request created successfully!', 'success');
    } catch (error: any) {
      console.error("Failed to create request", error);
      showToast(error.message || "Failed to create request.", 'error');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
       await api.permanentDeleteRequest(requestId);
       await fetchData(currentUser); 
       showToast('Request deleted successfully.', 'success');
    } catch (error: any) {
       console.error("Failed to delete request", error);
       showToast(error.message || "Failed to delete request.", 'error');
    }
  };

  const handleToggleVerifyProvider = async (providerId: string) => {
    try {
      await api.toggleProviderVerification(providerId);
      await fetchData(currentUser);
      showToast('Provider status updated.', 'success');
    } catch (error: any) {
      console.error("Failed to toggle provider verification", error);
      showToast(error.message, 'error');
    }
  };

  const handleSubmitQuote = async (quoteData: any) => {
    if (!quoteRequest || !currentUser) return;
    try {
      const myProfile = providers.find(p => p.id === currentUser.id);
      if (myProfile) {
        await api.submitQuote(quoteRequest, myProfile, quoteData);
        setQuoteRequest(null);
        fetchData(currentUser);
        showToast('Quote submitted successfully!', 'success');
      }
    } catch (error: any) {
      console.error("Failed to submit quote", error);
      showToast(error.message || "Failed to submit quote.", 'error');
    }
  };

  const handleAcceptQuote = async () => {
    if (!quoteToAccept) return;
    try {
      await api.acceptQuote(quoteToAccept.requestId, quoteToAccept.quote.id);
      fetchData(currentUser);
      // Toast handled in payment complete usually, but here is intermediate step
    } catch (error: any) {
      console.error("Failed to accept quote", error);
      showToast("Failed to process acceptance.", 'error');
    }
  };

  const handlePaymentCompleted = async (method: 'online' | 'offline') => {
    if (!quoteToAccept) return;
    try {
       await api.completeOrder(quoteToAccept.requestId);
       setQuoteToAccept(null);
       fetchData(currentUser);
       showToast(`Order confirmed via ${method} payment!`, 'success');
    } catch (error: any) {
       console.error("Failed to complete order", error);
       showToast("Payment processing failed.", 'error');
    }
  };

  const handleProfileUpdate = async (data: any) => {
    try {
      if (currentUser?.role === UserRole.PROVIDER) {
        await api.updateProvider(currentUser.id, {
          name: data.name,
          tagline: data.tagline,
          description: data.description,
          services: data.services,
          serviceTypes: data.serviceTypes, 
          location: data.location
        });
      }
      // Also update base user data
      await api.updateUser({ ...currentUser!, name: data.name, email: data.email });

      setCurrentPage('dashboard');
      fetchData(currentUser);
      showToast('Profile settings saved successfully.', 'success');
    } catch (error: any) {
       console.error("Profile update failed", error);
       showToast("Failed to save profile changes.", 'error');
    }
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
       return <AuthPage onSuccess={handleLoginSuccess} showToast={showToast} />;
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
          initialData={currentUser.role === UserRole.PROVIDER ? providers.find(p => p.id === currentUser.id) : { name: currentUser.name, email: currentUser.email, phone: '', location: '' }}
          onSave={handleProfileUpdate}
          onCancel={() => setCurrentPage('dashboard')}
          onPreview={() => {
             setSelectedProviderId(currentUser.id);
             setCurrentPage('provider-profile');
          }}
        />
      );
    }
    
    // NEW: Provider Leads Page
    if (currentPage === 'provider-leads' && currentUser && currentUser.role === UserRole.PROVIDER) {
      // NOTE: We now use providerLeads fetched from API instead of all requests
      const visibleRequests = providerLeads.filter(r => !ignoredRequestIds.includes(r.id));
      const currentProvider = providers.find(p => p.id === currentUser.id);
      
      return (
        <ProviderLeadsPage 
          requests={visibleRequests} // Pass pre-filtered leads
          allRequests={requests} // Pass all requests for "My Proposals" cross-referencing
          currentProviderId={currentUser.id}
          currentProvider={currentProvider} 
          onSubmitQuote={(requestId) => setQuoteRequest(requestId)}
          onIgnoreRequest={(requestId) => {
             setIgnoredRequestIds(prev => [...prev, requestId]);
             showToast('Request hidden', 'info');
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
             showToast={showToast}
             onSubmitReview={async (id, review) => {
               try {
                 await api.addReview(id, review);
                 fetchData(currentUser);
                 showToast('Review posted successfully', 'success');
               } catch(e) { showToast('Failed to post review', 'error'); }
             }}
             onRequestQuote={() => {
               if(!currentUser) {
                  showToast('Please sign in to request a quote', 'info');
                  setCurrentPage('dashboard'); // Redirect to auth
               } else {
                  setCurrentPage('home');
                  setShowRequestForm(true);
               }
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
      // ADMIN VIEW
      if (currentUser?.role === UserRole.ADMIN) {
        return (
          <AdminDashboard
             requests={requests}
             providers={providers}
             users={allUsers}
             onDeleteRequest={handleDeleteRequest}
             onToggleVerifyProvider={handleToggleVerifyProvider}
             activeSection={adminSection}
             showToast={showToast}
          />
        );
      }

      // NORMAL VIEWS
      let visibleRequests = requests;
      if (currentUser?.role === UserRole.USER) {
        visibleRequests = requests.filter(r => r.userId === currentUser.id);
      } else if (currentUser?.role === UserRole.PROVIDER) {
        // For Dashboard, we also want to show the specific leads in the "New Opportunities" section
        visibleRequests = providerLeads.filter(r => !ignoredRequestIds.includes(r.id));
      }

      const currentProviderProfile = currentUser?.role === UserRole.PROVIDER 
        ? providers.find(p => p.id === currentUser.id) 
        : undefined;

      return (
        <Dashboard 
          role={currentUser!.role}
          requests={visibleRequests} // This now carries filtered leads for providers
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
          onIgnoreRequest={(requestId) => {
             setIgnoredRequestIds(prev => [...prev, requestId]);
             showToast('Request hidden from dashboard', 'info');
          }}
          onViewQuote={(quote) => setViewingQuote(quote)}
          onDeleteRequest={handleDeleteRequest}
        />
      );
    }

    // HOME PAGE
    return (
      <div className="bg-white">
        {/* ... (Existing Home Page Content - Unchanged) ... */}
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
                    <div onClick={() => openRequestForm(ServiceCategory.VISA)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors">
                       <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                       <span className="text-sm font-bold text-gray-800">Visas</span>
                       <span className="text-[10px] text-gray-400">Residency & Entry</span>
                    </div>
                    <div onClick={() => openRequestForm(ServiceCategory.BUSINESS)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors">
                       <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                       <span className="text-sm font-bold text-gray-800">Business</span>
                       <span className="text-[10px] text-gray-400">Setup & License</span>
                    </div>
                    <div onClick={() => openRequestForm(ServiceCategory.TRAVEL)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors">
                       <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></div>
                       <span className="text-sm font-bold text-gray-800">Travel</span>
                       <span className="text-[10px] text-gray-400">Tours & Hotels</span>
                    </div>
                    <div onClick={() => setIsAiOpen(true)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:bg-gray-50 transition-colors">
                       <div className="w-10 h-10 rounded-full bg-dubai-gold/10 text-dubai-gold flex items-center justify-center mb-2"><span className="text-lg">✨</span></div>
                       <span className="text-sm font-bold text-gray-800">Ask AI</span>
                       <span className="text-[10px] text-gray-400">Instant Guide</span>
                    </div>
                 </div>
              </div>

              {/* Recent Activity */}
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
             {/* ... (Existing Desktop Banner - Unchanged) ... */}
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
                {siteSettings?.siteName || 'DubaiLink'}, <span className="text-dubai-gold">Simplified.</span>
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
                <div onClick={() => openRequestForm(ServiceCategory.VISA)} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">Visa Services</h3>
                    <p className="text-gray-500 mb-6">Golden Visa, Freelance, Family & Tourist Visas.</p>
                    <span className="text-dubai-blue text-sm font-bold group-hover:underline">Post Request &rarr;</span>
                </div>
                <div onClick={() => openRequestForm(ServiceCategory.BUSINESS)} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">Business Setup</h3>
                    <p className="text-gray-500 mb-6">Mainland & Freezone Company Formation.</p>
                    <span className="text-dubai-blue text-sm font-bold group-hover:underline">Post Request &rarr;</span>
                </div>
                <div onClick={() => openRequestForm(ServiceCategory.TRAVEL)} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></div>
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
      onMarkRead={(id) => api.markNotificationAsRead(id).then(() => fetchData(currentUser))}
      onMarkAllRead={() => currentUser && api.markAllNotificationsAsRead(currentUser.id).then(() => fetchData(currentUser))}
      onToggleAi={() => setIsAiOpen(!isAiOpen)}
      siteSettings={siteSettings}
      adminSection={adminSection}
      setAdminSection={setAdminSection}
    >
      {renderContent()}

      <Toast 
        message={toastConfig?.message || ''}
        type={toastConfig?.type} 
        isVisible={!!toastConfig} 
        onClose={() => setToastConfig(null)} 
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
          showToast={showToast}
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
