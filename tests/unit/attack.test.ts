import { describe, expect, it } from "vitest";
import {
  attributedTechniques,
  formatKillChain,
  getAttackMeta,
  getGroup,
  listGroupOptions,
} from "@/lib/attack";
import rawData from "@/data/attack-groups.json";

// These run against the committed data file, so they also catch a broken
// `npm run update:attack` result before it ships.
describe("committed ATT&CK data", () => {
  it("has a version and tactics", () => {
    const meta = getAttackMeta();
    expect(meta.domain).toBe("Enterprise ATT&CK");
    expect(meta.version).toMatch(/^\d+\.\d+$/);
    expect(rawData.tactics.length).toBeGreaterThanOrEqual(14);
  });

  it("has unique group IDs and every group has techniques", () => {
    const options = listGroupOptions();
    expect(options.length).toBeGreaterThan(100);
    expect(new Set(options.map((g) => g.id)).size).toBe(options.length);
    for (const { id } of options) {
      expect(getGroup(id)!.techniques.length, id).toBeGreaterThan(0);
    }
  });

  it("only sends id, name and aliases to the group picker", () => {
    expect(Object.keys(listGroupOptions()[0]).sort()).toEqual(["aliases", "id", "name"]);
  });
});

describe("getGroup", () => {
  it("finds a group by ATT&CK ID", () => {
    expect(getGroup("G0007")?.name).toBe("APT28");
    expect(getGroup("G9999")).toBeUndefined();
  });
});

describe("attributedTechniques", () => {
  it("prefers techniques attributed to the group or its campaigns", () => {
    const group = getGroup("G0007")!;
    const { techniques, softwareOnly } = attributedTechniques(group);
    expect(softwareOnly).toBe(false);
    expect(techniques.length).toBeLessThan(group.techniques.length);
    for (const t of techniques) {
      expect(t.via.some((v) => v === "direct" || v.startsWith("C"))).toBe(true);
    }
  });

  it("falls back to software techniques when nothing is attributed", () => {
    const group = getGroup("G1028")!; // APT-C-23
    const { techniques, softwareOnly } = attributedTechniques(group);
    expect(softwareOnly).toBe(true);
    expect(techniques).toEqual(group.techniques);
  });
});

describe("formatKillChain", () => {
  it("groups techniques by tactic in matrix order and lists software", () => {
    const text = formatKillChain(getGroup("G0007")!);
    const lines = text.split("\n");
    expect(lines[0]).toMatch(/^- Reconnaissance \(TA0043\): T\d{4}/);
    expect(text.indexOf("Initial Access")).toBeLessThan(text.indexOf("Impact"));
    expect(text).toContain("T1566.001 Spearphishing Attachment");
    expect(lines.at(-1)).toMatch(/^- Known software: .*\(S\d{4}\)/);
  });

  it("says when techniques only come from software", () => {
    expect(formatKillChain(getGroup("G1028")!).split("\n")[0]).toMatch(/No techniques are attributed/);
  });
});
