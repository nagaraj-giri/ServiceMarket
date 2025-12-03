
import React, { useState } from 'react';
import { UserRole, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
  onLoginClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentPage, setCurrentPage, onLogout, onLoginClick }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
              {user && (
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className={`${currentPage === 'dashboard' ? 'text-dubai-blue border-b-2 border-dubai-blue' : 'text-gray-500 hover:text-gray-900'} px-1 pt-1 text-sm font-medium h-16`}
                >
                  My Dashboard
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                     <div className="w-8 h-8 rounded-full bg-dubai-gold text-white flex items-center justify-center font-bold text-sm">
                       {user.name.charAt(0)}
                     </div>
                     <div className="hidden md:block text-left">
                       <p className="text-sm font-medium text-gray-700 leading-none">{user.name}</p>
                       <p className="text-xs text-gray-500 mt-0.5 capitalize">{user.role.toLowerCase()}</p>
                     </div>
                     <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5 animate-in fade-in duration-150">
                        <button 
                          onClick={() => { setShowProfileMenu(false); setCurrentPage('profile-settings'); }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          {user.role === UserRole.PROVIDER ? 'Storefront Settings' : 'Profile Settings'}
                        </button>
                        <button 
                          onClick={() => { setShowProfileMenu(false); setCurrentPage('dashboard'); }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Dashboard
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button 
                          onClick={() => { setShowProfileMenu(false); onLogout(); }}
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={onLoginClick}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={onLoginClick}
                    className="bg-dubai-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
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
