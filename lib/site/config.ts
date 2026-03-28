import { normalizeHost } from "@/lib/utils/url";

export type SiteTheme = {
  template: "template-1";
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
    panel: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
};

export type SiteConfig = {
  name: string;
  organizationName: string;
  description: string;
  domain: string;
  language: string;
  logoUrl?: string;
  social: {
    twitter?: string;
    facebook?: string;
  };
  theme: SiteTheme;
};

function readDomain(): string {
  const raw = process.env.SITE_DOMAIN || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "localhost:3000";
  return normalizeHost(raw);
}

export function getSiteConfig(): SiteConfig {
  const siteName = process.env.SITE_NAME || "NewsForge Daily";

  return {
    name: siteName,
    organizationName: process.env.SITE_ORGANIZATION_NAME || siteName,
    description: process.env.SITE_DESCRIPTION || "Independent reporting and analysis with fast, verified updates.",
    domain: readDomain(),
    language: process.env.SITE_LANGUAGE || "en",
    logoUrl: process.env.SITE_LOGO_URL || undefined,
    social: {
      twitter: process.env.SITE_TWITTER || undefined,
      facebook: process.env.SITE_FACEBOOK || undefined
    },
    theme: {
      template: "template-1",
      colors: {
        primary: process.env.SITE_THEME_PRIMARY || "#161616",
        accent: process.env.SITE_THEME_ACCENT || "#cc0000",
        background: process.env.SITE_THEME_BACKGROUND || "#f5f5f5",
        text: process.env.SITE_THEME_TEXT || "#111111",
        panel: process.env.SITE_THEME_PANEL || "#ffffff"
      },
      typography: {
        headingFont: process.env.SITE_HEADING_FONT || '"Merriweather", Georgia, serif',
        bodyFont: process.env.SITE_BODY_FONT || '"Source Sans 3", system-ui, sans-serif'
      }
    }
  };
}

export function getSiteBaseUrl(config = getSiteConfig()): string {
  const explicit = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.trim().replace(/\/+$/, "");
  }

  const protocol = config.domain.includes("localhost") || config.domain.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${config.domain}`;
}
