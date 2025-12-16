import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { User, UserRole, ServiceRequest, ProviderProfile, Notification, Quote, SiteSettings, Conversation, AdminSection } from './types';
import { api } from './services/api';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import RequestForm from './components/RequestForm';
import VerifyEmailPage from './components/VerifyEmailPage';
import ProviderProfileView from './components/ProviderProfile';
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

// Helper for Route Protection
const RequireAuth = ({ user, children }: { user: User | null; children: React.ReactNode }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [viewingProviderId, setViewingProviderId] = useState<string | null>(null); // Kept for modal logic if needed, but switching to routes mostly
  
  const navigate = useNavigate();
  const location = useLocation();

  // --- EFFECTS ---

  // Auth Check
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      
      if (currentUser) {
        refreshData();
      }
    };
    initAuth();
  }, []);

  // Poll for updates
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
    
    if (pendingAction === 'post_request') {
      navigate('/dashboard');
      setTimeout(() => setShowRequestForm(true), 100);
      setPendingAction(null);
    } else {
      navigate('/dashboard');
    }
    
    refreshData();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    navigate('/');
    setRequests([]);
    setNotifications([]);
    setPendingAction(null);
  };

  const openRequestForm = () => {
    if (!user) {
      setPendingAction('post_request');
      showToastMessage('Please sign in to post a request', 'info');
      navigate('/login');
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
      refreshData();
    } catch (e) {
      showToastMessage('Failed to accept quote.', 'error');
    }
  };

  const handlePaymentComplete = async (method: 'online' | 'offline') => {
    if (!acceptingQuote) return;
    const requestId = requests.find(r => r.quotes.some(q => q.id === acceptingQuote.quote.id))?.id;
    if (requestId) {
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

  return (
    <>
      <Routes>
        <Route path="/login" element={
          !user ? <AuthPage onSuccess={handleLogin} showToast={showToastMessage} /> : <Navigate to="/dashboard" replace />
        } />
        
        <Route path="/verify-email" element={
          user && !user.emailVerified ? (
            <VerifyEmailPage 
              user={user} 
              onLogout={handleLogout} 
              onVerificationCheck={async () => {
                 const u = await api.refreshUserAuth();
                 if (u?.emailVerified) {
                    setUser(u);
                    showToastMessage('Email verified!', 'success');
                    navigate('/dashboard');
                 } else {
                    showToastMessage('Email not verified yet.', 'error');
                 }
              }} 
            />
          ) : <Navigate to="/dashboard" replace />
        } />

        <Route path="/" element={
          <Layout
            user={user}
            onLogout={handleLogout}
            onPostRequest={openRequestForm}
            notifications={notifications}
            onMarkRead={(id) => api.markNotificationAsRead(id).then(refreshData)}
            onMarkAllRead={() => user && api.markAllNotificationsAsRead(user.id).then(refreshData)}
            onToggleAi={() => setShowAiAssistant(!showAiAssistant)}
            siteSettings={siteSettings}
          >
             <Dashboard 
                role={user?.role || UserRole.USER}
                requests={requests}
                conversations={conversations}
                currentProvider={user?.role === UserRole.PROVIDER ? providers.find(p => p.id === user.id) : undefined}
                currentProviderId={user?.id}
                onViewProvider={(pid) => navigate(`/provider/${pid}`)}
                onPostRequest={openRequestForm}
                isHomeView={true}
                // Pass minimal props for home view
             />
          </Layout>
        } />

        <Route path="/dashboard" element={
          <Layout
            user={user}
            onLogout={handleLogout}
            onPostRequest={openRequestForm}
            notifications={notifications}
            onMarkRead={(id) => api.markNotificationAsRead(id).then(refreshData)}
            onMarkAllRead={() => user && api.markAllNotificationsAsRead(user.id).then(refreshData)}
            onToggleAi={() => setShowAiAssistant(!showAiAssistant)}
            siteSettings={siteSettings}
          >
             <Dashboard 
                role={user?.role || UserRole.USER}
                requests={requests}
                conversations={conversations}
                currentProvider={user?.role === UserRole.PROVIDER ? providers.find(p => p.id === user.id) : undefined}
                currentProviderId={user?.id}
                onViewProvider={(pid) => navigate(`/provider/${pid}`)}
                onAcceptQuote={(rid, qid) => {
                   const req = requests.find(r => r.id === rid);
                   const quote = req?.quotes.find(q => q.id === qid);
                   if (quote) setAcceptingQuote({ quote, reqStatus: req?.status });
                }}
                onChatWithProvider={(pid, name) => setActiveChatUser({ id: pid, name })}
                onChatWithUser={(uid, name) => setActiveChatUser({ id: uid, name })}
                onSubmitQuote={(rid) => setQuotingRequestId(rid)}
                onViewQuote={(q) => setViewingQuote(q)}
                onDeleteRequest={handleDeleteRequest}
                onPostRequest={openRequestForm}
             />
          </Layout>
        } />

        <Route path="/admin" element={
          <RequireAuth user={user}>
            <Layout
              user={user}
              onLogout={handleLogout}
              notifications={notifications}
              siteSettings={siteSettings}
              adminSection={adminSection}
              setAdminSection={setAdminSection}
            >
               {user?.role === UserRole.ADMIN ? (
                 <AdminDashboard 
                    requests={requests}
                    providers={providers}
                    users={users}
                    onDeleteRequest={handleDeleteRequest}
                    onToggleVerifyProvider={async (pid) => { await api.toggleProviderVerification(pid); refreshData(); }}
                    activeSection={adminSection}
                    showToast={showToastMessage}
                 />
               ) : <Navigate to="/dashboard" />}
            </Layout>
          </RequireAuth>
        } />

        <Route path="/provider-leads" element={
          <RequireAuth user={user}>
            <Layout user={user} onLogout={handleLogout} siteSettings={siteSettings}>
               {user?.role === UserRole.PROVIDER ? (
                  <ProviderLeadsPage 
                     requests={requests}
                     allRequests={requests}
                     currentProviderId={user.id}
                     currentProvider={providers.find(p => p.id === user.id)}
                     onSubmitQuote={(rid) => setQuotingRequestId(rid)}
                  />
               ) : <Navigate to="/dashboard" />}
            </Layout>
          </RequireAuth>
        } />

        <Route path="/messages" element={
          <RequireAuth user={user}>
            <Layout user={user} onLogout={handleLogout} siteSettings={siteSettings}>
               <MessagesPage 
                 conversations={conversations}
                 onOpenChat={(uid, name) => setActiveChatUser({ id: uid, name })}
               />
            </Layout>
          </RequireAuth>
        } />

        <Route path="/profile-settings" element={
          <RequireAuth user={user}>
            <Layout user={user} onLogout={handleLogout} siteSettings={siteSettings}>
               <ProfileSettings 
                  role={user!.role}
                  initialData={user!.role === UserRole.PROVIDER ? { ...providers.find(p => p.id === user!.id), email: user!.email } : user}
                  onSave={async (data) => {
                     if (user!.role === UserRole.PROVIDER) await api.updateProvider(user!.id, data);
                     else await api.updateUser({ ...user!, ...data });
                     showToastMessage('Profile updated successfully', 'success');
                     refreshData();
                     navigate('/dashboard');
                  }}
                  onCancel={() => navigate('/dashboard')}
                  onPreview={() => {
                     if (user!.role === UserRole.PROVIDER) navigate(`/provider/${user!.id}`);
                  }}
               />
            </Layout>
          </RequireAuth>
        } />

        <Route path="/provider/:providerId" element={
           <Layout
             user={user}
             onLogout={handleLogout}
             onPostRequest={openRequestForm}
             siteSettings={siteSettings}
           >
              {/* Note: In a real app we'd fetch specific provider by ID from params. 
                  Here we use the pre-fetched providers list for simplicity. */}
              <ProviderRouteWrapper 
                 providers={providers}
                 user={user}
                 onBack={() => navigate('/dashboard')}
                 onSubmitReview={async (pid, rev) => { await api.addReview(pid, rev); showToastMessage('Review submitted', 'success'); refreshData(); }}
                 onRequestQuote={openRequestForm}
                 showToast={showToastMessage}
              />
           </Layout>
        } />

        <Route path="/trash" element={
           <RequireAuth user={user}>
             <Layout user={user} onLogout={handleLogout} siteSettings={siteSettings}>
                <TrashPage 
                   deletedRequests={[]} 
                   onRestore={() => {}} 
                   onPermanentDelete={() => {}} 
                   onBack={() => navigate('/dashboard')} 
                />
             </Layout>
           </RequireAuth>
        } />

      </Routes>

      {/* --- MODALS --- */}
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
    </>
  );
};

// Small wrapper to handle extracting ID from params for Provider View
const ProviderRouteWrapper = ({ providers, user, onBack, onSubmitReview, onRequestQuote, showToast }: any) => {
    const params = useParams();
    const pid = params.providerId;

    const provider = providers.find((p: any) => p.id === pid) || {
        id: pid, name: 'Provider', services: [], rating: 0, reviewCount: 0, badges: [], description: '', location: '', serviceTypes: [], isVerified: false, reviews: [], gallery: [], coverImage: '', profileImage: '', tagline: ''
    };

    return (
        <ProviderProfileView 
             provider={provider}
             currentUser={user}
             onBack={onBack}
             onSubmitReview={onSubmitReview}
             onRequestQuote={() => {
                 if(!user) {
                    // Logic handled in parent
                    onRequestQuote();
                 } else {
                    onRequestQuote();
                 }
             }}
             showToast={showToast}
        />
    );
};

export default App;