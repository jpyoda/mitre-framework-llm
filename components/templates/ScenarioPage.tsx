"use client";

import React, { useContext, useEffect, useState } from "react";
import ApiKeyContext from "../layouts/ApiKeyContext";
import { INDUSTRIES, SIZES } from "@/constants/companyAttributes";
import groups from "../../data/groups.json";
import mitre from "../../data/enterprise-attack.json";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { usePathname } from "next/navigation";
import { getLanguageLabel } from "@/utils/language";
import { remark } from "remark";
import html from "remark-html";
import { useTranslations } from "next-intl";

interface MitreObject {
  type: string;
  id?: string;
  name?: string;
  source_ref?: string;
  target_ref?: string;
  [key: string]: any; // This allows other properties without specifying all of them
}

interface Mitre {
  objects?: MitreObject[];
}

const ScenarioPage = () => {
  const pathname = usePathname();
  const t = useTranslations("Scenario");

  const [language] = useState<any>(getLanguageLabel(pathname));
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [threatActor, setThreatActor] = useState(
    groups ? groups[0]?.group : ""
  );
  const [scenario, setScenario] = useState<string>(``);
  const [loading, setLoading] = useState(false);
  const [renderedContent, setRenderedContent] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const apiKey = useContext(ApiKeyContext);

  const groupKillChains = (mitre: Mitre, group: string): string => {
    const intrusion = mitre?.objects?.find(
      (v: any) => v?.type === "intrusion-set" && v?.name === group
    );

    const relations =
      mitre?.objects?.filter(
        (relation: any) => relation?.source_ref === intrusion?.id
      ) ?? [];

    const phaseSet: Set<string> = new Set(); // Using a Set to store unique phases

    relations.forEach((relation: any) => {
      const tactic = mitre?.objects?.find(
        (item: any) =>
          item?.type === "attack-pattern" && item?.id === relation?.target_ref
      );
      if (tactic) {
        tactic?.kill_chain_phases?.forEach((phase: any) => {
          if (phase?.phase_name) {
            phaseSet.add(phase.phase_name);
          }
        });
      }
    });

    const uniquePhases = Array.from(phaseSet).join(", ");

    return `${uniquePhases}`;
  };

  async function handleGenerateScenario() {
    setLoading(true);
    const llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      streaming: false,
    });
    const system_template =
      "You are a cybersecurity expert. Your task is to produce a comprehensive incident response testing scenario based on the information provided.";
    const system_message_prompt =
      SystemMessagePromptTemplate.fromTemplate(system_template);
    const human_template = `**Background information:**
    The company operates in the {industry} industry and is of size {company_size}. 
    
    **Threat actor information:**
    Threat actor group '{selected_group_alias}' is planning to target the company using the following kill chain
    {kill_chain_string}
    
    **Your task:**
    Create an incident response testing scenario based on the information provided. The goal of the scenario is to test the company's incident response capabilities against the identified threat actor group. 
    
    Your response should be well structured and formatted using Markdown. Write in {language}.
    `;
    const human_message_prompt =
      HumanMessagePromptTemplate.fromTemplate(human_template);
    const chat_prompt = ChatPromptTemplate.fromPromptMessages([
      system_message_prompt,
      human_message_prompt,
    ]);
    const messages = await chat_prompt.format({
      industry: industry,
      company_size: size,
      selected_group_alias: threatActor,
      kill_chain_string: groupKillChains(mitre, threatActor),
      language: language?.fullValue,
    });
    console.log(messages);
    const response = await llm.predict(messages);
    console.log(response);
    setScenario(response);
    setLoading(false);
  }

  async function markdownRender(content: string) {
    const processedContent = await remark()
      .use(html)
      .process(content)
      .then((v) => {
        return v?.value;
      });

    return processedContent.toString();
  }

  useEffect(() => {
    async function fetchAndSetRenderedContent() {
      const contentHtml = await markdownRender(scenario);
      setRenderedContent(contentHtml);
    }

    fetchAndSetRenderedContent();
  }, [scenario]);

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
            <span className="font-medium">Reminder!</span> Please provide your
            OpenAI API key to proceed.
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
              value={threatActor}
              onChange={(e) => setThreatActor(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              {groups?.map((v, i) => (
                <option key={i} value={v?.group}>
                  {v?.group}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            if (apiKey && !loading) {
              handleGenerateScenario();
              setShowAlert(false);
            } else if (!apiKey) {
              setShowAlert(true);
            }
          }}
          disabled={loading}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          {t("cta")}
        </button>
        {loading ? (
          <div role="status" className="max-w-sm animate-pulse mt-8">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
            <span className="sr-only">Loading...</span>
          </div>
        ) : scenario ? (
          <div className="prose prose-invert">
            <hr className="my-8 border-gray-600" />
            <div
              dangerouslySetInnerHTML={{
                __html: renderedContent,
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ScenarioPage;
