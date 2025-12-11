
import React, { useState, useMemo } from 'react';
import { ServiceRequest, ProviderProfile } from '../types';
import { api } from '../services/api';

interface ProviderLeadsPageProps {
  requests: ServiceRequest[]; // These are the LEADS matched to the provider
  allRequests?: ServiceRequest[]; // These are ALL requests (needed to find myQuotes)
  currentProviderId: string;
  currentProvider?: ProviderProfile;
  onSubmitQuote: (requestId: string) => void;
  onIgnoreRequest?: (requestId: string) => void;
}

const ProviderLeadsPage: React.FC<ProviderLeadsPageProps> = ({ requests, allRequests = [], currentProviderId, currentProvider, onSubmitQuote, onIgnoreRequest }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'quotes'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Logic to separate data
  const { leads, myQuotes } = useMemo(() => {
    // 1. My Quotes: Found in ALL requests where I have a quote
    const quotesList = allRequests.filter(req => 
       req.quotes.some(q => q.providerId === currentProviderId)
    );

    // 2. Leads: "requests" prop passed to this component is ALREADY pre-filtered by the API/App
    // We just need to filter out ones we've already quoted
    const leadsList = requests.filter(req => 
       !req.quotes.some(q => q.providerId === currentProviderId)
    );

    return { leads: leadsList, myQuotes: quotesList };
  }, [requests, allRequests, currentProviderId]);

  // Filtering Logic
  const filterData = (data: ServiceRequest[]) => {
    return data.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.locality && item.locality.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const displayedLeads = filterData(leads);
  const displayedQuotes = filterData(myQuotes);

  const categories = ['All', ...Array.from(new Set(allRequests.map(r => r.category)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Quotes Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track new opportunities and manage your submitted proposals.</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none text-sm"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none text-sm bg-white"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'leads' ? 'border-dubai-gold text-dubai-gold' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Opportunity Market
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'leads' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
            {leads.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'quotes' ? 'border-dubai-gold text-dubai-gold' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Proposals
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'quotes' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
            {myQuotes.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {activeTab === 'leads' && (
          <>
            {displayedLeads.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                 <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">No new leads found</h3>
                 <p className="text-sm text-gray-500">
                   {currentProvider 
                     ? "Try adjusting your filters or update your service categories/location." 
                     : "Please ensure your provider profile is fully set up."}
                 </p>
               </div>
            ) : (
              displayedLeads.map(req => (
                <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{req.category}</span>
                            <span className="text-xs text-gray-400">• Posted {new Date(req.createdAt).toLocaleDateString()}</span>
                         </div>
                         <h3 className="text-lg font-bold text-gray-900 mb-2">{req.title}</h3>
                         <p className="text-gray-600 text-sm mb-4 line-clamp-2">{req.description}</p>
                         {req.locality && (
                           <div className="flex items-center text-xs text-gray-500">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {req.locality}
                           </div>
                         )}
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                         <button 
                           onClick={() => onSubmitQuote(req.id)}
                           className="w-full py-2 bg-dubai-gold hover:bg-yellow-600 text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
                         >
                           Quote Now
                         </button>
                         {onIgnoreRequest && (
                           <button 
                             onClick={() => onIgnoreRequest(req.id)}
                             className="w-full py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium text-sm rounded-lg transition-colors"
                           >
                             Ignore
                           </button>
                         )}
                      </div>
                   </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'quotes' && (
          <>
            {displayedQuotes.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                 <h3 className="text-lg font-bold text-gray-900">No proposals submitted</h3>
                 <p className="text-sm text-gray-500">Head to the Opportunity Market to start quoting.</p>
               </div>
            ) : (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                       <tr>
                          <th className="px-6 py-4 font-medium">Service Request</th>
                          <th className="px-6 py-4 font-medium">Your Quote</th>
                          <th className="px-6 py-4 font-medium">Timeline</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {displayedQuotes.map(req => {
                          const myQuote = req.quotes.find(q => q.providerId === currentProviderId);
                          const isExpanded = expandedRequestId === req.id;
                          return (
                             <React.Fragment key={req.id}>
                               <tr className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                     <div className="font-bold text-gray-900">{req.title}</div>
                                     <div className="text-xs text-gray-500 mt-1">{new Date(req.createdAt).toLocaleDateString()}</div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-dubai-dark">
                                     AED {myQuote?.price.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-gray-600">
                                     {myQuote?.timeline}
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                        myQuote?.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                        myQuote?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-50 text-yellow-700'
                                     }`}>
                                        {myQuote?.status}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <button 
                                        onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                                        className="text-dubai-gold hover:text-yellow-600 font-bold text-xs border border-dubai-gold/30 hover:border-dubai-gold px-3 py-1.5 rounded transition-all bg-white"
                                     >
                                        {isExpanded ? 'Hide' : 'View'}
                                     </button>
                                  </td>
                               </tr>
                               {isExpanded && (
                                   <tr className="bg-gray-50 animate-in fade-in">
                                       <td colSpan={5} className="px-6 py-4">
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                               <div>
                                                   <h4 className="font-bold text-gray-900 mb-2">Request Details</h4>
                                                   <p className="text-gray-600 mb-1"><span className="font-medium text-gray-700">Category:</span> {req.category}</p>
                                                   <p className="text-gray-600 mb-1"><span className="font-medium text-gray-700">Location:</span> {req.locality || 'N/A'}</p>
                                                   <p className="text-gray-600 mt-2 bg-white p-3 rounded border border-gray-100">{req.description}</p>
                                               </div>
                                               <div>
                                                   <h4 className="font-bold text-gray-900 mb-2">Your Proposal</h4>
                                                   <p className="text-gray-600 mt-2 bg-white p-3 rounded border border-gray-100">{myQuote?.description}</p>
                                               </div>
                                           </div>
                                       </td>
                                   </tr>
                               )}
                             </React.Fragment>
                          );
                       })}
                    </tbody>
                 </table>
               </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default ProviderLeadsPage;
