
import React, { useState, useEffect } from 'react';
import { ServiceRequest, ProviderProfile, User, SiteSettings, ServiceType, UserRole, AuditLog, AdminSection } from '../types';
import { api } from '../services/api';
import AdminAnalytics from './AdminAnalytics';
import { ToastType } from './Toast';

interface AdminDashboardProps {
  requests: ServiceRequest[];
  providers: ProviderProfile[];
  users: User[];
  onDeleteRequest: (requestId: string) => void;
  onToggleVerifyProvider: (providerId: string) => void;
  activeSection: AdminSection;
  showToast?: (message: string, type: ToastType) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, providers, users: initialUsers, onDeleteRequest, onToggleVerifyProvider, activeSection, showToast }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({ siteName: '', contactEmail: '', maintenanceMode: false, allowNewRegistrations: true });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Local state forms & UI toggles
  const [newService, setNewService] = useState({ name: '', description: '' });
  const [broadcastMsg, setBroadcastMsg] = useState({ title: '', message: '' });
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  
  // User CRUD State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: UserRole.USER, companyName: '' });

  // Provider Management State
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderProfile | null>(null);
  const [providerForm, setProviderForm] = useState({ 
    name: '', tagline: '', description: '', location: '', badges: [] as string[], serviceTypes: [] as string[]
  });
  const [newBadge, setNewBadge] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      const srv = await api.getServiceTypes();
      const stg = await api.getSettings();
      const allUsers = await api.getAllUsers();
      const logs = await api.getAuditLogs();
      setServiceTypes(srv);
      setSettings(stg);
      setSettingsForm(stg);
      setUsers(allUsers);
      setAuditLogs(logs);
    };
    fetchAdminData();
  }, [activeSection]);

  // --- ACTIONS ---

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      setSettings(settingsForm);
      if (showToast) showToast('Site settings updated successfully', 'success');
    } catch (e: any) {
      if (showToast) showToast('Failed to update settings', 'error');
    }
  };

  const handleAddService = async () => {
    if (!newService.name) return;
    try {
      const newType: ServiceType = {
        id: `srv_${Date.now()}`,
        name: newService.name,
        description: newService.description,
        isActive: true
      };
      await api.manageServiceType(newType, 'add');
      setServiceTypes(prev => [...prev, newType]);
      setNewService({ name: '', description: '' });
      if (showToast) showToast(`Service category "${newType.name}" added`, 'success');
    } catch(e) {
      if (showToast) showToast('Failed to add service', 'error');
    }
  };

  const handleDeleteService = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Critical fix: prevent event from bubbling to parent container
    if (window.confirm('Delete this service category?')) {
      try {
        await api.deleteServiceType(id);
        setServiceTypes(prev => prev.filter(s => s.id !== id));
        if (showToast) showToast('Service category deleted', 'success');
      } catch(e) {
        if (showToast) showToast('Failed to delete service', 'error');
      }
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.broadcastNotification(broadcastMsg.title, broadcastMsg.message);
      setBroadcastMsg({ title: '', message: '' });
      if (showToast) showToast('Broadcast notification sent to all users.', 'success');
    } catch(e) {
      if (showToast) showToast('Failed to send broadcast', 'error');
    }
  };

  const handleBlockUser = async (user: User) => {
    try {
      const updated = { ...user, isBlocked: !user.isBlocked };
      await api.updateUser(updated);
      setUsers(users.map(u => u.id === user.id ? updated : u));
      if (showToast) showToast(`User ${user.name} has been ${updated.isBlocked ? 'blocked' : 'unblocked'}`, 'success');
    } catch(e) {
      if (showToast) showToast('Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.deleteUser(userId);
        const updatedUsers = await api.getAllUsers();
        setUsers(updatedUsers);
        if (showToast) showToast('User deleted permanently', 'success');
      } catch(e) {
        if (showToast) showToast('Failed to delete user', 'error');
      }
    }
  };

  // --- USER MODAL HANDLERS ---
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        companyName: user.companyName || '' 
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: UserRole.USER, companyName: '' });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Edit Mode
        const updatedUser: User = {
          ...editingUser,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          companyName: userForm.role === UserRole.PROVIDER ? userForm.companyName : undefined
        };
        await api.updateUser(updatedUser);
        if (showToast) showToast('User updated successfully', 'success');
      } else {
        // Create Mode
        await api.register({
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          companyName: userForm.role === UserRole.PROVIDER ? userForm.companyName : undefined
        });
        if (showToast) showToast('New user created successfully', 'success');
      }
      
      const updatedUsers = await api.getAllUsers();
      setUsers(updatedUsers);
      setShowUserModal(false);
    } catch (err: any) {
      if (showToast) showToast(`Error: ${err.message}`, 'error');
    }
  };

  // --- PROVIDER MANAGE HANDLERS ---
  const handleManageProvider = (userId: string) => {
    const provider = providers.find(p => p.id === userId);
    if (provider) {
      setEditingProvider(provider);
      setProviderForm({
        name: provider.name,
        tagline: provider.tagline,
        description: provider.description,
        location: provider.location,
        badges: provider.badges || [],
        serviceTypes: provider.serviceTypes || []
      });
      setShowProviderModal(true);
    } else {
      if (showToast) showToast('Provider profile not found.', 'error');
    }
  };

  const handleAddBadge = () => {
    if (newBadge.trim() && !providerForm.badges.includes(newBadge.trim())) {
      setProviderForm(prev => ({ ...prev, badges: [...prev.badges, newBadge.trim()] }));
      setNewBadge('');
    }
  };

  const handleRemoveBadge = (badge: string) => {
    setProviderForm(prev => ({ ...prev, badges: prev.badges.filter(b => b !== badge) }));
  };

  const handleAddServiceType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected && !providerForm.serviceTypes.includes(selected)) {
      setProviderForm(prev => ({
        ...prev,
        serviceTypes: [...prev.serviceTypes, selected]
      }));
    }
    e.target.value = "";
  };

  const handleRemoveServiceType = (typeName: string) => {
    setProviderForm(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.filter(t => t !== typeName)
    }));
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
      await api.updateProvider(editingProvider.id, {
        name: providerForm.name,
        tagline: providerForm.tagline,
        description: providerForm.description,
        location: providerForm.location,
        badges: providerForm.badges,
        serviceTypes: providerForm.serviceTypes
      });
      if (showToast) showToast('Storefront updated successfully', 'success');
      setShowProviderModal(false);
    } catch (err) {
      if (showToast) showToast('Failed to update provider', 'error');
    }
  };

  const handleDeleteReview = async (providerId: string, reviewId: string) => {
    if(window.confirm('Remove this review?')) {
      try {
        await api.deleteReview(providerId, reviewId);
        if (showToast) showToast('Review removed successfully', 'success');
        // Ideally trigger refresh in parent or local state update
      } catch(e) {
        if (showToast) showToast('Failed to remove review', 'error');
      }
    }
  };

  const handleExportData = () => {
    try {
      // Generate CSV for Requests
      const headers = ['ID', 'Title', 'Category', 'Status', 'Quotes Count', 'Created At'];
      const rows = requests.map(r => [
        r.id, 
        `"${r.title}"`, 
        r.category, 
        r.status, 
        r.quotes.length, 
        new Date(r.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `dubailink_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (showToast) showToast('Report generated successfully', 'success');
    } catch(e) {
      if (showToast) showToast('Failed to generate report', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative">
      {/* Create/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Create New User'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none" 
                  value={userForm.name} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none" 
                  value={userForm.email} 
                  onChange={e => setUserForm({...userForm, email: e.target.value})} 
                  disabled={!!editingUser} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none"
                  value={userForm.role}
                  onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.PROVIDER}>Provider</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              
              {userForm.role === UserRole.PROVIDER && (
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none" 
                    value={userForm.companyName} 
                    onChange={e => setUserForm({...userForm, companyName: e.target.value})} 
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 border p-2 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-dubai-gold text-white p-2 rounded font-bold hover:bg-yellow-600">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider Management Modal */}
      {showProviderModal && editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h3 className="text-xl font-bold">Manage Storefront</h3>
              <button onClick={() => setShowProviderModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveProvider} className="space-y-4 overflow-y-auto pr-2">
              {/* Badges Section */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                 <label className="block text-sm font-bold text-yellow-800 mb-2">Provider Badges</label>
                 <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="Add Badge (e.g. Top Rated)" 
                      className="flex-1 border border-yellow-200 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBadge())}
                    />
                    <button type="button" onClick={handleAddBadge} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-yellow-600">Add</button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {providerForm.badges.map((badge, idx) => (
                      <span key={idx} className="bg-white text-yellow-700 px-2 py-1 rounded border border-yellow-200 text-xs font-medium flex items-center gap-1">
                        {badge}
                        <button type="button" onClick={() => handleRemoveBadge(badge)} className="text-red-400 hover:text-red-600 ml-1">×</button>
                      </span>
                    ))}
                    {providerForm.badges.length === 0 && <span className="text-xs text-yellow-600/60 italic">No badges assigned.</span>}
                 </div>
              </div>

               {/* Service Categories Section - Admin Exclusive Edit */}
               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                 <label className="block text-sm font-bold text-blue-800 mb-2">Service Categories</label>
                 <div className="relative mb-2">
                     <select
                       onChange={handleAddServiceType}
                       className="w-full px-3 py-1.5 border border-blue-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                       defaultValue=""
                     >
                       <option value="" disabled>Add Category...</option>
                       {serviceTypes
                         .filter(type => !providerForm.serviceTypes.includes(type.name))
                         .map(type => (
                           <option key={type.id} value={type.name}>{type.name}</option>
                         ))
                       }
                     </select>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {providerForm.serviceTypes.map((type, idx) => (
                      <span key={idx} className="bg-white text-blue-700 px-2 py-1 rounded border border-blue-200 text-xs font-medium flex items-center gap-1">
                        {type}
                        <button type="button" onClick={() => handleRemoveServiceType(type)} className="text-red-400 hover:text-red-600 ml-1">×</button>
                      </span>
                    ))}
                    {providerForm.serviceTypes.length === 0 && <span className="text-xs text-blue-600/60 italic">No categories assigned.</span>}
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Display Name</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none" 
                  value={providerForm.name} 
                  onChange={e => setProviderForm({...providerForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tagline</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none" 
                  value={providerForm.tagline} 
                  onChange={e => setProviderForm({...providerForm, tagline: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none" 
                  value={providerForm.location} 
                  onChange={e => setProviderForm({...providerForm, location: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  rows={4}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-dubai-gold outline-none" 
                  value={providerForm.description} 
                  onChange={e => setProviderForm({...providerForm, description: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowProviderModal(false)} className="flex-1 border p-2 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-dubai-gold text-white p-2 rounded font-bold hover:bg-yellow-600">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* Header with Quick Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeSection.replace('-', ' & ')}</h1>
          
          <div className="flex flex-wrap gap-2">
             <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Create User
             </button>
             <button onClick={handleExportData} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Export Report
             </button>
             <button onClick={() => setBroadcastMsg({...broadcastMsg, title: 'Alert'})} className="flex items-center gap-2 bg-dubai-gold text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-yellow-600 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                Broadcast
             </button>
          </div>
        </div>

        {activeSection === 'overview' && (
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 space-y-6 min-w-0">
               <AdminAnalytics requests={requests} providers={providers} users={users} />
            </div>
          </div>
        )}

        {/* ... USERS TAB ... */}
        {activeSection === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 font-bold">{u.name}</td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs uppercase">{u.role}</span></td>
                    <td className="px-6 py-4 text-gray-500">{new Date(u.joinDate || Date.now()).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? <span className="text-red-500 font-bold text-xs">Blocked</span> : <span className="text-green-500 font-bold text-xs">Active</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== UserRole.ADMIN && (
                        <div className="flex items-center justify-end gap-2">
                           {/* Add Provider Management Button */}
                           {u.role === UserRole.PROVIDER && (
                             <button 
                                onClick={() => handleManageProvider(u.id)}
                                className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                title="Manage Storefront & Badges"
                             >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                Storefront
                             </button>
                           )}

                          <button onClick={() => handleOpenUserModal(u)} className="text-gray-400 hover:text-dubai-gold p-1" title="Edit User Details">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleBlockUser(u)} className={`text-xs font-bold ${u.isBlocked ? 'text-green-600' : 'text-orange-500'} hover:underline`} title={u.isBlocked ? "Unblock" : "Block"}>
                             {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-600 p-1" title="Delete">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ... REQUESTS TAB ... */}
        {activeSection === 'requests' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             {requests.map(r => (
               <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{r.title}</span>
                          <span className="text-xs text-gray-400">#{r.id.split('_')[1]}</span>
                       </div>
                       <div className="flex items-center gap-3 text-xs">
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{r.category}</span>
                          <span className={`uppercase font-bold ${r.status === 'open' ? 'text-green-600' : 'text-gray-500'}`}>{r.status}</span>
                          <span className="text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setExpandedRequestId(expandedRequestId === r.id ? null : r.id)}
                          className="text-gray-500 hover:text-dubai-gold text-xs font-medium px-3 py-1 border border-gray-200 rounded transition-colors"
                        >
                           {expandedRequestId === r.id ? 'Hide Details' : 'View Details'}
                        </button>
                        <button onClick={() => onDeleteRequest(r.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Delete Permanently">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                  </div>
                  
                  {expandedRequestId === r.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                             <p className="text-gray-500 text-xs uppercase font-bold mb-1">Description</p>
                             <p className="text-gray-700">{r.description}</p>
                          </div>
                          <div>
                             <p className="text-gray-500 text-xs uppercase font-bold mb-1">Locality</p>
                             <p className="text-gray-700">{r.locality || 'N/A'}</p>
                          </div>
                       </div>
                       {r.quotes.length > 0 && (
                         <div className="mt-4">
                            <p className="text-gray-500 text-xs uppercase font-bold mb-2">Quotes ({r.quotes.length})</p>
                            <div className="space-y-2">
                               {r.quotes.map(q => (
                                 <div key={q.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs">
                                    <span>{q.providerName}: <strong>{q.price} {q.currency}</strong></span>
                                    <span className="uppercase">{q.status}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
               </div>
             ))}
          </div>
        )}

        {/* ... SERVICES TAB ... */}
        {activeSection === 'services' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Add Service Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Add New Service Type</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Service Name (e.g. Legal Services)" 
                  className="flex-1 border border-gray-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none transition-all text-sm"
                  value={newService.name}
                  onChange={e => setNewService({...newService, name: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                />
                <input 
                  type="text" 
                  placeholder="Description" 
                  className="flex-[2] border border-gray-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none transition-all text-sm"
                  value={newService.description}
                  onChange={e => setNewService({...newService, description: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                />
                <button 
                  onClick={handleAddService} 
                  className="bg-dubai-gold hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-all hover:shadow-md active:scale-95 text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Service List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceTypes.map(s => (
                <div key={s.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                  <button 
                    onClick={(e) => handleDeleteService(e, s.id)} 
                    className="absolute top-3 right-3 text-red-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
                    title="Delete Category"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="pr-8">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{s.name}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.description || 'No description available'}</p>
                  </div>
                </div>
              ))}
              
              {serviceTypes.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
                   <p className="mb-2">No service types found.</p>
                   <p className="text-xs">Add your first service category above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ... SETTINGS TAB ... */}
        {activeSection === 'settings' && (
          <form onSubmit={handleUpdateSettings} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 max-w-2xl animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Site Name</label>
              <input type="text" value={settingsForm.siteName} onChange={e => setSettingsForm({...settingsForm, siteName: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={settingsForm.contactEmail} onChange={e => setSettingsForm({...settingsForm, contactEmail: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={settingsForm.maintenanceMode} onChange={e => setSettingsForm({...settingsForm, maintenanceMode: e.target.checked})} />
              <label>Maintenance Mode</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={settingsForm.allowNewRegistrations} onChange={e => setSettingsForm({...settingsForm, allowNewRegistrations: e.target.checked})} />
              <label>Allow New Registrations</label>
            </div>
            <button type="submit" className="bg-dubai-dark text-white px-6 py-2 rounded-lg font-bold">Save Settings</button>
          </form>
        )}

        {/* ... SECURITY TAB ... */}
        {activeSection === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-white p-6 rounded-xl border border-gray-100">
                <h3 className="font-bold mb-4">Broadcast Notification</h3>
                <p className="text-sm text-gray-500 mb-4">Send a system-wide alert to all users.</p>
                <form onSubmit={handleBroadcast} className="space-y-4">
                   <input type="text" placeholder="Title" required className="w-full border p-2 rounded" value={broadcastMsg.title} onChange={e => setBroadcastMsg({...broadcastMsg, title: e.target.value})} />
                   <textarea placeholder="Message" required className="w-full border p-2 rounded" value={broadcastMsg.message} onChange={e => setBroadcastMsg({...broadcastMsg, message: e.target.value})} />
                   <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Broadcast</button>
                </form>
             </div>
          </div>
        )}

        {/* ... REVIEWS TAB ... */}
        {activeSection === 'reviews' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             {providers.map(p => (
               <div key={p.id} className="bg-white p-6 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-lg mb-2">{p.name} <span className="text-gray-400 text-sm font-normal">({p.reviews.length} reviews)</span></h3>
                  <div className="space-y-3">
                    {p.reviews.map(r => (
                      <div key={r.id} className="flex justify-between items-start border-b border-gray-50 pb-2">
                         <div>
                            <div className="flex gap-2">
                                <span className="font-bold text-sm">{r.author}</span>
                                <span className="text-yellow-500 text-sm">★ {r.rating}</span>
                            </div>
                            <p className="text-sm text-gray-600">{r.content}</p>
                         </div>
                         <button onClick={() => handleDeleteReview(p.id, r.id)} className="text-red-400 text-xs hover:text-red-600 font-bold">Remove</button>
                      </div>
                    ))}
                    {p.reviews.length === 0 && <p className="text-gray-400 text-sm italic">No reviews.</p>}
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* ... AUDIT TAB ... */}
        {activeSection === 'audit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">System Activity Log</h3>
                <span className="text-xs text-gray-500">Last 100 events</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Severity</th>
                            <th className="px-6 py-3">Admin/User</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {auditLogs.length > 0 ? (
                            auditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            log.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                            log.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {log.adminId}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {log.details}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No audit logs found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
