export type Theme = "dark" | "light";
const KEY = "mini.theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(KEY) as Theme) || "dark";
}

export function applyTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  document.documentElement.classList.toggle("light", t === "light");
}
