"use client";

import React from "react";
import { useTranslations } from "next-intl";
import DefaultLayout from "../layouts/DefaultLayout";

const HomePage = () => {
  const t = useTranslations("Index");

  return (
    <DefaultLayout>
      <section>
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-12">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            {t("title")}
          </h1>
          <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
            {t("description")}
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
};

export default HomePage;
