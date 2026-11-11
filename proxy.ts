import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 "proxy" (formerly middleware): picks the locale from the URL,
// cookie or Accept-Language header and redirects or rewrites accordingly.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and files with an extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
