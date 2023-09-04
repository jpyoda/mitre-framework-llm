import React from "react";
import { OpenAI } from "langchain/llms/openai";
import DefaultLayout from "../layouts/DefaultLayout";

const ScenarioPage = () => {
  /*const llm = new OpenAI({
    openAIApiKey: "YOUR_KEY_HERE",
    temperature: 0,
  });
  const result = llm.predict(
    "What would be a good company name for a company that makes colorful socks?"
  );*/
  return (
    <DefaultLayout>
      <div className="p-4">{`Scenario page`}</div>
    </DefaultLayout>
  );
};

export default ScenarioPage;
