"use client";

import React from "react";
import { useTranslations } from "next-intl";

const HomePage = () => {
  const t = useTranslations("Index");

  return (
    <section>
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-12">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
          {t("description")}
        </p>
        <hr className="mb-8 border-gray-600" />
        <p className="mb-8 text-lg font-normal dark:text-gray-400">{t("p1")}</p>
        <p className="mb-8 text-lg font-normal dark:text-gray-400">{t("p2")}</p>
        <h2 className="mb-4 text-xl font-extrabold tracking-tight leading-none md:text-2xl lg:text-3xl dark:text-gray-100">
          {t("subtitle")}
        </h2>
        <ol className="list-decimal mx-5 text-lg font-normal dark:text-gray-400">
          <li>{t("l1")}</li>
          <li>{t("l2")}</li>
        </ol>
      </div>
    </section>
  );
};

export default HomePage;
