import React, { useState, useEffect } from 'react';
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
import { UserRole, ServiceRequest, ProviderProfile as IProviderProfile, Review, Quote } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.USER);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Data State (Fetched from API)
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providers, setProviders] = useState<IProviderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [ignoredRequestIds, setIgnoredRequestIds] = useState<string[]>([]);
  const [quoteRequest, setQuoteRequest] = useState<string | null>(null); // Request ID being quoted
  const [activeChat, setActiveChat] = useState<{name: string, id: string} | null>(null);
  const [quoteToAccept, setQuoteToAccept] = useState<{ requestId: string, quote: Quote } | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);

  // Initialize Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedRequests, fetchedProviders] = await Promise.all([
          api.getRequests(),
          api.getProviders()
        ]);
        setRequests(fetchedRequests);
        setProviders(fetchedProviders);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Determine Current Provider (Simple logic: first provider in list if role is PROVIDER)
  const currentProvider = activeRole === UserRole.PROVIDER && providers.length > 0 ? providers[0] : null;

  const handleCreateRequest = async (reqData: any) => {
    try {
      const newRequest = await api.createRequest({
        userId: 'current_user',
        ...reqData
      });
      setRequests(prev => [newRequest, ...prev]);
      setShowRequestForm(false);
      setCurrentPage('dashboard');
    } catch (e) {
      console.error(e);
      alert("Failed to create request");
    }
  };

  const handleViewProvider = (providerId: string) => {
    setSelectedProviderId(providerId);
    setCurrentPage('provider-profile');
  };

  // User Actions
  const handleInitiateAcceptQuote = (requestId: string, quoteId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    const quote = request.quotes.find(q => q.id === quoteId);
    if (!quote) return;

    setQuoteToAccept({ requestId, quote });
  };

  const handleQuoteAccepted = async () => {
    if (!quoteToAccept) return;
    
    try {
      const updatedReq = await api.acceptQuote(quoteToAccept.requestId, quoteToAccept.quote.id);
      setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaymentCompleted = async (method: 'online' | 'offline') => {
    if (!quoteToAccept) return;
    
    try {
      const updatedReq = await api.completeOrder(quoteToAccept.requestId);
      setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    } catch (e) {
      console.error(e);
    }
  };

  // Provider Actions
  const handleProviderIgnoreRequest = (requestId: string) => {
    setIgnoredRequestIds(prev => [...prev, requestId]);
  };

  const handleProviderSubmitQuote = async (quoteData: { price: number, timeline: string, description: string }) => {
    if (!quoteRequest || !currentProvider) return;

    try {
      const updatedReq = await api.submitQuote(quoteRequest, currentProvider, quoteData);
      setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
      setQuoteRequest(null);
    } catch (e) {
      console.error(e);
      alert("Failed to submit quote");
    }
  };

  const handleSaveProfile = async (updatedData: any) => {
    if (activeRole === UserRole.PROVIDER && currentProvider) {
      try {
        const updatedProvider = await api.updateProvider(currentProvider.id, updatedData);
        setProviders(prev => prev.map(p => p.id === updatedProvider.id ? updatedProvider : p));
        setCurrentPage('dashboard');
      } catch (e) {
        console.error(e);
      }
    } else {
      // User profile update mock
      setCurrentPage('dashboard');
    }
  };

  // Chat Handlers
  const handleChatWithProvider = (providerId: string, providerName: string) => {
    setActiveChat({ id: providerId, name: providerName });
  };

  const handleChatWithUser = (userId: string, userName: string) => {
    setActiveChat({ id: userId, name: userName });
  };

  const handleAddReview = async (providerId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    try {
      const updatedProvider = await api.addReview(providerId, reviewData);
      setProviders(prev => prev.map(p => p.id === updatedProvider.id ? updatedProvider : p));
    } catch (e) {
      console.error(e);
    }
  };

  const getCurrentRequestStatus = (requestId: string): ServiceRequest['status'] => {
    return requests.find(r => r.id === requestId)?.status || 'open';
  };

  // Filter requests for Provider Dashboard
  const getProviderRequests = () => {
    if (activeRole === UserRole.PROVIDER && currentProvider) {
      return requests.filter(r => !ignoredRequestIds.includes(r.id));
    }
    return requests;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-dubai-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading DubaiLink Marketplace...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentPage === 'ai-assistant') {
      return <AiAssistant />;
    }

    if (currentPage === 'dashboard') {
      return (
        <Dashboard 
          role={activeRole} 
          requests={activeRole === UserRole.PROVIDER ? getProviderRequests() : requests}
          currentProviderId={currentProvider?.id}
          onViewProvider={handleViewProvider} 
          onAcceptQuote={handleInitiateAcceptQuote}
          onChatWithProvider={handleChatWithProvider}
          onChatWithUser={handleChatWithUser}
          onSubmitQuote={(id) => setQuoteRequest(id)}
          onIgnoreRequest={handleProviderIgnoreRequest}
          onViewQuote={(quote) => setViewingQuote(quote)}
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
            onSubmitReview={handleAddReview}
            onRequestQuote={() => setShowRequestForm(true)}
          />
        );
      }
    }

    if (currentPage === 'profile-settings') {
      return (
        <ProfileSettings 
          role={activeRole} 
          initialData={activeRole === UserRole.PROVIDER ? currentProvider : undefined}
          onSave={handleSaveProfile} 
          onCancel={() => setCurrentPage('home')}
          onPreview={() => {
            if (activeRole === UserRole.PROVIDER && currentProvider) {
              handleViewProvider(currentProvider.id);
            }
          }}
        />
      );
    }

    // Home / Marketplace View
    return (
      <div>
        {/* Hero Section */}
        <div className="relative bg-dubai-dark overflow-hidden">
          <div className="absolute inset-0">
            <img 
              className="w-full h-full object-cover opacity-30" 
              src="https://images.unsplash.com/photo-1512453979798-5ea904ac22ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
              alt="Dubai Skyline" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dubai-dark to-transparent mix-blend-multiply" />
          </div>
          <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Dubai Services, <span className="text-dubai-gold">Simplified.</span>
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-3xl">
              Connect with verified PROs, Business Consultants, and Travel Agencies. 
              Get accurate quotes, compare prices, and handle everything online.
            </p>
            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => setShowRequestForm(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-dubai-dark bg-dubai-gold hover:bg-yellow-600 hover:text-white transition-all shadow-lg hover:shadow-xl"
              >
                Post a Request
              </button>
              <button 
                onClick={() => setCurrentPage('ai-assistant')}
                className="inline-flex items-center px-6 py-3 border border-gray-500 text-base font-medium rounded-md text-white bg-transparent hover:bg-gray-800 transition-all backdrop-blur-sm"
              >
                <span className="mr-2">✨</span> Research with AI
              </button>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Golden Visa & Residencies',
                desc: '10-year Golden Visa, Green Visa, and family sponsorship.',
                icon: '🛂',
                color: 'bg-blue-50'
              },
              {
                title: 'Business Setup',
                desc: 'Mainland, Freezone, and Offshore company formation.',
                icon: '🏢',
                color: 'bg-yellow-50'
              },
              {
                title: 'Tourist & Travel',
                desc: 'Desert safaris, luxury stays, and 30/60 day tourist visas.',
                icon: '✈️',
                color: 'bg-green-50'
              }
            ].map((service, idx) => (
              <div key={idx} className={`${service.color} rounded-2xl p-8 transition-transform hover:-translate-y-1 cursor-pointer`} onClick={() => setShowRequestForm(true)}>
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.desc}</p>
                <div className="mt-4 text-dubai-blue font-semibold text-sm flex items-center">
                  Get Quotes <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white py-16 border-t border-gray-100">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Why DubaiLink?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                   <div className="w-12 h-12 bg-dubai-gold rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">1</div>
                   <h3 className="font-bold">Verified Providers</h3>
                   <p className="text-sm text-gray-500 mt-2">All PROs are vetted and licensed.</p>
                </div>
                <div>
                   <div className="w-12 h-12 bg-dubai-gold rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">2</div>
                   <h3 className="font-bold">Transparent Pricing</h3>
                   <p className="text-sm text-gray-500 mt-2">Compare apples to apples. No hidden fees.</p>
                </div>
                <div>
                   <div className="w-12 h-12 bg-dubai-gold rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">3</div>
                   <h3 className="font-bold">AI Powered</h3>
                   <p className="text-sm text-gray-500 mt-2">Get instant answers on regulations.</p>
                </div>
                <div>
                   <div className="w-12 h-12 bg-dubai-gold rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">4</div>
                   <h3 className="font-bold">Secure Payments</h3>
                   <p className="text-sm text-gray-500 mt-2">Your money is held safe until service delivery.</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <Layout 
      activeRole={activeRole} 
      setActiveRole={setActiveRole}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      {renderContent()}
      
      {showRequestForm && (
        <RequestForm 
          onSubmit={handleCreateRequest} 
          onCancel={() => setShowRequestForm(false)} 
        />
      )}

      {/* Direct Message Modal */}
      {activeChat && (
        <DirectMessageModal 
          recipientName={activeChat.name}
          currentUserRole={activeRole}
          onClose={() => setActiveChat(null)} 
        />
      )}

      {/* Quote Acceptance Modal */}
      {quoteToAccept && (
        <QuoteAcceptanceModal
          quote={quoteToAccept.quote}
          requestStatus={getCurrentRequestStatus(quoteToAccept.requestId)}
          onAccept={handleQuoteAccepted}
          onPaymentComplete={handlePaymentCompleted}
          onClose={() => setQuoteToAccept(null)}
        />
      )}

      {/* Submit Quote Modal */}
      {quoteRequest && (
        <SubmitQuoteModal
          requestTitle={requests.find(r => r.id === quoteRequest)?.title || 'Service Request'}
          onClose={() => setQuoteRequest(null)}
          onSubmit={handleProviderSubmitQuote}
        />
      )}

      {/* Quote Details Modal (Read-Only View) */}
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