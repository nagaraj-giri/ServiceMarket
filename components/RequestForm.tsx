import React, { useState, useRef, useEffect } from 'react';
import { ServiceCategory, ServiceRequest } from '../types';
import { DUBAI_LOCALITIES } from '../constants';
import { getPlaceSuggestions } from '../services/geminiService';

interface RequestFormProps {
  onSubmit: (request: Omit<ServiceRequest, 'id' | 'quotes' | 'status' | 'createdAt'>) => void;
  onCancel: () => void;
  initialCategory?: ServiceCategory;
}

const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, onCancel, initialCategory }) => {
  const [category, setCategory] = useState<ServiceCategory>(initialCategory || ServiceCategory.VISA);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autocomplete state
  const [filteredLocalities, setFilteredLocalities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Debounced search for dynamic suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (locality.length >= 3) {
        setIsLoadingSuggestions(true);
        // Fallback to static filter first for immediate feedback
        const staticMatches = DUBAI_LOCALITIES.filter(l => l.toLowerCase().includes(locality.toLowerCase()));
        setFilteredLocalities(staticMatches);
        
        // Then fetch AI suggestions
        try {
          const aiSuggestions = await getPlaceSuggestions(locality);
          if (aiSuggestions.length > 0) {
            // Merge and deduplicate
            const combined = Array.from(new Set([...aiSuggestions, ...staticMatches]));
            setFilteredLocalities(combined.slice(0, 8));
          }
        } catch (err) {
          // Keep static matches if AI fails
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setFilteredLocalities(DUBAI_LOCALITIES.filter(l => l.toLowerCase().includes(locality.toLowerCase())));
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 600);
    return () => clearTimeout(debounceTimer);
  }, [locality]);

  const handleLocalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocality(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocality(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      onSubmit({
        userId: 'current-user', // Mocked
        category,
        title,
        description,
        locality
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[80] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        {/* Header with Close Button */}
        <div className="bg-dubai-dark p-6 flex-shrink-0 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Service Request</h2>
            <p className="text-gray-400 text-sm mt-1">Get quotes from verified providers.</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(ServiceCategory).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 text-sm rounded-lg border text-center transition-all ${
                    category === cat
                      ? 'bg-dubai-gold text-white border-dubai-gold shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-dubai-gold'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 2-Year Freelance Visa Assistance"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locality / Area</label>
            <div className="relative" ref={wrapperRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={handleLocalityChange}
                  onFocus={() => {
                     // Initial suggestions from static list
                     setFilteredLocalities(DUBAI_LOCALITIES.filter(l => l.toLowerCase().includes(locality.toLowerCase())).slice(0, 8));
                     setShowSuggestions(true);
                  }}
                  placeholder="Search area (e.g. Business Bay)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none bg-white text-gray-700 placeholder-gray-400"
                  autoComplete="off"
                />
                {isLoadingSuggestions && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="animate-spin h-4 w-4 text-dubai-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {showSuggestions && filteredLocalities.length > 0 && (
                <ul className="absolute z-10 w-full bg-white shadow-xl max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm mt-1 border border-gray-100">
                  {filteredLocalities.map((loc, idx) => (
                    <li
                      key={`${loc}-${idx}`}
                      onClick={() => handleSuggestionClick(loc)}
                      className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-gray-50 text-gray-900 border-b border-gray-50 last:border-0 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="block truncate">{loc}</span>
                    </li>
                  ))}
                  <li className="py-2 px-3 text-xs text-center text-gray-400 bg-gray-50/50">
                    Suggestions powered by Google Maps
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Requirements</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need. E.g., I need a visa for myself and my spouse. We are currently in Dubai on a tourist visa..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs text-blue-800">
              Your query will be shared to our experts. You will receive quotes shortly.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-dubai-gold hover:bg-yellow-600 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center"
            >
              {isSubmitting && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;