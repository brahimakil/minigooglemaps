/**
 * Firebase utility functions to help handle common issues
 */

import { FirebaseError } from 'firebase/app';
import { collection, addDoc, DocumentData, getDocs, query, where, orderBy, QueryConstraint, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { PLACEHOLDER_IMAGE_DATA_URL } from './imageUtils';

// Flag to force real Firebase operations even in development
let FORCE_REAL_FIREBASE = true;

/**
 * Checks if the app is running in development mode where Firebase operations are simulated
 * @returns Boolean indicating if running in simulated mode
 */
export function isFirebaseSimulated(): boolean {
  // First check if we've forced real Firebase
  if (FORCE_REAL_FIREBASE) {
    return false;
  }
  
  // Otherwise, use the default logic - but we won't get here by default anymore
  return process.env.NODE_ENV === 'development';
}

/**
 * Turns off simulation mode and forces real Firebase operations
 * This is useful for testing with real Firebase even in development
 * 
 * @param permanent - Whether to make this setting persist in localStorage (default: false)
 */
export function useRealFirebase(permanent: boolean = false): void {
  FORCE_REAL_FIREBASE = true;
  console.log('🔥 Real Firebase mode enabled - all operations will use the actual Firebase database');
  
  if (permanent && typeof window !== 'undefined') {
    localStorage.setItem('useRealFirebase', 'true');
    console.log('This setting will persist across page reloads');
  }
}

/**
 * Turns on simulation mode for Firebase operations
 * This is the default in development
 * 
 * @param permanent - Whether to make this setting persist in localStorage (default: false)
 */
export function useSimulatedFirebase(permanent: boolean = false): void {
  FORCE_REAL_FIREBASE = false;
  console.log('🧪 Simulated Firebase mode enabled - operations will be simulated in development');
  
  if (permanent && typeof window !== 'undefined') {
    localStorage.removeItem('useRealFirebase');
    console.log('This setting will persist across page reloads');
  }
}

// Initialize from localStorage if available
if (typeof window !== 'undefined') {
  FORCE_REAL_FIREBASE = localStorage.getItem('useRealFirebase') === 'true';
  if (FORCE_REAL_FIREBASE) {
    console.log('🔥 Real Firebase mode enabled from saved setting');
  }
}

/**
 * Safely uploads a file to Firebase Storage with error handling
 * In development mode, returns a placeholder image URL instead
 * 
 * @param file - The file to upload
 * @param path - The storage path to upload to
 * @returns The download URL of the uploaded file
 */
export async function safeStorageUpload(
  file: File,
  path: string
): Promise<{ url: string; success: boolean; error?: string }> {
  try {
    // In development mode, return a placeholder image
    if (isFirebaseSimulated()) {
      console.log('Development mode detected, using placeholder image instead of uploading');
      return { 
        url: PLACEHOLDER_IMAGE_DATA_URL, 
        success: true 
      };
    }

    // In production, attempt the upload
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    
    return {
      url: downloadUrl,
      success: true
    };
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error);
    const firebaseError = error as FirebaseError;
    
    return {
      url: PLACEHOLDER_IMAGE_DATA_URL,
      success: false,
      error: firebaseError.message || 'Error uploading file'
    };
  }
}

/**
 * Safely adds a document to Firestore with error handling
 * In development mode, simulates success without actually writing to Firestore
 * 
 * @param collectionPath - The Firestore collection path
 * @param data - The document data to add
 * @returns The document ID if successful
 */
export async function safeFirestoreAdd(
  collectionPath: string,
  data: DocumentData
): Promise<{ id?: string; success: boolean; error?: string }> {
  try {
    console.log(`Attempting to add document to ${collectionPath}`, data);
    console.log(`Firebase simulation mode: ${isFirebaseSimulated() ? 'ON' : 'OFF'}`);
    
    // In development mode, simulate success
    if (isFirebaseSimulated()) {
      console.log(`Development mode detected, simulating write to ${collectionPath}`, data);
      // Simulate a delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return a fake document ID
      return {
        id: `dev-${Date.now()}`,
        success: true
      };
    }
    
    // In production, actually write to Firestore
    console.log(`Writing document to Firestore collection: ${collectionPath}`);
    const docRef = await addDoc(collection(db, collectionPath), data);
    console.log(`Document successfully added with ID: ${docRef.id}`);
    
    return {
      id: docRef.id,
      success: true
    };
  } catch (error) {
    console.error('Error adding document to Firestore:', error);
    const firebaseError = error as FirebaseError;
    
    // Check if it's a permissions error
    if (firebaseError.code === 'permission-denied') {
      console.error('Firestore permissions error. You may need to update your security rules.');
    }
    
    // More detailed error logging
    if (firebaseError.code) {
      console.error(`Firebase error code: ${firebaseError.code}`);
    }
    
    return {
      success: false,
      error: firebaseError.message || 'Error adding document'
    };
  }
}

/**
 * Safely gets documents from Firestore with error handling
 * In development mode, returns fake data in the expected format
 * 
 * @param collectionPath - The Firestore collection path
 * @param constraints - Optional query constraints (where, orderBy, etc.)
 * @returns Array of documents if successful
 */
export async function safeFirestoreGet<T>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<{ data: T[]; success: boolean; error?: string }> {
  try {
    // In development mode, return fake data
    if (isFirebaseSimulated()) {
      console.log(`Development mode detected, simulating read from ${collectionPath}`);
      
      // Create different mock data based on collection path
      let mockData: any[] = [];
      
      if (collectionPath === 'tourGuideRequests') {
        // Mock tour guide requests
        mockData = [
          {
            id: 'mock-request-1',
            fullName: 'John Smith',
            email: 'john@example.com',
            phone: '+1234567890',
            regions: ['New York', 'Boston'],
            bio: 'Experienced tour guide with 5 years of experience.',
            idCardUrl: PLACEHOLDER_IMAGE_DATA_URL,
            status: 'pending',
            createdAt: { toDate: () => new Date() }
          },
          {
            id: 'mock-request-2',
            fullName: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '+9876543210',
            regions: ['Los Angeles', 'San Francisco'],
            bio: 'Specialized in historical tours with excellent knowledge of local culture.',
            idCardUrl: PLACEHOLDER_IMAGE_DATA_URL,
            status: 'approved',
            createdAt: { toDate: () => new Date(Date.now() - 86400000) } // 1 day ago
          },
          {
            id: 'mock-request-3',
            fullName: 'Ahmed Hassan',
            email: 'ahmed@example.com',
            phone: '+2345678901',
            regions: ['Cairo', 'Alexandria'],
            bio: 'Trilingual guide specializing in archaeological sites.',
            idCardUrl: PLACEHOLDER_IMAGE_DATA_URL,
            status: 'rejected',
            createdAt: { toDate: () => new Date(Date.now() - 172800000) } // 2 days ago
          }
        ];
      }
      
      // Simulate a delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        data: mockData as T[],
        success: true
      };
    }
    
    // In production, actually query Firestore
    const q = query(collection(db, collectionPath), ...constraints);
    const snapshot = await getDocs(q);
    
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    
    return {
      data,
      success: true
    };
  } catch (error) {
    console.error(`Error getting documents from ${collectionPath}:`, error);
    const firebaseError = error as FirebaseError;
    
    return {
      data: [] as T[],
      success: false,
      error: firebaseError.message || 'Error getting documents'
    };
  }
}

/**
 * Safely updates a document in Firestore with error handling
 * In development mode, simulates success without actually updating Firestore
 * 
 * @param collectionPath - The Firestore collection path
 * @param docId - The document ID to update
 * @param data - The document data to update
 * @returns Success status and error if any
 */
export async function safeFirestoreUpdate(
  collectionPath: string,
  docId: string,
  data: DocumentData
): Promise<{ success: boolean; error?: string }> {
  try {
    // In development mode, simulate success
    if (isFirebaseSimulated()) {
      console.log(`Development mode detected, simulating update to ${collectionPath}/${docId}`, data);
      // Simulate a delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true
      };
    }
    
    // In production, actually update Firestore
    const docRef = doc(db, collectionPath, docId);
    await updateDoc(docRef, data);
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error updating document ${collectionPath}/${docId}:`, error);
    const firebaseError = error as FirebaseError;
    
    // Check if it's a permissions error
    if (firebaseError.code === 'permission-denied') {
      console.error('Firestore permissions error. You may need to update your security rules.');
    }
    
    return {
      success: false,
      error: firebaseError.message || 'Error updating document'
    };
  }
}

/**
 * Safely deletes a document from Firestore with error handling
 * In development mode, simulates success without actually deleting from Firestore
 * 
 * @param collectionPath - The Firestore collection path
 * @param docId - The document ID to delete
 * @returns Success status and error if any
 */
export async function safeFirestoreDelete(
  collectionPath: string,
  docId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In development mode, simulate success
    if (isFirebaseSimulated()) {
      console.log(`Development mode detected, simulating delete of ${collectionPath}/${docId}`);
      // Simulate a delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true
      };
    }
    
    // In production, actually delete from Firestore
    const docRef = doc(db, collectionPath, docId);
    await deleteDoc(docRef);
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error deleting document ${collectionPath}/${docId}:`, error);
    const firebaseError = error as FirebaseError;
    
    // Check if it's a permissions error
    if (firebaseError.code === 'permission-denied') {
      console.error('Firestore permissions error. You may need to update your security rules.');
    }
    
    return {
      success: false,
      error: firebaseError.message || 'Error deleting document'
    };
  }
}

/**
 * Helper function to debug collections in development mode
 * In development, it shows the simulated data
 * In production, it fetches and logs the actual data
 * 
 * @param collectionName - Name of the collection to debug
 */
export async function debugFirestoreCollection(collectionName: string): Promise<void> {
  console.log(`Debugging collection: ${collectionName}`);
  
  if (isFirebaseSimulated()) {
    console.log(`DEVELOPMENT MODE: Showing simulated ${collectionName} data`);
    
    // Show mock data for different collections
    if (collectionName === 'tourGuideRequests') {
      console.log('Simulated tourGuideRequests:', [
        {
          id: 'mock-request-1',
          fullName: 'John Smith',
          email: 'john@example.com',
          phone: '+1234567890',
          regions: ['New York', 'Boston'],
          bio: 'Experienced tour guide with 5 years of experience.',
          idCardUrl: PLACEHOLDER_IMAGE_DATA_URL,
          status: 'pending',
          createdAt: new Date()
        },
        // More mock data here
      ]);
    } else if (collectionName === 'tourGuides') {
      console.log('Simulated tourGuides:', [
        {
          id: 'mock-guide-1',
          fullName: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '+9876543210',
          regions: ['Los Angeles', 'San Francisco'],
          bio: 'Specialized in historical tours.',
          idCardUrl: PLACEHOLDER_IMAGE_DATA_URL,
          idCardVerified: true,
          role: 'tourGuide',
          approved: true,
          approvedAt: new Date(Date.now() - 86400000), // 1 day ago
          userId: 'user-123'
        }
      ]);
    } else if (collectionName === 'appUsers') {
      console.log('Simulated appUsers:', [
        {
          id: 'user-123',
          email: 'user@example.com',
          fullName: 'Regular User',
          role: 'user'
        },
        {
          id: 'user-456',
          email: 'sarah@example.com',
          fullName: 'Sarah Johnson',
          role: 'tourGuide',
          tourGuideId: 'mock-guide-1'
        }
      ]);
    } else {
      console.log(`No mock data available for collection: ${collectionName}`);
    }
    
    return;
  }
  
  // In production mode, fetch and log the actual data
  try {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`PRODUCTION: ${collectionName} data (${data.length} documents):`, data);
  } catch (error) {
    console.error(`Error fetching ${collectionName} collection:`, error);
  }
} 