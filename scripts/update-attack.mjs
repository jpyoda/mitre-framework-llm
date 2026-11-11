#!/usr/bin/env node
// Downloads a MITRE ATT&CK Enterprise release and writes data/attack-groups.json.
//
//   npm run update:attack                     # latest Enterprise release
//   npm run update:attack -- --version 20.1   # a specific release
//   npm run update:attack -- --input file.json  # an already-downloaded bundle (offline)
//
// The release can also be pinned with the ATTACK_VERSION environment variable.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { transformAttackBundle } from "./attack/transform.mjs";

const INDEX_URL =
  "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/index.json";
const DOMAIN = "Enterprise ATT&CK";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { values: args } = parseArgs({
  options: {
    version: { type: "string" },
    input: { type: "string" },
    output: { type: "string", default: join(root, "data", "attack-groups.json") },
  },
});

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function resolveRelease(wanted) {
  const index = await fetchJson(INDEX_URL);
  const collection = index.collections?.find((c) => c.name === DOMAIN);
  if (!collection) throw new Error(`${DOMAIN} not found in ${INDEX_URL}`);
  // versions[] is newest first
  const release = wanted
    ? collection.versions.find((v) => v.version === wanted)
    : collection.versions[0];
  if (!release) {
    const known = collection.versions.map((v) => v.version).join(", ");
    throw new Error(`${DOMAIN} version ${wanted} not found. Known: ${known}`);
  }
  return release;
}

async function main() {
  let bundle;
  let meta = {};
  if (args.input) {
    console.log(`Reading ${args.input}`);
    bundle = JSON.parse(await readFile(args.input, "utf8"));
  } else {
    const release = await resolveRelease(args.version ?? process.env.ATTACK_VERSION);
    console.log(`Downloading ${DOMAIN} v${release.version} (${release.modified})`);
    bundle = await fetchJson(release.url);
    meta = { version: release.version, modified: release.modified, source: release.url };
  }

  const data = transformAttackBundle(bundle, meta);
  const techniqueCount = new Set(
    data.groups.flatMap((g) => g.techniques.map((t) => t.id))
  ).size;

  await mkdir(dirname(args.output), { recursive: true });
  const json = JSON.stringify(data) + "\n";
  await writeFile(args.output, json);

  console.log(
    `Wrote ${args.output}: ${data.domain} v${data.version}, ` +
      `${data.groups.length} groups, ${techniqueCount} techniques in use, ` +
      `${(json.length / 1024).toFixed(0)} KB`
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
