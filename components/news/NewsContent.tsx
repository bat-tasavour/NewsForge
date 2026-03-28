import type { CSSProperties } from "react";

import type { SiteTheme } from "@/lib/site/config";

type NewsContentProps = {
  html: string;
  theme: SiteTheme;
};

export function NewsContent({ html, theme }: NewsContentProps) {
  return (
    <div
      className="news-content"
      style={
        {
          "--t1-primary": theme.colors.primary,
          "--t1-accent": theme.colors.accent,
          "--t1-bg": theme.colors.background,
          "--t1-text": theme.colors.text,
          "--t1-heading-font": theme.typography.headingFont,
          "--t1-body-font": theme.typography.bodyFont
        } as CSSProperties
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
