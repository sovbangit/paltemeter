import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

function matchLast(path: string): string | undefined {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  return router.matchRoutes(path).at(-1)?.routeId;
}

describe("App routing", () => {
  it.each([
    ["/", "/"],
    ["/login", "/login"],
    ["/settings", "/settings"],
    ["/terms", "/terms"],
    ["/privacy", "/privacy"],
    ["/auth/callback", "/auth/callback"],
  ])("matches %s to its own route", (path, expectedId) => {
    expect(matchLast(path)).toBe(expectedId);
  });

  it("never matches an unknown path to a real page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/does-not-exist");
    const last = matches.at(-1)?.routeId;
    expect(last === undefined || last === rootRouteId).toBe(true);
  });
});
