import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, MAX_SCANS_PER_SESSION, useAuth, type User } from "@/lib/auth-context";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const testUser: User = { id: "u1", email: "a@b.c", name: "Test", picture: "p.png" };

// jsdom cannot navigate; replace location so signIn's redirect is observable.
const originalLocation = window.location;

beforeEach(() => {
  sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

afterEach(() => {
  Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  vi.unstubAllEnvs();
});

describe("AuthProvider", () => {
  it("starts with no user when there is no stored session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("restores the user from sessionStorage on mount", async () => {
    sessionStorage.setItem("auth_user", JSON.stringify(testUser));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(testUser));
  });

  it("discards corrupted session data", async () => {
    sessionStorage.setItem("auth_user", "{broken json");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(sessionStorage.getItem("auth_user")).toBeNull();
  });

  it("completeSignIn persists the user and updates state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.completeSignIn(testUser));

    expect(result.current.user).toEqual(testUser);
    expect(JSON.parse(sessionStorage.getItem("auth_user")!)).toEqual(testUser);
  });

  it("signOut clears the user and all session storage", async () => {
    sessionStorage.setItem("auth_user", JSON.stringify(testUser));
    sessionStorage.setItem("auth_token", "tok");
    sessionStorage.setItem("oauth_state", "st");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(testUser));

    act(() => result.current.signOut());

    expect(result.current.user).toBeNull();
    expect(sessionStorage.getItem("auth_user")).toBeNull();
    expect(sessionStorage.getItem("auth_token")).toBeNull();
    expect(sessionStorage.getItem("oauth_state")).toBeNull();
  });

  it("signIn redirects to Google with client id, scope and state", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");
    Object.defineProperty(window, "location", {
      value: { href: "", origin: "http://localhost:3000" },
      writable: true,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.signIn());

    expect(window.location.href).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(window.location.href).toContain("client_id=test-client-id");
    expect(window.location.href).toContain("scope=openid");
    expect(window.location.href).toContain("response_type=code");
    expect(window.location.href).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback",
    );
    expect(sessionStorage.getItem("oauth_state")).toBeTruthy();
  });

  it("signIn without configured client id does not redirect", async () => {
    // Ensure no VITE_GOOGLE_CLIENT_ID is present
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    Object.defineProperty(window, "location", { value: { href: "unchanged" }, writable: true });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.signIn());

    expect(window.location.href).toBe("unchanged");
    expect(result.current.loading).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("scan limit", () => {
  it("exposes an allowance of 10 scans per session", () => {
    expect(MAX_SCANS_PER_SESSION).toBe(10);
  });

  it("starts at 0 scans used for a fresh session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scansUsed).toBe(0);
  });

  it("restores the used count from sessionStorage on mount", async () => {
    sessionStorage.setItem("auth_user", JSON.stringify(testUser));
    sessionStorage.setItem("scan_count", "7");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.scansUsed).toBe(7));
  });

  it("recordScan increments the count and persists it", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.recordScan());
    act(() => result.current.recordScan());

    expect(result.current.scansUsed).toBe(2);
    expect(sessionStorage.getItem("scan_count")).toBe("2");
  });

  it("completeSignIn resets the count for the new session", async () => {
    sessionStorage.setItem("scan_count", "9");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.scansUsed).toBe(9));

    act(() => result.current.completeSignIn(testUser));

    expect(result.current.scansUsed).toBe(0);
    expect(sessionStorage.getItem("scan_count")).toBe("0");
  });

  it("signOut clears the count", async () => {
    sessionStorage.setItem("auth_user", JSON.stringify(testUser));
    sessionStorage.setItem("scan_count", "10");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.scansUsed).toBe(10));

    act(() => result.current.signOut());

    expect(result.current.scansUsed).toBe(0);
    expect(sessionStorage.getItem("scan_count")).toBeNull();
  });

  it("a fresh mount after sign-out starts from 0", async () => {
    sessionStorage.setItem("auth_user", JSON.stringify(testUser));
    sessionStorage.setItem("scan_count", "10");
    const first = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(first.result.current.scansUsed).toBe(10));
    act(() => first.result.current.signOut());
    first.unmount();

    const second = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.scansUsed).toBe(0);
    expect(second.result.current.user).toBeNull();
  });
});

describe("useAuth", () => {
  it("throws outside of an AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/must be used within an AuthProvider/);
    consoleSpy.mockRestore();
  });
});
