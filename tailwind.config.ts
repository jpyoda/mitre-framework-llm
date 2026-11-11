import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/** A color backed by a CSS variable from globals.css, with opacity support. */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;
const solid = (name: string) => `rgb(var(--color-${name}))`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        "surface-muted": token("surface-muted"),
        border: token("border"),
        fg: token("fg"),
        muted: token("muted"),
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          fg: token("accent-fg"),
          soft: token("accent-soft"),
        },
        danger: {
          DEFAULT: token("danger"),
          soft: token("danger-soft"),
        },
      },
      typography: {
        // Generated scenarios follow the same tokens in light and dark mode.
        DEFAULT: {
          css: {
            "--tw-prose-body": solid("fg"),
            "--tw-prose-headings": solid("fg"),
            "--tw-prose-lead": solid("muted"),
            "--tw-prose-links": solid("accent"),
            "--tw-prose-bold": solid("fg"),
            "--tw-prose-counters": solid("muted"),
            "--tw-prose-bullets": solid("muted"),
            "--tw-prose-hr": solid("border"),
            "--tw-prose-quotes": solid("fg"),
            "--tw-prose-quote-borders": solid("accent"),
            "--tw-prose-captions": solid("muted"),
            "--tw-prose-code": solid("fg"),
            "--tw-prose-pre-code": solid("fg"),
            "--tw-prose-pre-bg": solid("surface-muted"),
            "--tw-prose-th-borders": solid("border"),
            "--tw-prose-td-borders": solid("border"),
          },
        },
      },
    },
  },
  plugins: [typography],
};
export default config;
