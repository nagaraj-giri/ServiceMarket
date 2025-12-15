
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

export interface SiteSettings {
  siteName: string;
  contactEmail: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  // Hero Banner Config
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  heroImage?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string; // For providers
  isBlocked?: boolean;
  joinDate?: string;
  profileImage?: string;
  emailVerified?: boolean; // New field for verification status
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

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  category: string; // Changed from Enum to string to support dynamic types
  title: string;
  description: string;
  locality?: string;
  coordinates?: Coordinates; // New: Geospatial data
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
      maps?: { uri: string; title: string };
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
  services: string[]; // These are "Tags"
  serviceTypes: string[]; // These are the selected Service Categories
  isVerified: boolean;
  location: string;
  coordinates?: Coordinates; // New: Geospatial data
  reviews: Review[];
  profileImage?: string;
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

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  adminId: string; // ID of the user (Admin or Regular) who performed the action
  userRole?: string; // To distinguish in logs
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
}

export interface AiInteraction {
  id: string;
  userId: string;
  userName: string;
  query: string;
  timestamp: number;
}

export type AdminSection = 'overview' | 'users' | 'requests' | 'services' | 'settings' | 'security' | 'reviews' | 'audit' | 'ai-insights';

export type AnalyticsTab = 'users' | 'leads' | 'providers' | 'site';
