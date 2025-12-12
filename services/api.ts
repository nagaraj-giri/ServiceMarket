
// api.ts – Modular Firebase v9+

import { auth, db, storage } from "./firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  User as FirebaseUser
} from "firebase/auth";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  User, 
  UserRole, 
  ProviderProfile, 
  ServiceRequest, 
  Quote, 
  Notification, 
  Review, 
  DirectMessage, 
  Conversation, 
  SiteSettings, 
  ServiceType, 
  AuditLog, 
  Coordinates,
  AiInteraction
} from "../types";


// --- CONSTANTS ---
const MAX_QUOTES_PER_REQUEST = 5;
const MAX_REQUEST_AGE_HOURS = 24;

// --- GEOSPATIAL HELPERS ---
const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371; // km
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLon = deg2rad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

// --- CONVERSION HELPERS ---
const convertTimestamp = (data: any) => {
  if (!data) return data;
  const newData: any = { ...data };

  Object.keys(newData).forEach((key) => {
    const value = newData[key];

    if (value && typeof value.toDate === "function") {
      newData[key] = value.toDate().toISOString();
    } else if (Array.isArray(value)) {
      newData[key] = value.map((item: any) => convertTimestamp(item));
    } else if (typeof value === "object" && value !== null) {
      newData[key] = convertTimestamp(value);
    }
  });

  return newData;
};

// Helper to ensure role is uppercase (matching Enum) regardless of DB entry
// Also merges auth-specific properties like emailVerified
const normalizeUser = (id: string, data: any, authUser?: FirebaseUser | null): User => {
  const converted = convertTimestamp(data);
  let role = converted.role;
  
  if (role && typeof role === 'string') {
      const upper = role.toUpperCase();
      // Only normalize if it matches known roles
      if (upper === 'ADMIN' || upper === 'PROVIDER' || upper === 'USER') {
          role = upper;
      }
  } else {
      role = UserRole.USER;
  }

  return {
    id,
    ...converted,
    role: role as UserRole,
    emailVerified: authUser ? authUser.emailVerified : false
  };
};

// --- LOGIC SIMULATION ---
const isProviderEligibleForLead = (
  provider: ProviderProfile,
  request: ServiceRequest
): boolean => {
  if (request.status !== "open") return false;
  if (request.quotes.some((q) => q.providerId === provider.id)) return false;
  if (request.quotes.length >= MAX_QUOTES_PER_REQUEST) return false;

  const createdAt = new Date(request.createdAt).getTime();
  const timeElapsedMinutes = (Date.now() - createdAt) / 60000;
  const timeElapsedHours = timeElapsedMinutes / 60;

  if (timeElapsedHours > MAX_REQUEST_AGE_HOURS) return false;

  // Check category match
  if (provider.serviceTypes && provider.serviceTypes.length > 0) {
    if (!provider.serviceTypes.includes(request.category)) {
      return false;
    }
  }

  // Check Location/Distance (if both have coordinates)
  if (!request.coordinates || !provider.coordinates) {
    return true;
  }

  const distanceKm = calculateDistance(request.coordinates, provider.coordinates);
  if (distanceKm > 15) return false; // Hard limit 15km

  // Time-decay distance logic (simulate "expanding" radius)
  if (timeElapsedMinutes < 2) return distanceKm <= 5;
  if (timeElapsedMinutes < 4) return distanceKm <= 8;
  return distanceKm <= 15;
};

const distributeLeadsToProviders = async (newRequest: ServiceRequest) => {
  try {
    const providersSnapshot = await getDocs(collection(db, "providers"));
    const providers = providersSnapshot.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as ProviderProfile)
    );

    const batch = writeBatch(db);
    let opCount = 0;

    for (const provider of providers) {
      if (isProviderEligibleForLead(provider, newRequest)) {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          userId: provider.id,
          type: "info",
          title: "New Lead Opportunity",
          message: `New ${newRequest.category} request nearby: ${newRequest.title}`,
          timestamp: Date.now(),
          read: false,
          link: "provider-leads",
        });
        opCount++;
      }
    }

    if (opCount > 0) await batch.commit();
  } catch (e) {
    console.error("Error distributing leads:", e);
  }
};

export const api = {
  init: async () => {},

  // --- AUTH ---

  login: async (email: string, password?: string): Promise<User> => {
    if (!password) throw new Error("Password is required");
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const uid = firebaseUser?.uid;

    if (!uid) throw new Error("Authentication failed");

    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const u = normalizeUser(uid, userDoc.data(), firebaseUser);
      if (u.isBlocked) {
        await signOut(auth);
        throw new Error("Your account has been blocked. Please contact support.");
      }
      // Log Login
      api.logAction(u.id, "LOGIN", "User logged in", u.role);
      return u;
    } else {
      throw new Error("User profile not found.");
    }
  },

  loginWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    const { uid, email, displayName } = firebaseUser;

    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const u = normalizeUser(uid, userDoc.data(), firebaseUser);
      if (u.isBlocked) {
        await signOut(auth);
        throw new Error("Your account has been blocked. Please contact support.");
      }
      api.logAction(u.id, "LOGIN_GOOGLE", "User logged in via Google", u.role);
      return u;
    } else {
      // Create new user profile if not exists
      const newUser: User = {
        id: uid,
        name: displayName || "User",
        email: email || "",
        role: UserRole.USER, // Default to USER
        joinDate: new Date().toISOString(),
        companyName: "",
        emailVerified: firebaseUser.emailVerified
      };
      await setDoc(userDocRef, {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        joinDate: newUser.joinDate,
        companyName: newUser.companyName
      });
      api.logAction(uid, "REGISTER_GOOGLE", "User registered via Google", UserRole.USER);
      return newUser;
    }
  },

  register: async (
    userData: Omit<User, "id">,
    password?: string
  ): Promise<User> => {
    if (!password) throw new Error("Password is required");

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      password
    );
    const firebaseUser = userCredential.user;
    const uid = firebaseUser?.uid;

    if (!uid) throw new Error("Registration failed");

    // Send verification email
    try {
      // Removing actionCodeSettings to prevent auth/invalid-continue-uri errors
      // if the current domain is not whitelisted in Firebase Console.
      await sendEmailVerification(firebaseUser);
      console.log("Verification email sent to:", userData.email);
    } catch (e) {
      console.error("Failed to send verification email:", e);
      // We do not throw here, allowing the user to be created, 
      // but they will land on verify page where they can resend.
    }

    const newUser: User = {
      id: uid,
      joinDate: new Date().toISOString(),
      ...userData,
      emailVerified: false // Explicitly false initially for email/pass
    };

    // Don't save emailVerified to Firestore, it's managed by Auth
    const { emailVerified, ...firestoreData } = newUser;
    await setDoc(doc(db, "users", uid), firestoreData);

    if (userData.role === UserRole.PROVIDER) {
      // Default coordinates (Downtown Dubai approx) as fallback for map visualization
      const defaultCoords = { lat: 25.1972, lng: 55.2744 };
      const newProvider: ProviderProfile = {
        id: uid,
        name: userData.companyName || userData.name,
        tagline: "New Service Provider",
        rating: 0,
        reviewCount: 0,
        badges: ["New"],
        isVerified: false,
        description: "No description yet.",
        services: [],
        serviceTypes: [],
        location: "Downtown Dubai",
        coordinates: defaultCoords,
        reviews: [],
      };
      await setDoc(doc(db, "providers", uid), newProvider);
    }

    api.logAction(uid, "REGISTER", `New user registered as ${userData.role}`, userData.role);
    return newUser;
  },

  logout: async (): Promise<void> => {
    const u = auth.currentUser;
    if(u) api.logAction(u.uid, "LOGOUT", "User logged out");
    await signOut(auth);
  },

  resendVerificationEmail: async (): Promise<void> => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      // Removing actionCodeSettings to ensure email sends even if domain not whitelisted for redirects
      await sendEmailVerification(user);
      console.log("Verification email resent to:", user.email);
    }
  },

  refreshUserAuth: async (): Promise<User | null> => {
    const user = auth.currentUser;
    if (user) {
      await user.reload(); // Refresh token claims
      const updatedAuthUser = auth.currentUser;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const u = normalizeUser(user.uid, userDoc.data(), updatedAuthUser);
        if (u.isBlocked) {
            await signOut(auth); // Force logout if blocked while in session
            return null;
        }
        return u;
      }
    }
    return null;
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  updateUserPassword: async (newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, newPassword);
      api.logAction(user.uid, "UPDATE_PASSWORD", "User changed password");
    } else {
      throw new Error("No authenticated user found");
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const u = normalizeUser(user.uid, userDoc.data(), user);
              if (u.isBlocked) {
                  await signOut(auth);
                  resolve(null);
                  return;
              }
              resolve(u);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error(e);
          resolve(null);
        } finally {
          unsubscribe();
        }
      });
    });
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const snap = await getDocs(collection(db, "users"));
      // We don't have access to all Auth objects for bulk lists, 
      // so emailVerified will be missing/false here, which is fine for Admin lists
      return snap.docs.map((d) => normalizeUser(d.id, d.data(), null));
    } catch (e) {
      console.warn("getAllUsers failed (likely permission):", e);
      return [];
    }
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    // Destructure to remove fields we don't want to save back to Firestore directly
    const { emailVerified, id, ...dataToUpdate } = updatedUser;
    
    await updateDoc(doc(db, "users", id), dataToUpdate);
    api.logAction(id, "UPDATE_PROFILE", "User profile updated", updatedUser.role);
  },

  deleteUser: async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, "users", userId));
    try {
      await deleteDoc(doc(db, "providers", userId));
    } catch (e) {}
    api.logAction("system", "DELETE_USER", `User ${userId} deleted by Admin`, "ADMIN", "critical");
  },

  // --- STORAGE ---

  uploadFile: async (file: File): Promise<string> => {
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  },

  // --- REQUESTS & LEADS ---

  createRequest: async (
    reqData: Omit<ServiceRequest, "id" | "status" | "quotes" | "createdAt">
  ): Promise<ServiceRequest> => {
    // Only use coordinates passed from the frontend (via Google Maps Grounding)
    const coords = reqData.coordinates || null;

    const newReqData = {
      ...reqData,
      status: "open",
      createdAt: new Date().toISOString(),
      quotes: [],
      coordinates: coords,
      isDeleted: false,
    };

    const docRef = await addDoc(collection(db, "requests"), newReqData);
    const savedReq = { id: docRef.id, ...newReqData } as ServiceRequest;

    await distributeLeadsToProviders(savedReq);
    
    api.logAction(reqData.userId, "CREATE_REQUEST", `Created request: ${reqData.title}`, UserRole.USER);

    return savedReq;
  },

  getRequests: async (user?: User): Promise<ServiceRequest[]> => {
    if (!user) return [];

    try {
      let qReq;

      // We remove ALL orderBy clauses here to prevent Firestore index errors
      // and perform sorting on the client side instead.
      if (user.role === UserRole.USER) {
        qReq = query(
          collection(db, "requests"),
          where("userId", "==", user.id)
        );
      } else if (user.role === UserRole.PROVIDER) {
        qReq = query(
          collection(db, "requests"),
          where("status", "==", "open")
        );
      } else {
        // Admin or other: fetch all
        qReq = query(collection(db, "requests"));
      }

      const snap = await getDocs(qReq);
      const results = snap.docs.map((d) =>
        convertTimestamp({ id: d.id, ...(d.data() as any) })
      ) as ServiceRequest[];

      // Client-side sort to ensure correct order
      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    } catch (error) {
      console.error("Error fetching requests:", error);
      return []; // Return empty on failure to prevent app crash
    }
  },

  permanentDeleteRequest: async (requestId: string): Promise<void> => {
    const user = auth.currentUser;
    await deleteDoc(doc(db, "requests", requestId));
    if(user) api.logAction(user.uid, "DELETE_REQUEST", `Request ${requestId} deleted`);
  },

  getProviderLeads: async (providerId: string): Promise<ServiceRequest[]> => {
    try {
      // NOTE: removed orderBy("createdAt", "desc") to avoid composite index error: status + createdAt
      // Sort is handled client-side below.
      const qReq = query(
        collection(db, "requests"),
        where("status", "==", "open")
      );
      const snap = await getDocs(qReq);
      const leads = snap.docs.map((d) =>
        convertTimestamp({ id: d.id, ...(d.data() as any) })
      ) as ServiceRequest[];

      // Sort client-side
      leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const providerDoc = await getDoc(doc(db, "providers", providerId));
      const provider = providerDoc.data() as ProviderProfile | undefined;

      if (!provider) return [];

      return leads.filter((req) => {
        if (req.isDeleted) return false;
        if (req.quotes.some((q) => q.providerId === providerId)) return false;

        if (
          provider.serviceTypes &&
          provider.serviceTypes.length > 0 &&
          !provider.serviceTypes.includes(req.category)
        ) {
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error("Error fetching provider leads:", error);
      return [];
    }
  },

  matchProviderToRequest: (
    provider: ProviderProfile,
    request: ServiceRequest
  ): boolean => {
    return isProviderEligibleForLead(provider, request);
  },

  shouldNotifyToRefineCriteria: (request: ServiceRequest): boolean => {
    if (request.status !== "open") return false;
    if (request.quotes.length >= MAX_QUOTES_PER_REQUEST) return false;
    const timeElapsedMinutes =
      (Date.now() - new Date(request.createdAt).getTime()) / 60000;
    return timeElapsedMinutes > 10;
  },

  // --- QUOTES ---

  submitQuote: async (
    requestId: string,
    provider: ProviderProfile,
    quoteData: { price: number; timeline: string; description: string }
  ): Promise<void> => {
    const reqRef = doc(db, "requests", requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error("Request not found");

    const request = reqSnap.data() as ServiceRequest;

    const newQuote: Quote = {
      id: `q_${Date.now()}`,
      providerId: provider.id,
      providerName: provider.name,
      verified: provider.isVerified,
      rating: provider.rating,
      price: quoteData.price,
      currency: "AED",
      timeline: quoteData.timeline,
      description: quoteData.description,
      status: "pending",
    };

    const updatedQuotes = [...(request.quotes || []), newQuote];

    await updateDoc(reqRef, {
      quotes: updatedQuotes,
      status: "quoted",
    });

    await api.createNotification({
      userId: request.userId,
      type: "info",
      title: "New Quote",
      message: `${provider.name} sent a quote of AED ${quoteData.price}`,
      link: "dashboard",
    });

    api.logAction(provider.id, "SUBMIT_QUOTE", `Submitted quote for request: ${request.title}`, UserRole.PROVIDER);
  },

  acceptQuote: async (requestId: string, quoteId: string): Promise<void> => {
    const reqRef = doc(db, "requests", requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) return;

    const request = reqSnap.data() as ServiceRequest;
    const updatedQuotes = request.quotes.map((q: Quote) => {
      if (q.id === quoteId) {
        api.createNotification({
          userId: q.providerId,
          type: "success",
          title: "Quote Accepted",
          message: `Your quote for "${request.title}" was accepted.`,
          link: "dashboard",
        });
        return { ...q, status: "accepted" };
      }
      return { ...q, status: "rejected" };
    });

    await updateDoc(reqRef, {
      quotes: updatedQuotes,
      status: "accepted",
    });

    api.logAction(request.userId, "ACCEPT_QUOTE", `Accepted quote from provider for request: ${request.title}`, UserRole.USER);
  },

  completeOrder: async (requestId: string): Promise<void> => {
    await updateDoc(doc(db, "requests", requestId), { status: "closed" });
    const user = auth.currentUser;
    if(user) api.logAction(user.uid, "COMPLETE_ORDER", `Order completed for request ${requestId}`);
  },

  // --- PROVIDERS ---

  getProviders: async (): Promise<ProviderProfile[]> => {
    try {
      const snap = await getDocs(collection(db, "providers"));
      return snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as ProviderProfile)
      );
    } catch (error) {
      console.warn("Error fetching providers (permission/network):", error);
      return [];
    }
  },

  updateProvider: async (
    providerId: string,
    updates: Partial<ProviderProfile>
  ): Promise<ProviderProfile> => {
    const provRef = doc(db, "providers", providerId);
    let newCoords: Coordinates | undefined = updates.coordinates;

    const dataToUpdate: any = { ...updates };
    // If coordinates are explicitly passed (even if null/undefined to clear), use them
    if (updates.coordinates !== undefined) {
       dataToUpdate.coordinates = updates.coordinates;
    }

    await updateDoc(provRef, dataToUpdate);
    const snap = await getDoc(provRef);
    
    api.logAction(providerId, "UPDATE_STOREFRONT", "Provider updated storefront details", UserRole.PROVIDER);
    
    return { id: snap.id, ...(snap.data() || {}) } as ProviderProfile;
  },

  toggleProviderVerification: async (providerId: string): Promise<void> => {
    const provRef = doc(db, "providers", providerId);
    const snap = await getDoc(provRef);
    const admin = auth.currentUser;
    if (snap.exists()) {
      const current = (snap.data() as any)?.isVerified;
      await updateDoc(provRef, { isVerified: !current });
      api.logAction(admin?.uid || 'admin', "TOGGLE_VERIFY", `Provider ${providerId} verification toggled to ${!current}`, "ADMIN");
    }
  },

  // --- REVIEWS ---

  addReview: async (
    providerId: string,
    reviewData: Omit<Review, "id" | "date">
  ): Promise<void> => {
    const provRef = doc(db, "providers", providerId);
    const snap = await getDoc(provRef);
    if (!snap.exists()) return;

    const provider = snap.data() as ProviderProfile;
    const newReview: Review = {
      id: `r_${Date.now()}`,
      date: new Date().toISOString(),
      ...reviewData,
    };

    const updatedReviews = [newReview, ...(provider.reviews || [])];
    const newCount = updatedReviews.length;
    const newRating =
      updatedReviews.reduce((acc, r) => acc + r.rating, 0) / newCount;

    await updateDoc(provRef, {
      reviews: updatedReviews,
      reviewCount: newCount,
      rating: newRating,
    });
    
    const user = auth.currentUser;
    if(user) api.logAction(user.uid, "ADD_REVIEW", `Review added for provider ${provider.name}`, UserRole.USER);
  },

  deleteReview: async (
    providerId: string,
    reviewId: string
  ): Promise<void> => {
    const provRef = doc(db, "providers", providerId);
    const snap = await getDoc(provRef);
    if (!snap.exists()) return;

    const provider = snap.data() as ProviderProfile;
    const updatedReviews = (provider.reviews || []).filter(
      (r: Review) => r.id !== reviewId
    );
    const newCount = updatedReviews.length;
    const newRating =
      newCount > 0
        ? updatedReviews.reduce((acc, r) => acc + r.rating, 0) / newCount
        : 0;

    await updateDoc(provRef, {
      reviews: updatedReviews,
      reviewCount: newCount,
      rating: newRating,
    });
    
    const user = auth.currentUser;
    if(user) api.logAction(user.uid, "DELETE_REVIEW", `Review ${reviewId} removed`, "ADMIN", "warning");
  },

  // --- MESSAGES ---

  getMessages: async (
    userId: string,
    otherUserId: string
  ): Promise<DirectMessage[]> => {
    try {
      // Split into two specific queries to comply with standard security rules (read own messages)
      // Query 1: Messages where I am the sender
      const qSent = query(
        collection(db, "messages"),
        where("senderId", "==", userId),
        where("recipientId", "==", otherUserId)
      );
      
      // Query 2: Messages where I am the recipient
      const qReceived = query(
        collection(db, "messages"),
        where("senderId", "==", otherUserId),
        where("recipientId", "==", userId)
      );

      const [sentSnap, receivedSnap] = await Promise.all([getDocs(qSent), getDocs(qReceived)]);
      
      const sent = sentSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as DirectMessage));
      const received = receivedSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as DirectMessage));

      // Merge and sort
      return [...sent, ...received].sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.warn("Error fetching messages:", error);
      return [];
    }
  },

  sendMessage: async (
    senderId: string,
    recipientId: string,
    content: string
  ): Promise<void> => {
    await addDoc(collection(db, "messages"), {
      senderId,
      recipientId,
      content,
      timestamp: Date.now(),
      read: false,
    });

    const senderDoc = await getDoc(doc(db, "users", senderId));
    const sender = senderDoc.data() as User | undefined;

    await api.createNotification({
      userId: recipientId,
      type: "info",
      title: "New Message",
      message: `Message from ${sender?.name || "User"}`,
      link: "messages",
    });

    api.logAction(senderId, "SEND_MESSAGE", `Sent message to user ${recipientId}`, sender?.role || UserRole.USER);
  },

  getConversations: async (userId: string): Promise<Conversation[]> => {
    try {
      // Fetch both sent and received messages to build conversation list
      // This respects security rules better than querying *all* messages sorted by timestamp
      const qSent = query(collection(db, "messages"), where("senderId", "==", userId));
      const qReceived = query(collection(db, "messages"), where("recipientId", "==", userId));

      const [sentSnap, receivedSnap] = await Promise.all([getDocs(qSent), getDocs(qReceived)]);
      
      const allMessages = [
        ...sentSnap.docs.map(d => d.data() as DirectMessage),
        ...receivedSnap.docs.map(d => d.data() as DirectMessage)
      ].sort((a, b) => b.timestamp - a.timestamp); // Descending for latest first

      const conversationsMap = new Map<string, DirectMessage[]>();
      allMessages.forEach((m) => {
        const otherId = m.senderId === userId ? m.recipientId : m.senderId;
        if (!conversationsMap.has(otherId)) conversationsMap.set(otherId, []);
        conversationsMap.get(otherId)!.push(m);
      });

      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as User) })
      );

      const conversations: Conversation[] = [];
      conversationsMap.forEach((msgs, otherId) => {
        const last = msgs[0];
        const otherUser = users.find((u) => u.id === otherId);
        const unread = msgs.filter(
          (m) => m.recipientId === userId && !m.read
        ).length;

        conversations.push({
          otherUserId: otherId,
          otherUserName: otherUser?.name || "Unknown",
          lastMessage: last.content,
          timestamp: last.timestamp,
          unreadCount: unread,
        });
      });

      return conversations;
    } catch (error) {
      console.warn("Error fetching conversations:", error);
      return [];
    }
  },

  // --- NOTIFICATIONS ---

  getNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      // Removed orderBy("timestamp", "desc") to rely on client-side sorting and avoid potential index issues
      const qNotif = query(
        collection(db, "notifications"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(qNotif);
      const notifs = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as Notification)
      );
      return notifs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.warn("Error fetching notifications:", error);
      return [];
    }
  },

  createNotification: async (
    data: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    await addDoc(collection(db, "notifications"), {
      ...data,
      timestamp: Date.now(),
      read: false,
    });
  },

  markNotificationAsRead: async (notificationId: string) => {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  },

  markAllNotificationsAsRead: async (userId: string) => {
    const qNotif = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snap = await getDocs(qNotif);

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  },

  broadcastNotification: async (title: string, message: string) => {
    const users = await api.getAllUsers();
    const batch = writeBatch(db);

    users.forEach((u) => {
      const refDoc = doc(collection(db, "notifications"));
      batch.set(refDoc, {
        userId: u.id,
        type: "info",
        title,
        message,
        timestamp: Date.now(),
        read: false,
      });
    });

    await batch.commit();
    api.logAction("admin", "BROADCAST", `Sent broadcast: ${title}`, "ADMIN", "warning");
  },

  // --- ADMIN & SETTINGS ---

  getSettings: async (): Promise<SiteSettings> => {
    try {
      const snap = await getDoc(doc(db, "settings", "global"));
      return snap.exists()
        ? (snap.data() as SiteSettings)
        : {
            siteName: "DubaiLink",
            contactEmail: "support@dubailink.ae",
            maintenanceMode: false,
            allowNewRegistrations: true,
          };
    } catch (e) {
      return {
        siteName: "DubaiLink",
        contactEmail: "support@dubailink.ae",
        maintenanceMode: false,
        allowNewRegistrations: true,
      };
    }
  },

  updateSettings: async (settings: SiteSettings): Promise<void> => {
    await setDoc(doc(db, "settings", "global"), settings);
    api.logAction("admin", "UPDATE_SETTINGS", "Updated site settings", "ADMIN", "warning");
  },

  getServiceTypes: async (): Promise<ServiceType[]> => {
    try {
      const snap = await getDocs(collection(db, "service_types"));
      return snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as ServiceType)
      );
    } catch (error) {
      console.warn("Error fetching service types:", error);
      return [];
    }
  },

  manageServiceType: async (
    type: ServiceType,
    action: "add" | "update"
  ): Promise<void> => {
    await setDoc(doc(db, "service_types", type.id), type);
    api.logAction("admin", action === 'add' ? "ADD_SERVICE" : "UPDATE_SERVICE", `Service type: ${type.name}`, "ADMIN");
  },

  deleteServiceType: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "service_types", id));
    api.logAction("admin", "DELETE_SERVICE", `Deleted service type ${id}`, "ADMIN", "warning");
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      // Client sort for logs too
      const qLogs = query(collection(db, "audit_logs"));
      const snap = await getDocs(qLogs);
      const logs = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as AuditLog)
      );
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.warn("Error fetching audit logs:", error);
      return [];
    }
  },

  // Generic logging for ALL users, not just admins
  logAction: async (
    userId: string,
    action: string,
    details: string,
    userRole?: string,
    severity: "info" | "warning" | "critical" = "info"
  ) => {
    try {
      // Manual ID generation to prevent "Document already exists" errors with addDoc in some environments
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, "audit_logs", logId), {
        action,
        details,
        severity,
        adminId: userId, // Keeping field name 'adminId' for compat, but it's really 'actorId'
        userRole: userRole || 'UNKNOWN',
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("Failed to log action", e);
    }
  },

  // --- AI INTERACTIONS ---
  logAiQuery: async (userId: string, userName: string, queryText: string) => {
    try {
        // We log to audit_logs instead of ai_logs to avoid permission errors with new collections
        // and to keep a unified log.
        // We distinguish Guest users by setting userRole to 'GUEST'
        const role = userId.startsWith('guest_') ? 'GUEST' : 'USER';
        const logId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await setDoc(doc(db, "audit_logs", logId), {
            action: "AI_QUERY",
            details: queryText,
            adminId: userId,
            userName: userName, // Storing user name for easier display
            userRole: role,
            severity: "info",
            timestamp: Date.now()
        });
    } catch (e) {
        // We catch strictly here to ensure AI functionality doesn't break if logging fails due to strict rules
        console.error("Failed to log AI query (likely permissions or network)", e);
    }
  },

  getAiInteractions: async (): Promise<AiInteraction[]> => {
    try {
        // Query audit_logs for AI_QUERY actions. This assumes the Admin is authenticated and has read access.
        const qLogs = query(collection(db, "audit_logs"), where("action", "==", "AI_QUERY"));
        const snap = await getDocs(qLogs);
        const logs = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                userId: data.adminId,
                userName: data.userName || (data.userRole === 'GUEST' ? 'Guest User' : 'User'),
                query: data.details, // The query is stored in details field
                timestamp: data.timestamp
            } as AiInteraction;
        });
        return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Failed to fetch AI logs", e);
        return [];
    }
  }
};
