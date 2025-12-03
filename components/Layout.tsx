import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRole, setActiveRole, currentPage, setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="w-8 h-8 bg-dubai-gold rounded-lg mr-2 flex items-center justify-center text-white font-bold">D</div>
              <span className="text-xl font-bold text-dubai-dark tracking-tight">Dubai<span className="text-dubai-gold">Link</span></span>
            </div>
            
            <div className="hidden sm:flex items-center space-x-8">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`${currentPage === 'home' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setCurrentPage('ai-assistant')}
                className={`${currentPage === 'ai-assistant' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16 flex items-center gap-1`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Ask AI Guide
              </button>
              <button 
                onClick={() => setCurrentPage('dashboard')}
                className={`${currentPage === 'dashboard' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16`}
              >
                My Dashboard
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Profile Icon */}
              <button 
                onClick={() => setCurrentPage('profile-settings')}
                className={`p-2 rounded-full transition-colors mr-1 ${currentPage === 'profile-settings' ? 'bg-gray-100 text-dubai-gold' : 'text-gray-400 hover:text-dubai-gold hover:bg-gray-50'}`}
                title="Edit Profile"
              >
                <span className="sr-only">Edit Profile</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              <div className="h-6 w-px bg-gray-200"></div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400">View as:</div>
                <select 
                  value={activeRole} 
                  onChange={(e) => setActiveRole(e.target.value as UserRole)}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:border-dubai-gold focus:ring focus:ring-dubai-gold focus:ring-opacity-50"
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.PROVIDER}>Provider</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dubai-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-dubai-gold mb-4">DubaiLink</h3>
              <p className="text-gray-400 text-sm">
                The trusted marketplace for premium services in Dubai. Visas, Business Setup, and Travel made simple.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Golden Visa Assistance</li>
                <li>Freezone Company Setup</li>
                <li>Mainland Licensing</li>
                <li>Luxury Travel Concierge</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400 text-sm">
                Downtown Dubai, UAE<br/>
                support@dubailink.uae
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; 2025 DubaiLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
