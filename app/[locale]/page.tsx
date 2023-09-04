import { OpenAI } from "langchain/llms/openai";
import HomePage from "@/components/templates/HomePage";

export default function Home() {
  /*const llm = new OpenAI({
    openAIApiKey: "YOUR_KEY_HERE",
    temperature: 0,
  });
  const result = llm.predict(
    "What would be a good company name for a company that makes colorful socks?"
  );*/

  return <HomePage />;
}
