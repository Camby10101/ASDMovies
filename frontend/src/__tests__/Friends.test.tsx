import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Friends from "@/pages/FriendPage";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "fake-token" } },
        error: null
      })
    }
  }
}));

describe("Friends page", () => {
  it("renders heading", async () => {
    render(<Friends />);
    expect(await screen.findByText("Friends")).toBeInTheDocument();
  });
});
