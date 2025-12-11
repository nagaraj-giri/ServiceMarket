
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, ServiceType } from '../types';
import { DUBAI_LOCALITIES } from '../constants';
import { getPlaceSuggestions } from '../services/geminiService';
import { api } from '../services/api';
import FileUploader from './FileUploader';

interface ProfileSettingsProps {
  role: UserRole;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  onPreview?: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ role, initialData, onSave, onCancel, onPreview }) => {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+971 50 123 4567',
    company: '',
    location: 'Dubai, UAE',
    tagline: '',
    description: '',
    services: [] as string[],
    serviceTypes: [] as string[],
    imageUrl: '', // New field for image URL
  });
  const [newService, setNewService] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<ServiceType[]>([]);

  // Autocomplete state for location
  const [filteredLocalities, setFilteredLocalities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);
  
  // Ref to track previous initialData to prevent unnecessary resets during polling
  const prevDataRef = useRef<string>('');

  useEffect(() => {
    // Fetch available service types
    api.getServiceTypes().then(setAvailableServiceTypes);

    const handleClickOutside = (event: MouseEvent) => {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [locationWrapperRef]);

  // Debounced search for dynamic suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (formData.location.length >= 3) {
        setIsLoadingSuggestions(true);
        // Fallback to static filter first
        const staticMatches = DUBAI_LOCALITIES.filter(l => l.toLowerCase().includes(formData.location.toLowerCase()));
        setFilteredLocalities(staticMatches);
        
        // Then fetch AI suggestions
        try {
          const aiSuggestions = await getPlaceSuggestions(formData.location);
          if (aiSuggestions.length > 0) {
            // Merge and deduplicate
            const combined = Array.from(new Set([...aiSuggestions, ...staticMatches]));
            setFilteredLocalities(combined.slice(0, 8));
          }
        } catch (err) {
          // Keep static matches
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setFilteredLocalities(DUBAI_LOCALITIES.filter(l => l.toLowerCase().includes(formData.location.toLowerCase())));
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 600);
    return () => clearTimeout(debounceTimer);
  }, [formData.location]);

  useEffect(() => {
    // Deep compare initialData to prevent overwriting user edits on poll
    const currentDataStr = JSON.stringify(initialData);
    if (currentDataStr === prevDataRef.current) return;
    
    if (initialData) {
      prevDataRef.current = currentDataStr;
      setFormData(prev => ({
          ...prev, 
          ...initialData,
          serviceTypes: initialData.serviceTypes || [],
          services: initialData.services || []
      }));
    } else if (role === UserRole.PROVIDER && !prevDataRef.current) {
      // Default mock for provider if no initial data AND not previously loaded
      setFormData(prev => ({
        ...prev,
        name: 'Elite Visa Services',
        email: 'contact@elitevisa.ae',
        company: 'Elite Visa Services LLC',
        tagline: 'Premium PRO Services & Visa Assistance',
        description: 'We specialize in handling complex visa requirements for investors, entrepreneurs, and families.',
        services: ['Golden Visa', 'Family Sponsorship', 'Investor Visa'],
        serviceTypes: ['Visa Services'],
      }));
    }
  }, [role, initialData]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
    }, 1000);
  };

  const handleAddTag = () => {
    if (!newService.trim()) return;
    setFormData(prev => ({
      ...prev,
      services: [...(prev.services || []), newService.trim()]
    }));
    setNewService('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-dubai-dark px-8 py-6 flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-white">Edit {role === UserRole.PROVIDER ? 'Storefront' : 'Profile'}</h1>
             {role === UserRole.PROVIDER && <p className="text-gray-400 text-sm mt-1">Manage your public listing and contact details</p>}
          </div>
          <div className="flex items-center gap-4">
            {role === UserRole.PROVIDER && onPreview && (
              <button
                type="button"
                onClick={onPreview}
                className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 transition-colors flex items-center gap-2 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Preview
              </button>
            )}
            <button onClick={onCancel} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          {/* Image Uploader */}
          <div className="mb-8 border-b border-gray-100 pb-8">
            <FileUploader 
              label={role === UserRole.PROVIDER ? 'Company Logo' : 'Profile Photo'}
              currentImageUrl={formData.imageUrl}
              onUploadComplete={handleImageUpload}
              isCircular={role === UserRole.USER}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{role === UserRole.PROVIDER ? 'Company / Display Name' : 'Full Name'}</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" 
              />
            </div>

            {role === UserRole.PROVIDER && (
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (Short Bio)</label>
                 <input 
                   type="text" 
                   value={formData.tagline}
                   onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                   placeholder="e.g. Fast & Reliable Visa Services"
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" 
                 />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="relative" ref={locationWrapperRef}>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                   </div>
                   <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({...formData, location: e.target.value});
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        setFilteredLocalities(DUBAI_LOCALITIES.filter(l => l.toLowerCase().includes(formData.location.toLowerCase())).slice(0, 8));
                        setShowSuggestions(true);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none" 
                      placeholder="Search area..."
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
                        onClick={() => {
                          setFormData({...formData, location: loc});
                          setShowSuggestions(false);
                        }}
                        className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-gray-50 text-gray-900 border-b border-gray-50 last:border-0 flex items-center gap-2"
                      >
                         <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                         <span className="block truncate">{loc}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {role === UserRole.PROVIDER && (
              <>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories</label>
                   {role === UserRole.PROVIDER ? (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                           {formData.serviceTypes.length > 0 ? (
                             formData.serviceTypes.map((type, idx) => (
                               <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-700 shadow-sm">
                                 {type}
                               </span>
                             ))
                           ) : (
                             <span className="text-sm text-gray-400 italic">No service categories assigned yet.</span>
                           )}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Assigned by Administrator
                        </p>
                      </div>
                   ) : (
                      <div className="relative"></div>
                   )}
                 </div>

                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                   <div className="flex gap-2 mb-3">
                     <input 
                       type="text" 
                       value={newService}
                       onChange={(e) => setNewService(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                       placeholder="Add a tag (e.g. Family Visa)"
                       className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" 
                     />
                     <button 
                       type="button" 
                       onClick={handleAddTag}
                       className="px-4 py-2 bg-dubai-gold text-white rounded-lg hover:bg-yellow-600 font-medium"
                     >
                       Add
                     </button>
                   </div>
                   <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-lg border border-gray-100">
                       {formData.services?.length > 0 ? (
                           formData.services.map((service, idx) => (
                               <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 shadow-sm animate-in zoom-in-50 duration-200">
                                   {service}
                                   <button type="button" onClick={() => handleRemoveTag(idx)} className="ml-2 text-gray-400 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50 transition-colors">
                                       <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                   </button>
                               </span>
                           ))
                       ) : (
                           <span className="text-gray-400 text-sm italic p-1">No tags listed yet. Add tags to appear in search results.</span>
                       )}
                   </div>
                 </div>
              </>
            )}
            
            {role === UserRole.PROVIDER && (
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                 <textarea
                   rows={4}
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Describe your services and expertise..."
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none resize-none"
                 />
               </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2 bg-dubai-gold text-white rounded-lg hover:bg-yellow-600 font-medium flex items-center shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
