// Turns a MITRE ATT&CK STIX 2.1 bundle into the compact data file the app
// uses (data/attack-groups.json). Pure function, no I/O, so it can be tested
// against a small fixture.

const ATTACK_SOURCE = "mitre-attack";

/** True for objects MITRE has withdrawn; these must not reach the app. */
function isRetired(obj) {
  return obj.revoked === true || obj.x_mitre_deprecated === true;
}

/** The ATT&CK reference (ID and URL) of a STIX object, if it has one. */
function attackRef(obj) {
  return (obj.external_references ?? []).find(
    (ref) => ref.source_name === ATTACK_SOURCE && ref.external_id
  );
}

/**
 * Removes "(Citation: ...)" markers, turns markdown links into their text,
 * and collapses whitespace.
 */
export function cleanDescription(text = "") {
  return text
    .replace(/\s*\(Citation:[^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function byId(a, b) {
  return a.id.localeCompare(b.id, "en", { numeric: true });
}

/**
 * @param {{ objects: any[] }} bundle - an Enterprise (or ICS/Mobile) ATT&CK STIX bundle
 * @param {{ version?: string, modified?: string, source?: string }} meta
 */
export function transformAttackBundle(bundle, meta = {}) {
  const objects = bundle?.objects;
  if (!Array.isArray(objects)) {
    throw new Error("Not a STIX bundle: missing `objects` array");
  }

  // Index the live (non-retired) objects by STIX id.
  const live = new Map();
  for (const obj of objects) {
    if (obj.type !== "relationship" && !isRetired(obj)) live.set(obj.id, obj);
  }

  const collection = objects.find((o) => o.type === "x-mitre-collection");
  const matrix = objects.find(
    (o) => o.type === "x-mitre-matrix" && !isRetired(o)
  );

  // Tactics in matrix order (Reconnaissance ... Impact).
  const tacticObjects = (matrix?.tactic_refs ?? [])
    .map((ref) => live.get(ref))
    .filter(Boolean);
  const tactics = tacticObjects.map((t) => ({
    id: attackRef(t)?.external_id,
    shortname: t.x_mitre_shortname,
    name: t.name,
  }));

  // Techniques and sub-techniques.
  const techniques = new Map(); // stix id -> { id, name, tactics }
  for (const obj of live.values()) {
    if (obj.type !== "attack-pattern") continue;
    const ref = attackRef(obj);
    if (!ref) continue;
    techniques.set(obj.id, {
      id: ref.external_id,
      name: obj.name,
      tactics: (obj.kill_chain_phases ?? [])
        .filter((p) => p.kill_chain_name === ATTACK_SOURCE)
        .map((p) => p.phase_name),
    });
  }

  // Only "uses" and "attributed-to" matter here; other relationship types
  // (mitigates, detects, subtechnique-of, revoked-by) must not be read as
  // something a group does.
  const uses = new Map(); // source stix id -> Set<target stix id>
  const campaignsOf = new Map(); // intrusion-set stix id -> Set<campaign stix id>
  for (const rel of objects) {
    if (rel.type !== "relationship" || isRetired(rel)) continue;
    if (!live.has(rel.source_ref) || !live.has(rel.target_ref)) continue;
    if (rel.relationship_type === "uses") {
      if (!uses.has(rel.source_ref)) uses.set(rel.source_ref, new Set());
      uses.get(rel.source_ref).add(rel.target_ref);
    } else if (
      rel.relationship_type === "attributed-to" &&
      live.get(rel.source_ref).type === "campaign" &&
      live.get(rel.target_ref).type === "intrusion-set"
    ) {
      if (!campaignsOf.has(rel.target_ref)) {
        campaignsOf.set(rel.target_ref, new Set());
      }
      campaignsOf.get(rel.target_ref).add(rel.source_ref);
    }
  }

  const isSoftware = (obj) => obj.type === "malware" || obj.type === "tool";

  const groups = [];
  for (const group of live.values()) {
    if (group.type !== "intrusion-set") continue;
    const ref = attackRef(group);
    if (!ref) continue;

    // technique stix id -> Set of how we know: "direct", a software ID, or a campaign ID
    const found = new Map();
    const note = (techniqueRef, via) => {
      if (!techniques.has(techniqueRef)) return;
      if (!found.has(techniqueRef)) found.set(techniqueRef, new Set());
      found.get(techniqueRef).add(via);
    };

    const software = new Map(); // stix id -> { id, name, type }
    const addSoftware = (stixId) => {
      const sw = live.get(stixId);
      if (!sw || !isSoftware(sw) || software.has(stixId)) return;
      const swRef = attackRef(sw);
      if (swRef) {
        software.set(stixId, { id: swRef.external_id, name: sw.name, type: sw.type });
      }
    };

    for (const target of uses.get(group.id) ?? []) {
      note(target, "direct");
      addSoftware(target);
    }

    const campaigns = [];
    for (const campaignRef of campaignsOf.get(group.id) ?? []) {
      const campaign = live.get(campaignRef);
      const cRef = attackRef(campaign);
      if (!cRef) continue;
      campaigns.push({ id: cRef.external_id, name: campaign.name });
      for (const target of uses.get(campaignRef) ?? []) {
        note(target, cRef.external_id);
        addSoftware(target);
      }
    }

    for (const [swStixId, sw] of software) {
      for (const target of uses.get(swStixId) ?? []) note(target, sw.id);
    }

    groups.push({
      id: ref.external_id,
      name: group.name,
      aliases: (group.aliases ?? []).filter((a) => a !== group.name),
      url: ref.url,
      description: cleanDescription(group.description),
      techniques: [...found]
        .map(([stixId, via]) => ({
          ...techniques.get(stixId),
          via: [...via].sort((a, b) =>
            a === "direct" ? -1 : b === "direct" ? 1 : a.localeCompare(b)
          ),
        }))
        .sort(byId),
      software: [...software.values()].sort(byId),
      campaigns: campaigns.sort(byId),
    });
  }

  groups.sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );

  return {
    domain: collection?.name ?? "ATT&CK",
    version: meta.version ?? collection?.x_mitre_version,
    modified: meta.modified ?? collection?.modified,
    source: meta.source,
    tactics,
    groups,
  };
}
