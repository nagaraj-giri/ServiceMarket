
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
import { UserRole, ServiceRequest, ProviderProfile as IProviderProfile, Review, Quote, User, Conversation, Notification } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [showRequestForm, setShowRequestForm] = useState(false);
  
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

         // Show Toast for new Notifications
         if (notifs.length > prevNotifCount && prevNotifCount > 0) {
            const newest = notifs[0];
            if (!newest.read) {
               setToastMessage(`${newest.title}: ${newest.message}`);
            }
         }
         setPrevNotifCount(notifs.length);
         
         // Logic for Provider Notifications: "New Lead Received" (Keep this as well for specific location matches)
         if (currentUser.role === UserRole.PROVIDER) {
            const me = fetchedProviders.find(p => p.id === currentUser.id);
            if (me && me.location) {
               // Calculate number of open leads matching this provider's location
               const matchedLeads = fetchedRequests.filter(r => {
                  const isAvailable = r.status === 'open' && !r.quotes.some(q => q.providerId === me.id);
                  if (!isAvailable) return false;
                  
                  // Strict location matching for notification
                  if (r.locality) {
                     const reqLoc = r.locality.toLowerCase().trim();
                     const provLoc = me.location.toLowerCase().trim();
                     return provLoc.includes(reqLoc) || reqLoc.includes(provLoc);
                  }
                  return false;
               });

               // If count increased, assume a new lead arrived
               if (matchedLeads.length > prevLeadCount && prevLeadCount > 0) {
                  const newLead = matchedLeads[0];
                  // Only show toast if not already covered by general notifications (which it isn't, leads are passive)
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

  // Initialize
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

  // Polling
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
       await fetchData(); // Await to ensure UI updates
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
      return <AiAssistant />;
    }

    if (currentPage === 'dashboard') {
      let visibleRequests = requests;

      // Filter Logic for User vs Provider View
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

    return (
      <div className="bg-white">
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
                onClick={() => {
                   if (!currentUser) {
                      setCurrentPage('dashboard');
                   } else {
                      setShowRequestForm(true);
                   }
                }}
                className="bg-dubai-gold text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-600 transition-colors shadow-lg"
              >
                Post a Request
              </button>
              <button 
                onClick={() => setCurrentPage('ai-assistant')}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <span>✨</span> Research with AI
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-dubai-blue transition-colors">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Golden Visa & Residencies</h3>
              <p className="text-gray-500 mb-4">10-year Golden Visa, Green Visa, and family sponsorship.</p>
              <span className="text-dubai-blue font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Get Quotes <span>&rarr;</span></span>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group">
               <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-dubai-gold transition-colors">
                <svg className="w-6 h-6 text-yellow-700 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Business Setup</h3>
              <p className="text-gray-500 mb-4">Mainland & Freezone company formation, licensing, and banking.</p>
               <span className="text-dubai-blue font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Get Quotes <span>&rarr;</span></span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group">
               <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                <svg className="w-6 h-6 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tourist & Travel</h3>
              <p className="text-gray-500 mb-4">Desert safaris, luxury stays, and 30/60 day tourist visas.</p>
               <span className="text-dubai-blue font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Get Quotes <span>&rarr;</span></span>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-100 py-16">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How DubaiLink Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                 <div>
                    <div className="w-10 h-10 bg-dubai-gold text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">1</div>
                    <h3 className="font-bold text-gray-900">Post a Request</h3>
                    <p className="text-sm text-gray-500 mt-2">Tell us what you need. AI helps you research requirements.</p>
                 </div>
                 <div>
                    <div className="w-10 h-10 bg-dubai-gold text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">2</div>
                    <h3 className="font-bold text-gray-900">Receive Quotes</h3>
                    <p className="text-sm text-gray-500 mt-2">Get competitive offers from verified providers within 24 hours.</p>
                 </div>
                 <div>
                    <div className="w-10 h-10 bg-dubai-gold text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">3</div>
                    <h3 className="font-bold text-gray-900">Compare & Chat</h3>
                    <p className="text-sm text-gray-500 mt-2">Check ratings, reviews, and chat directly with providers.</p>
                 </div>
                 <div>
                    <div className="w-10 h-10 bg-dubai-gold text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">4</div>
                    <h3 className="font-bold text-gray-900">Secure Service</h3>
                    <p className="text-sm text-gray-500 mt-2">Accept the best quote and get your service delivered.</p>
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
      notifications={notifications}
      onMarkRead={(id) => api.markNotificationAsRead(id).then(fetchData)}
      onMarkAllRead={() => currentUser && api.markAllNotificationsAsRead(currentUser.id).then(fetchData)}
    >
      {renderContent()}

      <Toast 
        message={toastMessage || ''} 
        isVisible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

      {showRequestForm && (
        <RequestForm 
          onSubmit={handleCreateRequest}
          onCancel={() => setShowRequestForm(false)}
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
