import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

// Check if Firebase app is already initialized
if (!getApps().length) {
  try {
    console.log('[FIREBASE] Initializing new Firebase app instance');
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('[FIREBASE] Error initializing Firebase:', error);
    // Create a dummy app for SSR if initialization fails
    if (typeof window === 'undefined') {
      console.log('[FIREBASE] Creating dummy app for SSR');
      // @ts-ignore - This is a workaround for SSR
      app = {} as FirebaseApp;
    }
  }
} else {
  console.log('[FIREBASE] Using existing Firebase app instance');
  app = getApps()[0];
}

// Initialize services with error handling
let db, auth, storage;

try {
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  console.error('[FIREBASE] Error initializing Firebase services:', error);
  // Create dummy services for SSR
  if (typeof window === 'undefined') {
    // @ts-ignore - This is a workaround for SSR
    db = {};
    // @ts-ignore
    auth = {};
    // @ts-ignore
    storage = {};
  }
}

export { app, db, auth, storage }; 