
import React, { useState } from 'react';
import { UserRole, ServiceRequest, Quote, Conversation, ProviderProfile } from '../types';

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

const Dashboard: React.FC<DashboardProps> = ({ role, requests, conversations = [], currentProvider, currentProviderId, onViewProvider, onAcceptQuote, onChatWithProvider, onChatWithUser, onSubmitQuote, onIgnoreRequest, onViewQuote, onDeleteRequest }) => {
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<string>>(new Set());
  const activeProviderId = currentProvider?.id || currentProviderId;

  const toggleExpand = (requestId: string) => {
    const newSet = new Set(expandedRequestIds);
    if (newSet.has(requestId)) {
      newSet.delete(requestId);
    } else {
      newSet.add(requestId);
    }
    setExpandedRequestIds(newSet);
  };

  // ----------------------------------------------------------------------
  // PROVIDER DASHBOARD
  // ----------------------------------------------------------------------
  if (role === UserRole.PROVIDER && activeProviderId) {
    const newLeads = requests.filter(r => {
      const isAvailable = r.status !== 'closed' && r.status !== 'accepted' && !r.quotes.some(q => q.providerId === activeProviderId);
      if (!isAvailable) return false;
      if (currentProvider && r.locality && currentProvider.location) {
        const reqLoc = r.locality.toLowerCase().trim();
        const provLoc = currentProvider.location.toLowerCase().trim();
        return provLoc.includes(reqLoc) || reqLoc.includes(provLoc);
      }
      if (r.locality && currentProvider?.location) return false; 
      return true;
    });

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
                <div className="text-center py-12 text-gray-400 text-sm">No new leads matching your profile.</div>
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
                 {conversations.length === 0 && <div className="p-8 text-center text-xs text-gray-400">No messages yet.</div>}
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
                  {myQuotes.length === 0 && <div className="p-8 text-center text-xs text-gray-400">No quotes submitted.</div>}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // USER DASHBOARD (REDESIGNED FOR MOBILE)
  // ----------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
      </div>
      
      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
           <p className="text-gray-500">You haven't posted any requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const isExpanded = expandedRequestIds.has(req.id);
            const isRequestClosed = req.status === 'closed';

            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                <div className="p-5">
                   {/* Header Area */}
                   <div className="flex flex-col mb-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight flex-1 mr-2">
                            {req.title}
                        </h3>
                        {/* Status Pill on Top Right */}
                         <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap ${
                             req.status === 'open' ? 'bg-blue-50 text-blue-600' :
                             req.status === 'quoted' ? 'bg-dubai-gold/10 text-dubai-gold' :
                             req.status === 'accepted' ? 'bg-green-50 text-green-600' :
                             'bg-gray-100 text-gray-500'
                         }`}>
                            {req.status}
                         </span>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                         {req.locality && (
                           <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center">
                             <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             {req.locality}
                           </span>
                         )}
                         <span className="text-[10px] text-gray-400">Posted: {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                   </div>

                   {/* Key Stats & Toggles */}
                   <div className="flex items-end justify-between border-t border-gray-50 pt-4 mt-2">
                      <div className="flex flex-col text-center sm:text-left">
                         <span className="text-3xl font-bold text-dubai-blue leading-none">{req.quotes.length}</span>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Quotes Received</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <button 
                            onClick={() => toggleExpand(req.id)}
                            className="text-sm font-medium text-gray-500 hover:text-dubai-gold transition-colors flex items-center gap-1 group"
                         >
                            {isExpanded ? 'Hide' : 'View Details'}
                            <svg className={`w-4 h-4 transform transition-transform duration-200 text-gray-400 group-hover:text-dubai-gold ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                         </button>
                         <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('Permanently delete this request?')) onDeleteRequest && onDeleteRequest(req.id);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            title="Delete"
                         >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                   </div>

                   {/* Expanded Content Area */}
                   {isExpanded && (
                      <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                         {/* Dashed Description Box (Updated Style) */}
                         <div className="border-2 border-dashed border-dubai-blue/20 bg-blue-50/20 rounded-xl p-4 mb-6 relative">
                            <h4 className="text-[10px] font-bold text-dubai-blue uppercase tracking-widest mb-2">Description</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{req.description}</p>
                         </div>

                         <div className="mb-6">
                            <RequestStatusStepper status={req.status} />
                         </div>

                         <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Compare Quotes</h4>
                            {req.quotes.length > 0 ? (
                                <div className="space-y-3">
                                   {/* Mobile Card Style for Quotes within the Request */}
                                   {req.quotes.map(quote => (
                                     <div key={quote.id} className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${isRequestClosed && quote.status !== 'accepted' ? 'opacity-60 grayscale' : ''}`}>
                                        <div className="flex justify-between items-start mb-3">
                                           <div>
                                              <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
                                                 {quote.providerName}
                                                 {quote.verified && <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                                              </div>
                                              <button onClick={() => onViewProvider && onViewProvider(quote.providerId)} className="text-[10px] text-gray-400 hover:text-dubai-blue hover:underline">View Profile</button>
                                           </div>
                                           <div className="text-right">
                                              <div className="text-lg font-bold text-gray-900">{quote.currency} {quote.price.toLocaleString()}</div>
                                              <div className="text-[10px] text-gray-500">{quote.timeline}</div>
                                           </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="flex text-yellow-400 text-xs">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3.5 h-3.5 ${i < quote.rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                {quote.status === 'accepted' ? (
                                                   req.status === 'accepted' ? 
                                                   <button onClick={() => onAcceptQuote && onAcceptQuote(req.id, quote.id)} className="bg-dubai-gold text-white text-xs font-bold px-3 py-1.5 rounded">Pay Now</button> :
                                                   <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Paid</span>
                                                ) : isRequestClosed ? (
                                                    <span className="text-gray-400 text-xs italic">Closed</span>
                                                ) : (
                                                   <>
                                                     <button onClick={() => onViewQuote && onViewQuote(quote)} className="text-gray-500 text-xs font-medium hover:text-gray-900">View</button>
                                                     <button onClick={() => onChatWithProvider && onChatWithProvider(quote.providerId, quote.providerName)} className="text-dubai-blue text-xs font-medium hover:text-blue-800">Chat</button>
                                                     <button onClick={() => onAcceptQuote && onAcceptQuote(req.id, quote.id)} className="text-dubai-gold text-xs font-bold hover:text-yellow-700">Accept</button>
                                                   </>
                                                )}
                                            </div>
                                        </div>
                                     </div>
                                   ))}
                                </div>
                            ) : (
                               <p className="text-sm text-gray-500 italic">Waiting for providers...</p>
                            )}
                         </div>
                      </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
