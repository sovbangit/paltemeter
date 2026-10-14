import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  completeSignIn: (user: User) => void;
  signOut: () => void;
  /** AI scans used in the current login session (resets on sign-in). */
  scansUsed: number;
  /** Records one AI scan against the current session's allowance. */
  recordScan: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const SCAN_COUNT_KEY = "scan_count";
export const MAX_SCANS_PER_SESSION = 10;

// Secure token storage with encryption
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encryptedToken: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(encryptedToken), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "decrypt",
    ]);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [scansUsed, setScansUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = sessionStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
      }
    }
    const storedCount = Number(sessionStorage.getItem(SCAN_COUNT_KEY) || 0);
    setScansUsed(Number.isFinite(storedCount) && storedCount > 0 ? storedCount : 0);
    setLoading(false);
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      // Initialize Google OAuth (client ID is public; secret stays server-side)
      const clientId = import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined;
      if (!clientId) {
        throw new Error(
          "Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.",
        );
      }
      const redirectUri = `${window.location.origin}/auth/callback`;
      const scope = "openid email profile";

      const state = btoa(
        crypto
          .getRandomValues(new Uint8Array(32))
          .reduce((a, b) => a + b.toString(16).padStart(2, "0"), ""),
      );
      sessionStorage.setItem("oauth_state", state);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
        access_type: "offline",
        prompt: "consent",
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch (error) {
      console.error("Sign in error:", error);
      setLoading(false);
    }
  }, []);

  const completeSignIn = useCallback((u: User) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    sessionStorage.setItem(SCAN_COUNT_KEY, "0");
    setUser(u);
    setScansUsed(0);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setScansUsed(0);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SCAN_COUNT_KEY);
    sessionStorage.removeItem("oauth_state");
  }, []);

  const recordScan = useCallback(() => {
    const next = (Number(sessionStorage.getItem(SCAN_COUNT_KEY)) || 0) + 1;
    sessionStorage.setItem(SCAN_COUNT_KEY, String(next));
    setScansUsed(next);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, completeSignIn, signOut, scansUsed, recordScan }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
