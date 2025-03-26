import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { path, data } = await request.json();
    
    // Check if we're in a server environment and have a valid db
    if (typeof db.collection !== 'function') {
      return NextResponse.json(
        { error: 'Firebase not available in this environment' },
        { status: 500 }
      );
    }
    
    const docRef = doc(db, path);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
      { status: 500 }
    );
  }
} 