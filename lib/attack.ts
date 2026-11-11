import "server-only";

// Server-only access to the derived ATT&CK data (data/attack-groups.json,
// produced by `npm run update:attack`). Nothing in here may be imported from a
// client component: the file is ~1.5 MB.
import rawData from "@/data/attack-groups.json";

export interface AttackTactic {
  id: string;
  shortname: string;
  name: string;
}

export interface AttackTechnique {
  id: string;
  name: string;
  tactics: string[];
  /** How the group is linked to it: "direct", a campaign ID (C####) or a software ID (S####). */
  via: string[];
}

export interface AttackGroup {
  id: string;
  name: string;
  aliases: string[];
  url: string;
  description: string;
  techniques: AttackTechnique[];
  software: { id: string; name: string; type: string }[];
  campaigns: { id: string; name: string }[];
}

export interface AttackData {
  domain: string;
  version: string;
  modified: string;
  source?: string;
  tactics: AttackTactic[];
  groups: AttackGroup[];
}

/** What the group picker needs; safe to send to the browser. */
export interface GroupOption {
  id: string;
  name: string;
  aliases: string[];
}

const data = rawData as AttackData;

export function getAttackMeta() {
  return { domain: data.domain, version: data.version, modified: data.modified };
}

export function listGroupOptions(): GroupOption[] {
  return data.groups.map(({ id, name, aliases }) => ({ id, name, aliases }));
}

export function getGroup(id: string): AttackGroup | undefined {
  return data.groups.find((group) => group.id === id);
}

/**
 * Techniques attributed to the group itself or to its campaigns. Software-only
 * links describe what a tool can do, not what the group was seen doing, so
 * they are used only when nothing better exists.
 */
export function attributedTechniques(group: AttackGroup): {
  techniques: AttackTechnique[];
  softwareOnly: boolean;
} {
  const attributed = group.techniques.filter((t) =>
    t.via.some((v) => v === "direct" || v.startsWith("C"))
  );
  return attributed.length > 0
    ? { techniques: attributed, softwareOnly: false }
    : { techniques: group.techniques, softwareOnly: true };
}

/**
 * Plain-text kill chain for the LLM prompt: techniques grouped by tactic in
 * ATT&CK matrix order, then the group's known software.
 */
export function formatKillChain(group: AttackGroup): string {
  const { techniques, softwareOnly } = attributedTechniques(group);
  const lines: string[] = [];

  for (const tactic of data.tactics) {
    const inTactic = techniques.filter((t) => t.tactics.includes(tactic.shortname));
    if (inTactic.length === 0) continue;
    const list = inTactic.map((t) => `${t.id} ${t.name}`).join("; ");
    lines.push(`- ${tactic.name} (${tactic.id}): ${list}`);
  }

  if (softwareOnly) {
    lines.unshift(
      "(No techniques are attributed to this group directly; these come from the software it is known to use.)"
    );
  }
  if (group.software.length > 0) {
    const sw = group.software.map((s) => `${s.name} (${s.id})`).join(", ");
    lines.push(`- Known software: ${sw}`);
  }
  return lines.join("\n");
}
