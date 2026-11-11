// A tiny hand-made ATT&CK STIX bundle covering the cases the transform must
// handle: live and retired objects, sub-techniques, "uses" via the group,
// its campaign and its software, and relationship types that must be ignored.

const ref = (id: string, url = `https://attack.mitre.org/x/${id}`) => ({
  source_name: "mitre-attack",
  external_id: id,
  url,
});

const technique = (stixId: string, id: string, name: string, tactics: string[], extra = {}) => ({
  type: "attack-pattern",
  id: stixId,
  name,
  external_references: [ref(id)],
  kill_chain_phases: tactics.map((phase_name) => ({
    kill_chain_name: "mitre-attack",
    phase_name,
  })),
  ...extra,
});

const uses = (id: string, source_ref: string, target_ref: string, extra = {}) => ({
  type: "relationship",
  id,
  relationship_type: "uses",
  source_ref,
  target_ref,
  ...extra,
});

export const fixtureBundle = {
  type: "bundle",
  objects: [
    {
      type: "x-mitre-collection",
      id: "x-mitre-collection--1",
      name: "Enterprise ATT&CK",
      x_mitre_version: "99.0",
      modified: "2026-01-01T00:00:00.000Z",
    },
    {
      type: "x-mitre-matrix",
      id: "x-mitre-matrix--1",
      // Matrix order, deliberately not alphabetical.
      tactic_refs: ["x-mitre-tactic--ia", "x-mitre-tactic--exec"],
    },
    { type: "x-mitre-tactic", id: "x-mitre-tactic--ia", name: "Initial Access", x_mitre_shortname: "initial-access", external_references: [ref("TA0001")] },
    { type: "x-mitre-tactic", id: "x-mitre-tactic--exec", name: "Execution", x_mitre_shortname: "execution", external_references: [ref("TA0002")] },

    technique("attack-pattern--phish", "T1566.001", "Spearphishing Attachment", ["initial-access"], { x_mitre_is_subtechnique: true }),
    technique("attack-pattern--ps", "T1059.001", "PowerShell", ["execution"]),
    technique("attack-pattern--valid", "T1078", "Valid Accounts", ["initial-access", "execution"]),
    technique("attack-pattern--sw", "T1105", "Ingress Tool Transfer", ["execution"]),
    technique("attack-pattern--revoked", "T9999", "Revoked Technique", ["execution"], { revoked: true }),
    technique("attack-pattern--deprecated", "T9998", "Deprecated Technique", ["execution"], { x_mitre_deprecated: true }),

    {
      type: "intrusion-set",
      id: "intrusion-set--alpha",
      name: "Alpha Group",
      aliases: ["Alpha Group", "Fancy Alpha"],
      description:
        "[Alpha Group](https://attack.mitre.org/groups/G9001) is a test group.(Citation: Report 2020)  It  phishes.",
      external_references: [ref("G9001", "https://attack.mitre.org/groups/G9001")],
    },
    {
      type: "intrusion-set",
      id: "intrusion-set--beta",
      name: "beta crew", // lower case: sorting must ignore case
      aliases: [],
      description: "Only known through its software.",
      external_references: [ref("G9002")],
    },
    {
      type: "intrusion-set",
      id: "intrusion-set--old",
      name: "Retired Group",
      x_mitre_deprecated: true,
      external_references: [ref("G9003")],
    },
    {
      type: "campaign",
      id: "campaign--c1",
      name: "Operation Test",
      external_references: [ref("C9001")],
    },
    { type: "malware", id: "malware--m1", name: "TestRAT", external_references: [ref("S9001")] },
    { type: "tool", id: "tool--t1", name: "TestTool", external_references: [ref("S9002")] },
    { type: "course-of-action", id: "course-of-action--1", name: "Train users", external_references: [ref("M9001")] },

    // Alpha: direct technique, a technique via its campaign, and software.
    uses("relationship--1", "intrusion-set--alpha", "attack-pattern--phish"),
    uses("relationship--2", "intrusion-set--alpha", "malware--m1"),
    uses("relationship--3", "malware--m1", "attack-pattern--sw"),
    uses("relationship--4", "malware--m1", "attack-pattern--phish"), // also direct
    {
      type: "relationship",
      id: "relationship--5",
      relationship_type: "attributed-to",
      source_ref: "campaign--c1",
      target_ref: "intrusion-set--alpha",
    },
    uses("relationship--6", "campaign--c1", "attack-pattern--valid"),
    // Links that must be ignored:
    uses("relationship--7", "intrusion-set--alpha", "attack-pattern--revoked"),
    uses("relationship--8", "intrusion-set--alpha", "attack-pattern--deprecated"),
    uses("relationship--9", "intrusion-set--alpha", "attack-pattern--ps", { revoked: true }),
    {
      type: "relationship",
      id: "relationship--10",
      relationship_type: "mitigates",
      source_ref: "course-of-action--1",
      target_ref: "attack-pattern--phish",
    },
    {
      type: "relationship",
      id: "relationship--11",
      relationship_type: "related-to",
      source_ref: "intrusion-set--alpha",
      target_ref: "attack-pattern--ps",
    },
    // Beta: only software.
    uses("relationship--12", "intrusion-set--beta", "tool--t1"),
    uses("relationship--13", "tool--t1", "attack-pattern--ps"),
    // Retired group's links must not leak anywhere.
    uses("relationship--14", "intrusion-set--old", "attack-pattern--ps"),
  ],
};
