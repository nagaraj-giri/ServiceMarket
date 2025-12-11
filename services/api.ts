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
  signInWithPopup
} from "firebase/auth";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getCoordinates } from "../constants";
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
  Coordinates 
} from "../types";


// --- CONSTANTS ---
const MAX_QUOTES_PER_REQUEST = 5;
const MAX_REQUEST_AGE_HOURS = 24;
const DEMO_USER_KEY = 'dubailink_demo_user';

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
      (d) => ({ id: d.id, ...d.data() } as ProviderProfile)
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
    const uid = userCredential.user?.uid;

    if (!uid) throw new Error("Authentication failed");

    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = convertTimestamp(userDoc.data());
      return { id: uid, ...data } as User;
    } else {
      throw new Error("User profile not found.");
    }
  },

  loginWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const { uid, email, displayName } = userCredential.user;

    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = convertTimestamp(userDoc.data());
      return { id: uid, ...data } as User;
    } else {
      // Create new user profile if not exists
      const newUser: User = {
        id: uid,
        name: displayName || "User",
        email: email || "",
        role: UserRole.USER, // Default to USER
        joinDate: new Date().toISOString(),
        companyName: "",
      };
      await setDoc(userDocRef, newUser);
      return newUser;
    }
  },

  // Bypass method for environments with strict auth rules or blocked domains
  loginAsDemoUser: async (role: UserRole = UserRole.USER): Promise<User> => {
    const demoUser: User = {
      id: 'demo_' + Date.now(),
      name: role === UserRole.PROVIDER ? 'Demo Provider' : 'Demo User',
      email: role === UserRole.PROVIDER ? 'provider@demo.local' : 'user@demo.local',
      role: role,
      joinDate: new Date().toISOString(),
      companyName: role === UserRole.PROVIDER ? 'Demo Services LLC' : undefined
    };
    
    // Store in localStorage to persist across reloads
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    
    return demoUser;
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
    const uid = userCredential.user?.uid;

    if (!uid) throw new Error("Registration failed");

    const newUser: User = {
      id: uid,
      joinDate: new Date().toISOString(),
      ...userData,
    };

    await setDoc(doc(db, "users", uid), newUser);

    if (userData.role === UserRole.PROVIDER) {
      const coords = getCoordinates("Downtown Dubai");
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
        coordinates: coords,
        reviews: [],
      };
      await setDoc(doc(db, "providers", uid), newProvider);
    }

    return newUser;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(DEMO_USER_KEY);
    await signOut(auth);
  },

  getCurrentUser: async (): Promise<User | null> => {
    // Check for demo user bypass first
    const demoUserStr = localStorage.getItem(DEMO_USER_KEY);
    if (demoUserStr) {
      try {
        return JSON.parse(demoUserStr) as User;
      } catch (e) {
        localStorage.removeItem(DEMO_USER_KEY);
      }
    }

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = convertTimestamp(userDoc.data());
              resolve({ id: user.uid, ...data } as User);
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
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => {
      const data = convertTimestamp(d.data());
      return { id: d.id, ...data } as User;
    });
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    await updateDoc(doc(db, "users", updatedUser.id), { ...updatedUser });
  },

  deleteUser: async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, "users", userId));
    try {
      await deleteDoc(doc(db, "providers", userId));
    } catch (e) {}
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
    // Priority: Coordinates passed from AI/Maps > Static lookup > undefined
    const coords = reqData.coordinates || (reqData.locality ? getCoordinates(reqData.locality) : undefined);

    const newReqData = {
      ...reqData,
      status: "open",
      createdAt: new Date().toISOString(),
      quotes: [],
      coordinates: coords || null,
      isDeleted: false,
    };

    const docRef = await addDoc(collection(db, "requests"), newReqData);
    const savedReq = { id: docRef.id, ...newReqData } as ServiceRequest;

    await distributeLeadsToProviders(savedReq);

    return savedReq;
  },

  getRequests: async (user?: User): Promise<ServiceRequest[]> => {
    if (!user) return [];

    try {
      let qReq;

      if (user.role === UserRole.USER) {
        qReq = query(
          collection(db, "requests"),
          where("userId", "==", user.id),
          orderBy("createdAt", "desc")
        );
      } else if (user.role === UserRole.PROVIDER) {
        // Fetch open requests to avoid permission errors if "list all" is blocked
        qReq = query(
          collection(db, "requests"),
          where("status", "==", "open"),
          orderBy("createdAt", "desc")
        );
      } else {
        // Admin or other: fetch all
        qReq = query(
          collection(db, "requests"),
          orderBy("createdAt", "desc")
        );
      }

      const snap = await getDocs(qReq);
      return snap.docs.map((d) =>
        convertTimestamp({ id: d.id, ...(d.data() as any) })
      ) as ServiceRequest[];
    } catch (error) {
      console.error("Error fetching requests:", error);
      return []; // Return empty on failure to prevent app crash
    }
  },

  permanentDeleteRequest: async (requestId: string): Promise<void> => {
    await deleteDoc(doc(db, "requests", requestId));
  },

  getProviderLeads: async (providerId: string): Promise<ServiceRequest[]> => {
    try {
      const qReq = query(
        collection(db, "requests"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(qReq);
      const leads = snap.docs.map((d) =>
        convertTimestamp({ id: d.id, ...(d.data() as any) })
      ) as ServiceRequest[];

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
  },

  completeOrder: async (requestId: string): Promise<void> => {
    await updateDoc(doc(db, "requests", requestId), { status: "closed" });
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

    if (!newCoords && updates.location) {
      newCoords = getCoordinates(updates.location);
    }

    const dataToUpdate: any = { ...updates };
    if (newCoords) dataToUpdate.coordinates = newCoords;

    await updateDoc(provRef, dataToUpdate);
    const snap = await getDoc(provRef);
    return { id: snap.id, ...(snap.data() || {}) } as ProviderProfile;
  },

  toggleProviderVerification: async (providerId: string): Promise<void> => {
    const provRef = doc(db, "providers", providerId);
    const snap = await getDoc(provRef);
    if (snap.exists()) {
      const current = (snap.data() as any)?.isVerified;
      await updateDoc(provRef, { isVerified: !current });
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
  },

  // --- MESSAGES ---

  getMessages: async (
    userId: string,
    otherUserId: string
  ): Promise<DirectMessage[]> => {
    const qMsg = query(
      collection(db, "messages"),
      orderBy("timestamp", "asc")
    );
    const snap = await getDocs(qMsg);
    const all = snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as DirectMessage)
    );

    return all.filter(
      (m) =>
        (m.senderId === userId && m.recipientId === otherUserId) ||
        (m.senderId === otherUserId && m.recipientId === userId)
    );
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
  },

  getConversations: async (userId: string): Promise<Conversation[]> => {
    const qMsg = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(qMsg);
    const messages = snap.docs.map((d) => d.data() as DirectMessage);
    const myMessages = messages.filter(
      (m) => m.senderId === userId || m.recipientId === userId
    );

    const conversationsMap = new Map<string, DirectMessage[]>();
    myMessages.forEach((m) => {
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
  },

  // --- NOTIFICATIONS ---

  getNotifications: async (userId: string): Promise<Notification[]> => {
    const qNotif = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(qNotif);
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as Notification)
    );
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
  },

  getServiceTypes: async (): Promise<ServiceType[]> => {
    const snap = await getDocs(collection(db, "service_types"));
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as ServiceType)
    );
  },

  manageServiceType: async (
    type: ServiceType,
    action: "add" | "update"
  ): Promise<void> => {
    await setDoc(doc(db, "service_types", type.id), type);
  },

  deleteServiceType: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "service_types", id));
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const qLogs = query(
      collection(db, "audit_logs"),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(qLogs);
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as AuditLog)
    );
  },

  logAdminAction: async (
    action: string,
    details: string,
    severity: "info" | "warning" | "critical" = "info"
  ) => {
    const user = auth.currentUser;
    await addDoc(collection(db, "audit_logs"), {
      action,
      details,
      severity,
      adminId: user?.uid || "system",
      timestamp: Date.now(),
    });
  },
};