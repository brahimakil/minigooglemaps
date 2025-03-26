import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json();
  
  try {
    const docRef = doc(db, body.collection, body.id);
    await updateDoc(docRef, {
      ...body.data,
      updatedAt: serverTimestamp()
    });
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Update failed' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
} 