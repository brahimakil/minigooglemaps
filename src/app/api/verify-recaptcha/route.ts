import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  const { token } = data;
  
  if (!token) {
    return NextResponse.json({ success: false, message: 'reCAPTCHA token is required' }, { status: 400 });
  }
  
  try {
    // Verify the reCAPTCHA token with Google
    const secret = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Test key
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });
    
    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'reCAPTCHA verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 