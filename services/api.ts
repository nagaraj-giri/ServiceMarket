import { db, auth, storage } from './firebase';
import { 
  collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, addDoc, Timestamp, writeBatch, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, 
  onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, 
  sendEmailVerification, updatePassword, User as FirebaseUser 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  User, UserRole, ServiceRequest, ProviderProfile, Notification, 
  Quote, ServiceType, Conversation, DirectMessage, AuditLog, 
  AiInteraction, SiteSettings, Review 
} from '../types';
import { DEFAULT_SERVICE_TYPES, API_DELAY } from '../constants';

// Helper to convert Firebase User to App User
const mapUser = async (fbUser: FirebaseUser): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, "users", fbUser.uid));
  if (userDoc.exists()) {
    return { id: fbUser.uid, ...(userDoc.data() as any), emailVerified: fbUser.emailVerified } as User;
  }
  return null;
};

export const api = {
  // --- AUTHENTICATION ---

  login: async (email: string, password: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = await mapUser(cred.user);
    if (!user) throw new Error("User record not found in database.");
    return user;
  },

  loginWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    
    // Check if user exists, if not create basic user
    const userRef = doc(db, "users", cred.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const newUser: User = {
        id: cred.user.uid,
        name: cred.user.displayName || 'User',
        email: cred.user.email || '',
        role: UserRole.USER,
        joinDate: new Date().toISOString(),
        emailVerified: cred.user.emailVerified
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    
    return { id: cred.user.uid, ...(userSnap.data() as any), emailVerified: cred.user.emailVerified } as User;
  },

  register: async (userData: Omit<User, 'id' | 'joinDate' | 'emailVerified'>, password: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, userData.email, password);
    await sendEmailVerification(cred.user);
    
    const newUser: User = {
      id: cred.user.uid,
      ...userData,
      joinDate: new Date().toISOString(),
      emailVerified: false
    };
    
    await setDoc(doc(db, "users", cred.user.uid), newUser);
    
    // If provider, create profile placeholder
    if (userData.role === UserRole.PROVIDER) {
      const providerProfile: ProviderProfile = {
        id: cred.user.uid,
        name: userData.companyName || userData.name,
        tagline: '',
        rating: 0,
        reviewCount: 0,
        badges: ['New'],
        description: '',
        services: [],
        serviceTypes: [],
        isVerified: false,
        location: 'Dubai, UAE',
        reviews: []
      };
      await setDoc(doc(db, "providers", cred.user.uid), providerProfile);
    }
    
    return newUser;
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  resendVerificationEmail: async (): Promise<void> => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        unsubscribe();
        if (fbUser) {
          const user = await mapUser(fbUser);
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  },

  refreshUserAuth: async (): Promise<User | null> => {
    if (auth.currentUser) {
       await auth.currentUser.reload();
       return mapUser(auth.currentUser);
    }
    return null;
  },

  updateUser: async (user: User): Promise<void> => {
    const { id, ...data } = user;
    await updateDoc(doc(db, "users", id), data);
  },

  deleteUser: async (userId: string): Promise<void> => {
    // Note: This only deletes Firestore data. Deleting Auth user requires Cloud Functions or Admin SDK.
    await deleteDoc(doc(db, "users", userId));
    await deleteDoc(doc(db, "providers", userId));
  },

  getAllUsers: async (): Promise<User[]> => {
    const q = query(collection(db, "users"), orderBy("joinDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as User));
  },

  updateUserPassword: async (password: string): Promise<void> => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, password);
    } else {
      throw new Error("No authenticated user.");
    }
  },

  // --- SERVICE TYPES ---

  getServiceTypes: async (): Promise<ServiceType[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "service_types"));
        let types = querySnapshot.docs.map(
          (d) => {
             const data = d.data();
             return { id: d.id, ...(data as any) } as ServiceType;
          }
        );

        if (types.length === 0) {
           console.log("Seeding default service types...");
           try {
               const batch = writeBatch(db);
               const createdTypes: ServiceType[] = [];
               
               for (const type of DEFAULT_SERVICE_TYPES) {
                  const docRef = doc(collection(db, "service_types"));
                  const typeData = { ...type };
                  batch.set(docRef, typeData);
                  createdTypes.push({ id: docRef.id, ...typeData } as ServiceType);
               }
               await batch.commit();
               types = createdTypes;
           } catch (err) {
               console.warn("Failed to seed service types. DB might be read-only or offline.");
               return [];
           }
        }
        return types;
    } catch (e) {
        console.warn("Error fetching service types.", e);
        return [];
    }
  },

  manageServiceType: async (serviceType: ServiceType, action: 'add' | 'update'): Promise<void> => {
    if (action === 'add') {
      const { id, ...data } = serviceType;
      // If ID looks generated by frontend, let firestore gen one, else use it
      if (id.startsWith('srv_')) {
        await addDoc(collection(db, "service_types"), data);
      } else {
        await setDoc(doc(db, "service_types", id), data);
      }
    } else {
      const { id, ...data } = serviceType;
      await updateDoc(doc(db, "service_types", id), data);
    }
  },

  deleteServiceType: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "service_types", id));
  },

  // --- REQUESTS ---

  getRequests: async (user: User): Promise<ServiceRequest[]> => {
    let q;
    if (user.role === UserRole.USER) {
      q = query(collection(db, "requests"), where("userId", "==", user.id), orderBy("createdAt", "desc"));
    } else {
      // Admins and Providers see all (filtering done on client or advanced queries)
      q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ServiceRequest));
  },

  createRequest: async (data: any): Promise<void> => {
    const req: Omit<ServiceRequest, 'id'> = {
      ...data,
      status: 'open',
      createdAt: new Date().toISOString(),
      quotes: [],
      isDeleted: false
    };
    await addDoc(collection(db, "requests"), req);
    await api.logAction(data.userId, "CREATE_REQUEST", `Created request: ${data.title}`, "USER", "info");
  },

  permanentDeleteRequest: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "requests", id));
  },

  // --- QUOTES ---

  submitQuote: async (requestId: string, provider: ProviderProfile, quoteData: any): Promise<void> => {
    const quote: Quote = {
      id: `quote_${Date.now()}`,
      providerId: provider.id,
      providerName: provider.name,
      ...quoteData,
      currency: 'AED',
      rating: provider.rating,
      verified: provider.isVerified,
      status: 'pending'
    };
    
    const reqRef = doc(db, "requests", requestId);
    await updateDoc(reqRef, {
      status: 'quoted',
      quotes: arrayUnion(quote)
    });

    await api.logAction(provider.id, "SUBMIT_QUOTE", `Submitted quote for request ${requestId}`, "PROVIDER", "info");
  },

  acceptQuote: async (requestId: string, quoteId: string): Promise<void> => {
    const reqRef = doc(db, "requests", requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) return;

    const data = reqSnap.data() as ServiceRequest;
    const updatedQuotes = data.quotes.map(q => 
      q.id === quoteId ? { ...q, status: 'accepted' as const } : { ...q, status: 'rejected' as const }
    );

    await updateDoc(reqRef, {
      status: 'accepted',
      quotes: updatedQuotes
    });
  },

  completeOrder: async (requestId: string): Promise<void> => {
    const reqRef = doc(db, "requests", requestId);
    await updateDoc(reqRef, {
      status: 'closed'
    });
  },

  // --- PROVIDERS ---

  getProviders: async (): Promise<ProviderProfile[]> => {
    const snapshot = await getDocs(collection(db, "providers"));
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ProviderProfile));
  },

  updateProvider: async (id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, "providers", id), data);
  },

  toggleProviderVerification: async (id: string): Promise<void> => {
    const ref = doc(db, "providers", id);
    const snap = await getDoc(ref);
    if(snap.exists()) {
       const current = snap.data().isVerified;
       await updateDoc(ref, { isVerified: !current });
    }
  },

  // --- REVIEWS ---

  addReview: async (providerId: string, reviewData: any): Promise<void> => {
    const review: Review = {
       id: `rev_${Date.now()}`,
       date: new Date().toISOString(),
       ...reviewData
    };
    
    const provRef = doc(db, "providers", providerId);
    const provSnap = await getDoc(provRef);
    
    if (provSnap.exists()) {
       const prov = provSnap.data() as ProviderProfile;
       const newCount = prov.reviewCount + 1;
       const newRating = ((prov.rating * prov.reviewCount) + review.rating) / newCount;
       
       await updateDoc(provRef, {
          reviews: arrayUnion(review),
          reviewCount: newCount,
          rating: newRating
       });
    }
  },

  deleteReview: async (providerId: string, reviewId: string): Promise<void> => {
      const provRef = doc(db, "providers", providerId);
      const provSnap = await getDoc(provRef);
      if(provSnap.exists()) {
          const prov = provSnap.data() as ProviderProfile;
          const review = prov.reviews.find(r => r.id === reviewId);
          if(!review) return;

          const newCount = Math.max(0, prov.reviewCount - 1);
          let newRating = 0;
          if (newCount > 0) {
             newRating = ((prov.rating * prov.reviewCount) - review.rating) / newCount;
          }

          await updateDoc(provRef, {
              reviews: arrayRemove(review),
              reviewCount: newCount,
              rating: newRating
          });
      }
  },

  // --- MESSAGES ---

  getConversations: async (userId: string): Promise<Conversation[]> => {
    // This is a simplified fetch. Real implementation would require a dedicated collection for chats.
    // We will query unique senders/recipients from messages collection for demo.
    const sentQ = query(collection(db, "messages"), where("senderId", "==", userId));
    const recQ = query(collection(db, "messages"), where("recipientId", "==", userId));
    
    const [sentSnap, recSnap] = await Promise.all([getDocs(sentQ), getDocs(recQ)]);
    const messages = [...sentSnap.docs, ...recSnap.docs].map(d => d.data() as DirectMessage);
    
    // Group by other user
    const map = new Map<string, Conversation>();
    
    messages.sort((a,b) => a.timestamp - b.timestamp);
    
    messages.forEach(m => {
        const isMe = m.senderId === userId;
        const otherId = isMe ? m.recipientId : m.senderId;
        // In a real app, use user cache or fetch it
        const conv = map.get(otherId) || { 
            otherUserId: otherId, 
            otherUserName: 'User', // Would need fetch
            lastMessage: '',
            timestamp: 0,
            unreadCount: 0
        };
        conv.lastMessage = m.content;
        conv.timestamp = m.timestamp;
        if (!isMe && !m.read) conv.unreadCount++;
        map.set(otherId, conv);
    });
    
    // Fetch names for conversations
    const convos = Array.from(map.values());
    for (const c of convos) {
        const u = await getDoc(doc(db, "users", c.otherUserId));
        if (u.exists()) c.otherUserName = u.data().name;
    }
    
    return convos.sort((a, b) => b.timestamp - a.timestamp);
  },

  getMessages: async (userId: string, otherId: string): Promise<DirectMessage[]> => {
      // Simplistic query: (sender==A && recipient==B) OR (sender==B && recipient==A)
      // Firestore doesn't support OR queries natively in this way easily without composite indexes or multiple queries.
      const q1 = query(collection(db, "messages"), where("senderId", "==", userId), where("recipientId", "==", otherId));
      const q2 = query(collection(db, "messages"), where("senderId", "==", otherId), where("recipientId", "==", userId));
      
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const allMsgs = [...s1.docs, ...s2.docs].map(d => ({id: d.id, ...d.data()} as DirectMessage));
      
      // Mark as read
      const batch = writeBatch(db);
      s2.docs.forEach(d => {
          if (!d.data().read) batch.update(d.ref, { read: true });
      });
      await batch.commit();

      return allMsgs.sort((a, b) => a.timestamp - b.timestamp);
  },

  sendMessage: async (senderId: string, recipientId: string, content: string): Promise<void> => {
      const msg: Omit<DirectMessage, 'id'> = {
          senderId,
          recipientId,
          content,
          timestamp: Date.now(),
          read: false
      };
      await addDoc(collection(db, "messages"), msg);
  },

  // --- NOTIFICATIONS ---

  getNotifications: async (userId: string): Promise<Notification[]> => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("timestamp", "desc"), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Notification));
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  },

  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  },

  broadcastNotification: async (title: string, message: string): Promise<void> => {
      // 1. Log the action
      await api.logAction("system", "BROADCAST", `Sent: ${title}`, "ADMIN", "info");
      
      // 2. Fetch all users to create individual notifications
      // Note: In production, this loop should be handled by a Cloud Function to scale.
      const usersSnap = await getDocs(collection(db, "users"));
      const batch = writeBatch(db);
      
      let operationCount = 0;
      
      usersSnap.docs.forEach(userDoc => {
          const newNotifRef = doc(collection(db, "notifications"));
          const notification: Omit<Notification, 'id'> = {
              userId: userDoc.id,
              type: 'info',
              title: title,
              message: message,
              timestamp: Date.now(),
              read: false,
              link: 'dashboard'
          };
          batch.set(newNotifRef, notification);
          operationCount++;
          
          // Firestore batches are limited to 500 operations.
          // For this frontend-only implementation, we assume < 500 users for now.
          // A real implementation would chunk this.
      });

      if (operationCount > 0) {
          await batch.commit();
      }
  },

  // --- SETTINGS ---

  getSettings: async (): Promise<SiteSettings> => {
    const docRef = doc(db, "settings", "global");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) return snapshot.data() as SiteSettings;
    return {
       siteName: 'DubaiLink',
       contactEmail: 'support@dubailink.uae',
       maintenanceMode: false,
       allowNewRegistrations: true
    };
  },

  updateSettings: async (settings: SiteSettings): Promise<void> => {
    await setDoc(doc(db, "settings", "global"), settings);
  },

  // --- LOGGING & AUDIT ---

  logAction: async (adminId: string, action: string, details: string, userRole = 'SYSTEM', severity: 'info' | 'warning' | 'critical' = 'info'): Promise<void> => {
    await addDoc(collection(db, "audit_logs"), {
        adminId, action, details, userRole, severity, timestamp: Date.now()
    });
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as AuditLog));
  },

  logAiQuery: async (userId: string, userName: string, queryText: string): Promise<void> => {
     await addDoc(collection(db, "ai_logs"), {
         userId, userName, query: queryText, timestamp: Date.now()
     });
  },

  getAiInteractions: async (): Promise<AiInteraction[]> => {
      const q = query(collection(db, "ai_logs"), orderBy("timestamp", "desc"), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as AiInteraction));
  },

  // --- FILES ---

  uploadFile: async (file: File, folder = 'uploads'): Promise<string> => {
     // Create a unique path with optional folder support
     const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
     await uploadBytes(storageRef, file);
     return await getDownloadURL(storageRef);
  },

  // --- HELPERS ---

  matchProviderToRequest: (provider: ProviderProfile, request: ServiceRequest): boolean => {
      // 1. Check if provider supports the category
      const hasCategory = provider.serviceTypes?.includes(request.category);
      if (!hasCategory) return false;
      
      // 2. Check location proximity (string match for now)
      if (request.locality && provider.location) {
         // Simple check: if provider location string is part of request locality or vice versa
         // In a real app, use Geo queries.
         // For now, if provider is in 'Dubai' generally, we might allow it unless request is very specific
         return true;
      }
      
      return true;
  },

  shouldNotifyToRefineCriteria: (req: ServiceRequest): boolean => {
      const hoursSincePost = (Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60);
      // Notify if older than 24 hours and no quotes
      return hoursSincePost > 24 && req.quotes.length === 0;
  }
};