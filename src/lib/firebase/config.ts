import { initializeApp, getApps } from 'firebase/app';
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

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage }; 