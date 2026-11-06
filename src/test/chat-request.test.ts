import { describe, expect, it } from "vitest";
import { buildChatRequest, MINI_IDENTITY } from "@/lib/chat-request";

describe("Mini current information", () => {
  it("attributes the Mini application to Mini ai studio separately from the model developer", () => {
    expect(MINI_IDENTITY.creator).toBe("Mini ai studio");
    expect(MINI_IDENTITY.modelDeveloper).toBe("Google");
    expect(MINI_IDENTITY.modelName).toBe("Gemini");
  });
  it("uses the runtime year 2026 even when history says 2024", () => {
    const request = buildChatRequest(
      [{ role: "assistant", content: "Сейчас 2024 год." }],
      new Date("2026-11-04T08:51:00Z"),
    );
    expect(request.contents[0]?.role).toBe("model");
    expect(request.systemInstruction.parts[0]?.text).toContain("2026-11-04");
    expect(request.systemInstruction.parts[0]?.text).toContain("current year is 2026");
  });

  it("refreshes the authoritative date across a year boundary", () => {
    const request = buildChatRequest([], new Date("2027-01-01T00:00:00Z"));
    expect(request.systemInstruction.parts[0]?.text).toContain("2027-01-01");
    expect(request.systemInstruction.parts[0]?.text).toContain("current year is 2027");
  });

  it("enables real Google Search for fresh sources on every request", () => {
    expect(buildChatRequest([]).tools).toEqual([{ google_search: {} }]);
  });
});