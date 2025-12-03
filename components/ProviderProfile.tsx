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
    // Simulate delay
    setTimeout(() => {
      onSubmitReview(provider.id, {
        author: 'Current User', // Mocked user
        rating: newReviewRating,
        content: newReviewContent
      });
      setNewReviewContent('');
      setNewReviewRating(5);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-gray-600 hover:text-dubai-blue transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-dubai-dark to-gray-800 p-8 text-white relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{provider.name}</h1>
                {provider.isVerified && (
                  <span className="bg-blue-500/20 text-blue-100 border border-blue-400/30 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-lg mb-4">{provider.tagline}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {provider.location}
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <span className="font-bold text-white">{provider.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({provider.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onRequestQuote}
                className="bg-dubai-gold hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg"
              >
                Request Quote
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-2.5 rounded-lg font-medium transition-colors backdrop-blur-sm">
                Message
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">About Provider</h3>
              <p className="text-gray-600 leading-relaxed">{provider.description}</p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Services Offered</h3>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((service, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-default">
                    {service}
                  </span>
                ))}
              </div>
            </section>

            <section>
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-gray-900">Reviews & Ratings</h3>
                 <div className="flex items-center gap-2">
                   <div className="flex text-yellow-400 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < Math.round(provider.rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                   </div>
                   <span className="font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
                   <span className="text-gray-500">/ 5.0</span>
                 </div>
               </div>

               {/* Reviews List */}
               <div className="space-y-6 mb-8">
                 {provider.reviews.length > 0 ? (
                   provider.reviews.map((review) => (
                     <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                             {review.author.charAt(0)}
                           </div>
                           <span className="font-semibold text-gray-900 text-sm">{review.author}</span>
                         </div>
                         <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                       </div>
                       <div className="flex text-yellow-400 text-xs mb-2 pl-10">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                       </div>
                       <p className="text-gray-600 text-sm pl-10">{review.content}</p>
                     </div>
                   ))
                 ) : (
                   <p className="text-gray-500 italic">No reviews yet.</p>
                 )}
               </div>

               {/* Write Review Form */}
               <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                 <h4 className="font-bold text-gray-900 mb-4">Write a Review</h4>
                 <form onSubmit={handleSubmit}>
                   <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
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
                     <label className="block text-sm font-medium text-gray-700 mb-1">Your Experience</label>
                     <textarea
                       rows={3}
                       required
                       value={newReviewContent}
                       onChange={(e) => setNewReviewContent(e.target.value)}
                       placeholder="Share details about the service quality..."
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none text-sm"
                     />
                   </div>
                   <button
                     type="submit"
                     disabled={isSubmitting}
                     className="px-5 py-2 bg-dubai-dark text-white rounded-lg hover:bg-black transition-colors text-sm font-medium flex items-center"
                   >
                     {isSubmitting ? 'Submitting...' : 'Submit Review'}
                   </button>
                 </form>
               </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4">Credentials</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Trade License Verified</p>
                    <p className="text-xs">DED License #123456</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                   <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">10+ Years Experience</p>
                    <p className="text-xs">Business Setup Specialist</p>
                  </div>
                </li>
              </ul>
            </div>

             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4">Badges</h4>
              <div className="flex flex-wrap gap-2">
                {provider.badges.map((badge, idx) => (
                   <span key={idx} className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-md text-xs font-semibold">
                     {badge}
                   </span>
                ))}
              </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;