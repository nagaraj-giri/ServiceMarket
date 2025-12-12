
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface VerifyEmailPageProps {
  user: User;
  onLogout: () => void;
  onVerificationCheck: () => void;
}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ user, onLogout, onVerificationCheck }) => {
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleResend = async () => {
    setResendStatus('sending');
    setErrorMessage('');
    try {
      await api.resendVerificationEmail();
      setResendStatus('sent');
    } catch (error: any) {
      console.error("Failed to resend email", error);
      setResendStatus('error');
      
      // Detailed error handling for better debugging
      if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please wait a few minutes before resending.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage(`Domain unauthorized (${window.location.hostname}). Please add this domain to Firebase Console > Authentication > Settings.`);
      } else {
        setErrorMessage(error.message || 'Failed to send email. Please try again.');
      }
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    // Add small delay to allow Firebase to propagate status if user just clicked link
    setTimeout(async () => {
        try {
            // Force refresh of user token
            await onVerificationCheck();
        } finally {
            setIsChecking(false);
        }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-dubai-gold">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
        <p className="text-gray-500 mb-2 text-sm leading-relaxed">
          We've sent a verification link to <strong className="text-gray-900">{user.email}</strong>.<br/>
          This link is valid for <strong className="text-dubai-dark">24 hours</strong>.
        </p>
        <div className="bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-lg mb-6 inline-block font-medium">
           ⚠️ Please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleCheck}
            disabled={isChecking}
            className="w-full bg-dubai-gold text-white font-bold py-3 rounded-xl hover:bg-yellow-600 transition-colors shadow-sm flex items-center justify-center"
          >
            {isChecking ? (
                <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Checking status...
                </>
            ) : "I've Verified My Email"}
          </button>

          <div className="pt-4 border-t border-gray-100">
            {resendStatus === 'sent' ? (
                <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-600 text-sm font-bold">Email sent successfully!</p>
                    <p className="text-green-500 text-xs mt-1">Please allow a few minutes for delivery.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500">
                        Link expired or not received?{' '}
                        <button 
                            onClick={handleResend}
                            disabled={resendStatus === 'sending'}
                            className="text-dubai-blue font-bold hover:underline disabled:opacity-50"
                        >
                            {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification'}
                        </button>
                    </p>
                    {errorMessage && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded w-full border border-red-100 font-medium">
                           {errorMessage}
                        </p>
                    )}
                </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2">
            <p className="text-xs text-gray-400">Wrong email address?</p>
            <button 
                onClick={onLogout}
                className="text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors flex items-center justify-center gap-1 w-full border border-gray-200 py-2 rounded-lg hover:bg-gray-50"
            >
                Sign Out & Register Again
            </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
