import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "sbx_training_session";
const SESSION_DURATION = 3600; // 1 hour in seconds

export interface Session {
  userId: string;          // Supabase users.id (UUID)
  schoolboxUserId: number; // Schoolbox internal User ID
  externalId: string;      // College's Staff ID
  username: string;        // Username
  email: string;           // Email address
  name: string;            // Full name
  role: "staff";           // This app is staff-only
  isAdmin: boolean;        // Has admin privileges
  expires: number;         // Expiry timestamp
}

/**
 * Creates and sets a session cookie
 * Uses sameSite: "none" for iframe embedding in Schoolbox
 */
export async function setSession(session: Omit<Session, "expires">) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const sessionData: Session = { ...session, expires };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: true, // Required for sameSite: none
    sameSite: "none", // Allow cookies in iframe (third-party context)
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Gets the current session from cookie
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const session: Session = JSON.parse(sessionCookie.value);
    const now = Math.floor(Date.now() / 1000);

    // Check if session has expired
    if (session.expires < now) {
      await clearSession();
      return null;
    }

    return session;
  } catch (error) {
    await clearSession();
    return null;
  }
}

/**
 * Clears the session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
