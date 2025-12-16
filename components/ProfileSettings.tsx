
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, ServiceType, Coordinates } from '../types';
import { REAL_DUBAI_LOCATIONS } from '../constants';
import { getPlaceSuggestions, PlaceSuggestion } from '../services/geminiService';
import { api } from '../services/api';
import FileUploader from './FileUploader';

interface ProfileSettingsProps {
  role: UserRole;
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onPreview?: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ role, initialData, onSave, onCancel, onPreview }) => {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    contactEmail: '',
    phone: '+971 50 123 4567',
    company: '',
    location: 'Dubai, UAE',
    tagline: '',
    description: '',
    website: '',
    services: [] as string[],
    serviceTypes: [] as string[],
    imageUrl: '',
    coverImage: '',
    gallery: [] as string[],
    coordinates: undefined as Coordinates | undefined,
  });
  const [newService, setNewService] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<ServiceType[]>([]);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Autocomplete state for location
  const [filteredLocalities, setFilteredLocalities] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  
  // Gallery Upload State

  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const prevDataRef = useRef<string>('');


  useEffect(() => {
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

  useEffect(() => {
    if (!formData.location) {
        setFilteredLocalities([]);
        return;
    }
    const staticMatches: PlaceSuggestion[] = REAL_DUBAI_LOCATIONS
       .filter(l => l.name.toLowerCase().includes(formData.location.toLowerCase()))
       .map(l => ({ name: l.name, coordinates: { lat: l.lat, lng: l.lng } }));
    
    setFilteredLocalities(staticMatches.slice(0, 8));

    if (staticMatches.length === 0 && formData.location.length >= 4) {
        const debounceTimer = setTimeout(async () => {
            setIsLoadingSuggestions(true);
            try {
                const aiSuggestions = await getPlaceSuggestions(formData.location);
                setFilteredLocalities(prev => {
                    if (formData.location.length < 4) return prev;
                    return aiSuggestions.slice(0, 5);
                });
            } catch (err) {
                // ignore
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 800);
        return () => clearTimeout(debounceTimer);
    }
  }, [formData.location]);

  useEffect(() => {
    const currentDataStr = JSON.stringify(initialData);
    if (currentDataStr === prevDataRef.current) return;
    
    if (initialData) {
      prevDataRef.current = currentDataStr;
      setFormData(prev => ({
          ...prev, 
          ...initialData,
          imageUrl: initialData.profileImage || initialData.imageUrl || '',
          coverImage: initialData.coverImage || '',
          gallery: initialData.gallery || [],
          serviceTypes: initialData.serviceTypes || [],
          services: initialData.services || [],
          coordinates: initialData.coordinates,
          website: initialData.website || '',
          contactEmail: initialData.contactEmail || '',
      }));
    } else if (role === UserRole.PROVIDER && !prevDataRef.current) {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch(e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
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

  const handleCoverUpload = (url: string) => {
    setFormData(prev => ({ ...prev, coverImage: url }));
  };

  const handleGalleryUpload = (url: string) => {
    setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), url] }));
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max size is 5MB.");
        return;
    }

    setIsGalleryUploading(true);
    try {
      const url = await api.uploadFile(file);
      handleGalleryUpload(url);
    } catch (error) {
      console.error("Gallery upload failed", error);
      alert("Failed to upload image.");
    } finally {
      setIsGalleryUploading(false);
      if(galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      await api.updateUserPassword(newPassword);
      setPasswordSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        setPasswordError('For security, please logout and login again to change your password.');
      } else {
        setPasswordError('Failed to update password. ' + e.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-dubai-dark px-6 py-5 flex justify-between items-start">
          <div>
             <h1 className="text-xl font-bold text-white">Edit {role === UserRole.PROVIDER ? 'Storefront' : 'Profile'}</h1>
             {role === UserRole.PROVIDER && <p className="text-gray-400 text-xs mt-1">Manage your public listing and contact details</p>}
          </div>
          <div className="flex items-center gap-3">
            {role === UserRole.PROVIDER && onPreview && (
              <button
                type="button"
                onClick={onPreview}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded border border-white/20 transition-colors flex items-center gap-1.5 font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Preview
              </button>
            )}
            <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* Visual Branding Section */}
            <div>
                <h3 className="text-base font-bold text-gray-900 mb-6">Visual Branding</h3>
                <div className="space-y-6">
                    {/* Profile Image */}
                    <FileUploader 
                        label={role === UserRole.PROVIDER ? 'Profile / Logo' : 'Profile Photo'}
                        currentImageUrl={formData.imageUrl}
                        onUploadComplete={handleImageUpload}
                        variant={role === UserRole.USER ? 'circular' : 'square'}
                    />

                    {/* Cover Image (Providers Only) */}
                    {role === UserRole.PROVIDER && (
                        <FileUploader 
                            label="Cover Banner"
                            currentImageUrl={formData.coverImage}
                            onUploadComplete={handleCoverUpload}
                            variant="banner"
                        />
                    )}
                </div>
                <div className="border-b border-gray-100 mt-8"></div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{role === UserRole.PROVIDER ? 'Company / Display Name' : 'Full Name'}</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none" 
                />
              </div>

              {role === UserRole.PROVIDER && (
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (Short Bio)</label>
                   <input 
                     type="text" 
                     value={formData.tagline}
                     onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                     placeholder="e.g. Fast & Reliable Visa Services"
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none" 
                   />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Login)</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      readOnly 
                      title="To change login email, please contact support."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none" 
                    />
                  </div>
              </div>

              {role === UserRole.PROVIDER && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input 
                      type="email" 
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      placeholder="contact@company.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input 
                      type="url" 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none" 
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative" ref={locationWrapperRef}>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {formData.coordinates ? (
                          <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                     </div>
                     <input 
                        type="text" 
                        value={formData.location}
                        onChange={(e) => {
                          setFormData({...formData, location: e.target.value, coordinates: undefined});
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold focus:border-transparent outline-none" 
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
                          key={`${loc.name}-${idx}`}
                          onClick={() => {
                            setFormData({
                               ...formData, 
                               location: loc.name,
                               coordinates: loc.coordinates 
                            });
                            setShowSuggestions(false);
                          }}
                          className="cursor-pointer select-none relative py-2.5 pl-3 pr-3 hover:bg-gray-50 text-gray-900 border-b border-gray-50 last:border-0 flex items-center justify-between"
                        >
                           <div className="flex items-center gap-2 truncate">
                               <svg className={`h-4 w-4 flex-shrink-0 ${loc.coordinates ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                               </svg>
                               <span className="block truncate">{loc.name}</span>
                           </div>
                           {loc.coordinates && (
                              <div className="flex items-center bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                  <img src="https://www.gstatic.com/images/branding/product/1x/maps_round_48dp.png" alt="Maps" className="w-3 h-3 mr-1" />
                                  <span className="text-[9px] text-gray-500 font-medium">Verified</span>
                              </div>
                           )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {role === UserRole.PROVIDER && (
                <>
                   {/* Description */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                     <textarea
                       rows={4}
                       value={formData.description}
                       onChange={(e) => setFormData({...formData, description: e.target.value})}
                       placeholder="Describe your services and expertise..."
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none resize-none"
                     />
                   </div>

                   {/* Gallery Upload - Card Grid */}
                   <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Upload Button Card - First Item */}
                            <div 
                                onClick={() => !isGalleryUploading && galleryInputRef.current?.click()}
                                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-dubai-gold bg-gray-50 hover:bg-gray-100 cursor-pointer flex flex-col items-center justify-center transition-all group"
                            >
                                <input 
                                    type="file" 
                                    ref={galleryInputRef} 
                                    onChange={handleGalleryFileChange} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/webp" 
                                />
                                {isGalleryUploading ? (
                                    <svg className="animate-spin h-6 w-6 text-dubai-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm group-hover:shadow-md text-dubai-gold flex items-center justify-center mb-2 transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        <span className="text-xs font-bold text-gray-600 group-hover:text-dubai-gold">Upload Image</span>
                                    </>
                                )}
                            </div>

                            {/* Images */}
                            {formData.gallery && formData.gallery.map((img, i) => (
                                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                    <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveGalleryImage(i)}
                                        className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-50"
                                        title="Remove image"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                   </div>

                   <div>
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

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                     <div className="flex gap-2 mb-3">
                       <input 
                         type="text" 
                         value={newService}
                         onChange={(e) => setNewService(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                         placeholder="Add a tag (e.g. Family Visa)"
                         className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none" 
                       />
                       <button 
                         type="button" 
                         onClick={handleAddTag}
                         className="px-4 py-2 bg-dubai-gold text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
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
                             <span className="text-gray-400 text-sm italic p-1">No tags listed.</span>
                         )}
                     </div>
                   </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button 
                type="button" 
                onClick={onCancel}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-bold text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-8 py-2.5 bg-dubai-gold text-white rounded-lg hover:bg-yellow-600 font-bold text-sm flex items-center shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Security / Password Reset Section */}
          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-800 mb-4">Change Password</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-dubai-gold outline-none bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-dubai-gold outline-none bg-white text-sm"
                  />
                </div>
              </div>
              
              {passwordError && <p className="text-xs text-red-500 mb-3">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-green-600 mb-3">{passwordSuccess}</p>}

              <button 
                type="button" 
                onClick={handleChangePassword}
                disabled={!newPassword || !confirmPassword}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-sm disabled:opacity-50"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
