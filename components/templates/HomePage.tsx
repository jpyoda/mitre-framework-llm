"use client";

import React from "react";
import { useTranslations } from "next-intl";

const HomePage = () => {
  const t = useTranslations("Index");

  return (
    <section>
      <div className="py-8 px-4 mx-auto max-w-4xl lg:py-16 lg:px-12">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-tight text-fg md:text-5xl">
          {t("title")}
        </h1>
        <p className="mb-8 text-lg text-muted lg:text-xl">
          {t("description")}
        </p>
        <hr className="mb-8 border-border" />
        <p className="mb-6 text-base leading-relaxed text-fg/90">{t("p1")}</p>
        <p className="mb-6 text-base leading-relaxed text-fg/90">{t("p2")}</p>
        <h2 className="mb-4 text-xl font-bold tracking-tight text-fg md:text-2xl">
          {t("subtitle")}
        </h2>
        <ol className="list-decimal ml-5 space-y-2 text-base text-muted marker:text-accent marker:font-semibold">
          <li>{t("l1")}</li>
          <li>{t("l2")}</li>
        </ol>
      </div>
    </section>
  );
};

export default HomePage;
