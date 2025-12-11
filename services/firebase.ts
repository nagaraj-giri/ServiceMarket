import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
export const db = getFirestore(app);
export const storage = getStorage(app);