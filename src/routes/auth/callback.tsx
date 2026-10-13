import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { exchangeCodeForToken, getUserInfo } from "@/lib/auth-server";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const storedState = sessionStorage.getItem("oauth_state");

      // Verify state to prevent CSRF attacks
      if (!code || !state || state !== storedState) {
        setError("Invalid authentication response. Please try again.");
        setTimeout(() => navigate({ to: "/login" }), 2000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const tokenResponse = await exchangeCodeForToken(code, redirectUri);
        const userInfo = await getUserInfo(tokenResponse.access_token);

        // Store user info securely
        const user = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        };

        sessionStorage.setItem("auth_user", JSON.stringify(user));
        sessionStorage.setItem("auth_token", tokenResponse.id_token);
        sessionStorage.removeItem("oauth_state");

        navigate({ to: "/" });
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate({ to: "/login" }), 2000);
      }
    }

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="rounded-2xl bg-destructive/10 p-6 text-destructive">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
