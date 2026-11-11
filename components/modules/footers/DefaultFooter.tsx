import Link from "next/link";
import React from "react";
import { getAttackMeta } from "@/lib/attack";

const DefaultFooter = () => {
  const currentYear = new Date().getFullYear();
  const attack = getAttackMeta();

  return (
    <footer className="border-t border-border mt-8">
      <div className="w-full mx-auto max-w-screen-xl px-4 py-6 lg:px-12 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <span className="text-sm text-muted">
          © {currentYear}{" "}
          <Link
            href="https://www.juanpgonzalez.com/"
            target="_blank"
            className="text-fg hover:text-accent hover:underline"
          >{`JP`}</Link>
          {` | `}
          {`MIT Licence`}.
        </span>
        <span className="text-sm text-muted">
          {`Data: `}
          <Link
            href="https://attack.mitre.org/"
            target="_blank"
            className="text-fg hover:text-accent hover:underline"
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
