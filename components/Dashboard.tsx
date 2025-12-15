
import React, { useState, useEffect } from 'react';
import { UserRole, ServiceRequest, Quote, Conversation, ProviderProfile, ServiceType } from '../types';
import { api } from '../services/api';
import { Skeleton } from './Skeleton';

interface DashboardProps {
  role: UserRole;
  requests: ServiceRequest[];
  conversations?: Conversation[];
  currentProvider?: ProviderProfile;
  currentProviderId?: string;
  onViewProvider?: (providerId: string) => void;
  onAcceptQuote?: (requestId: string, quoteId: string) => void;
  onChatWithProvider?: (providerId: string, providerName: string) => void;
  onChatWithUser?: (userId: string, userName: string) => void;
  onSubmitQuote?: (requestId: string) => void;
  onIgnoreRequest?: (requestId: string) => void;
  onViewQuote?: (quote: Quote) => void;
  onDeleteRequest?: (requestId: string) => void;
  onPostRequest?: () => void;
  isHomeView?: boolean;
}

const RequestStatusStepper = ({ status }: { status: ServiceRequest['status'] }) => {
  const steps = [
    { id: 'open', label: 'Open' },
    { id: 'quoted', label: 'Quoted' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'closed', label: 'Closed' }
  ];

  const currentStepIndex = Math.max(0, steps.findIndex(s => s.id === status));

  return (
    <div className="py-4 overflow-x-auto">
      <div className="relative flex items-center justify-between min-w-[280px]">
        {/* Background gray line */}
        <div className="absolute left-0 top-3 w-full h-0.5 bg-gray-100 -z-10"></div>
        
        {/* Active colored line */}
        <div 
          className="absolute left-0 top-3 h-0.5 bg-dubai-gold -z-10 transition-all duration-500 ease-out"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
                  ${isCompleted ? 'border-dubai-gold text-dubai-gold' : 'border-gray-200 text-transparent'}
                  ${isCurrent ? 'ring-2 ring-yellow-100 scale-110' : ''}
                `}
              >
                {index < currentStepIndex ? (
                  <svg className="w-3 h-3 text-dubai-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-dubai-gold' : 'bg-gray-200'}`}></div>
                )}
              </div>
              <span className={`mt-2 text-[10px] font-medium uppercase tracking-wide ${isCurrent ? 'text-dubai-dark font-bold' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ role, requests, conversations = [], currentProvider, currentProviderId, onViewProvider, onAcceptQuote, onChatWithProvider, onChatWithUser, onSubmitQuote, onIgnoreRequest, onViewQuote, onDeleteRequest, onPostRequest, isHomeView = false }) => {
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');
  
  // New State for Services
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const activeProviderId = currentProvider?.id || currentProviderId;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Simulate a slight delay for the weightless animation to be visible (UX preference)
        // In a real app, this delay would just be the network time.
        const types = await api.getServiceTypes();
        setServiceTypes(types.filter(t => t.isActive));
      } catch (e) {
        console.error("Failed to fetch services", e);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const toggleExpand = (requestId: string) => {
    const newSet = new Set(expandedRequestIds);
    if (newSet.has(requestId)) {
      newSet.delete(requestId);
    } else {
      newSet.add(requestId);
    }
    setExpandedRequestIds(newSet);
  };

  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    const props = { className: "w-8 h-8", strokeWidth: 1.5 };
    
    if (lower.includes('visa')) return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M8 12h8" /><path d="M3 8V6a2 2 0 012-2h14a2 2 0 012 2v2" /></svg>
    );
    if (lower.includes('travel') || lower.includes('tour')) return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    );
    if (lower.includes('car') || lower.includes('drive') || lower.includes('lift')) return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    );
    if (lower.includes('rent')) return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    );
    if (lower.includes('insurance')) return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    );
    if (lower.includes('movers') || lower.includes('pack')) return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    );
    if (lower.includes('business')) return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    );
    return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
  };

  // ----------------------------------------------------------------------
  // PROVIDER DASHBOARD
  // ----------------------------------------------------------------------
  if (role === UserRole.PROVIDER && activeProviderId && !isHomeView) {
    const newLeads = requests.filter(r => currentProvider ? api.matchProviderToRequest(currentProvider, r) : false);

    const myQuotes = requests.filter(r => r.quotes.some(q => q.providerId === activeProviderId));
    const revenue = myQuotes.reduce((total, req) => {
      const myQuote = req.quotes.find(q => q.providerId === activeProviderId);
      return (myQuote && myQuote.status === 'accepted') ? total + myQuote.price : total;
    }, 0);
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Provider Dashboard</h1>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">Active Leads</h3>
            <p className="text-3xl font-bold text-dubai-blue mt-1">{newLeads.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">Submitted Quotes</h3>
            <p className="text-3xl font-bold text-dubai-gold mt-1">{myQuotes.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">Revenue</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1"><span className="text-sm font-normal text-gray-400 mr-1">AED</span>{revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">Messages</h3>
             <p className={`text-3xl font-bold mt-1 ${totalUnread > 0 ? 'text-green-500' : 'text-gray-400'}`}>{totalUnread}</p>
          </div>
        </div>

        {/* Leads and Quotes Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Leads Column */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">New Opportunities</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">LIVE</span>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {newLeads.length > 0 ? newLeads.map(req => (
                <div key={req.id} className="border border-gray-200 rounded-lg p-4 hover:border-dubai-gold/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{req.category}</span>
                    <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{req.title}</h3>
                  {req.locality && <div className="text-xs text-gray-500 flex items-center mb-2"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{req.locality}</div>}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{req.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => onSubmitQuote && onSubmitQuote(req.id)} className="flex-1 bg-dubai-gold text-white text-sm font-bold py-2 rounded hover:bg-yellow-600">Quote</button>
                    <button onClick={() => onIgnoreRequest && onIgnoreRequest(req.id)} className="px-4 border border-gray-300 rounded text-gray-500 hover:bg-gray-50">Ignore</button>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                   <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   </div>
                   <p className="text-sm font-bold text-gray-900">No new leads found</p>
                   <p className="text-xs text-gray-500 mt-1 max-w-xs">We'll notify you when requests match your services and location.</p>
                </div>
              )}
            </div>
          </div>

          {/* Messages & My Quotes */}
          <div className="flex flex-col gap-6 h-[600px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50"><h2 className="font-bold text-gray-900">Recent Messages</h2></div>
              <div className="overflow-y-auto flex-1 p-0">
                 {conversations.map(c => (
                   <div key={c.otherUserId} onClick={() => onChatWithUser && onChatWithUser(c.otherUserId, c.otherUserName)} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{c.otherUserName.charAt(0)}</div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between"><span className="font-bold text-sm truncate">{c.otherUserName}</span> <span className="text-xs text-gray-400">{new Date(c.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                       <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                     </div>
                   </div>
                 ))}
                 {conversations.length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center">
                        <span className="text-lg mb-2">💬</span>
                        No messages yet. Chats will appear here.
                    </div>
                 )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
               <div className="p-4 border-b border-gray-100 bg-gray-50"><h2 className="font-bold text-gray-900">My Quotes</h2></div>
               <div className="overflow-y-auto flex-1">
                  {myQuotes.map(req => {
                    const q = req.quotes.find(q => q.providerId === activeProviderId);
                    return (
                      <div key={req.id} className="p-4 border-b border-gray-50 hover:bg-gray-50">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-sm text-gray-900 truncate max-w-[60%]">{req.title}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${q?.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{q?.status}</span>
                        </div>
                        <div className="text-xs text-gray-500">AED {q?.price.toLocaleString()} • {q?.timeline}</div>
                      </div>
                    )
                  })}
                  {myQuotes.length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center">
                        <span className="text-lg mb-2">📄</span>
                        No quotes submitted yet.
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // USER DASHBOARD (MARKETPLACE VIEW)
  // ----------------------------------------------------------------------
  
  // Filter and Sort Requests for User
  let filteredRequests = requests.filter(req => {
      if (filterStatus === 'all') return true;
      return req.status === filterStatus;
  });

  filteredRequests.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOption === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  // Dynamic Trending Service
  const trendingService = serviceTypes.find(s => s.name.includes('Visa')) || serviceTypes[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 1. HERO SECTION */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 mb-10 text-white relative overflow-hidden shadow-xl animate-in fade-in duration-700">
          {/* Content */}
          <div className="relative z-10 max-w-2xl">
             {isLoadingServices ? (
                <div className="space-y-4">
                   <div className="h-6 w-24 bg-white/10 rounded animate-pulse"></div>
                   <div className="h-12 w-3/4 bg-white/10 rounded animate-pulse"></div>
                   <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse"></div>
                   <div className="h-12 w-40 bg-white/10 rounded-xl mt-6 animate-pulse"></div>
                </div>
             ) : (
                <>
                   <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded mb-4 tracking-wider uppercase backdrop-blur-sm">
                      Trending
                   </span>
                   <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                     {trendingService ? trendingService.name : 'Premium Dubai Services'}
                   </h1>
                   <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                     {trendingService ? trendingService.description : 'Connect with verified professionals for all your business and lifestyle needs in Dubai.'}
                   </p>
                   {onPostRequest && (
                     <button 
                       onClick={onPostRequest}
                       className="bg-dubai-gold hover:bg-yellow-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl"
                     >
                       Post Request
                     </button>
                   )}
                </>
             )}
          </div>
          {/* Abstract Background Element */}
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-dubai-blue/30 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-dubai-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. BROWSE SERVICES GRID */}
      <div className="mb-12">
         <h2 className="text-xl font-bold text-gray-900 mb-6">Browse Services</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingServices ? (
               // Weightless Animation Loading State
               [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-56 flex flex-col justify-center items-center gap-4 relative overflow-hidden">
                     {/* Shimmer Effect */}
                     <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"></div>
                     
                     <div className="w-14 h-14 rounded-full bg-gray-100 relative overflow-hidden"></div>
                     <div className="h-4 w-32 bg-gray-100 rounded"></div>
                     <div className="h-12 w-full bg-gray-50 rounded"></div>
                  </div>
               ))
            ) : (
               serviceTypes.map((service) => (
                  <div 
                    key={service.id} 
                    onClick={onPostRequest} // Or navigate to specific category
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group flex flex-col items-center text-center h-full"
                  >
                     <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        {getServiceIcon(service.name)}
                     </div>
                     <h3 className="font-bold text-gray-900 mb-2">{service.name}</h3>
                     <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{service.description}</p>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* 3. RECENT ACTIVITY */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-t border-gray-100 pt-8">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        
        {requests.length > 0 && (
            <div className="flex gap-2">
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-dubai-gold"
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="quoted">Quoted</option>
                    <option value="accepted">Accepted</option>
                    <option value="closed">Closed</option>
                </select>
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-dubai-gold"
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                </select>
            </div>
        )}
      </div>
      
      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
           <p className="text-gray-400 text-sm">No active requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.length > 0 ? filteredRequests.map(req => {
            const isExpanded = expandedRequestIds.has(req.id);
            const isRequestClosed = req.status === 'closed';
            const shouldRefine = api.shouldNotifyToRefineCriteria(req);

            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Status Column */}
                  <div className="md:w-1/4 min-w-[200px] border-r border-gray-100 pr-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                        req.status === 'open' ? 'bg-blue-50 text-blue-700' :
                        req.status === 'quoted' ? 'bg-yellow-50 text-yellow-700' :
                        req.status === 'accepted' ? 'bg-green-50 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{req.title}</h3>
                    <p className="text-sm text-gray-500">{req.category}</p>
                    
                    {shouldRefine && req.status === 'open' && (
                        <div className="mt-3 bg-yellow-50 p-2 rounded text-xs text-yellow-800 flex gap-2 items-start">
                            <span className="text-lg">💡</span>
                            <p>No quotes yet? Try adding more details to your request.</p>
                        </div>
                    )}
                  </div>

                  {/* Details Column */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                       <RequestStatusStepper status={req.status} />
                       <button onClick={() => toggleExpand(req.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </button>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-20 opacity-80'}`}>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                           {req.description}
                        </p>
                        
                        {/* Quote List Preview */}
                        {req.quotes.length > 0 ? (
                           <div className="space-y-3">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Received Quotes ({req.quotes.length})</h4>
                              {req.quotes.map(quote => (
                                 <div key={quote.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-dubai-gold/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-dubai-gold text-white flex items-center justify-center font-bold text-xs">
                                          {quote.providerName.charAt(0)}
                                       </div>
                                       <div>
                                          <p 
                                            className="font-bold text-sm text-gray-900 cursor-pointer hover:underline"
                                            onClick={() => onViewProvider && onViewProvider(quote.providerId)}
                                          >
                                            {quote.providerName}
                                          </p>
                                          <p className="text-xs text-gray-500">{quote.timeline}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="font-bold text-gray-900">{quote.currency} {quote.price.toLocaleString()}</p>
                                       
                                       <div className="flex gap-2 mt-1 justify-end">
                                          <button onClick={() => onViewQuote && onViewQuote(quote)} className="text-xs text-gray-500 hover:text-gray-700 underline">Details</button>
                                          
                                          {!isRequestClosed && quote.status === 'pending' && (
                                             <button 
                                                onClick={() => onAcceptQuote && onAcceptQuote(req.id, quote.id)}
                                                className="text-xs bg-dubai-gold text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors font-bold"
                                             >
                                                Accept
                                             </button>
                                          )}
                                          
                                          {(quote.status === 'accepted' || quote.status === 'pending') && (
                                             <button 
                                                onClick={() => onChatWithProvider && onChatWithProvider(quote.providerId, quote.providerName)}
                                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                                             >
                                                Chat
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="flex items-center gap-2 text-sm text-gray-400 italic mt-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Awaiting quotes from providers...
                           </div>
                        )}
                        
                        {/* Footer Actions */}
                        {isExpanded && (
                           <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                              <button 
                                 onClick={() => onDeleteRequest && onDeleteRequest(req.id)}
                                 className="text-red-500 text-xs hover:text-red-700 font-medium flex items-center gap-1"
                              >
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 Delete Request
                              </button>
                           </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
             <div className="text-center py-12 text-gray-400">No requests match filters.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
