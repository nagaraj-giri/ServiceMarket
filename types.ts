
export enum UserRole {
  USER = 'USER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN'
}

export enum ServiceCategory {
  VISA = 'Visa Services',
  BUSINESS = 'Business Setup',
  TRAVEL = 'Travel Packages'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string; // For providers
}

export interface Quote {
  id: string;
  providerId: string;
  providerName: string;
  price: number;
  currency: string;
  timeline: string;
  description: string;
  rating: number;
  verified: boolean;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ServiceRequest {
  id: string;
  userId: string;
  category: ServiceCategory;
  title: string;
  description: string;
  locality?: string;
  status: 'open' | 'quoted' | 'accepted' | 'closed';
  createdAt: string;
  quotes: Quote[];
  isDeleted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  groundingMetadata?: {
    groundingChunks: Array<{
      web?: { uri: string; title: string };
    }>;
  };
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
}

export interface ProviderProfile {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  badges: string[];
  description: string;
  services: string[];
  isVerified: boolean;
  location: string;
  reviews: Review[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string; // e.g. "dashboard"
}
