"use client";

import React from "react";
import DefaultLayout from "../layouts/DefaultLayout";
import { useTranslations } from "next-intl";

const HomePage = () => {
  const t = useTranslations("Index");

  return (
    <DefaultLayout>
      <div className="p-4">{t("title")}</div>
    </DefaultLayout>
  );
};

export default HomePage;
