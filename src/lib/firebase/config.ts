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

// Initialize Firebase on both client and server
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

// Initialize Firebase app (works on both client and server)
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services - these work on both client and server
db = getFirestore(app);
auth = getAuth(app);
storage = getStorage(app);

export { app, db, auth, storage };