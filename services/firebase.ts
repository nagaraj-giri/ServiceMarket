import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBWjFgzcioU6WN3xHsee82Ud-YyuPE93As",
  authDomain: "servicemarket-22498701-b4b44.firebaseapp.com",
  projectId: "servicemarket-22498701-b4b44",
  storageBucket: "servicemarket-22498701-b4b44.firebasestorage.app",
  messagingSenderId: "225876463298",
  appId: "1:225876463298:web:2d2e3ebd18332e5077355b",
  measurementId: "G-4FBVJ5JCJV"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
