export const IMAGE_FREE_LIMIT = 10;

export const IMAGE_STYLES = [
  { id: "none", label: "Без стиля", hint: "" },
  { id: "realistic", label: "Фото", hint: "photorealistic, natural lighting, high detail" },
  { id: "3d", label: "3D", hint: "cute 3D render, soft lighting, glossy materials" },
  { id: "anime", label: "Аниме", hint: "anime illustration style, vibrant colors" },
  { id: "neon", label: "Неон", hint: "neon cyberpunk style, purple and blue glow" },
  { id: "watercolor", label: "Акварель", hint: "watercolor painting, soft textures" },
] as const;

export type ImageStyle = (typeof IMAGE_STYLES)[number]["id"];

export function buildImagePrompt(prompt: string, style: ImageStyle) {
  const hint = IMAGE_STYLES.find((s) => s.id === style)?.hint;
  return hint ? `${prompt.trim()}. Style: ${hint}.` : prompt.trim();
}
