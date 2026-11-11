import { describe, expect, it } from "vitest";
import {
  cleanDescription,
  transformAttackBundle,
} from "../../scripts/attack/transform.mjs";
import { fixtureBundle } from "./fixtures/stix";

const data = transformAttackBundle(fixtureBundle, { source: "fixture" });
const alpha = data.groups.find((g: { id: string }) => g.id === "G9001")!;
const beta = data.groups.find((g: { id: string }) => g.id === "G9002")!;

describe("transformAttackBundle", () => {
  it("reads metadata from the collection, letting explicit meta win", () => {
    expect(data.domain).toBe("Enterprise ATT&CK");
    expect(data.version).toBe("99.0");
    expect(data.modified).toBe("2026-01-01T00:00:00.000Z");
    expect(data.source).toBe("fixture");
    expect(transformAttackBundle(fixtureBundle, { version: "1.2" }).version).toBe("1.2");
  });

  it("lists tactics in matrix order", () => {
    expect(data.tactics).toEqual([
      { id: "TA0001", shortname: "initial-access", name: "Initial Access" },
      { id: "TA0002", shortname: "execution", name: "Execution" },
    ]);
  });

  it("drops deprecated and revoked groups and sorts by name ignoring case", () => {
    expect(data.groups.map((g: { name: string }) => g.name)).toEqual([
      "Alpha Group",
      "beta crew",
    ]);
  });

  it("keeps aliases other than the group's own name", () => {
    expect(alpha.aliases).toEqual(["Fancy Alpha"]);
    expect(alpha.url).toBe("https://attack.mitre.org/groups/G9001");
  });

  it("cleans citations and markdown links out of descriptions", () => {
    expect(alpha.description).toBe("Alpha Group is a test group. It phishes.");
  });

  it("resolves techniques through the group, its campaigns and its software", () => {
    expect(alpha.techniques).toEqual([
      { id: "T1078", name: "Valid Accounts", tactics: ["initial-access", "execution"], via: ["C9001"] },
      { id: "T1105", name: "Ingress Tool Transfer", tactics: ["execution"], via: ["S9001"] },
      { id: "T1566.001", name: "Spearphishing Attachment", tactics: ["initial-access"], via: ["direct", "S9001"] },
    ]);
    expect(alpha.software).toEqual([{ id: "S9001", name: "TestRAT", type: "malware" }]);
    expect(alpha.campaigns).toEqual([{ id: "C9001", name: "Operation Test" }]);
  });

  it("ignores retired techniques, retired relationships and non-'uses' links", () => {
    const ids = alpha.techniques.map((t: { id: string }) => t.id);
    expect(ids).not.toContain("T9999"); // revoked technique
    expect(ids).not.toContain("T9998"); // deprecated technique
    expect(ids).not.toContain("T1059.001"); // revoked "uses" + "related-to"
  });

  it("keeps groups that are only linked to techniques through software", () => {
    expect(beta.techniques).toEqual([
      { id: "T1059.001", name: "PowerShell", tactics: ["execution"], via: ["S9002"] },
    ]);
  });

  it("rejects input that is not a STIX bundle", () => {
    // @ts-expect-error: deliberately not a bundle
    expect(() => transformAttackBundle({})).toThrow(/STIX bundle/);
  });
});

describe("cleanDescription", () => {
  it("handles missing text", () => {
    expect(cleanDescription(undefined)).toBe("");
  });
});
