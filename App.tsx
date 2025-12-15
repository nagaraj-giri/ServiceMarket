import React, { useState, useEffect } from 'react';
import { User, UserRole, ServiceRequest, ProviderProfile, Notification, Quote, SiteSettings, Conversation, AdminSection } from './types';
import { api } from './services/api';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import RequestForm from './components/RequestForm';
import VerifyEmailPage from './components/VerifyEmailPage';
import ProviderProfileView from './components/ProviderProfile'; // Import correctly
import ProfileSettings from './components/ProfileSettings';
import MessagesPage from './components/MessagesPage';
import ProviderLeadsPage from './components/ProviderLeadsPage';
import AdminDashboard from './components/AdminDashboard';
import AiAssistant from './components/AiAssistant';
import Toast, { ToastType } from './components/Toast';
import DirectMessageModal from './components/DirectMessageModal';
import SubmitQuoteModal from './components/SubmitQuoteModal';
import QuoteAcceptanceModal from './components/QuoteAcceptanceModal';
import QuoteDetailsModal from './components/QuoteDetailsModal';
import TrashPage from './components/TrashPage';

const App: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [adminSection, setAdminSection] = useState<AdminSection>('overview');
  
  // Data State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For admin
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | undefined>(undefined);
  
  // UI State
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType, isVisible: boolean}>({
    message: '', type: 'info', isVisible: false
  });
  const [pendingAction, setPendingAction] = useState<'post_request' | null>(null);

  // Modal State
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string} | null>(null);
  const [quotingRequestId, setQuotingRequestId] = useState<string | null>(null);
  const [acceptingQuote, setAcceptingQuote] = useState<{quote: Quote, reqStatus: any} | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [viewingProviderId, setViewingProviderId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  // --- EFFECTS ---

  // Auth Check
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      
      // Default to home or dashboard if logged in
      if (currentUser) {
        if (currentUser.role === UserRole.ADMIN) setCurrentPage('dashboard');
        refreshData();
      }
    };
    initAuth();
  }, []);

  // Poll for updates (simplified for demo)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
       refreshData();
    }, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [user]);

  // Load Settings
  useEffect(() => {
    api.getSettings().then(setSiteSettings);
  }, []);

  const refreshData = async () => {
    if (!user) return;
    try {
      const [reqs, notifs, chats] = await Promise.all([
        api.getRequests(user),
        api.getNotifications(user.id),
        api.getConversations(user.id)
      ]);
      setRequests(reqs);
      setNotifications(notifs);
      setConversations(chats);

      if (user.role === UserRole.ADMIN || user.role === UserRole.USER) {
        const provs = await api.getProviders();
        setProviders(provs);
      }
      if (user.role === UserRole.ADMIN) {
        const allUsers = await api.getAllUsers();
        setUsers(allUsers);
      } else if (user.role === UserRole.PROVIDER) {
         // Provider needs self profile
         const provs = await api.getProviders();
         setProviders(provs);
      }
    } catch (e) {
      console.error("Failed to refresh data", e);
    }
  };

  // --- ACTIONS ---

  const showToastMessage = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    
    // Check for pending actions (e.g. user tried to post request before login)
    if (pendingAction === 'post_request') {
      setCurrentPage('dashboard');
      // Adding a small delay ensures state updates propagate correctly before opening the modal
      setTimeout(() => setShowRequestForm(true), 100);
      setPendingAction(null);
    } else {
      setCurrentPage('dashboard');
    }
    
    refreshData();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCurrentPage('home');
    setRequests([]);
    setNotifications([]);
    setPendingAction(null);
  };

  const openRequestForm = () => {
    if (!user) {
      setPendingAction('post_request');
      showToastMessage('Please sign in to post a request', 'info');
      setCurrentPage('login');
    } else {
      setShowRequestForm(true);
    }
  };

  const handlePostRequest = async (data: any) => {
    try {
      await api.createRequest({ ...data, userId: user?.id });
      showToastMessage('Request posted successfully!', 'success');
      setShowRequestForm(false);
      refreshData();
    } catch (error) {
      showToastMessage('Failed to post request.', 'error');
    }
  };

  const handleSubmitQuote = async (quoteData: any) => {
    if (!quotingRequestId || !user) return;
    const provider = providers.find(p => p.id === user.id);
    if (!provider) {
       showToastMessage('Provider profile not found.', 'error');
       return;
    }

    try {
      await api.submitQuote(quotingRequestId, provider, quoteData);
      showToastMessage('Quote submitted successfully!', 'success');
      setQuotingRequestId(null);
      refreshData();
    } catch (error) {
      showToastMessage('Failed to submit quote.', 'error');
    }
  };

  const handleAcceptQuote = async () => {
    if (!acceptingQuote) return;
    try {
      await api.acceptQuote(requests.find(r => r.quotes.some(q => q.id === acceptingQuote.quote.id))?.id || '', acceptingQuote.quote.id);
      showToastMessage('Quote accepted!', 'success');
      // Note: Payment/Completion flow would continue here, handled inside modal logic usually or triggers refresh
      refreshData();
      // Don't close modal yet, wait for payment completion flow inside component
    } catch (e) {
      showToastMessage('Failed to accept quote.', 'error');
    }
  };

  const handlePaymentComplete = async (method: 'online' | 'offline') => {
    if (!acceptingQuote) return;
    const requestId = requests.find(r => r.quotes.some(q => q.id === acceptingQuote.quote.id))?.id;
    if (requestId) {
        // Automatically close request if paid
        await api.completeOrder(requestId);
        showToastMessage('Order confirmed and request closed.', 'success');
        setAcceptingQuote(null);
        refreshData();
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
     try {
       await api.permanentDeleteRequest(requestId);
       showToastMessage('Request deleted.', 'info');
       refreshData();
     } catch (e) {
       showToastMessage('Failed to delete.', 'error');
     }
  };

  // --- RENDER ---

  if (isLoading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-dubai-gold animate-pulse">Loading DubaiLink...</div>;
  }

  // 1. Auth Page
  if (currentPage === 'login' && !user) {
    return (
      <>
        <AuthPage onSuccess={handleLogin} showToast={showToastMessage} />
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isVisible={toast.isVisible} 
          onClose={() => setToast({ ...toast, isVisible: false })} 
        />
      </>
    );
  }

  // 2. Verify Email Page
  if (user && !user.emailVerified) {
    return (
      <>
        <VerifyEmailPage 
          user={user} 
          onLogout={handleLogout} 
          onVerificationCheck={async () => {
             const u = await api.refreshUserAuth();
             if (u?.emailVerified) {
                setUser(u);
                showToastMessage('Email verified!', 'success');
             } else {
                showToastMessage('Email not verified yet.', 'error');
             }
          }} 
        />
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isVisible={toast.isVisible} 
          onClose={() => setToast({ ...toast, isVisible: false })} 
        />
      </>
    );
  }

  // 3. Main Layout
  return (
    <Layout
      user={user}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      onLogout={handleLogout}
      onLoginClick={() => setCurrentPage('login')}
      onPostRequest={openRequestForm}
      notifications={notifications}
      onMarkRead={(id) => api.markNotificationAsRead(id).then(refreshData)}
      onMarkAllRead={() => user && api.markAllNotificationsAsRead(user.id).then(refreshData)}
      onToggleAi={() => setShowAiAssistant(!showAiAssistant)}
      siteSettings={siteSettings}
      adminSection={adminSection}
      setAdminSection={setAdminSection}
    >
       {/* HOME / DASHBOARD */}
       {(currentPage === 'home' || currentPage === 'dashboard') && (
         <>
           {user?.role === UserRole.ADMIN && currentPage === 'dashboard' ? (
             <AdminDashboard 
                requests={requests}
                providers={providers}
                users={users}
                onDeleteRequest={handleDeleteRequest}
                onToggleVerifyProvider={async (pid) => { await api.toggleProviderVerification(pid); refreshData(); }}
                activeSection={adminSection}
                showToast={showToastMessage}
             />
           ) : (
             <Dashboard 
                role={user?.role || UserRole.USER}
                requests={requests}
                conversations={conversations}
                currentProvider={user?.role === UserRole.PROVIDER ? providers.find(p => p.id === user.id) : undefined}
                currentProviderId={user?.id}
                onViewProvider={(pid) => { setViewingProviderId(pid); setCurrentPage('provider-view'); }}
                onAcceptQuote={(rid, qid) => {
                   const req = requests.find(r => r.id === rid);
                   const quote = req?.quotes.find(q => q.id === qid);
                   if (quote) setAcceptingQuote({ quote, reqStatus: req?.status });
                }}
                onChatWithProvider={(pid, name) => setActiveChatUser({ id: pid, name })}
                onChatWithUser={(uid, name) => setActiveChatUser({ id: uid, name })}
                onSubmitQuote={(rid) => setQuotingRequestId(rid)} // Only for providers in dashboard context if needed
                onIgnoreRequest={(rid) => { /* Implement ignore logic if needed */ }}
                onViewQuote={(q) => setViewingQuote(q)}
                onDeleteRequest={handleDeleteRequest}
                onPostRequest={openRequestForm}
                isHomeView={currentPage === 'home'}
             />
           )}
         </>
       )}

       {/* PROVIDER LEADS PAGE */}
       {currentPage === 'provider-leads' && user?.role === UserRole.PROVIDER && (
          <ProviderLeadsPage 
             requests={requests} // Note: api.getRequests returns relevant requests for user/provider
             allRequests={requests} // For this simple implementation, it's the same list
             currentProviderId={user.id}
             currentProvider={providers.find(p => p.id === user.id)}
             onSubmitQuote={(rid) => setQuotingRequestId(rid)}
             onIgnoreRequest={(rid) => { /* ignore */ }}
          />
       )}

       {/* MESSAGES PAGE */}
       {currentPage === 'messages' && user && (
          <MessagesPage 
            conversations={conversations}
            onOpenChat={(uid, name) => setActiveChatUser({ id: uid, name })}
          />
       )}

       {/* PROVIDER PROFILE VIEW (Public) */}
       {currentPage === 'provider-view' && viewingProviderId && (
          <ProviderProfileView 
             provider={providers.find(p => p.id === viewingProviderId) || {id: viewingProviderId, name: 'Provider', services: [], rating: 0, reviewCount: 0, badges: [], description: '', location: '', serviceTypes: [], isVerified: false, reviews: [], gallery: [], coverImage: '', profileImage: '', tagline: ''}}
             currentUser={user}
             onBack={() => setCurrentPage('dashboard')}
             onSubmitReview={async (pid, rev) => { await api.addReview(pid, rev); showToastMessage('Review submitted', 'success'); refreshData(); }}
             onRequestQuote={() => { 
                if (!user) {
                   setPendingAction('post_request');
                   showToastMessage('Please sign in to request a quote', 'info');
                   setCurrentPage('login');
                } else {
                   openRequestForm();
                }
             }}
             showToast={showToastMessage}
          />
       )}

       {/* PROFILE SETTINGS */}
       {currentPage === 'profile-settings' && user && (
          <ProfileSettings 
             role={user.role}
             initialData={user.role === UserRole.PROVIDER ? { ...providers.find(p => p.id === user.id), email: user.email } : user}
             onSave={async (data) => {
                if (user.role === UserRole.PROVIDER) await api.updateProvider(user.id, data);
                else await api.updateUser({ ...user, ...data });
                showToastMessage('Profile updated successfully', 'success');
                refreshData();
                setCurrentPage('dashboard');
             }}
             onCancel={() => setCurrentPage('dashboard')}
             onPreview={() => {
                if (user.role === UserRole.PROVIDER) {
                   setViewingProviderId(user.id);
                   setCurrentPage('provider-view');
                }
             }}
          />
       )}

       {/* TRASH PAGE */}
       {currentPage === 'trash' && (
          <TrashPage 
             deletedRequests={[]} // Implement soft delete filter here if using soft delete
             onRestore={() => {}} 
             onPermanentDelete={() => {}} 
             onBack={() => setCurrentPage('dashboard')} 
          />
       )}

       {/* --- MODALS & OVERLAYS --- */}

       {showRequestForm && (
         <RequestForm 
           onSubmit={handlePostRequest} 
           onCancel={() => setShowRequestForm(false)} 
         />
       )}

       {showAiAssistant && (
         <AiAssistant 
           currentUser={user}
           onClose={() => setShowAiAssistant(false)} 
         />
       )}

       {activeChatUser && user && (
         <DirectMessageModal 
           recipientId={activeChatUser.id}
           recipientName={activeChatUser.name}
           currentUser={user}
           onClose={() => setActiveChatUser(null)}
           showToast={showToastMessage}
         />
       )}

       {quotingRequestId && (
         <SubmitQuoteModal 
           requestTitle={requests.find(r => r.id === quotingRequestId)?.title || 'Request'}
           onClose={() => setQuotingRequestId(null)}
           onSubmit={handleSubmitQuote}
         />
       )}

       {acceptingQuote && (
         <QuoteAcceptanceModal 
           quote={acceptingQuote.quote}
           requestStatus={acceptingQuote.reqStatus}
           onAccept={handleAcceptQuote}
           onPaymentComplete={handlePaymentComplete}
           onClose={() => setAcceptingQuote(null)}
         />
       )}

       {viewingQuote && (
         <QuoteDetailsModal 
           quote={viewingQuote}
           onClose={() => setViewingQuote(null)}
         />
       )}

       <Toast 
         message={toast.message} 
         type={toast.type} 
         isVisible={toast.isVisible} 
         onClose={() => setToast({ ...toast, isVisible: false })} 
       />
    </Layout>
  );
};

export default App;