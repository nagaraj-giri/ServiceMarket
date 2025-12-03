
import React, { useState } from 'react';
import { ProviderProfile as IProviderProfile, Review } from '../types';

interface ProviderProfileProps {
  provider: IProviderProfile;
  onBack: () => void;
  onSubmitReview: (providerId: string, review: Omit<Review, 'id' | 'date'>) => void;
  onRequestQuote: () => void;
}

const ProviderProfile: React.FC<ProviderProfileProps> = ({ provider, onBack, onSubmitReview, onRequestQuote }) => {
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewContent.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitReview(provider.id, {
        author: 'Current User',
        rating: newReviewRating,
        content: newReviewContent
      });
      setNewReviewContent('');
      setNewReviewRating(5);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="mb-4 flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Dashboard
      </button>

      {/* Main Header Card */}
      <div className="bg-dubai-dark rounded-3xl overflow-hidden shadow-xl text-white mb-6 relative">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="p-6 relative z-10">
            {/* Header: Name & Verified */}
            <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold leading-tight pr-4">{provider.name}</h1>
                {provider.isVerified && (
                  <div className="bg-blue-500/20 text-blue-100 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-blue-500/30 backdrop-blur-sm whitespace-nowrap flex-shrink-0">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </div>
                )}
            </div>
            
            <p className="text-gray-400 text-sm mb-5 font-medium">{provider.tagline}</p>
            
            {/* Location & Rating */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 mb-6">
                <div className="flex items-center gap-1.5">
                   <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   {provider.location}
                </div>
                <div className="flex items-center gap-1.5">
                   <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                   <span className="font-bold text-white">{provider.rating.toFixed(1)}</span>
                   <span className="text-gray-400">({provider.reviewCount} reviews)</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
               <button 
                  onClick={onRequestQuote}
                  className="flex-1 bg-dubai-gold hover:bg-yellow-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center"
               >
                  Request Quote
               </button>
               <button 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm border border-white/10 backdrop-blur-md transition-colors active:bg-white/30 flex items-center justify-center"
               >
                  Message
               </button>
            </div>
          </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
          {/* About */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
             <h3 className="text-lg font-bold text-gray-900 mb-3">About Provider</h3>
             <p className="text-gray-600 text-sm leading-relaxed">{provider.description}</p>
          </section>

          {/* Services */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
             <h3 className="text-lg font-bold text-gray-900 mb-3">Services</h3>
             <div className="flex flex-wrap gap-2">
                {provider.services.map((service, index) => (
                  <span key={index} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                    {service}
                  </span>
                ))}
              </div>
          </section>

          {/* Credentials/Badges */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Credentials & Badges</h3>
             <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {provider.badges.map((badge, idx) => (
                   <div key={idx} className="flex-shrink-0 px-3 py-2 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded-lg text-xs font-bold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      {badge}
                   </div>
                ))}
             </div>
          </section>

          {/* Reviews */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Reviews ({provider.reviewCount})</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                      <span className="font-bold text-sm">{provider.rating.toFixed(1)}</span>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
              </div>
              
              <div className="space-y-4">
                 {provider.reviews.slice(0, 3).map((review) => (
                     <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                         <div className="flex items-center justify-between mb-1">
                             <span className="font-bold text-gray-900 text-sm">{review.author}</span>
                             <span className="text-[10px] text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                         </div>
                         <div className="flex text-yellow-400 mb-1">
                             {[...Array(5)].map((_, i) => (
                                 <svg key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             ))}
                         </div>
                         <p className="text-gray-600 text-xs">{review.content}</p>
                     </div>
                 ))}
                 <button className="w-full py-2 text-center text-xs text-dubai-gold font-bold hover:bg-gray-50 rounded-lg transition-colors">
                     View all {provider.reviewCount} reviews
                 </button>
              </div>
          </section>

          {/* Write Review Form */}
          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
             <h4 className="font-bold text-gray-900 mb-4 text-sm">Write a Review</h4>
             <form onSubmit={handleSubmit}>
               <div className="mb-4">
                 <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                 <div className="flex gap-2">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <button
                       key={star}
                       type="button"
                       onClick={() => setNewReviewRating(star)}
                       className="focus:outline-none transition-transform hover:scale-110"
                     >
                       <svg className={`w-6 h-6 ${star <= newReviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                     </button>
                   ))}
                 </div>
               </div>
               <div className="mb-4">
                 <label className="block text-xs font-medium text-gray-700 mb-1">Your Experience</label>
                 <textarea
                   rows={3}
                   required
                   value={newReviewContent}
                   onChange={(e) => setNewReviewContent(e.target.value)}
                   placeholder="Share details about the service..."
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none text-sm"
                 />
               </div>
               <button
                 type="submit"
                 disabled={isSubmitting}
                 className="w-full px-5 py-3 bg-dubai-dark text-white rounded-xl hover:bg-black transition-colors text-sm font-medium flex items-center justify-center"
               >
                 {isSubmitting ? 'Submitting...' : 'Submit Review'}
               </button>
             </form>
          </section>
      </div>
    </div>
  );
};

export default ProviderProfile;
