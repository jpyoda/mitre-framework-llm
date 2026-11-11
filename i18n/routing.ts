import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/constants/languages";

// Locales come from constants/languages.ts, the one list the proxy, layout
// and language picker all use.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // English pages have no prefix (/scenario); others do (/es/scenario).
  localePrefix: "as-needed",
});
