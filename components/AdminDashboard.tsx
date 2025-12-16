import React, { useState, useEffect } from 'react';
import { ServiceRequest, ProviderProfile, User, SiteSettings, ServiceType, UserRole, AuditLog, AdminSection, AiInteraction } from '../types';
import { api } from '../services/api';
import AdminAnalytics from './AdminAnalytics';
import { ToastType } from './Toast';
import { TableSkeleton } from './Skeleton';
import FileUploader from './FileUploader';

interface AdminDashboardProps {
  requests: ServiceRequest[];
  providers: ProviderProfile[];
  users: User[];
  onDeleteRequest: (requestId: string) => void;
  onToggleVerifyProvider: (providerId: string) => void;
  activeSection: AdminSection;
  showToast?: (message: string, type: ToastType) => void;
}

// Extracted for performance: SortableHeader is now stable across renders
interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string;
  onSort: (key: string) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, currentSort, onSort, className = "" }) => {
  let active = false;
  let direction = 'desc';

  // Determine active state and direction based on current sort string
  if (sortKey === 'date') {
      if (currentSort === 'newest') { active = true; direction = 'desc'; }
      if (currentSort === 'oldest') { active = true; direction = 'asc'; }
  } else if (sortKey === 'rating') {
      if (currentSort === 'rating_high') { active = true; direction = 'desc'; }
      if (currentSort === 'rating_low') { active = true; direction = 'asc'; }
  } else {
      if (currentSort.startsWith(sortKey)) {
          active = true;
          direction = currentSort.endsWith('_asc') ? 'asc' : 'desc';
      }
  }

  return (
      <th 
          className={`px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none group ${className}`}
          onClick={() => onSort(sortKey)}
      >
          <div className="flex items-center gap-2">
              {label}
              <div className="flex flex-col space-y-[2px]">
                  {/* Up Arrow */}
                  <svg className={`w-2 h-2 ${active && direction === 'asc' ? 'text-gray-900' : 'text-gray-300 group-hover:text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z" /></svg>
                  {/* Down Arrow */}
                  <svg className={`w-2 h-2 ${active && direction === 'desc' ? 'text-gray-900' : 'text-gray-300 group-hover:text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16l-8 8z" /></svg>
              </div>
          </div>
      </th>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, providers, users: initialUsers, onDeleteRequest, onToggleVerifyProvider, activeSection, showToast }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({ siteName: '', contactEmail: '', maintenanceMode: false, allowNewRegistrations: true });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiLogs, setAiLogs] = useState<AiInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Unified Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');

  // Local state forms & UI toggles
  const [newService, setNewService] = useState({ name: '', description: '' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [broadcastMsg, setBroadcastMsg] = useState({ title: '', message: '' });
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  
  // User CRUD State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: UserRole.USER, companyName: '', password: '' });
  const [userSubTab, setUserSubTab] = useState<'all' | 'providers' | 'admins'>('all');

  // Provider Management State
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderProfile | null>(null);
  const [providerForm, setProviderForm] = useState({ 
    name: '', tagline: '', description: '', location: '', badges: [] as string[], serviceTypes: [] as string[], services: [] as string[], profileImage: ''
  });
  const [newBadge, setNewBadge] = useState('');

  // Sync state with props when props change
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const srv = await api.getServiceTypes();
        const stg = await api.getSettings();
        const logs = await api.getAuditLogs();
        setServiceTypes(srv);
        setSettings(stg);
        setSettingsForm(stg);
        setAuditLogs(logs);
        
        if (activeSection === 'ai-insights') {
            const aiData = await api.getAiInteractions();
            setAiLogs(aiData);
        }
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, [activeSection]);

  // Reset filters when changing sections
  useEffect(() => {
    setSearchTerm('');
    setSortOption('newest');
    setFilterStatus('all');
  }, [activeSection]);

  // --- SORTING LOGIC ---
  const handleHeaderSort = (key: string) => {
      let currentKey = sortOption;
      let currentDir = 'desc';

      // Map currentSort string back to key/dir
      if (sortOption === 'newest') { currentKey = 'date'; currentDir = 'desc'; }
      else if (sortOption === 'oldest') { currentKey = 'date'; currentDir = 'asc'; }
      else if (sortOption === 'rating_high') { currentKey = 'rating'; currentDir = 'desc'; }
      else if (sortOption === 'rating_low') { currentKey = 'rating'; currentDir = 'asc'; }
      else if (sortOption.includes('_')) {
          const parts = sortOption.split('_');
          currentDir = parts.pop() || 'asc';
          currentKey = parts.join('_');
      }

      let newSortOption = '';
      if (currentKey === key) {
          // Toggle direction
          const newDir = currentDir === 'asc' ? 'desc' : 'asc';
          if (key === 'date') newSortOption = newDir === 'desc' ? 'newest' : 'oldest';
          else if (key === 'rating') newSortOption = newDir === 'desc' ? 'rating_high' : 'rating_low';
          else newSortOption = `${key}_${newDir}`;
      } else {
          // Default start direction based on key type
          const defaultDesc = ['date', 'rating', 'joined', 'created'].includes(key);
          const dir = defaultDesc ? 'desc' : 'asc';
          if (key === 'date') newSortOption = dir === 'desc' ? 'newest' : 'oldest';
          else if (key === 'rating') newSortOption = dir === 'desc' ? 'rating_high' : 'rating_low';
          else newSortOption = `${key}_${dir}`;
      }
      setSortOption(newSortOption);
  };

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

  // --- SERVICE ACTIONS ---
  const handleOpenServiceModal = (service?: ServiceType) => {
    if (service) {
      setEditingServiceId(service.id);
      setNewService({ name: service.name, description: service.description });
    } else {
      setEditingServiceId(null);
      setNewService({ name: '', description: '' });
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name) return;
    try {
      if (editingServiceId) {
        // Update existing service
        const updatedType: ServiceType = {
          id: editingServiceId,
          name: newService.name,
          description: newService.description,
          isActive: true
        };
        await api.manageServiceType(updatedType, 'update');
        setServiceTypes(prev => prev.map(s => s.id === editingServiceId ? updatedType : s));
        if (showToast) showToast(`Service category "${updatedType.name}" updated`, 'success');
      } else {
        // Add new service
        const newType: ServiceType = {
          id: `srv_${Date.now()}`,
          name: newService.name,
          description: newService.description,
          isActive: true
        };
        await api.manageServiceType(newType, 'add');
        setServiceTypes(prev => [...prev, newType]);
        if (showToast) showToast(`Service category "${newType.name}" added`, 'success');
      }
      setShowServiceModal(false);
      setNewService({ name: '', description: '' });
    } catch(e) {
      if (showToast) showToast('Failed to save service', 'error');
    }
  };

  const handleDeleteService = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
    const action = user.isBlocked ? 'Unblock' : 'Block';
    const confirmMessage = user.isBlocked 
        ? `Are you sure you want to unblock ${user.name}? They will regain access to the platform.` 
        : `Are you sure you want to block ${user.name}? They will be unable to log in.`;

    if (window.confirm(confirmMessage)) {
      try {
        const updated = { ...user, isBlocked: !user.isBlocked };
        await api.updateUser(updated);
        setUsers(users.map(u => u.id === user.id ? updated : u));
        
        api.logAction("admin", user.isBlocked ? "UNBLOCK_USER" : "BLOCK_USER", `User ${user.id} (${user.name}) was ${action}ed`, "ADMIN", "warning");
        
        if (showToast) showToast(`User ${user.name} has been ${updated.isBlocked ? 'blocked' : 'unblocked'}`, 'success');
      } catch(e) {
        console.error(e);
        if (showToast) showToast('Failed to update user status', 'error');
      }
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
        console.error(e);
        if (showToast) showToast('Failed to delete user', 'error');
      }
    }
  };

  const handleDeleteReview = async (providerId: string, reviewId: string) => {
    if(window.confirm('Are you sure you want to remove this review?')) {
        try {
            await api.deleteReview(providerId, reviewId);
            if(showToast) showToast('Review removed', 'success');
        } catch(e) {
            if(showToast) showToast('Failed to delete review', 'error');
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
        companyName: user.companyName || '',
        password: ''
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: UserRole.USER, companyName: '', password: '' });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
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
        await api.register({
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          companyName: userForm.role === UserRole.PROVIDER ? userForm.companyName : undefined
        }, userForm.password);
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
        serviceTypes: provider.serviceTypes || [],
        services: provider.services || [],
        profileImage: provider.profileImage || ''
      });
      setShowProviderModal(true);
    } else {
      if (showToast) showToast('Provider profile not found.', 'error');
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
       await api.updateProvider(editingProvider.id, providerForm);
       if (showToast) showToast('Provider profile updated by admin', 'success');
       setShowProviderModal(false);
    } catch (e: any) {
       if (showToast) showToast('Failed to update provider', 'error');
    }
  };

  // --- RENDERERS ---

  const renderOverview = () => (
    <div className="space-y-8">
       {isLoading ? <TableSkeleton rows={4} /> : <AdminAnalytics requests={requests} providers={providers} users={users} />}
    </div>
  );

  const FilterToolbar = ({ showStatusFilter = false }) => (
    <div className="flex gap-2 mb-4 bg-gray-50 p-2 rounded-xl border border-gray-200 flex-wrap">
       <div className="relative flex-grow md:flex-grow-0 md:w-64">
          <input 
             type="text" 
             placeholder="Search..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
       </div>
       <select 
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none bg-white"
       >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          {activeSection === 'users' && <option value="name_asc">Name (A-Z)</option>}
          {activeSection === 'services' && <option value="name_asc">Name (A-Z)</option>}
          {activeSection === 'reviews' && <option value="rating_high">Rating (High)</option>}
          {activeSection === 'reviews' && <option value="rating_low">Rating (Low)</option>}
       </select>
       {showStatusFilter && (
          <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none bg-white"
          >
             <option value="all">All Status</option>
             <option value="open">Open</option>
             <option value="quoted">Quoted</option>
             <option value="accepted">Accepted</option>
             <option value="closed">Closed</option>
          </select>
       )}
    </div>
  );

  const renderUsers = () => {
    let filteredUsers = users.filter(u => {
        if (userSubTab === 'providers') return u.role === UserRole.PROVIDER;
        if (userSubTab === 'admins') return u.role === UserRole.ADMIN;
        return true;
    });

    if (searchTerm) {
       const lowerSearch = searchTerm.toLowerCase();
       filteredUsers = filteredUsers.filter(u => 
          u.name.toLowerCase().includes(lowerSearch) || 
          u.email.toLowerCase().includes(lowerSearch) ||
          (u.companyName && u.companyName.toLowerCase().includes(lowerSearch))
       );
    }

    filteredUsers.sort((a, b) => {
       if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
       if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
       if (sortOption === 'role_asc') return a.role.localeCompare(b.role);
       if (sortOption === 'role_desc') return b.role.localeCompare(a.role);
       if (sortOption === 'status_asc') return (a.isBlocked === b.isBlocked) ? 0 : a.isBlocked ? 1 : -1;
       if (sortOption === 'status_desc') return (a.isBlocked === b.isBlocked) ? 0 : a.isBlocked ? -1 : 1;
       
       const dateA = new Date(a.joinDate || '').getTime();
       const dateB = new Date(b.joinDate || '').getTime();
       return sortOption === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-gray-900">User Management</h2>
           <p className="text-sm text-gray-500">Manage customers, providers, and admins.</p>
        </div>
        <button 
           onClick={() => handleOpenUserModal()}
           className="bg-dubai-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors"
        >
           + Add User
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
              onClick={() => setUserSubTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${userSubTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
              All Users
          </button>
          <button
              onClick={() => setUserSubTab('providers')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${userSubTab === 'providers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
              Providers
          </button>
          <button
              onClick={() => setUserSubTab('admins')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${userSubTab === 'admins' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
              Admins
          </button>
      </div>

      <FilterToolbar />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-4"><TableSkeleton rows={8} /></div> : (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <SortableHeader label="User" sortKey="name" currentSort={sortOption} onSort={handleHeaderSort} />
              <SortableHeader label="Role" sortKey="role" currentSort={sortOption} onSort={handleHeaderSort} />
              {userSubTab === 'providers' && <th className="px-6 py-4">Verification</th>}
              <SortableHeader label="Status" sortKey="status" currentSort={sortOption} onSort={handleHeaderSort} />
              <SortableHeader label="Joined" sortKey="date" currentSort={sortOption} onSort={handleHeaderSort} />
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length > 0 ? filteredUsers.map(u => {
              const providerProfile = providers.find(p => p.id === u.id);
              return (
              <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.isBlocked ? 'bg-gray-50/50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-dubai-gold/10 text-dubai-gold flex items-center justify-center font-bold text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className={`font-bold text-gray-900 ${u.isBlocked ? 'line-through text-gray-500' : ''}`}>{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                      {u.companyName && <div className="text-xs text-blue-600 font-medium mt-0.5">{u.companyName}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                    u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                    u.role === UserRole.PROVIDER ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                {userSubTab === 'providers' && (
                    <td className="px-6 py-4">
                        {providerProfile ? (
                            <button 
                                onClick={() => onToggleVerifyProvider(u.id)}
                                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border transition-colors ${
                                    providerProfile.isVerified 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {providerProfile.isVerified ? (
                                    <>
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Verified
                                    </>
                                ) : (
                                    <>Unverified</>
                                )}
                            </button>
                        ) : <span className="text-xs text-gray-400">N/A</span>}
                    </td>
                )}
                <td className="px-6 py-4">
                  {u.isBlocked ? (
                    <span className="text-red-600 font-bold text-xs flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-600"></div> Blocked
                    </span>
                  ) : (
                    <span className="text-green-600 font-bold text-xs flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div> Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {u.joinDate ? new Date(u.joinDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-3">
                     <button onClick={() => handleOpenUserModal(u)} className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Edit User">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                     
                     {u.role === UserRole.PROVIDER && (
                       <button onClick={() => handleManageProvider(u.id)} className="text-gray-400 hover:text-purple-600 transition-colors p-1" title="Manage Storefront">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                       </button>
                     )}

                     <button 
                        onClick={() => handleBlockUser(u)} 
                        className={`text-xs px-3 py-1 rounded font-bold transition-colors min-w-[60px] text-center ${u.isBlocked ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        title={u.isBlocked ? "Unblock User" : "Block User"}
                     >
                       {u.isBlocked ? 'Unblock' : 'Block'}
                     </button>

                     <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete User">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                  </div>
                </td>
              </tr>
            )}) : (
              <tr>
                <td colSpan={userSubTab === 'providers' ? 6 : 5} className="px-6 py-12 text-center text-gray-400 bg-gray-50/50">
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <span>No {userSubTab !== 'all' ? userSubTab : 'users'} found.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
    );
  };

  const renderRequests = () => {
    let filteredRequests = requests.filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            const user = users.find(u => u.id === r.userId);
            return r.title.toLowerCase().includes(lowerTerm) || (user && user.name.toLowerCase().includes(lowerTerm));
        }
        return true;
    });

    filteredRequests.sort((a, b) => {
        const userA = users.find(u => u.id === a.userId)?.name || '';
        const userB = users.find(u => u.id === b.userId)?.name || '';

        if (sortOption === 'title_asc') return a.title.localeCompare(b.title);
        if (sortOption === 'title_desc') return b.title.localeCompare(a.title);
        // ... (other sort logic) ...
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOption === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-gray-900">Requests & Leads</h2>
            <p className="text-sm text-gray-500">Monitor marketplace activity.</p>
         </div>
      </div>
      
      <FilterToolbar showStatusFilter />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-4"><TableSkeleton rows={6} /></div> : (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
             <tr>
               <SortableHeader label="Title" sortKey="title" currentSort={sortOption} onSort={handleHeaderSort} />
               <SortableHeader label="User" sortKey="user" currentSort={sortOption} onSort={handleHeaderSort} />
               <SortableHeader label="Category" sortKey="category" currentSort={sortOption} onSort={handleHeaderSort} />
               <SortableHeader label="Status" sortKey="status" currentSort={sortOption} onSort={handleHeaderSort} />
               <SortableHeader label="Date" sortKey="date" currentSort={sortOption} onSort={handleHeaderSort} />
               <th className="px-6 py-4 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredRequests.length > 0 ? filteredRequests.map(r => {
                const user = users.find(u => u.id === r.userId);
                const isExpanded = expandedRequestId === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedRequestId(isExpanded ? null : r.id)}>
                       <td className="px-6 py-4 font-medium text-gray-900">{r.title}</td>
                       <td className="px-6 py-4 text-gray-500">{user?.name || 'Unknown'}</td>
                       <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{r.category}</span></td>
                       <td className="px-6 py-4"><span className="uppercase text-xs font-bold text-gray-500">{r.status}</span></td>
                       <td className="px-6 py-4 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-right">
                          <button 
                             onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('Delete this request?')) onDeleteRequest(r.id);
                             }}
                             className="text-gray-400 hover:text-red-600"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </td>
                    </tr>
                    {isExpanded && (
                       <tr className="bg-gray-50 animate-in fade-in">
                          <td colSpan={6} className="px-6 py-4">
                             <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                   <p className="font-bold text-gray-700">Description:</p>
                                   <p className="text-gray-600 mt-1">{r.description}</p>
                                </div>
                                <div>
                                   <p className="font-bold text-gray-700">Location:</p>
                                   <p className="text-gray-600 mt-1">{r.locality || 'N/A'}</p>
                                   <p className="font-bold text-gray-700 mt-2">Quotes: {r.quotes.length}</p>
                                </div>
                             </div>
                          </td>
                       </tr>
                    )}
                  </React.Fragment>
                );
             }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 bg-gray-50/50">
                    <div className="flex flex-col items-center">
                      <span>No active requests found.</span>
                    </div>
                  </td>
                </tr>
             )}
          </tbody>
        </table>
        )}
      </div>
    </div>
    );
  };

  const renderServices = () => {
    let filteredServices = serviceTypes.filter(s => 
        !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredServices.sort((a, b) => {
        if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
        if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
        return 0; // Default order
    });

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-gray-900">Service Categories</h2>
            <p className="text-sm text-gray-500">Manage available services.</p>
         </div>
         <button 
           onClick={() => handleOpenServiceModal()}
           className="bg-dubai-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors"
        >
           + Add Category
        </button>
      </div>
      
      <FilterToolbar />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-4"><TableSkeleton rows={5} /></div> : (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
             <tr>
               <SortableHeader label="Name" sortKey="name" currentSort={sortOption} onSort={handleHeaderSort} />
               <th className="px-6 py-4">Description</th>
               <th className="px-6 py-4 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredServices.length > 0 ? filteredServices.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                   <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                   <td className="px-6 py-4 text-gray-500">{s.description}</td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                         <button onClick={() => handleOpenServiceModal(s)} className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         <button onClick={(e) => handleDeleteService(e, s.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                   </td>
                </tr>
             )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400 bg-gray-50/50">
                    <div className="flex flex-col items-center">
                      <span>No service categories found.</span>
                    </div>
                  </td>
                </tr>
             )}
          </tbody>
        </table>
        )}
      </div>
    </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Site Configuration</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
        <form onSubmit={handleUpdateSettings} className="space-y-5">
          {/* ... settings fields ... */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
            <input 
              type="text" 
              value={settingsForm.siteName} 
              onChange={(e) => setSettingsForm({...settingsForm, siteName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
            />
          </div>
          {/* ... other settings ... */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input 
              type="email" 
              value={settingsForm.contactEmail} 
              onChange={(e) => setSettingsForm({...settingsForm, contactEmail: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="block text-sm font-medium text-gray-700">Maintenance Mode</span>
              <span className="text-xs text-gray-500">Disable access for non-admins</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settingsForm.maintenanceMode} 
                onChange={(e) => setSettingsForm({...settingsForm, maintenanceMode: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dubai-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dubai-gold"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="block text-sm font-medium text-gray-700">Allow New Registrations</span>
              <span className="text-xs text-gray-500">Enable new users to sign up</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settingsForm.allowNewRegistrations} 
                onChange={(e) => setSettingsForm({...settingsForm, allowNewRegistrations: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dubai-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Hero Banner Configuration</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                    <FileUploader 
                        label="Hero Background" 
                        currentImageUrl={settingsForm.heroImage} 
                        onUploadComplete={(url) => setSettingsForm({...settingsForm, heroImage: url})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                    <input 
                        type="text" 
                        value={settingsForm.heroTitle || ''} 
                        onChange={(e) => setSettingsForm({...settingsForm, heroTitle: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
                        placeholder="e.g. Golden Visa AE"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input 
                        type="text" 
                        value={settingsForm.heroSubtitle || ''} 
                        onChange={(e) => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
                        placeholder="e.g. Secure your residency..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input 
                        type="text" 
                        value={settingsForm.heroButtonText || ''} 
                        onChange={(e) => setSettingsForm({...settingsForm, heroButtonText: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
                        placeholder="e.g. Post Request"
                    />
                </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="px-6 py-2 bg-dubai-dark text-white font-bold rounded-lg hover:bg-black transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Security & Communications</h2>
      {/* ... broadcast form ... */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
        <h3 className="font-bold text-gray-800 mb-4">Broadcast Notification</h3>
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              type="text" 
              value={broadcastMsg.title}
              onChange={(e) => setBroadcastMsg({...broadcastMsg, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
              placeholder="e.g. System Maintenance"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea 
              rows={3}
              value={broadcastMsg.message}
              onChange={(e) => setBroadcastMsg({...broadcastMsg, message: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none resize-none"
              placeholder="Message to all users..."
              required
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
            Send Broadcast
          </button>
        </form>
      </div>
    </div>
  );

  const renderReviews = () => {
    // Flatten and Filter
    let allReviews = providers.flatMap(p => 
        (p.reviews || []).map(r => ({
            ...r,
            providerName: p.name,
            providerId: p.id
        }))
    );

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        allReviews = allReviews.filter(r => 
            r.content.toLowerCase().includes(lower) || 
            r.author.toLowerCase().includes(lower) || 
            r.providerName.toLowerCase().includes(lower)
        );
    }

    allReviews.sort((a, b) => {
        if (sortOption === 'provider_asc') return a.providerName.localeCompare(b.providerName);
        if (sortOption === 'provider_desc') return b.providerName.localeCompare(a.providerName);
        if (sortOption === 'reviewer_asc') return a.author.localeCompare(b.author);
        if (sortOption === 'reviewer_desc') return b.author.localeCompare(a.author);
        if (sortOption === 'rating_high') return b.rating - a.rating;
        if (sortOption === 'rating_low') return a.rating - b.rating;
        
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOption === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Review Moderation</h2>
            <FilterToolbar />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? <div className="p-4"><TableSkeleton rows={5} /></div> : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <SortableHeader label="Provider" sortKey="provider" currentSort={sortOption} onSort={handleHeaderSort} />
                            <SortableHeader label="Reviewer" sortKey="reviewer" currentSort={sortOption} onSort={handleHeaderSort} />
                            <SortableHeader label="Rating" sortKey="rating" currentSort={sortOption} onSort={handleHeaderSort} />
                            <th className="px-6 py-4">Comment</th>
                            <SortableHeader label="Date" sortKey="date" currentSort={sortOption} onSort={handleHeaderSort} />
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allReviews.length > 0 ? allReviews.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{r.providerName}</td>
                                <td className="px-6 py-4 text-gray-500">{r.author}</td>
                                <td className="px-6 py-4">
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 truncate max-w-xs" title={r.content}>{r.content}</td>
                                <td className="px-6 py-4 text-gray-400 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDeleteReview(r.providerId, r.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete Review"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No reviews found.</td></tr>
                        )}
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
  };

  const renderAudit = () => {
    let filteredLogs = auditLogs.filter(l => 
        !searchTerm || 
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredLogs.sort((a, b) => {
        if (sortOption === 'action_asc') return a.action.localeCompare(b.action);
        if (sortOption === 'action_desc') return b.action.localeCompare(a.action);
        if (sortOption === 'role_asc') return (a.userRole || '').localeCompare(b.userRole || '');
        if (sortOption === 'role_desc') return (b.userRole || '').localeCompare(a.userRole || '');

        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOption === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">System Logs</h2>
          <button onClick={() => setAuditLogs([])} className="text-xs text-gray-400 hover:text-red-500">Clear Local View</button>
       </div>
       <FilterToolbar />
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? <div className="p-4"><TableSkeleton rows={8} /></div> : (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <tr>
                  <SortableHeader label="Timestamp" sortKey="date" currentSort={sortOption} onSort={handleHeaderSort} />
                  <SortableHeader label="Action" sortKey="action" currentSort={sortOption} onSort={handleHeaderSort} />
                  <SortableHeader label="Role" sortKey="role" currentSort={sortOption} onSort={handleHeaderSort} />
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 font-mono">
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                       {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{log.action}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            log.userRole === 'PROVIDER' ? 'bg-blue-100 text-blue-700' :
                            log.userRole === 'GUEST' ? 'bg-gray-200 text-gray-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                           {log.userRole || 'USER'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-[100px]" title={log.adminId}>{log.adminId}</td>
                    <td className={`px-6 py-4 ${log.severity === 'critical' ? 'text-red-600 font-bold' : (log.severity === 'warning' ? 'text-orange-600' : 'text-gray-600')}`}>
                      {log.details}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No logs match your filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
            )}
         </div>
       </div>
    </div>
    );
  };

  const renderAiInsights = () => {
      let filteredAiLogs = aiLogs.filter(l => 
          !searchTerm || 
          l.query.toLowerCase().includes(searchTerm.toLowerCase()) || 
          l.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filteredAiLogs.sort((a, b) => {
          if (sortOption === 'user_asc') return a.userName.localeCompare(b.userName);
          if (sortOption === 'user_desc') return b.userName.localeCompare(a.userName);

          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return sortOption === 'oldest' ? dateA - dateB : dateB - dateA;
      });

      return (
      <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">AI Interactions</h2>
          <FilterToolbar />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                  {isLoading ? <div className="p-4"><TableSkeleton rows={5} /></div> : (
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm border-b border-gray-100">
                      <tr>
                          <SortableHeader label="Time" sortKey="date" currentSort={sortOption} onSort={handleHeaderSort} />
                          <SortableHeader label="User" sortKey="user" currentSort={sortOption} onSort={handleHeaderSort} />
                          <th className="px-6 py-4">Query</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                      {filteredAiLogs.length > 0 ? filteredAiLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900">{log.userName}</div>
                                  <div className="text-xs text-gray-400 font-mono">{log.userId.slice(0, 8)}...</div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                  "{log.query}"
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No AI interactions match.</td></tr>
                      )}
                      </tbody>
                  </table>
                  )}
              </div>
          </div>
      </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {activeSection === 'overview' && renderOverview()}
      {activeSection === 'users' && renderUsers()}
      {activeSection === 'requests' && renderRequests()}
      {activeSection === 'services' && renderServices()}
      {activeSection === 'settings' && renderSettings()}
      {activeSection === 'security' && renderSecurity()}
      {activeSection === 'reviews' && renderReviews()}
      {activeSection === 'audit' && renderAudit()}
      {activeSection === 'ai-insights' && renderAiInsights()}
      
      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
             <h3 className="text-lg font-bold mb-4">{editingUser ? 'Edit User' : 'Create User'}</h3>
             <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-700">Name</label>
                   <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-700">Email</label>
                   <input type="email" className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Password</label>
                    <input type="password" className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                  </div>
                )}
                <div>
                   <label className="block text-xs font-bold text-gray-700">Role</label>
                   <select className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.PROVIDER}>Provider</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                   </select>
                </div>
                {userForm.role === UserRole.PROVIDER && (
                   <div>
                     <label className="block text-xs font-bold text-gray-700">Company Name</label>
                     <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={userForm.companyName} onChange={e => setUserForm({...userForm, companyName: e.target.value})} required />
                   </div>
                )}
                <div className="flex justify-end gap-2 mt-6">
                   <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">Cancel</button>
                   <button type="submit" className="px-4 py-2 bg-dubai-gold text-white rounded text-sm font-bold hover:bg-yellow-600">Save</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
             <h3 className="text-lg font-bold mb-4">{editingServiceId ? 'Edit Service Category' : 'Add Service Category'}</h3>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                   <input 
                     type="text" 
                     value={newService.name} 
                     onChange={(e) => setNewService({...newService, name: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                   <textarea 
                     rows={3}
                     value={newService.description} 
                     onChange={(e) => setNewService({...newService, description: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dubai-gold outline-none resize-none"
                   />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                   <button onClick={() => setShowServiceModal(false)} className="px-4 py-2 border border-gray-300 text-gray-600 font-bold text-sm rounded-lg hover:bg-gray-50">
                      Cancel
                   </button>
                   <button onClick={handleSaveService} className="px-4 py-2 bg-dubai-dark text-white font-bold text-sm rounded-lg hover:bg-black">
                      {editingServiceId ? 'Update' : 'Add'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Provider Modal */}
      {showProviderModal && editingProvider && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Manage Provider Storefront</h3>
                  <button onClick={() => setShowProviderModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               <form onSubmit={handleSaveProvider} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700">Display Name</label>
                        <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={providerForm.name} onChange={e => setProviderForm({...providerForm, name: e.target.value})} required />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700">Tagline</label>
                        <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={providerForm.tagline} onChange={e => setProviderForm({...providerForm, tagline: e.target.value})} />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-700">Description</label>
                     <textarea className="w-full border border-gray-300 rounded p-2 text-sm mt-1" rows={3} value={providerForm.description} onChange={e => setProviderForm({...providerForm, description: e.target.value})} />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-700">Location</label>
                     <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm mt-1" value={providerForm.location} onChange={e => setProviderForm({...providerForm, location: e.target.value})} />
                  </div>

                  {/* Badges */}
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2">Badges</label>
                     <div className="flex flex-wrap gap-2 mb-2">
                        {providerForm.badges.map((b, i) => (
                           <span key={i} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                              {b}
                              <button type="button" onClick={() => setProviderForm({...providerForm, badges: providerForm.badges.filter((_, idx) => idx !== i)})} className="hover:text-red-600">×</button>
                           </span>
                        ))}
                     </div>
                     <div className="flex gap-2">
                        <input type="text" className="flex-1 border border-gray-300 rounded p-2 text-sm" placeholder="Add badge (e.g. Top Rated)" value={newBadge} onChange={e => setNewBadge(e.target.value)} />
                        <button type="button" onClick={() => { if(newBadge) { setProviderForm({...providerForm, badges: [...providerForm.badges, newBadge]}); setNewBadge(''); }}} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold">Add</button>
                     </div>
                  </div>

                  {/* Service Categories */}
                  <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">Assigned Service Categories</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          {serviceTypes.map(st => (
                              <label key={st.id} className="flex items-center gap-2 text-sm">
                                  <input 
                                    type="checkbox" 
                                    checked={providerForm.serviceTypes.includes(st.name)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setProviderForm(prev => ({ ...prev, serviceTypes: [...prev.serviceTypes, st.name] }));
                                        } else {
                                            setProviderForm(prev => ({ ...prev, serviceTypes: prev.serviceTypes.filter(t => t !== st.name) }));
                                        }
                                    }}
                                    className="rounded text-dubai-gold focus:ring-dubai-gold"
                                  />
                                  {st.name}
                              </label>
                          ))}
                      </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                     <button type="button" onClick={() => setShowProviderModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-dubai-gold text-white rounded text-sm font-bold hover:bg-yellow-600">Save Changes</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default AdminDashboard;