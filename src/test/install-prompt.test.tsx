import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallPrompt } from "@/components/InstallPrompt";

const DISMISS_KEY = "platescan-install-dismissed";

function setStandalone(standalone: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: standalone && query.includes("standalone"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }));
}

beforeEach(() => {
  localStorage.clear();
  setStandalone(false);
  Object.defineProperty(window.navigator, "userAgent", {
    value: "Mozilla/5.0 (Windows NT 10.0)",
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("InstallPrompt", () => {
  it("does not render when the app is already installed (standalone)", () => {
    setStandalone(true);
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when recently dismissed", () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render on desktop before an install prompt event arrives", () => {
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows iOS instructions on iPhones after a delay", () => {
    vi.useFakeTimers();
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      configurable: true,
    });

    render(<InstallPrompt />);
    expect(screen.queryByText(/Add to Home Screen/)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
    expect(screen.getByText("Install PlateScan")).toBeInTheDocument();
  });

  it("hides itself after the user dismisses it", () => {
    vi.useFakeTimers();
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      configurable: true,
    });

    render(<InstallPrompt />);
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    act(() => {
      screen.getByRole("button", { name: "Close" }).click();
    });

    expect(screen.queryByText("Install PlateScan")).toBeNull();
    // Dismissal is remembered for 3 days
    expect(Number(localStorage.getItem(DISMISS_KEY))).toBeGreaterThan(0);
  });
});
