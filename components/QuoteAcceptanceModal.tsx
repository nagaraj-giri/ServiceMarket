
import React, { useState, useEffect } from 'react';
import { Quote, ServiceRequest } from '../types';

interface QuoteAcceptanceModalProps {
  quote: Quote;
  requestStatus: ServiceRequest['status'];
  onAccept: () => Promise<void>;
  onPaymentComplete: (method: 'online' | 'offline') => Promise<void>;
  onClose: () => void;
}

const QuoteAcceptanceModal: React.FC<QuoteAcceptanceModalProps> = ({ quote, requestStatus, onAccept, onPaymentComplete, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');

  // Sync step with request status
  useEffect(() => {
    if (requestStatus === 'accepted') {
      setStep(2);
    } else if (requestStatus === 'closed') {
      setStep(3);
    } else {
      setStep(1);
    }
  }, [requestStatus]);

  const handleAcceptQuote = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment gateway delay for UX, then process the backend completion
    setTimeout(async () => {
      try {
        await onPaymentComplete(paymentMethod);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-dubai-dark p-6 flex justify-between items-center text-white">
          <h3 className="text-xl font-bold">
            {step === 1 && 'Review Quote'}
            {step === 2 && 'Checkout'}
            {step === 3 && 'Confirmation'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{quote.providerName}</h4>
                    <p className="text-sm text-gray-500">Service Provider</p>
                  </div>
                  {quote.verified && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Verified</span>
                  )}
                </div>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Service Cost</span>
                  <span className="font-bold text-gray-900">{quote.currency} {quote.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Timeline</span>
                  <span className="font-medium text-gray-900">{quote.timeline}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Fee (2%)</span>
                  <span className="font-medium text-gray-900">{quote.currency} {(quote.price * 0.02).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-dubai-dark">Total</span>
                  <span className="font-bold text-dubai-gold">{quote.currency} {(quote.price * 1.02).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex items-start gap-3">
                 <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>By accepting, you agree to the service terms. The request status will move to <strong>Accepted</strong>.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleAcceptQuote} 
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-dubai-gold text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-lg flex justify-center items-center"
                >
                  {isProcessing ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Accept Quote'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm">Total Amount to Pay</p>
                <p className="text-3xl font-bold text-dubai-dark mt-1">{quote.currency} {(quote.price * 1.02).toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                {/* Online Payment Option */}
                <div 
                  onClick={() => setPaymentMethod('online')}
                  className={`border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${paymentMethod === 'online' ? 'border-dubai-gold bg-yellow-50/50 ring-1 ring-dubai-gold' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-dubai-gold bg-dubai-gold' : 'border-gray-300'}`}>
                    {paymentMethod === 'online' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500">Secure online payment</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 bg-gray-200 rounded"></div>
                    <div className="w-8 h-5 bg-gray-200 rounded"></div>
                  </div>
                </div>

                 {/* Offline Payment Option */}
                 <div 
                  onClick={() => setPaymentMethod('offline')}
                  className={`border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${paymentMethod === 'offline' ? 'border-dubai-gold bg-yellow-50/50 ring-1 ring-dubai-gold' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'offline' ? 'border-dubai-gold bg-dubai-gold' : 'border-gray-300'}`}>
                    {paymentMethod === 'offline' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Pay Offline</p>
                    <p className="text-xs text-gray-500">Cash or Bank Transfer directly to provider</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>

                {paymentMethod === 'online' ? (
                  <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                    <input type="text" placeholder="Card Number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" defaultValue="4242 4242 4242 4242" />
                    <div className="flex gap-3">
                      <input type="text" placeholder="MM/YY" className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" defaultValue="12/26" />
                      <input type="text" placeholder="CVC" className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" defaultValue="123" />
                    </div>
                    <input type="text" placeholder="Cardholder Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none" defaultValue="John Doe" />
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-xl text-sm text-yellow-800 animate-in fade-in slide-in-from-top-2">
                    <p><strong>Note:</strong> You will need to coordinate payment directly with {quote.providerName}. The request will be marked as closed once you confirm this order.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={handlePayment} 
                disabled={isProcessing}
                className="w-full py-4 bg-dubai-dark text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg flex justify-center items-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                   paymentMethod === 'online' 
                   ? `Pay ${quote.currency} ${(quote.price * 1.02).toLocaleString()}`
                   : 'Confirm Order'
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {paymentMethod === 'online' ? 'Payment Successful!' : 'Order Confirmed!'}
                </h3>
                <p className="text-gray-500 mt-2">
                  You have successfully secured the service from {quote.providerName}.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
                The provider has been notified. You can now chat with them to arrange the next steps.
              </div>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-dubai-gold text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-md"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteAcceptanceModal;
