import React, { useState, useRef, useEffect } from 'react';
import { ServiceCategory, ServiceRequest } from '../types';

interface RequestFormProps {
  onSubmit: (request: Omit<ServiceRequest, 'id' | 'quotes' | 'status' | 'createdAt'>) => void;
  onCancel: () => void;
}

// Comprehensive list of Dubai areas to simulate Maps Autocomplete
const DUBAI_LOCALITIES = [
  "Downtown Dubai", "Business Bay", "Dubai Marina", "Jumeirah Lake Towers (JLT)",
  "Palm Jumeirah", "Deira", "Bur Dubai", "Al Barsha", "Dubai Silicon Oasis",
  "Jumeirah Village Circle (JVC)", "Mirdif", "International City", "Dubai Hills Estate",
  "Arabian Ranches", "Motor City", "Dubai Sports City", "Discovery Gardens",
  "Jumeirah Beach Residence (JBR)", "Sheikh Zayed Road", "Al Quoz", "Al Nahda",
  "Al Qusais", "Garhoud", "Dubai Festival City", "Jumeirah 1", "Jumeirah 2", "Jumeirah 3",
  "Umm Suqeim", "Al Satwa", "Al Karama", "DIFC (Dubai International Financial Centre)", 
  "City Walk", "Bluewaters Island", "Dubai Creek Harbour", "Meydan City", 
  "Al Furjan", "Remraam", "Damac Hills", "Town Square", "The Springs",
  "The Meadows", "Emirates Hills", "Jumeirah Islands", "Dubai Production City (IMPZ)",
  "Dubai Studio City", "Knowledge Park", "Dubai Internet City", "Dubai Media City"
];

const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, onCancel }) => {
  const [category, setCategory] = useState<ServiceCategory>(ServiceCategory.VISA);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autocomplete state
  const [filteredLocalities, setFilteredLocalities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  const handleLocalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    setLocality(userInput);
    
    const filtered = DUBAI_LOCALITIES.filter(
      (loc) => loc.toLowerCase().includes(userInput.toLowerCase())
    );
    setFilteredLocalities(filtered);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        <div className="bg-dubai-dark p-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Create Service Request</h2>
          <p className="text-gray-400 text-sm mt-1">Get quotes from verified providers.</p>
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
                     setFilteredLocalities(DUBAI_LOCALITIES.filter(l => l.toLowerCase().includes(locality.toLowerCase())));
                     setShowSuggestions(true);
                  }}
                  placeholder="Search area (e.g. Business Bay)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none bg-white text-gray-700 placeholder-gray-400"
                  autoComplete="off"
                />
              </div>
              
              {showSuggestions && filteredLocalities.length > 0 && (
                <ul className="absolute z-10 w-full bg-white shadow-xl max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm mt-1 border border-gray-100">
                  {filteredLocalities.map((loc) => (
                    <li
                      key={loc}
                      onClick={() => handleSuggestionClick(loc)}
                      className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-gray-50 text-gray-900 border-b border-gray-50 last:border-0 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="block truncate">{loc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Start typing to see suggestions from our database.</p>
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
              Your request will be sent to up to 5 verified providers. You'll receive quotes within 24 hours.
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