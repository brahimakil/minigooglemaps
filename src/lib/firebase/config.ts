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

console.log('[TRACE] Initializing Firebase app instance');
if (typeof window !== 'undefined' && !getApps().length) {
  console.log('[FIREBASE] Client-side initialization');
  initializeApp(firebaseConfig);
}
const app = getApps()[0];
console.log('[TRACE] Firebase apps count:', getApps().length);
console.log('[TRACE] Firestore initialization path:', new Error().stack);
const db = getFirestore(app);
console.log('[DEBUG] Firestore instance created');
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage }; 