import createMiddleware from "next-intl/middleware";
import { DEFAULT_LOCALE, LOCALES } from "./constants/languages";

export default createMiddleware({
  // Supported locales come from constants/languages.ts so the middleware,
  // the layout and the language picker stay in sync.
  locales: LOCALES,

  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: DEFAULT_LOCALE,
});

export const config = {
  // Skip all paths that should not be internationalized. This example skips the
  // folders "api", "_next" and all files with an extension (e.g. favicon.ico)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
