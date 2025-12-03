
import React from 'react';
import { UserRole, ServiceRequest, Quote, Conversation } from '../types';

interface DashboardProps {
  role: UserRole;
  requests: ServiceRequest[];
  conversations?: Conversation[];
  currentProviderId?: string;
  onViewProvider?: (providerId: string) => void;
  onAcceptQuote?: (requestId: string, quoteId: string) => void;
  onChatWithProvider?: (providerId: string, providerName: string) => void;
  onChatWithUser?: (userId: string, userName: string) => void;
  onSubmitQuote?: (requestId: string) => void;
  onIgnoreRequest?: (requestId: string) => void;
  onViewQuote?: (quote: Quote) => void;
  onDeleteRequest?: (requestId: string) => void;
  onViewTrash?: () => void;
  deletedCount?: number;
}

const RequestStatusStepper = ({ status }: { status: ServiceRequest['status'] }) => {
  const steps = [
    { id: 'open', label: 'Request Open' },
    { id: 'quoted', label: 'Quotes Received' },
    { id: 'accepted', label: 'Quote Accepted' },
    { id: 'closed', label: 'Closed' }
  ];

  const currentStepIndex = Math.max(0, steps.findIndex(s => s.id === status));

  return (
    <div className="px-8 py-6 border-b border-gray-50">
      <div className="relative flex items-center justify-between">
         {/* Background gray line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-10"></div>
        
        {/* Active colored line */}
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-dubai-gold rounded-full -z-10 transition-all duration-500 ease-out"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.id} className="relative flex flex-col items-center group">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10
                  ${isCompleted 
                    ? 'bg-dubai-gold border-dubai-gold text-white' 
                    : isCurrent 
                      ? 'bg-white border-dubai-gold text-dubai-gold ring-4 ring-yellow-50 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-300'}
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <span className={`absolute top-10 w-32 text-center text-xs font-medium transition-colors duration-300
                ${isCurrent ? 'text-dubai-dark font-bold' : isCompleted ? 'text-dubai-dark' : 'text-gray-400'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-6"></div> {/* Spacer for the absolute positioned text labels */}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ role, requests, conversations = [], currentProviderId, onViewProvider, onAcceptQuote, onChatWithProvider, onChatWithUser, onSubmitQuote, onIgnoreRequest, onViewQuote, onDeleteRequest, onViewTrash, deletedCount = 0 }) => {
  if (role === UserRole.PROVIDER) {
    // Separate requests into "New Opportunities" (Leads) and "My Quotes"
    const newLeads = requests.filter(r => 
      r.status !== 'closed' && 
      r.status !== 'accepted' && 
      !r.quotes.some(q => q.providerId === currentProviderId)
    );

    const myQuotes = requests.filter(r => 
      r.quotes.some(q => q.providerId === currentProviderId)
    );

    // Calculate real-time stats
    const activeLeadsCount = newLeads.length;
    // const pendingQuotesCount = myQuotes.filter(r => r.status === 'quoted').length;
    
    // Calculate revenue: Sum of prices of accepted/closed quotes for this provider
    const revenue = myQuotes.reduce((total, req) => {
      const myQuote = req.quotes.find(q => q.providerId === currentProviderId);
      if (myQuote && (myQuote.status === 'accepted')) {
        return total + myQuote.price;
      }
      return total;
    }, 0);

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Provider Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Active Leads</h3>
            <p className="text-3xl font-bold text-dubai-blue mt-2">{activeLeadsCount}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Submitted Quotes</h3>
            <p className="text-3xl font-bold text-dubai-gold mt-2">{myQuotes.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Revenue (AED)</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Unread Messages</h3>
            <p className={`text-3xl font-bold mt-2 ${totalUnread > 0 ? 'text-green-600' : 'text-gray-900'}`}>{totalUnread}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Incoming Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">New Service Requests</h2>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 animate-pulse">Live</span>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {newLeads.length > 0 ? (
                newLeads.map(req => (
                  <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {req.category}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-medium text-gray-900">{req.title}</h3>
                    {req.locality && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {req.locality}
                      </div>
                    )}
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{req.description}</p>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => onSubmitQuote && onSubmitQuote(req.id)}
                        className="text-sm bg-dubai-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm"
                      >
                        Submit Quote
                      </button>
                      <button 
                        onClick={() => onIgnoreRequest && onIgnoreRequest(req.id)}
                        className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                  <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  No new leads available right now.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 h-[600px]">
            {/* Recent Messages */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-1/2">
               <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                 <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
                 <span className="text-xs text-dubai-blue font-semibold hover:underline cursor-pointer">View All</span>
               </div>
               <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                 {conversations.length > 0 ? (
                    conversations.map(conv => (
                       <div key={conv.otherUserId} onClick={() => onChatWithUser && onChatWithUser(conv.otherUserId, conv.otherUserName)} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                             {conv.otherUserName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{conv.otherUserName}</h4>
                                {conv.unreadCount > 0 ? (
                                   <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full">{conv.unreadCount} New</span>
                                ) : (
                                   <span className="text-xs text-gray-400">{new Date(conv.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                )}
                             </div>
                             <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                       <p className="text-xs">No active conversations.</p>
                    </div>
                 )}
               </div>
             </div>

            {/* My Submitted Quotes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-1/2">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">My Submitted Quotes</h2>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                {myQuotes.length > 0 ? (
                  myQuotes.map(req => {
                    const myQuote = req.quotes.find(q => q.providerId === currentProviderId);
                    return (
                      <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{req.title}</h3>
                          {myQuote?.status === 'accepted' ? (
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">Accepted</span>
                          ) : myQuote?.status === 'rejected' ? (
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">Rejected</span>
                          ) : (
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase tracking-wide">Pending</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs">
                           <span className="text-gray-500">Price: <span className="text-gray-900 font-medium">{myQuote?.currency} {myQuote?.price.toLocaleString()}</span></span>
                           <span className="text-gray-500">{myQuote?.timeline}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                     <p className="text-sm">You haven't submitted any quotes yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User Dashboard View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        {onViewTrash && (
          <button 
            onClick={onViewTrash}
            className="flex items-center gap-2 text-gray-500 hover:text-dubai-gold transition-colors px-3 py-1.5 rounded-lg hover:bg-yellow-50"
            title="View Deleted Requests"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span className="text-sm font-medium">Trash ({deletedCount})</span>
          </button>
        )}
      </div>
      
      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active requests</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new service request.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map(req => {
            const isRequestClosed = req.status === 'closed';

            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                       {req.title}
                       {req.locality && (
                          <span className="text-xs font-normal text-gray-500 flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {req.locality}
                          </span>
                       )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Posted: {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <div className="text-2xl font-bold text-dubai-blue">{req.quotes.length}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Quotes Received</div>
                     </div>
                     {(req.status === 'open' || req.status === 'quoted') && (
                       <button 
                          onClick={() => {
                             if(onDeleteRequest && window.confirm('Are you sure you want to delete this request?')) {
                                onDeleteRequest(req.id);
                             }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Request"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                     )}
                  </div>
                </div>
                
                {/* Progress Stepper */}
                <RequestStatusStepper status={req.status} />

                <div className="p-6 pt-2">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Compare Quotes</h4>
                  {req.quotes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (AED)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {req.quotes.map(quote => (
                            <tr key={quote.id} className={isRequestClosed && quote.status !== 'accepted' ? 'opacity-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <button 
                                    onClick={() => onViewProvider && onViewProvider(quote.providerId)}
                                    className="text-left group hover:opacity-80 transition-opacity"
                                  >
                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1 group-hover:text-dubai-blue">
                                      {quote.providerName}
                                      {quote.verified && <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                                    </div>
                                    <div className="text-xs text-gray-400">View Profile</div>
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                {quote.price.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {quote.timeline}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-4 h-4 ${i < quote.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {quote.status === 'accepted' ? (
                                  req.status === 'accepted' ? (
                                    <button 
                                      onClick={() => onAcceptQuote && onAcceptQuote(req.id, quote.id)}
                                      className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-dubai-gold text-white hover:bg-yellow-600 transition-colors shadow-sm"
                                    >
                                      Pay Now
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                      Paid & Closed
                                    </span>
                                  )
                                ) : isRequestClosed ? (
                                  <span className="text-gray-400 italic text-xs">Closed</span>
                                ) : (
                                  req.status === 'accepted' ? (
                                    <span className="text-gray-300 italic text-xs">Not Selected</span>
                                  ) : (
                                    <div className="flex gap-2 items-center">
                                      <button
                                        onClick={() => onViewQuote && onViewQuote(quote)}
                                        className="text-gray-500 hover:text-gray-900 transition-colors"
                                      >
                                        View
                                      </button>
                                      <button 
                                        onClick={() => onChatWithProvider && onChatWithProvider(quote.providerId, quote.providerName)}
                                        className="text-dubai-blue hover:text-blue-900 transition-colors"
                                      >
                                        Chat
                                      </button>
                                      <button 
                                        onClick={() => onAcceptQuote && onAcceptQuote(req.id, quote.id)}
                                        className="text-dubai-gold hover:text-yellow-700 font-bold transition-colors"
                                      >
                                        Accept
                                      </button>
                                    </div>
                                  )
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Waiting for providers to submit quotes...</p>
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
