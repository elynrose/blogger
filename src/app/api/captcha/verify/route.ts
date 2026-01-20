import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ success: false, error: 'Missing captcha secret' }, { status: 500 });
    }

    const body = new URLSearchParams({
      secret,
      response: token,
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const payload = await response.json();
    return NextResponse.json({ success: !!payload.success, errors: payload['error-codes'] || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Captcha verification failed' }, { status: 500 });
  }
}
