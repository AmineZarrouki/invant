import { NextResponse } from 'next/server';

// In-memory rate limiting map: IP -> { attempts: number, lockUntil: number }
const rateLimitMap = new Map<string, { attempts: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000; // 30 seconds lockout after 5 fails

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'anonymous';
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const now = Date.now();
    const rateData = rateLimitMap.get(ip) || { attempts: 0, lockUntil: 0 };

    // Check lockout
    if (rateData.lockUntil > now) {
      const remainingSec = Math.ceil((rateData.lockUntil - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Trop de tentatives incorrectes. Veuillez patienter ${remainingSec} secondes.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ success: false, error: 'Code PIN requis' }, { status: 400 });
    }

    // Default 6-digit PIN code or server-side env variable
    const expectedPin = (process.env.APP_PIN_CODE || '777777').trim();

    if (pin.trim() !== expectedPin) {
      rateData.attempts += 1;
      if (rateData.attempts >= MAX_ATTEMPTS) {
        rateData.lockUntil = now + LOCKOUT_MS;
        rateData.attempts = 0;
        rateLimitMap.set(ip, rateData);
        return NextResponse.json(
          {
            success: false,
            error: 'Trop de tentatives incorrectes. Clavier bloqué pendant 30 secondes.',
          },
          { status: 429 }
        );
      }
      rateLimitMap.set(ip, rateData);
      const remainingAttempts = MAX_ATTEMPTS - rateData.attempts;
      return NextResponse.json(
        {
          success: false,
          error: `Code PIN incorrect. ${remainingAttempts} essai(s) restant(s).`,
        },
        { status: 401 }
      );
    }

    // Success: Reset rate limits
    rateLimitMap.delete(ip);

    // Simple session token hash
    const sessionToken = Buffer.from(`${now}:${expectedPin.slice(0, 3)}:kickbox-auth`).toString('base64');

    return NextResponse.json({
      success: true,
      token: sessionToken,
      expiresIn: 600, // 10 minutes
    });
  } catch (err: any) {
    console.error('Auth verify error:', err);
    return NextResponse.json({ success: false, error: 'Erreur d’authentification' }, { status: 500 });
  }
}
