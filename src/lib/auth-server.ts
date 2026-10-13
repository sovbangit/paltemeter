import { createMiddleware } from "@tanstack/react-start";

const GOOGLE_CLIENT_ID = "client id 1";
const GOOGLE_CLIENT_SECRET = "secret1";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

interface JWKKey {
  kid: string;
  alg: string;
  kty: string;
  use: string;
  n: string;
  e: string;
  [key: string]: string | undefined;
}

interface GoogleJWKSResponse {
  keys: JWKKey[];
}

// Verify Google ID token using Google's public keys
async function verifyGoogleToken(
  idToken: string,
): Promise<{ userId: string; email: string } | null> {
  try {
    // Fetch Google's public keys
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
    const keys: GoogleJWKSResponse = await response.json();

    // Decode the token header to get the key ID
    const headerParts = idToken.split(".");
    if (headerParts.length < 1) return null;
    const headerB64 = headerParts[0];
    if (!headerB64) return null;
    const header = JSON.parse(atob(headerB64));

    // Find the matching key
    const key = keys.keys.find((k) => k.kid === header.kid);
    if (!key) return null;

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      key,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // Verify the signature
    const parts = idToken.split(".");
    if (parts.length < 3) return null;
    const [headerB642, payloadB64, signatureB64] = parts;
    if (!headerB642 || !payloadB64 || !signatureB64) return null;
    const data = new TextEncoder().encode(`${headerB642}.${payloadB64}`);
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );

    const isValid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, data);

    if (!isValid) return null;

    // Decode and validate the payload
    const payload = JSON.parse(atob((payloadB64 as string).replace(/-/g, "+").replace(/_/g, "/")));

    // Validate the token claims
    if (payload.aud !== GOOGLE_CLIENT_ID) return null;
    if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com")
      return null;
    if (payload.exp < Date.now() / 1000) return null;

    return { userId: payload.sub, email: payload.email };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  return next();
});

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for token");
  }

  return response.json();
}

export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  return response.json();
}

export { verifyGoogleToken };
