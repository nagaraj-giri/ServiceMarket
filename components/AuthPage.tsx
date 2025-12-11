import React, { useState } from 'react';
import { UserRole } from '../types';
import { api } from '../services/api';
import { ToastType } from './Toast';

interface AuthPageProps {
  onSuccess: () => void;
  showToast?: (message: string, type: ToastType) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  // Default role is USER, and we remove the ability to change it in the UI
  const role = UserRole.USER; 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isDomainError, setIsDomainError] = useState(false);
  const [errorType, setErrorType] = useState<'domain' | 'app-check' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to parse Firebase errors into user-friendly messages
  const getErrorMessage = (err: any) => {
    console.error("Auth Error Details:", err);
    
    const errorCode = err.code;
    const errorMessage = err.message || '';

    // Auth Domain Error (Check code or message string)
    if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('auth/unauthorized-domain')) {
      setIsDomainError(true);
      setErrorType('domain');
      return `Domain unauthorized. This app is running on "${window.location.hostname}" which is not whitelisted in Firebase Console.`;
    }
    
    // App Check / API Key Restrictions
    // Check various formats of the error code (with/without trailing dot)
    if (
      errorCode === 'auth/firebase-app-check-token-is-invalid' || 
      errorCode === 'auth/firebase-app-check-token-is-invalid.' || 
      errorMessage.includes('firebase-app-check-token-is-invalid')
    ) {
      setIsDomainError(true);
      setErrorType('app-check');
      return "Authentication blocked by Firebase App Check.";
    }

    setIsDomainError(false);
    setErrorType(null);

    // Common Auth Errors
    if (errorCode === 'auth/email-already-in-use') return "Email already in use. Please sign in instead.";
    if (errorCode === 'auth/wrong-password') return "Incorrect password.";
    if (errorCode === 'auth/user-not-found') return "No account found with this email.";
    if (errorCode === 'auth/weak-password') return "Password should be at least 6 characters.";
    if (errorCode === 'auth/invalid-email') return "Please enter a valid email address.";
    if (errorCode === 'auth/popup-closed-by-user') return "Sign-in popup was closed.";
    if (errorCode === 'auth/popup-blocked') return "Sign-in popup blocked. Please allow popups for this site.";

    return errorMessage || "Authentication failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsDomainError(false);
    setErrorType(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await api.login(email, password);
        onSuccess();
      } else {
        await api.register({
          name,
          email,
          role,
        }, password);
        onSuccess();
        if (showToast) showToast('Account created successfully!', 'success');
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      if (showToast) showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsDomainError(false);
    setErrorType(null);
    setIsLoading(true);
    try {
      await api.loginWithGoogle();
      onSuccess();
      if (showToast) showToast('Signed in with Google successfully!', 'success');
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      // Don't show toast for domain/config errors, the UI is better
      if (!isDomainError && showToast) showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await api.loginAsDemoUser();
      onSuccess();
      if (showToast) showToast('Logged in as Demo User (Read Only Mode)', 'success');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setIsDomainError(false);
    setErrorType(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-dubai-gold rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to DubaiLink' : 'Create Customer Account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The premier service marketplace for Dubai.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-dubai-gold focus:border-dubai-gold sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-dubai-gold focus:border-dubai-gold sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-dubai-gold focus:border-dubai-gold sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200 animate-in fade-in slide-in-from-top-1">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    
                    {isDomainError && (
                      <div className="mt-3 pt-3 border-t border-red-100">
                        {errorType === 'domain' && (
                          <div className="bg-white p-3 rounded border border-red-100 text-xs">
                            <p className="font-bold text-gray-800 mb-2">How to fix Authorized Domain:</p>
                            <ol className="list-decimal pl-4 space-y-1 text-gray-600 mb-2">
                              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Firebase Console</a></li>
                              <li>Select project: <strong>servicemarket-22498701...</strong></li>
                              <li>Navigate to <strong>Authentication</strong> &gt; <strong>Settings</strong> &gt; <strong>Authorized Domains</strong></li>
                              <li>Click <strong>Add Domain</strong> and paste this URL:</li>
                            </ol>
                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                              <code className="flex-1 font-mono text-gray-700 overflow-x-auto whitespace-nowrap">{window.location.hostname}</code>
                              <button 
                                type="button"
                                onClick={() => navigator.clipboard.writeText(window.location.hostname)} 
                                className="text-dubai-gold hover:text-yellow-600 font-bold px-2 py-1"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}

                        {errorType === 'app-check' && (
                           <div className="bg-white p-3 rounded border border-red-100 text-xs text-gray-600">
                             <p className="font-bold text-red-800 mb-1">Access Blocked by App Check</p>
                             <p>This app has App Check enabled, which rejects requests from unverified environments (like localhost or this preview).</p>
                             <p className="mt-2">To fix this in development:</p>
                             <ul className="list-disc pl-4 mt-1 space-y-1">
                               <li>Register a <strong>Debug Token</strong> in Firebase Console.</li>
                               <li>Or disable App Check enforcement temporarily.</li>
                             </ul>
                           </div>
                        )}
                        
                        <div className="mt-4">
                          <p className="text-xs text-center text-gray-500 mb-2">- OR -</p>
                          <button
                            type="button"
                            onClick={handleDemoLogin}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
                          >
                            Continue in Demo Mode (Local Only)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isDomainError && isLogin && (
               <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                 <strong>Demo Credentials:</strong><br/>
                 <div className="grid grid-cols-2 gap-x-2 mt-1">
                   <span>User:</span> <span>sarah@example.com</span>
                   <span>Provider:</span> <span>contact@elitevisa.ae</span>
                   <span>Admin:</span> <span>admin@dubailink.ae</span>
                   <span>Password:</span> <span>password123</span>
                 </div>
               </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dubai-gold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dubai-gold disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Sign Up'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                type="button"
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                <span className="ml-2">Sign in with Google</span>
              </button>
            </div>

            <div className="mt-6">
              <button
                onClick={toggleMode}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </div>
            {!isLogin && (
              <p className="mt-4 text-center text-xs text-gray-500">
                Service Providers: Please contact administration to register.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;