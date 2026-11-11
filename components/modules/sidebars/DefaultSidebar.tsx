"use client";

import React, { useState } from "react";
import DefaultHeader from "../headers/DefaultHeader";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLanguageLabel } from "@/utils/language";
import { LOCALES } from "@/constants/languages";
import ApiKeyContext from "@/components/layouts/ApiKeyContext";

type Props = {
  children: React.ReactNode;
  serverKeyConfigured: boolean;
};
const DefaultSidebar = ({ children, serverKeyConfigured }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const sidebar = useTranslations("Sidebar");
  const about = useTranslations("About");
  const menu = useTranslations("Menu");
  const pathname = usePathname();
  const [language] = useState<any>(getLanguageLabel(pathname));

  // Path without the locale prefix ("/es/scenario" -> "/scenario").
  const page =
    pathname.replace(new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`), "") || "/";
  const isHome = page === "/";
  const isScenario = page.startsWith("/scenario");

  const navLinkClass = (active: boolean) =>
    `flex items-center p-2 rounded-lg transition-colors ${
      active
        ? "bg-accent-soft text-accent font-semibold"
        : "text-fg hover:bg-surface-muted"
    }`;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div>
      <div
        className={`fixed top-0 left-0 z-30 w-screen h-screen transition-opacity ${
          isOpen ? "bg-black/40" : "bg-transparent"
        } ${isOpen ? "" : "pointer-events-none"}`}
        onClick={toggleSidebar}
      />

      <aside
        id="sidebar-multi-level-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-5 overflow-y-auto bg-surface border-r border-border">
          <Link
            href={`/${language?.value}/`}
            className="mb-6 flex items-center gap-2 px-2 text-xl font-bold tracking-tight text-fg"
          >
            <span
              aria-hidden="true"
              className="inline-block h-6 w-6 rounded-md bg-accent"
            />
            {sidebar("title")}
          </Link>
          <ul className="space-y-2 font-medium">
            <li>
              <Link
                href={`/${language?.value}/`}
                className={navLinkClass(isHome)}
                aria-current={isHome ? "page" : undefined}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>

                <span className="flex-1 ml-3 whitespace-nowrap">
                  {menu(`welcome`)}
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={`/${language?.value}/scenario`}
                className={navLinkClass(isScenario)}
                aria-current={isScenario ? "page" : undefined}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                  <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                </svg>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  {menu(`scenario`)}
                </span>
              </Link>
            </li>
          </ul>
          <hr className="border-border my-6" />
          <div>
            <label
              htmlFor="api-key"
              className="block mb-2 text-sm font-medium text-fg"
            >
              {sidebar("apiKey")}
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value ? e.target.value : "")}
              autoComplete="off"
              aria-describedby="api-key-help"
              className="bg-canvas border border-border text-fg text-sm rounded-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 block w-full p-2.5"
            />
            <p
              id="api-key-help"
              className="mt-2 text-xs text-muted"
            >
              {sidebar(
                serverKeyConfigured ? "apiKeyOptional" : "apiKeyRequired"
              )}
            </p>
          </div>
          <hr className="border-border my-6" />
          <div className="p-4 rounded-lg bg-surface-muted">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              {about("title")}
            </h3>
            <p className="mb-1 text-sm text-muted">
              {about("author")}
              <Link
                className="ml-1 font-medium text-accent hover:underline"
                href="https://www.juanpgonzalez.com/"
                target="_blank"
              >
                {`JP`}
              </Link>
            </p>
            <p className="text-sm text-muted">
              {about("source")}
              <Link
                className="ml-1 font-medium text-accent hover:underline"
                href="https://github.com/jpyoda/mitre-framework-llm"
                target="_blank"
              >
                {`GitHub`}
              </Link>
            </p>
          </div>
        </div>
      </aside>
      <div className="sm:ml-64">
        <DefaultHeader toggleSidebar={toggleSidebar} />
        <ApiKeyContext.Provider value={apiKey}>
          {children}
        </ApiKeyContext.Provider>
      </div>
    </div>
  );
};

export default DefaultSidebar;
