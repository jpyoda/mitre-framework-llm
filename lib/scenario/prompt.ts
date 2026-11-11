import "server-only";

import { AttackGroup, formatKillChain } from "@/lib/attack";

export interface ScenarioInput {
  industry: string;
  size: string;
  group: AttackGroup;
  /** Full language name, e.g. "Spanish". */
  language: string;
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

const SYSTEM_PROMPT = `You are a senior incident response consultant who designs tabletop and live-fire exercises.
You write realistic, technically accurate incident response testing scenarios grounded in MITRE ATT&CK.
Rules:
- Base the attack on the ATT&CK techniques you are given. Cite technique IDs (e.g. T1566.001) wherever you use one.
- If you need a step that is not in the list, label it clearly as an assumption.
- Fit the scenario to the company's industry and size: its likely systems, data, team size and maturity.
- Do not include working exploit code, real malware or real credentials.`;

/** First couple of sentences of the ATT&CK description; enough context without bloating the prompt. */
function shortDescription(text: string, maxLength = 600): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastStop = cut.lastIndexOf(". ");
  return (lastStop > 200 ? cut.slice(0, lastStop + 1) : cut) + " …";
}

export function buildScenarioMessages(input: ScenarioInput): ChatMessage[] {
  const { industry, size, group, language } = input;
  const aliases =
    group.aliases.length > 0 ? `\nAlso known as: ${group.aliases.join(", ")}` : "";

  const user = `## Company
- Industry: ${industry}
- Size: ${size}

## Threat actor
${group.name} (MITRE ATT&CK ${group.id})${aliases}
${shortDescription(group.description)}

Techniques this group is known to use, grouped by tactic:
${formatKillChain(group)}

## Your task
Create an incident response testing scenario in which ${group.name} targets this company. Pick the 6 to 10 techniques from the list that make the most plausible attack path for this industry and company size; do not try to use them all.

Structure the answer with these Markdown sections:
1. **Scenario overview**: objective, scope, participants and assumptions.
2. **Threat actor profile**: a short briefing for participants.
3. **Attack timeline**: phases in order. For each phase give what the attacker does, the ATT&CK technique IDs, what defenders could observe (log sources, alerts) and a facilitator inject.
4. **Expected response**: what the team should do at each phase (detect, contain, eradicate, recover, communicate).
5. **Discussion questions**.
6. **Success criteria**: measurable outcomes for the exercise.

Write the whole answer in ${language}. Keep ATT&CK IDs and technique names in English.`;

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: user },
  ];
}
