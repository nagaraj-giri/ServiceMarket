
import React, { useState } from 'react';

interface SubmitQuoteModalProps {
  requestTitle: string;
  onClose: () => void;
  onSubmit: (quote: { price: number; timeline: string; description: string }) => Promise<void>;
}

const SubmitQuoteModal: React.FC<SubmitQuoteModalProps> = ({ requestTitle, onClose, onSubmit }) => {
  const [price, setPrice] = useState<number | ''>('');
  const [timeline, setTimeline] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !timeline || !description) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        price: Number(price),
        timeline,
        description
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-dubai-dark p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Submit Quote</h3>
            <p className="text-xs text-gray-400 mt-1 truncate max-w-[250px]">{requestTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (AED)</label>
            <input
              type="number"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 5000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
            <input
              type="text"
              required
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="e.g. 10 Working Days"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Details</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is included in this price..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-gold outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-dubai-gold text-white rounded-lg hover:bg-yellow-600 font-medium shadow-sm flex justify-center items-center"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Send Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitQuoteModal;
