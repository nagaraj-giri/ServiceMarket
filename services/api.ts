import { db, auth, storage } from './firebase';
import { 
  collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, addDoc, Timestamp, writeBatch, arrayUnion, arrayRemove, increment 
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
    // FIX: Deleting Auth user requires Admin SDK, but we will cleanup Firestore data to prevent orphans
    const batch = writeBatch(db);

    // 1. Delete User Profile
    batch.delete(doc(db, "users", userId));

    // 2. Delete Provider Profile (if exists)
    batch.delete(doc(db, "providers", userId));

    // 3. Delete Requests made by User
    const reqQ = query(collection(db, "requests"), where("userId", "==", userId));
    const reqSnap = await getDocs(reqQ);
    reqSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
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

  getRequests: async (user: User, allProviders: ProviderProfile[]): Promise<ServiceRequest[]> => {
    let q;
    if (user.role === UserRole.USER) {
        q = query(collection(db, "requests"), where("userId", "==", user.id));
    } else {
        q = query(collection(db, "requests"));
    }
    const snapshot = await getDocs(q);
    let reqs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ServiceRequest));

    // If the user is a provider, filter requests to match their services
    if (user.role === UserRole.PROVIDER) {
        const provider = allProviders.find(p => p.id === user.id);
        if (provider && provider.serviceTypes) {
            reqs = reqs.filter(req => 
                provider.serviceTypes.some(st => st.toLowerCase() === req.category.toLowerCase())
            );
        }
    }

    return reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    // Security: Only authenticated providers can submit.
    const currentUser = await api.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.PROVIDER || currentUser.id !== provider.id) {
        throw new Error("Unauthorized: You must be a logged-in provider to submit a quote.");
    }

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

  // --- MESSAGES (Optimized with Conversations) ---

  getConversations: async (userId: string): Promise<Conversation[]> => {
    // Optimization: Fetch from dedicated 'conversations' collection
    const q = query(
        collection(db, "conversations"), 
        where("participants", "array-contains", userId)
    );
    const snapshot = await getDocs(q);
    
    const convos = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const otherUserId = data.participants.find((p: string) => p !== userId) || 'unknown';
        const unreadKey = `unreadCount_${userId}`;
        
        let otherUserName = 'User';
        // Fetch name (could be cached in real app)
        const uSnap = await getDoc(doc(db, "users", otherUserId));
        if (uSnap.exists()) otherUserName = uSnap.data().name;

        return {
            otherUserId,
            otherUserName,
            lastMessage: data.lastMessage,
            timestamp: data.timestamp,
            unreadCount: data[unreadKey] || 0
        } as Conversation;
    }));

    return convos.sort((a, b) => b.timestamp - a.timestamp);
  },

  getMessages: async (userId: string, otherId: string): Promise<DirectMessage[]> => {
      // Direct message fetch
      const q1 = query(collection(db, "messages"), where("senderId", "==", userId), where("recipientId", "==", otherId));
      const q2 = query(collection(db, "messages"), where("senderId", "==", otherId), where("recipientId", "==", userId));
      
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const allMsgs = [...s1.docs, ...s2.docs].map(d => ({id: d.id, ...d.data()} as DirectMessage));
      
      // Reset unread count for current user in conversation
      const sortedIds = [userId, otherId].sort().join("_");
      const convRef = doc(db, "conversations", sortedIds);
      // We do a non-blocking update to clear unread
      updateDoc(convRef, { [`unreadCount_${userId}`]: 0 }).catch(() => {});

      return allMsgs.sort((a, b) => a.timestamp - b.timestamp);
  },

  sendMessage: async (senderId: string, recipientId: string, content: string): Promise<void> => {
      const timestamp = Date.now();
      
      // 1. Add to Messages Collection
      const msg: Omit<DirectMessage, 'id'> = {
          senderId,
          recipientId,
          content,
          timestamp,
          read: false
      };
      await addDoc(collection(db, "messages"), msg);

      // 2. Update/Create Conversation Document
      const sortedIds = [senderId, recipientId].sort().join("_");
      const convRef = doc(db, "conversations", sortedIds);
      
      await setDoc(convRef, {
          participants: [senderId, recipientId],
          lastMessage: content,
          timestamp: timestamp,
          [`unreadCount_${recipientId}`]: increment(1)
      }, { merge: true });
  },

  // --- NOTIFICATIONS ---

  getNotifications: async (userId: string): Promise<Notification[]> => {
    // Client-side sort to avoid composite index requirement
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const notifs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Notification));
    
    return notifs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  },

  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    snapshot.docs.forEach(d => {
        if (d.data().read === false) {
            batch.update(d.ref, { read: true });
            updateCount++;
        }
    });
    
    if (updateCount > 0) {
        await batch.commit();
    }
  },

  broadcastNotification: async (title: string, message: string): Promise<void> => {
      await api.logAction("system", "BROADCAST", `Sent: ${title}`, "ADMIN", "info");
      
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
     const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
     await uploadBytes(storageRef, file);
     return await getDownloadURL(storageRef);
  },

  // --- HELPERS ---

  matchProviderToRequest: (provider: ProviderProfile, request: ServiceRequest): boolean => {
      // FIX: Case-insensitive matching logic
      const reqCategory = request.category.toLowerCase();
      const hasCategory = provider.serviceTypes?.some(t => t.toLowerCase() === reqCategory);
      
      if (!hasCategory) return false;
      
      // Simple location check (if strings overlap)
      if (request.locality && provider.location) {
         // This is weak matching, but good for MVP.
         // If provider says "Dubai", they match everything in Dubai potentially.
         return true; 
      }
      
      return true;
  },

  shouldNotifyToRefineCriteria: (req: ServiceRequest): boolean => {
      const hoursSincePost = (Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSincePost > 24 && req.quotes.length === 0;
  }
};