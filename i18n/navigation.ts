import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of Next's navigation APIs: links take paths without
// the locale prefix, and usePathname returns the path without it.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
