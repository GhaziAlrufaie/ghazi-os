import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  isLoggedIn: boolean;
  loginAt?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME || 'ghazi_os_session',
  password: process.env.SESSION_SECRET || 'fallback-secret-change-in-production-32chars',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000'), // 30 يوم
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth(): Promise<void> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    // سيتم التعامل معه في middleware
    throw new Error('UNAUTHORIZED');
  }
}
