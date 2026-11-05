import { describe, expect, it } from "vitest";
import { IMAGE_FREE_LIMIT, buildImagePrompt } from "@/lib/image-studio";
import { buildChatRequest } from "@/lib/chat-request";

describe("image studio", () => {
  it("gives 10 free generations", () => expect(IMAGE_FREE_LIMIT).toBe(10));
  it("appends style hint", () => expect(buildImagePrompt("cat", "anime")).toContain("anime"));
});

describe("photo analysis", () => {
  it("sends attached photos as image parts", () => {
    const req = buildChatRequest([{ role: "user", content: "что это?", images: ["data:image/jpeg;base64,AA"] }]);
    const last = req.messages[1] as { content: Array<{ type: string }> };
    expect(last.content.map((p) => p.type)).toEqual(["text", "image_url"]);
  });
});
