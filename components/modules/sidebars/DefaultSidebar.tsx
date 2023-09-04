"use client";

import React, { useState } from "react";
import DefaultHeader from "../headers/DefaultHeader";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLanguageLabel } from "@/utils/language";
import ApiKeyContext from "@/components/layouts/ApiKeyContext";

type Props = {
  children: React.ReactNode;
};
const DefaultSidebar = ({ children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const sidebar = useTranslations("Sidebar");
  const about = useTranslations("About");
  const menu = useTranslations("Menu");
  const pathname = usePathname();
  const [language, setLanguage] = useState<any>(getLanguageLabel(pathname));

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div>
      <div
        className={`fixed top-0 left-0 z-30 w-screen h-screen transition-opacity ${
          isOpen ? "bg-black bg-opacity-50" : "bg-transparent"
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
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <h5 className="mb-3 text-center text-3xl font-bold">
            {sidebar("title")}
          </h5>
          <ul className="space-y-2 font-medium">
            <li>
              <Link
                href={`/${language?.value}/`}
                className="flex items-center p-2 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
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
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
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
          <hr className="border-gray-600 my-6" />
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              {`OpenAI API key`}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value ? e.target.value : "")}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </div>
          <hr className="border-gray-600 my-6" />
          <div className="p-4 rounded-lg dark:bg-blue-900" role="alert">
            <h3 className="mb-2 text-lg font-medium dark:text-blue-400">
              {about("title")}
            </h3>
            <p className="mb-1 text-sm dark:text-blue-400">
              {about("author")}
              <Link
                className=" ml-1 text-sm underline font-medium hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                href="https://www.juanpgonzalez.com/"
                target="_blank"
              >
                {`JP`}
              </Link>
            </p>
            <p className="text-sm dark:text-blue-400">
              {about("source")}
              <Link
                className=" ml-1 text-sm underline font-medium hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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
