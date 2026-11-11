import { describe, expect, it } from "vitest";
import { getGroup, type AttackGroup } from "@/lib/attack";
import { buildScenarioMessages } from "@/lib/scenario/prompt";

const apt28 = getGroup("G0007")!;

describe("buildScenarioMessages", () => {
  const [system, user] = buildScenarioMessages({
    industry: "Healthcare",
    size: "Small (1-50 employees)",
    group: apt28,
    language: "Spanish",
  });

  it("returns a system and a user message", () => {
    expect(system.role).toBe("system");
    expect(user.role).toBe("user");
    expect(system.content).toMatch(/MITRE ATT&CK/);
  });

  it("includes the company, the group and its techniques", () => {
    expect(user.content).toContain("Industry: Healthcare");
    expect(user.content).toContain("Size: Small (1-50 employees)");
    expect(user.content).toContain("APT28 (MITRE ATT&CK G0007)");
    expect(user.content).toContain("Also known as: ");
    expect(user.content).toContain("Fancy Bear");
    expect(user.content).toContain("T1566.001 Spearphishing Attachment");
  });

  it("asks for the answer in the requested language", () => {
    expect(user.content).toContain("Write the whole answer in Spanish.");
  });

  it("asks for the structured sections", () => {
    for (const section of ["Scenario overview", "Attack timeline", "Expected response", "Discussion questions", "Success criteria"]) {
      expect(user.content).toContain(section);
    }
  });

  it("shortens long group descriptions and skips empty alias lists", () => {
    const group: AttackGroup = {
      ...apt28,
      aliases: [],
      description: "First sentence is here. ".repeat(60),
    };
    const content = buildScenarioMessages({ industry: "Retail / E-commerce", size: "Large Enterprise (10,000+ employees)", group, language: "English" })[1].content;
    expect(content).not.toContain("Also known as");
    expect(content).toContain("First sentence is here. …");
    expect(content.length).toBeLessThan(user.content.length + 1000);
  });
});
