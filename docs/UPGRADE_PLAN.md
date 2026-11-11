# Upgrade Plan: bringing MitreMesh up to date

_Drafted 2026-11-11. The last commit to the repo was 2023-09-05._

## Where things stand

| Area | In the repo | Latest | Gap |
|---|---|---|---|
| MITRE ATT&CK Enterprise data | **v13.1** (May 2023) | **v20.1** (Nov 2026) | 7 major releases |
| `data/groups.json` | 138 groups, edited by hand | built from STIX data | already out of sync with the bundled data (153 intrusion sets) |
| Next.js | 13.4.19 | 16.x | 3 majors (App Router APIs, `middleware` → `proxy`, `next lint` removed) |
| React | 18.2 | 19.x | 1 major |
| next-intl | 2.20 | 4.x | 2 majors (routing/request config rewritten) |
| langchain | 0.0.139 | 1.x (`@langchain/openai`) | old import paths and APIs (`predict`, `fromPromptMessages`) are gone |
| Tailwind CSS | 3.3 | 4.x | config moves into CSS |
| ESLint | 8 (`.eslintrc.json`) | 9/10 flat config | |
| TypeScript | 5.2 | 5.9 / 7.x | |

### Problems found while reviewing the code

1. **The 40 MB ATT&CK JSON goes to the browser.** `components/templates/ScenarioPage.tsx` is a `"use client"` component that does `import mitre from "../../data/enterprise-attack.json"`, so the whole STIX bundle ends up in the client JS.
2. **The OpenAI key is used from the browser.** The key is typed into the sidebar and `ChatOpenAI` is called client-side, so the key is sent from the user's browser and there is no server-side control.
3. **The kill-chain logic is loose.** `groupKillChains` uses *every* relationship whose `source_ref` is the group, not just `uses`. It doesn't skip `revoked` or `x_mitre_deprecated` objects, follows only direct links (not groups → software → techniques, or campaigns), and sends the LLM only tactic names. Technique IDs and names would ground the scenario far better.
4. **Bugs in `app/[locale]/layout.tsx`:** `generateStaticParams` returns `en`/`de`, but the middleware locales are `en`/`es`/`pt`. The metadata still reads "Create Next App".
5. **Unused dependencies:** `next-i18next`, `i18next`, `accept-language`, `react-markdown`, `remark-gfm`. The `@types/*`, `eslint` and `typescript` packages sit in `dependencies` instead of `devDependencies`.
6. **README is stale:** it mentions "AttackGen", the wrong folder (`cd mitremesh`), and an API-key config file that doesn't exist.
7. **No tests, no CI, no `.env.example`.**

---

## Phase 0: Baseline (½ day) — done

- [x] Create the branch. Confirm `npm ci && npm run build` works on Node 20 today, or record what fails.
- [x] Add `.nvmrc` (Node 22 LTS) and an `engines` field.
- [x] Remove the unused dependencies listed in item 5. Move the type, lint and TypeScript packages to `devDependencies`.
- [x] Fix `generateStaticParams` (→ `en`, `es`, `pt`) and the page metadata.

## Phase 1: ATT&CK data pipeline (1–2 days), the core "up to date" work — done (v20.1)

Goal: the data stays current without hand edits, and none of it reaches the client.

- [x] Add `scripts/update-attack.mjs` (plain Node, no extra dependencies; transform logic in `scripts/attack/transform.mjs`). It should:
  - Read `https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/index.json` and pick the latest Enterprise version, or one pinned in `package.json`/a config file.
  - Download `enterprise-attack/enterprise-attack-<ver>.json`.
  - Drop `revoked: true` and `x_mitre_deprecated: true` objects.
  - Write a **compact derived file**, `data/attack-groups.json` (likely a few hundred KB):
    ```ts
    { version, modified,
      groups: [{ id: "G0007", name, aliases, url, description,
                 techniques: [{ id: "T1566.001", name, tactics: ["initial-access"] }] }] }
    ```
  - Resolve techniques through `intrusion-set --uses--> attack-pattern`, plus `intrusion-set --uses--> malware/tool --uses--> attack-pattern` and `campaign --attributed-to--> intrusion-set`. Keep track of where each technique came from.
- [x] Remove `data/enterprise-attack.json` (40 MB) and `data/groups.json` from git. Keep only the derived file, or gitignore the raw download and run the script at build time.
- [x] Add `npm run update:attack` and show the ATT&CK version in the UI footer.
- [ ] Optional: offer ICS and Mobile ATT&CK (also at v20.1) as selectable domains.
- [x] Optional: a scheduled GitHub Action that runs the script and opens a PR when MITRE ships a new version (`.github/workflows/update-attack.yml`).

## Phase 2: Framework upgrades (2–3 days)

Do these one step at a time and run `npm run build` after each.

1. **Next 13 → 14 → 15 → 16 and React 18 → 19.** Use `npx @next/codemod upgrade`.
   - Make `params` async in `layout.tsx` and in pages (`params: Promise<{locale}>`).
   - Rename `middleware.ts` → `proxy.ts` for Next 16.
   - Replace `next lint` with the ESLint CLI.
2. **next-intl 2 → 4.**
   - Add `i18n/routing.ts` (`defineRouting`) and `i18n/request.ts` (`getRequestConfig`).
   - Add the plugin in `next.config.ts` with `createNextIntlPlugin`.
   - Use `setRequestLocale` in layouts and pages. Use `createNavigation` for links in the sidebar and header.
   - Generate the locales list from `constants/languages.ts` so the three places that list locales can't drift again.
3. **Tailwind 3 → 4.** Run `npx @tailwindcss/upgrade`. Move the config into `globals.css` (`@import "tailwindcss"; @plugin "@tailwindcss/typography";`). Update PostCSS to `@tailwindcss/postcss`.
4. **ESLint flat config.** Add `eslint.config.mjs` with `eslint-config-next`, then delete `.eslintrc.json`.
5. **TypeScript.** Upgrade to the current 5.x (or 7.x if the Next toolchain supports it). (`target` is already `ES2022`.)

## Phase 3: LLM layer rewrite (1–2 days) — done

- [x] Move generation into a **Route Handler** (`app/api/scenario/route.ts`) or a Server Action. The client then sends only `{industry, size, groupId, locale}`.
- [x] Replace `langchain@0.0.139` (done with the official `openai` SDK). Pick one of two approaches:
  - **Recommended:** the official `openai` SDK, or the Vercel AI SDK (`ai` + `@ai-sdk/openai`) with `streamText`. It's simple, streams well, and the provider can be swapped easily.
  - Or upgrade to `@langchain/openai` + `@langchain/core` 1.x (`ChatPromptTemplate.fromMessages`, `.invoke()` / `.stream()`).
- [x] Choose the API key with a clear rule: use the server env var `OPENAI_API_KEY` by default, and optionally accept a user-supplied key ("bring your own key"), sent per request and never logged. Add `.env.example`.
- [x] Stop hard-coding the model: read it from env (`LLM_MODEL`, default `gpt-5-mini`). Azure OpenAI and local OpenAI-compatible servers work through `OPENAI_BASE_URL`.
- [ ] Optional: native support for non-OpenAI-compatible providers (e.g. Anthropic).
- [x] Improve the prompt. Pass technique IDs and names grouped by tactic, plus the group description and aliases. Ask for a structured scenario: timeline, injects, detection opportunities, and the ATT&CK technique for each step.
- [x] Stream the response to the UI. Render it with `react-markdown` + `remark-gfm` instead of `dangerouslySetInnerHTML`.
- [x] Add basic rate limiting and input validation (`zod`) on the route.

## Phase 4: UX and features (optional, 2–4 days)

- [x] Replace the leftover create-next-app colors with light/dark design tokens and one accent color; active nav state; labelled form fields.

- [ ] Searchable group picker with aliases and a link to the ATT&CK page.
- [ ] "Custom scenario" mode where the user picks techniques directly.
- [ ] Copy or download the scenario as Markdown or PDF.
- [ ] Translate the remaining hard-coded English strings, such as the API-key "Reminder!" alert.
- [ ] Optional: localize industry and size labels.

## Phase 5: Quality and delivery (1–2 days) — done

- [x] Unit tests (Vitest) for the ATT&CK transform script and the prompt builder, using a small STIX fixture. Also covers the committed data, the rate limiter and the `/api/scenario` route (41 tests).
- [x] Playwright smoke tests against the production build and a local mock OpenAI server (4 tests).
- [x] GitHub Actions: `npm ci`, lint, type-check, test, build.
- [x] Dependabot or Renovate for npm, plus the ATT&CK update workflow from Phase 1.
- [x] Rewrite the README: correct name, setup steps, env vars, the `update:attack` script, the ATT&CK version, and attribution to MITRE ATT&CK® under its terms of use.

---

## Suggested order and PRs

1. PR 1: Phase 0 cleanup (low risk).
2. PR 2: Phase 1 data pipeline plus the move to ATT&CK v20.1. This gives the biggest gain and also shrinks the client bundle.
3. PR 3: Phase 3 LLM rewrite to server-side. This fixes the key exposure and the dead langchain APIs.
4. PR 4: Phase 2 framework upgrades. These are mechanical but touch many files.
5. PR 5: Phase 5 tests and CI. Better still, land the CI part before PR 4 so the upgrades are checked.
6. Phase 4 features as follow-ups.

Phases 1 and 3 can start on the current Next 13 stack, so the user-visible improvements don't wait on the framework upgrades.

**Rough total:** about 7–12 working days for Phases 0–3 and 5, plus the optional Phase 4.

## Risks and decisions needed

- **Server-held key or bring-your-own-key?** If the app is hosted publicly, a server key needs rate limiting or auth.
- **Which LLM provider and model.** OpenAI only, or a pluggable provider?
- **Commit the derived ATT&CK data, or generate it at build time?** Committing is simpler and reproducible; generating at build time stays fresh but needs network access during the build.
- **next-intl v4 rewrites the routing.** The i18n setup is small today, so now is a good time to do it.
