"use client";

import React, { useContext, useState } from "react";
import ApiKeyContext from "../layouts/ApiKeyContext";
import { INDUSTRIES, SIZES } from "@/constants/companyAttributes";
import { USER_KEY_HEADER } from "@/constants/api";
import { useLocale, useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { GroupOption } from "@/lib/attack";

type Props = {
  groups: GroupOption[];
  /** True when the server has its own OPENAI_API_KEY, so a user key is optional. */
  serverKeyConfigured: boolean;
};

const ERROR_CODES = [
  "missing_api_key",
  "invalid_api_key",
  "rate_limited",
  "provider_error",
  "invalid_request",
  "unknown_group",
] as const;

const ScenarioPage = ({ groups, serverKeyConfigured }: Props) => {
  const t = useTranslations("Scenario");
  const locale = useLocale();

  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [threatActorId, setThreatActorId] = useState(groups[0]?.id ?? "");
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [error, setError] = useState("");

  const apiKey = useContext(ApiKeyContext);

  function errorMessage(code: unknown, fallback: string): string {
    return ERROR_CODES.includes(code as (typeof ERROR_CODES)[number])
      ? t(`errors.${code as (typeof ERROR_CODES)[number]}`)
      : fallback;
  }

  async function handleGenerateScenario() {
    setLoading(true);
    setError("");
    setScenario("");
    try {
      await generateScenario();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function generateScenario() {
    const res = await fetch("/api/scenario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { [USER_KEY_HEADER]: apiKey } : {}),
      },
      body: JSON.stringify({ industry, size, groupId: threatActorId, locale }),
    });

    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => null);
      throw new Error(
        errorMessage(body?.code, body?.error ?? `Request failed (${res.status})`)
      );
    }

    // The scenario streams in as plain Markdown text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setScenario(text);
      }
    } catch {
      throw new Error(t("errors.interrupted"));
    }
  }

  return (
    <section>
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-12">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight leading-none md:text-2xl lg:text-3xl dark:text-gray-100">
          {t("title")}
        </h2>
        <p className="mb-8 text-lg font-normal dark:text-gray-400">
          {t("description")}
        </p>
        {showAlert && (
          <div
            className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
            role="alert"
          >
            {t("errors.missing_api_key")}
          </div>
        )}
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              {t("industry")}
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              {INDUSTRIES?.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              {t("size")}
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              {SIZES?.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              {t("group")}
            </label>
            <select
              value={threatActorId}
              onChange={(e) => setThreatActorId(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.id})
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            if (!apiKey && !serverKeyConfigured) {
              setShowAlert(true);
            } else if (!loading) {
              setShowAlert(false);
              handleGenerateScenario();
            }
          }}
          disabled={loading}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          {t("cta")}
        </button>
        {error && (
          <div
            className="p-4 mt-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}
        {scenario ? (
          <div className="prose dark:prose-invert max-w-none">
            <hr className="my-8 border-gray-600" />
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{scenario}</ReactMarkdown>
          </div>
        ) : loading ? (
          <div role="status" className="max-w-sm animate-pulse mt-8">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
            <span className="sr-only">Loading...</span>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ScenarioPage;
