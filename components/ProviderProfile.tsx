import React, { useState } from 'react';
import { ProviderProfile, User, UserRole, Review } from '../types';
import { ToastType } from './Toast';

interface ProviderProfileViewProps {
  provider: ProviderProfile;
  currentUser: User | null;
  onBack: () => void;
  onSubmitReview: (providerId: string, review: Omit<Review, 'id' | 'date'>) => Promise<void>;
  onRequestQuote: () => void;
  showToast: (message: string, type: ToastType) => void;
}

const ProviderProfileView: React.FC<ProviderProfileViewProps> = ({ 
  provider, 
  currentUser, 
  onBack, 
  onSubmitReview, 
  onRequestQuote,
  showToast 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const rating = provider.rating || 0;
  const reviewCount = provider.reviewCount || 0;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }
    if (!reviewContent.trim()) {
      showToast('Please write a review', 'error');
      return;
    }
    if (!currentUser) {
       showToast('Please login to leave a review', 'error');
       return;
    }

    setIsSubmittingReview(true);
    try {
      await onSubmitReview(provider.id, {
        author: currentUser.name,
        rating: reviewRating,
        content: reviewContent
      });
      setReviewRating(0);
      setReviewContent('');
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-gray-500 hover:text-dubai-gold transition-colors font-medium text-sm"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Dashboard
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-gray-200 relative">
          {provider.coverImage ? (
             <img src={provider.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-gradient-to-r from-dubai-dark to-gray-800 flex items-center justify-center">
                <span className="text-white/20 text-4xl font-bold uppercase tracking-widest">No Cover Image</span>
             </div>
          )}
          {provider.isVerified && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-dubai-dark px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
               <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
               Verified Business
            </div>
          )}
        </div>

        <div className="px-6 md:px-8 pb-6 relative">
             <div className="flex flex-col md:flex-row items-end md:items-start -mt-12 md:-mt-16 mb-4">
                 {/* Profile Avatar */}
                 <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-white shadow-lg bg-white overflow-hidden flex items-center justify-center z-10">
                        {provider.profileImage ? (
                           <img src={provider.profileImage} alt={provider.name} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-3xl font-bold text-gray-300">{provider.name.charAt(0)}</span>
                        )}
                    </div>
                 </div>

                 {/* Basic Info */}
                 <div className="flex-1 text-center md:text-left mt-4 md:mt-16 md:ml-6 md:mb-2 w-full">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{provider.name}</h1>
                        <p className="text-gray-500 font-medium text-sm md:text-base">{provider.tagline || 'Service Provider in Dubai'}</p>
                        
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="font-bold text-gray-900">{reviewCount}</span> Reviews
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="font-bold text-gray-900">{rating.toFixed(1)}</span> Rating
                            </span>
                            {provider.location && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {provider.location}
                                </span>
                            )}
                        </div>

                        {/* Badges Display */}
                        {provider.badges && provider.badges.length > 0 && (
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3 animate-in fade-in slide-in-from-bottom-1">
                                {provider.badges.map((badge, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm tracking-wide uppercase">
                                        <svg className="w-3 h-3 mr-1 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        )}
                 </div>

                 {/* Request Button */}
                 <div className="mt-6 md:mt-16 w-full md:w-auto">
                    {currentUser?.role !== UserRole.PROVIDER && (
                      <button 
                         onClick={onRequestQuote}
                         className="w-full md:w-auto px-8 py-3 bg-dubai-gold text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-all transform hover:-translate-y-1"
                      >
                         Request Quote
                      </button>
                    )}
                 </div>
             </div>
        </div>

        {/* Tabs */}
        <div className="px-6 md:px-8 border-t border-gray-100 flex gap-6">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-dubai-gold text-dubai-gold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab('reviews')}
             className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-dubai-gold text-dubai-gold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
           >
             Reviews ({reviewCount})
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Content */}
         <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <>
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                   <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                   <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {provider.description || "No description provided."}
                   </p>
                </div>
                
                {/* Services Tags */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                   <h2 className="text-xl font-bold text-gray-900 mb-4">Services Offered</h2>
                   <div className="flex flex-wrap gap-2">
                      {provider.services && provider.services.length > 0 ? provider.services.map((service, i) => (
                         <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {service}
                         </span>
                      )) : (
                         <span className="text-gray-400 italic">No specific services listed.</span>
                      )}
                   </div>
                </div>

                {/* Gallery */}
                {provider.gallery && provider.gallery.length > 0 && (
                   <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Gallery</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {provider.gallery.map((img, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                               <img src={img} alt={`Portfolio ${i}`} className="w-full h-full object-cover" />
                            </div>
                         ))}
                      </div>
                   </div>
                )}
              </>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in">
                 {/* Review Input */}
                 {currentUser && currentUser.role === UserRole.USER && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-gray-900 mb-3">Write a Review</h3>
                       <form onSubmit={handleSubmitReview}>
                          <div className="flex items-center gap-1 mb-3">
                             {[1,2,3,4,5].map(star => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className={`text-2xl transition-colors ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                                >
                                  ★
                                </button>
                             ))}
                             <span className="text-xs text-gray-400 ml-2">{reviewRating > 0 ? 'Thanks!' : 'Rate this provider'}</span>
                          </div>
                          <textarea 
                             value={reviewContent}
                             onChange={e => setReviewContent(e.target.value)}
                             placeholder="Share your experience..."
                             className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none text-sm min-h-[100px]"
                          />
                          <div className="flex justify-end mt-3">
                             <button 
                               type="submit"
                               disabled={isSubmittingReview}
                               className="px-4 py-2 bg-dubai-dark text-white text-sm font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                             >
                                {isSubmittingReview ? 'Posting...' : 'Post Review'}
                             </button>
                          </div>
                       </form>
                    </div>
                 )}

                 {/* Reviews List */}
                 {provider.reviews && provider.reviews.length > 0 ? (
                    provider.reviews.map(review => (
                       <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <h4 className="font-bold text-gray-900 text-sm">{review.author}</h4>
                                <div className="flex items-center text-yellow-400 text-xs mt-0.5">
                                   {[...Array(5)].map((_, i) => (
                                      <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                                   ))}
                                </div>
                             </div>
                             <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-600 text-sm">{review.content}</p>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
                       No reviews yet. Be the first to review!
                    </div>
                 )}
              </div>
            )}
         </div>

         {/* Sidebar info */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Contact Information</h3>
               <div className="space-y-4 text-sm">
                  {provider.email && (
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-gray-500 text-xs">Email</p>
                           <p className="font-medium truncate" title={provider.email}>{provider.email}</p>
                        </div>
                     </div>
                  )}
                  {provider.phone && (
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                           <p className="text-gray-500 text-xs">Phone</p>
                           <p className="font-medium">{provider.phone}</p>
                        </div>
                     </div>
                  )}
                  {provider.website && (
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-gray-500 text-xs">Website</p>
                           <a href={provider.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline truncate block">
                             {provider.website.replace(/^https?:\/\//, '')}
                           </a>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Map (Placeholder) */}
            {provider.location && (
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Location</h3>
                  <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center relative group cursor-pointer" title="View on map">
                     <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=Dubai&zoom=10&size=400x200&sensor=false&key=YOUR_KEY_HERE')"}}></div>
                     <span className="relative z-10 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        {provider.location}
                     </span>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ProviderProfileView;