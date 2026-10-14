import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LegalPage } from "@/components/LegalPage";

vi.mock("@tanstack/react-router", () => ({
  Link: (props: { to: string; children: React.ReactNode }) => (
    <a href={props.to}>{props.children}</a>
  ),
}));

describe("LegalPage", () => {
  it("renders the title, last-updated note and children", () => {
    render(
      <LegalPage title="Privacy Policy">
        <h2>Section 1</h2>
        <p>Body text.</p>
      </LegalPage>,
    );

    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Section 1" })).toBeInTheDocument();
    expect(screen.getByText("Body text.")).toBeInTheDocument();
  });

  it("renders a back link to the home page", () => {
    render(<LegalPage title="Terms">Content</LegalPage>);
    const back = screen.getByRole("link", { name: /Back/ });
    expect(back).toHaveAttribute("href", "/");
  });
});
