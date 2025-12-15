
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBWjFgzcioU6WN3xHsee82Ud-YyuPE93As",
  authDomain: "servicemarket-22498701-b4b44.firebaseapp.com",
  projectId: "servicemarket-22498701-b4b44",
  storageBucket: "servicemarket-22498701-b4b44.firebasestorage.app",
  messagingSenderId: "225876463298",
  appId: "1:225876463298:web:2d2e3ebd18332e5077355b",
};

// Initialize Firebase (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with experimentalForceLongPolling to fix "Could not reach Cloud Firestore backend" errors.
// This forces the client to use long-polling instead of WebSockets, which avoids timeout issues in some environments.
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  // If Firestore was already initialized (e.g. during hot module replacement), fall back to the existing instance.
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const storage = getStorage(app);
