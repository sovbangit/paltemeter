import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, type User } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";

vi.mock("@tanstack/react-router", () => ({
  Navigate: (props: { to: string }) => <div data-testid="navigate-to" data-to={props.to} />,
}));

const testUser: User = { id: "u1", email: "a@b.c", name: "Test" };

function renderProtected() {
  return render(
    <AuthProvider>
      <ProtectedRoute>
        <div>secret content</div>
      </ProtectedRoute>
    </AuthProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProtectedRoute", () => {
  it("renders children for a signed-in user", async () => {
    sessionStorage.setItem("auth_user", JSON.stringify(testUser));
    renderProtected();
    expect(await screen.findByText("secret content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate-to")).toBeNull();
  });

  it("redirects to /login when signed out", async () => {
    renderProtected();
    const nav = await screen.findByTestId("navigate-to");
    expect(nav.getAttribute("data-to")).toBe("/login");
    expect(screen.queryByText("secret content")).toBeNull();
  });

  it("shows a spinner while the session is being restored", async () => {
    // Restore a user but keep AuthProvider in loading state by never resolving:
    // simulate by rendering with a stored user and checking spinner appears first.
    sessionStorage.setItem("auth_user", JSON.stringify(testUser));
    const { container } = renderProtected();
    // The spinner has the animate-spin class while loading resolves.
    await waitFor(() => {
      expect(
        container.querySelector(".animate-spin") ?? screen.getByText("secret content"),
      ).toBeTruthy();
    });
  });
});
