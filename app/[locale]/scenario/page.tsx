import ScenarioPage from "@/components/templates/ScenarioPage";
import { listGroupOptions } from "@/lib/attack";
import React from "react";

const page = () => {
  return <ScenarioPage groups={listGroupOptions()} />;
};

export default page;
