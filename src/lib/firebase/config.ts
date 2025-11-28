import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAo9SSE5mvlGaDFgG7_-LotMzbYt86iZGM",
  authDomain: "minimaps-1c488.firebaseapp.com",
  projectId: "minimaps-1c488",
  storageBucket: "minimaps-1c488.firebasestorage.app",
  messagingSenderId: "641543938239",
  appId: "1:641543938239:web:308ff16b309d2d5d99e60a",
  measurementId: "G-ZW5V9NSMN4"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

// Check if Firebase app is already initialized
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('[FIREBASE] Error initializing Firebase:', error);
    // Create dummy objects for SSR
    if (typeof window === 'undefined') {
      // @ts-ignore - This is a workaround for SSR
      app = {} as FirebaseApp;
      // @ts-ignore
      db = {} as Firestore;
      // @ts-ignore
      auth = {} as Auth;
      // @ts-ignore
      storage = {} as FirebaseStorage;
    }
  }
} else {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { app, db, auth, storage }; 