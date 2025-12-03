import { ServiceRequest, ProviderProfile, UserRole, Quote, Review, ServiceCategory } from '../types';

// Storage Keys
const KEYS = {
  REQUESTS: 'dubailink_requests',
  PROVIDERS: 'dubailink_providers',
  CHATS: 'dubailink_chats'
};

// Simulated Network Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Seed Data ---

const SEED_PROVIDERS: ProviderProfile[] = [
  {
    id: 'prov_1',
    name: 'Elite Visa Services',
    tagline: 'Premium PRO Services & Visa Assistance',
    rating: 4.8,
    reviewCount: 124,
    badges: ['Top Rated', 'Verified PRO', 'Golden Visa Specialist'],
    isVerified: true,
    description: 'We specialize in handling complex visa requirements for investors, entrepreneurs, and families. Our team has over 15 years of experience in Dubai government relations.',
    services: ['Golden Visa', 'Family Sponsorship', 'Investor Visa', 'Trade License Renewal', 'Document Attestation'],
    location: 'Business Bay, Dubai',
    reviews: [
      { id: 'r1', author: 'Sarah J.', rating: 5, content: 'Excellent service! Got my Golden Visa sorted in record time.', date: '2024-12-10' },
      { id: 'r2', author: 'Ahmed K.', rating: 4, content: 'Very professional, though slightly expensive.', date: '2024-11-22' }
    ]
  },
  {
    id: 'prov_2',
    name: 'FastTrack PRO',
    tagline: 'Fast, Reliable, Affordable',
    rating: 4.2,
    reviewCount: 56,
    badges: ['Fast Response', 'Budget Friendly'],
    isVerified: true,
    description: 'FastTrack PRO focuses on efficiency and cost-effectiveness for startups and SMEs. We handle licensing and employee visas.',
    services: ['Freelance Visa', 'Company Formation', 'Employee Visas', 'PRO Services'],
    location: 'Deira, Dubai',
    reviews: [
      { id: 'r3', author: 'Mike T.', rating: 5, content: 'Great for budget conscious startups.', date: '2025-01-05' }
    ]
  }
];

const SEED_REQUESTS: ServiceRequest[] = [
  {
    id: 'req_1',
    userId: 'user_1',
    category: ServiceCategory.VISA,
    title: 'Golden Visa Inquiry',
    description: 'Looking for assistance with Golden Visa application for real estate investor category.',
    status: 'quoted',
    locality: 'Palm Jumeirah',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    quotes: [
      {
        id: 'q1',
        providerId: 'prov_1',
        providerName: 'Elite Visa Services',
        price: 15000,
        currency: 'AED',
        timeline: '10 Days',
        description: 'All inclusive package for 10-year Golden Visa including medical and Emirates ID.',
        rating: 4.8,
        verified: true,
        status: 'pending'
      },
      {
        id: 'q2',
        providerId: 'prov_2',
        providerName: 'FastTrack PRO',
        price: 12500,
        currency: 'AED',
        timeline: '14 Days',
        description: 'Standard processing including all government fees.',
        rating: 4.2,
        verified: true,
        status: 'pending'
      }
    ]
  },
  {
    id: 'req_2',
    userId: 'user_1',
    category: ServiceCategory.BUSINESS,
    title: 'E-commerce License Setup',
    description: 'Need a license for an online clothing store. Preference for Dubai South or Meydan Freezone.',
    status: 'open',
    locality: 'Dubai South',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    quotes: []
  }
];

// --- API Service ---

export const api = {
  // Initialize data if empty
  init: () => {
    if (!localStorage.getItem(KEYS.PROVIDERS)) {
      localStorage.setItem(KEYS.PROVIDERS, JSON.stringify(SEED_PROVIDERS));
    }
    if (!localStorage.getItem(KEYS.REQUESTS)) {
      localStorage.setItem(KEYS.REQUESTS, JSON.stringify(SEED_REQUESTS));
    }
  },

  // Providers
  getProviders: async (): Promise<ProviderProfile[]> => {
    await delay(500);
    const data = localStorage.getItem(KEYS.PROVIDERS);
    return data ? JSON.parse(data) : [];
  },

  updateProvider: async (providerId: string, updates: Partial<ProviderProfile>): Promise<ProviderProfile> => {
    await delay(800);
    const providers: ProviderProfile[] = JSON.parse(localStorage.getItem(KEYS.PROVIDERS) || '[]');
    const index = providers.findIndex(p => p.id === providerId);
    if (index === -1) throw new Error('Provider not found');
    
    const updatedProvider = { ...providers[index], ...updates };
    providers[index] = updatedProvider;
    localStorage.setItem(KEYS.PROVIDERS, JSON.stringify(providers));
    return updatedProvider;
  },

  addReview: async (providerId: string, reviewData: Omit<Review, 'id' | 'date'>): Promise<ProviderProfile> => {
    await delay(800);
    const providers: ProviderProfile[] = JSON.parse(localStorage.getItem(KEYS.PROVIDERS) || '[]');
    const index = providers.findIndex(p => p.id === providerId);
    if (index === -1) throw new Error('Provider not found');

    const provider = providers[index];
    const newReview: Review = {
      id: `r_${Date.now()}`,
      date: new Date().toISOString(),
      ...reviewData
    };

    const newReviews = [newReview, ...provider.reviews];
    const newCount = provider.reviewCount + 1;
    // Calculate new average rating
    const totalRating = (provider.rating * provider.reviewCount) + reviewData.rating;
    const newRating = totalRating / newCount;

    const updatedProvider = {
      ...provider,
      reviews: newReviews,
      reviewCount: newCount,
      rating: newRating
    };

    providers[index] = updatedProvider;
    localStorage.setItem(KEYS.PROVIDERS, JSON.stringify(providers));
    return updatedProvider;
  },

  // Requests
  getRequests: async (): Promise<ServiceRequest[]> => {
    await delay(600);
    const data = localStorage.getItem(KEYS.REQUESTS);
    // Return sorted by date desc
    const requests: ServiceRequest[] = data ? JSON.parse(data) : [];
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createRequest: async (reqData: Omit<ServiceRequest, 'id' | 'status' | 'quotes' | 'createdAt'>): Promise<ServiceRequest> => {
    await delay(1000);
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    
    const newRequest: ServiceRequest = {
      id: `req_${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      quotes: [],
      ...reqData
    };

    localStorage.setItem(KEYS.REQUESTS, JSON.stringify([newRequest, ...requests]));
    return newRequest;
  },

  // Quotes
  submitQuote: async (requestId: string, provider: ProviderProfile, quoteData: { price: number, timeline: string, description: string }): Promise<ServiceRequest> => {
    await delay(1000);
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Request not found');

    const newQuote: Quote = {
      id: `q_${Date.now()}`,
      providerId: provider.id,
      providerName: provider.name,
      verified: provider.isVerified,
      rating: provider.rating,
      price: quoteData.price,
      currency: 'AED',
      timeline: quoteData.timeline,
      description: quoteData.description,
      status: 'pending'
    };

    const updatedRequest = { ...requests[reqIndex] };
    updatedRequest.quotes = [...updatedRequest.quotes, newQuote];
    updatedRequest.status = 'quoted'; // Update status

    requests[reqIndex] = updatedRequest;
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
    return updatedRequest;
  },

  acceptQuote: async (requestId: string, quoteId: string): Promise<ServiceRequest> => {
    await delay(800);
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Request not found');

    const updatedRequest = { ...requests[reqIndex] };
    updatedRequest.status = 'accepted';
    
    updatedRequest.quotes = updatedRequest.quotes.map(q => ({
      ...q,
      status: q.id === quoteId ? 'accepted' : 'rejected'
    }));

    requests[reqIndex] = updatedRequest;
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
    return updatedRequest;
  },

  completeOrder: async (requestId: string): Promise<ServiceRequest> => {
    await delay(1000);
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Request not found');

    const updatedRequest = { ...requests[reqIndex] };
    updatedRequest.status = 'closed';

    requests[reqIndex] = updatedRequest;
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
    return updatedRequest;
  }
};

// Initialize on load
api.init();
