import Link from "next/link";
import React from "react";

const DefaultFooter = () => {
  const currentYear = new Date().getFullYear();

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
      </div>
    </footer>
  );
};

export default DefaultFooter;
