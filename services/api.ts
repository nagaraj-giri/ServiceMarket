
import { ServiceRequest, ProviderProfile, UserRole, Quote, Review, ServiceCategory, User, DirectMessage, Conversation, Notification } from '../types';

// Storage Keys
const KEYS = {
  REQUESTS: 'dubailink_requests',
  PROVIDERS: 'dubailink_providers',
  USERS: 'dubailink_users',
  CURRENT_USER: 'dubailink_current_user',
  CHATS: 'dubailink_chats',
  NOTIFICATIONS: 'dubailink_notifications'
};

// Simulated Network Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Seed Data ---

const SEED_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    role: UserRole.USER
  },
  {
    id: 'prov_1',
    name: 'Elite Visa Services',
    email: 'contact@elitevisa.ae',
    role: UserRole.PROVIDER,
    companyName: 'Elite Visa Services'
  }
];

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
    ],
    isDeleted: false
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
    quotes: [],
    isDeleted: false
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
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
  },

  // Auth Methods
  login: async (email: string): Promise<User> => {
    await delay(800);
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('User not found. Try "sarah@example.com" or "contact@elitevisa.ae"');
    }
    
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  register: async (userData: Omit<User, 'id'>): Promise<User> => {
    await delay(1000);
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: userData.role === UserRole.PROVIDER ? `prov_${Date.now()}` : `user_${Date.now()}`,
      ...userData
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    
    // If provider, create a basic profile too
    if (userData.role === UserRole.PROVIDER) {
      const providers: ProviderProfile[] = JSON.parse(localStorage.getItem(KEYS.PROVIDERS) || '[]');
      const newProvider: ProviderProfile = {
        id: newUser.id,
        name: userData.companyName || userData.name,
        tagline: 'New Service Provider',
        rating: 0,
        reviewCount: 0,
        badges: ['New'],
        isVerified: false,
        description: 'No description yet.',
        services: [],
        location: 'Dubai, UAE',
        reviews: []
      };
      providers.push(newProvider);
      localStorage.setItem(KEYS.PROVIDERS, JSON.stringify(providers));
    }

    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  },

  logout: async (): Promise<void> => {
    await delay(200);
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
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

    // Notify Provider
    api.createNotification({
      userId: providerId,
      type: 'info',
      title: 'New Review',
      message: `${reviewData.author} rated you ${reviewData.rating} stars.`
    });

    return updatedProvider;
  },

  // Requests
  getRequests: async (): Promise<ServiceRequest[]> => {
    const data = localStorage.getItem(KEYS.REQUESTS);
    const requests: ServiceRequest[] = data ? JSON.parse(data) : [];
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createRequest: async (reqData: Omit<ServiceRequest, 'id' | 'status' | 'quotes' | 'createdAt'>): Promise<ServiceRequest> => {
    await delay(500);
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    
    const newRequest: ServiceRequest = {
      id: `req_${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      quotes: [],
      isDeleted: false,
      ...reqData
    };

    localStorage.setItem(KEYS.REQUESTS, JSON.stringify([newRequest, ...requests]));
    return newRequest;
  },

  // Permanent delete with 0 delay for instant UI feedback
  permanentDeleteRequest: async (requestId: string): Promise<void> => {
    // Immediate action
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    const filteredRequests = requests.filter(r => r.id !== requestId);
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(filteredRequests));
    return Promise.resolve();
  },

  // Quotes
  submitQuote: async (requestId: string, provider: ProviderProfile, quoteData: { price: number, timeline: string, description: string }): Promise<ServiceRequest> => {
    await delay(500);
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

    // Notify User
    api.createNotification({
      userId: updatedRequest.userId,
      type: 'info',
      title: 'New Quote Received',
      message: `${provider.name} sent a quote of AED ${quoteData.price} for "${updatedRequest.title}".`,
      link: 'dashboard'
    });

    return updatedRequest;
  },

  acceptQuote: async (requestId: string, quoteId: string): Promise<ServiceRequest> => {
    await delay(500);
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Request not found');

    const updatedRequest = { ...requests[reqIndex] };
    const acceptedQuote = updatedRequest.quotes.find(q => q.id === quoteId);

    updatedRequest.status = 'accepted';
    
    updatedRequest.quotes = updatedRequest.quotes.map(q => ({
      ...q,
      status: q.id === quoteId ? 'accepted' : 'rejected'
    }));

    requests[reqIndex] = updatedRequest;
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));

    // Notify Provider
    if (acceptedQuote) {
      api.createNotification({
        userId: acceptedQuote.providerId,
        type: 'success',
        title: 'Quote Accepted!',
        message: `Your quote for "${updatedRequest.title}" was accepted.`,
        link: 'dashboard'
      });
    }

    return updatedRequest;
  },

  completeOrder: async (requestId: string): Promise<ServiceRequest> => {
    await delay(500);
    const requests: ServiceRequest[] = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Request not found');

    const updatedRequest = { ...requests[reqIndex] };
    updatedRequest.status = 'closed';

    const acceptedQuote = updatedRequest.quotes.find(q => q.status === 'accepted');

    requests[reqIndex] = updatedRequest;
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));

    // Notify Provider
    if (acceptedQuote) {
       api.createNotification({
        userId: acceptedQuote.providerId,
        type: 'success',
        title: 'Order Confirmed',
        message: `Payment confirmed for "${updatedRequest.title}". You can start the service.`,
        link: 'dashboard'
      });
    }

    return updatedRequest;
  },

  // Chat / Messages
  getMessages: async (userId: string, otherUserId: string): Promise<DirectMessage[]> => {
    const allChats: DirectMessage[] = JSON.parse(localStorage.getItem(KEYS.CHATS) || '[]');
    return allChats.filter(msg => 
      (msg.senderId === userId && msg.recipientId === otherUserId) ||
      (msg.senderId === otherUserId && msg.recipientId === userId)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },

  sendMessage: async (senderId: string, recipientId: string, content: string): Promise<DirectMessage> => {
    const allChats: DirectMessage[] = JSON.parse(localStorage.getItem(KEYS.CHATS) || '[]');
    const newMessage: DirectMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      recipientId,
      content,
      timestamp: Date.now(),
      read: false
    };

    allChats.push(newMessage);
    localStorage.setItem(KEYS.CHATS, JSON.stringify(allChats));

    // Notify Recipient (simplified, ideally we check online status or debounce)
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const sender = users.find((u: User) => u.id === senderId);
    const senderName = sender?.name || 'User';

    api.createNotification({
      userId: recipientId,
      type: 'info',
      title: 'New Message',
      message: `${senderName} sent you a message.`,
      link: 'dashboard'
    });

    return newMessage;
  },

  getConversations: async (userId: string): Promise<Conversation[]> => {
    const allChats: DirectMessage[] = JSON.parse(localStorage.getItem(KEYS.CHATS) || '[]');
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const providers: ProviderProfile[] = JSON.parse(localStorage.getItem(KEYS.PROVIDERS) || '[]');
    
    // Group by other participant
    const groups: { [key: string]: DirectMessage[] } = {};
    
    allChats.forEach(msg => {
        if (msg.senderId === userId || msg.recipientId === userId) {
            const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
            if (!groups[otherId]) groups[otherId] = [];
            groups[otherId].push(msg);
        }
    });

    const conversations: Conversation[] = Object.keys(groups).map(otherId => {
        const msgs = groups[otherId].sort((a, b) => b.timestamp - a.timestamp); // Descending
        const lastMsg = msgs[0];
        const unreadCount = msgs.filter(m => m.recipientId === userId && !m.read).length;
        
        let name = 'Unknown User';
        const userObj = users.find(u => u.id === otherId);
        if (userObj) name = userObj.name;
        else {
             const provObj = providers.find(p => p.id === otherId);
             if (provObj) name = provObj.name;
        }

        return {
            otherUserId: otherId,
            otherUserName: name,
            lastMessage: lastMsg.content,
            timestamp: lastMsg.timestamp,
            unreadCount
        };
    });

    return conversations.sort((a, b) => b.timestamp - a.timestamp);
  },

  // Notifications
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
    return all.filter((n: Notification) => n.userId === userId).sort((a: Notification, b: Notification) => b.timestamp - a.timestamp);
  },

  createNotification: async (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      read: false,
      ...data
    };
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([newNotif, ...all]));
  },

  markNotificationAsRead: async (notificationId: string) => {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
    const updated = all.map((n: Notification) => n.id === notificationId ? { ...n, read: true } : n);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  markAllNotificationsAsRead: async (userId: string) => {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
    const updated = all.map((n: Notification) => n.userId === userId ? { ...n, read: true } : n);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  }
};

api.init();
