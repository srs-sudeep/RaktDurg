import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "RAKT Durg",
  tagline: "District-Level Digital Blood Bank Platform — Durg, Chhattisgarh",
  favicon: "img/favicon.svg",

  // Canonical public docs URL (Vercel).
  url: "https://rakt-durg-docs.vercel.app",
  baseUrl: "/",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/rakt-durg-social.png",
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "RAKT Durg",
      logo: {
        alt: "RAKT Durg Logo",
        src: "img/logo.svg",
      },
      items: [
        { to: "/", label: "Docs", position: "left" },
        { to: "/demo", label: "Demo", position: "left" },
        { to: "/api/overview", label: "API Reference", position: "left" },
        { to: "/ops/docker", label: "Ops", position: "left" },
        {
          href: "http://8.231.102.114/login",
          label: "Live login",
          position: "right",
        },
        {
          href: "http://8.231.102.114",
          label: "App",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Product",
          items: [
            { label: "Architecture", to: "/architecture/overview" },
            { label: "Data Model", to: "/architecture/data-model" },
            { label: "Phases", to: "/phases/phase-0" },
          ],
        },
        {
          title: "Developer",
          items: [
            { label: "Quick Start", to: "/quickstart" },
            { label: "Backend Guide", to: "/backend/setup" },
            { label: "Web Guide", to: "/web/setup" },
            { label: "Mobile Guide", to: "/mobile/setup" },
          ],
        },
        {
          title: "Operations",
          items: [
            { label: "Docker & Compose", to: "/ops/docker" },
            { label: "CI / CD", to: "/ops/ci-cd" },
            { label: "Makefile Commands", to: "/ops/makefile" },
          ],
        },
        {
          title: "Links",
          items: [
            { label: "Documentation", href: "https://rakt-durg-docs.vercel.app/" },
            { label: "Demo & logins", to: "/demo" },
            { label: "Web app", href: "http://8.231.102.114" },
            { label: "GitHub", href: "https://github.com/srs-sudeep/RaktDurg" },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} RaktDurg — By IBITF and IIT Bhilai · Powered by Recogx Init`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["python", "bash", "yaml", "sql", "dart", "typescript", "json"],
    },
    algolia: undefined,
  } satisfies Preset.ThemeConfig,
};

export default config;
