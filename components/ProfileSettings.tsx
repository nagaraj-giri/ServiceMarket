import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

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
  });
  const [newService, setNewService] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    } else if (role === UserRole.PROVIDER) {
      // Default mock for provider if no initial data
      setFormData(prev => ({
        ...prev,
        name: 'Elite Visa Services',
        email: 'contact@elitevisa.ae',
        company: 'Elite Visa Services LLC',
        tagline: 'Premium PRO Services & Visa Assistance',
        description: 'We specialize in handling complex visa requirements for investors, entrepreneurs, and families.',
        services: ['Golden Visa', 'Family Sponsorship', 'Investor Visa'],
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

  const handleAddService = () => {
    if (!newService.trim()) return;
    setFormData(prev => ({
      ...prev,
      services: [...(prev.services || []), newService.trim()]
    }));
    setNewService('');
  };

  const handleRemoveService = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, idx) => idx !== indexToRemove)
    }));
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
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 relative group cursor-pointer overflow-hidden ring-4 ring-gray-50">
              {formData.name.charAt(0)}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{role === UserRole.PROVIDER ? 'Company Logo' : 'Profile Photo'}</h3>
              <p className="text-sm text-gray-500">Click to upload a new image. JPG or PNG.</p>
            </div>
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
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" 
              />
            </div>
            {role === UserRole.PROVIDER && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                    placeholder="Add a service (e.g. Family Visa)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" 
                  />
                  <button 
                    type="button" 
                    onClick={handleAddService}
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
                                <button type="button" onClick={() => handleRemoveService(idx)} className="ml-2 text-gray-400 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm italic p-1">No services listed yet. Add services to appear in search results.</span>
                    )}
                </div>
              </div>
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