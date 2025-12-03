
import React from 'react';
import { ServiceRequest } from '../types';

interface TrashPageProps {
  deletedRequests: ServiceRequest[];
  onRestore: (requestId: string) => void;
  onPermanentDelete: (requestId: string) => void;
  onBack: () => void;
}

const TrashPage: React.FC<TrashPageProps> = ({ deletedRequests, onRestore, onPermanentDelete, onBack }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Trash Bin</h1>
        </div>
        <div className="text-sm text-gray-500">
           {deletedRequests.length} {deletedRequests.length === 1 ? 'item' : 'items'} in trash
        </div>
      </div>

      {deletedRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Trash is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Deleted requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deletedRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center hover:bg-red-50/10 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   {req.title}
                   <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-normal">
                     {new Date(req.createdAt).toLocaleDateString()}
                   </span>
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-xl">{req.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                   <span>{req.quotes.length} Quotes</span>
                   <span>•</span>
                   <span className="capitalize">{req.status}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onRestore(req.id)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Restore
                </button>
                <button
                  onClick={() => {
                     if(window.confirm('Delete this request permanently? This cannot be undone.')) {
                        onPermanentDelete(req.id);
                     }
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashPage;
