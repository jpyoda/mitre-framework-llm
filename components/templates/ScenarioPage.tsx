"use client";

import React, { useContext } from "react";
import { OpenAI } from "langchain/llms/openai";
import DefaultLayout from "../layouts/DefaultLayout";
import ApiKeyContext from "../layouts/ApiKeyContext";

const ScenarioPage = () => {
  /*const llm = new OpenAI({
    openAIApiKey: "YOUR_KEY_HERE",
    temperature: 0,
  });
  const result = llm.predict(
    "What would be a good company name for a company that makes colorful socks?"
  );*/
  const apiKey = useContext(ApiKeyContext);

  return <div className="p-4">{`Scenario page 1`}</div>;
};

export default ScenarioPage;
