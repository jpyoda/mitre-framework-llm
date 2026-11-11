import ScenarioPage from "@/components/templates/ScenarioPage";
import { listGroupOptions } from "@/lib/attack";
import { hasServerApiKey } from "@/lib/scenario/config";
import React from "react";

const page = () => {
  return (
    <ScenarioPage
      groups={listGroupOptions()}
      serverKeyConfigured={hasServerApiKey()}
    />
  );
};

export default page;
