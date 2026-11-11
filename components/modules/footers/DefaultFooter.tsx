import Link from "next/link";
import React from "react";
import { getAttackMeta } from "@/lib/attack";

const DefaultFooter = () => {
  const currentYear = new Date().getFullYear();
  const attack = getAttackMeta();

  return (
    <footer className="bg-white rounded-lg shadow m-4 dark:bg-gray-800">
      <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
        <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
          © {currentYear}{" "}
          <Link
            href="https://www.juanpgonzalez.com/"
            target="_blank"
            className="hover:underline"
          >{`JP`}</Link>
          {` | `}
          {`MIT Licence`}.
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {`Data: `}
          <Link
            href="https://attack.mitre.org/"
            target="_blank"
            className="hover:underline"
          >
            {`MITRE ATT&CK®`}
          </Link>
          {` ${attack.domain.replace(" ATT&CK", "")} v${attack.version}`}
        </span>
      </div>
    </footer>
  );
};

export default DefaultFooter;
