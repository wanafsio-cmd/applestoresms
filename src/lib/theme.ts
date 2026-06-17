// Convert a hex color (#RRGGBB) to "H S% L%" suitable for hsl(var(--x))
export function hexToHslString(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return "186 100% 55%";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (l > 0.5 ? 2 - max - min : max + min);
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / (max - min) + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / (max - min) + 2); break;
      case b: h = ((r - g) / (max - min) + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export interface ThemeInput {
  accent_color?: string;
  accent_color_2?: string;
  theme_mode?: "dark" | "light";
  contrast_level?: number; // 70..140
}

export function applyTheme(theme: ThemeInput) {
  const root = document.documentElement;
  const mode = theme.theme_mode === "light" ? "light" : "dark";
  root.classList.toggle("dark", mode === "dark");
  root.dataset.theme = mode;

  const primary = hexToHslString(theme.accent_color || "#22e6ff");
  const accent = hexToHslString(theme.accent_color_2 || "#ff3df0");
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--neon-cyan", primary);
  root.style.setProperty("--neon-magenta", accent);
  root.style.setProperty("--velvet-glow", primary);
  root.style.setProperty(
    "--velvet-shimmer",
    `linear-gradient(135deg, hsl(${primary}), hsl(270 100% 65%), hsl(${accent}))`
  );

  // Contrast: tweak background lightness in dark, foreground in light
  const c = Math.max(70, Math.min(140, theme.contrast_level || 100));
  if (mode === "dark") {
    const bgL = Math.max(2, Math.min(14, Math.round(10 - (c - 100) * 0.06)));
    const cardL = bgL + 3;
    root.style.setProperty("--background", `230 35% ${bgL}%`);
    root.style.setProperty("--card", `232 32% ${cardL}%`);
    root.style.setProperty("--popover", `232 32% ${cardL}%`);
    root.style.setProperty("--foreground", `190 100% 95%`);
    root.style.setProperty("--card-foreground", `190 100% 95%`);
    root.style.setProperty("--popover-foreground", `190 100% 95%`);
    root.style.setProperty("--secondary", `232 30% ${cardL + 5}%`);
    root.style.setProperty("--muted", `232 25% ${cardL + 5}%`);
    root.style.setProperty("--border", `232 30% ${cardL + 9}%`);
    root.style.setProperty("--input", `232 30% ${cardL + 7}%`);
    root.style.setProperty("--sidebar-background", `232 40% ${Math.max(2, bgL - 1)}%`);
    root.style.setProperty("--sidebar-accent", `232 35% ${cardL + 1}%`);
    root.style.setProperty("--sidebar-border", `232 30% ${cardL + 5}%`);
  } else {
    const bgL = Math.max(92, Math.min(99, Math.round(97 + (c - 100) * 0.04)));
    const fgL = Math.max(4, Math.min(16, Math.round(11 - (c - 100) * 0.06)));
    root.style.setProperty("--background", `220 20% ${bgL}%`);
    root.style.setProperty("--card", `0 0% 100%`);
    root.style.setProperty("--popover", `0 0% 100%`);
    root.style.setProperty("--foreground", `222 47% ${fgL}%`);
    root.style.setProperty("--card-foreground", `222 47% ${fgL}%`);
    root.style.setProperty("--popover-foreground", `222 47% ${fgL}%`);
    root.style.setProperty("--secondary", `220 14% 93%`);
    root.style.setProperty("--muted", `220 14% 95%`);
    root.style.setProperty("--border", `220 13% 88%`);
    root.style.setProperty("--input", `220 13% 90%`);
    root.style.setProperty("--sidebar-background", `222 47% 8%`);
    root.style.setProperty("--sidebar-accent", `222 47% 14%`);
    root.style.setProperty("--sidebar-border", `222 30% 16%`);
  }
}
