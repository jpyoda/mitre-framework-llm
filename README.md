# MitreMesh

MitreMesh generates incident response testing scenarios from real threat actor data. Pick your company's industry and size and a threat actor group from [MITRE ATT&CK®](https://attack.mitre.org/). A language model then writes an exercise based on the techniques that group is known to use: an attack timeline with ATT&CK technique IDs, what defenders could observe, facilitator injects, the expected response and discussion questions.

The interface is available in English, Spanish and Portuguese, and scenarios are written in the selected language.

## How it works

1. `data/attack-groups.json` holds every active ATT&CK Enterprise group with its techniques grouped by tactic, plus its software and campaigns. It is built from MITRE's official STIX data (see [Updating the ATT&CK data](#updating-the-attck-data)).
2. The browser only receives the group list. When you click **Generate Scenario**, it sends your choices to `/api/scenario`.
3. The server looks up the group, builds the prompt, calls the model and streams the Markdown answer back to the page.

API keys and ATT&CK data never pass through the browser, apart from a key the user chooses to type into the sidebar.

## Requirements

- Node.js 22 or later (see `.nvmrc`)
- An OpenAI API key, or another OpenAI-compatible endpoint (see [Configuration](#configuration))

## Quick start

```bash
git clone https://github.com/jpyoda/mitre-framework-llm.git
cd mitre-framework-llm
npm install
cp .env.example .env.local   # then add your OPENAI_API_KEY, or leave it empty
npm run dev
```

Open http://localhost:3000 and go to **Scenario**.

## Configuration

All settings are optional environment variables. `.env.example` has a template.

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | none | The server's key. Without it, each user must enter their own key in the sidebar. |
| `LLM_MODEL` | `gpt-5-mini` | Model used to write scenarios. |
| `OPENAI_BASE_URL` | OpenAI | Any OpenAI-compatible endpoint, such as Azure OpenAI, or a local Ollama (`http://localhost:11434/v1`) or vLLM server. |
| `SCENARIO_RATE_LIMIT` | `10` | Scenarios per client IP per hour when the server's key is used. `0` turns it off. |

**About API keys:** a key typed into the sidebar is sent to this app's server with each request, used for that request only, and never stored or logged. It takes priority over `OPENAI_API_KEY`, and requests that use it are not rate limited.

**About the rate limit:** counts are kept in memory by each server process. That works for a single server. If you run several instances or serverless functions, each keeps its own count, so put a shared limiter (for example Redis) or your platform's rate limiting in front.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type-check |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright); builds the app first when run locally |
| `npm run update:attack` | Regenerate the ATT&CK data from MITRE's latest release |

## Updating the ATT&CK data

The app currently uses **ATT&CK Enterprise v20.1**. The version is shown in the page footer.

```bash
npm run update:attack                        # latest Enterprise release
npm run update:attack -- --version 20.1      # a specific release
npm run update:attack -- --input bundle.json # a STIX bundle you already downloaded
```

The script downloads the release from [mitre-attack/attack-stix-data](https://github.com/mitre-attack/attack-stix-data). It leaves out revoked and deprecated objects and only follows "uses" and "attributed-to" relationships. It also records how each technique is linked to a group: directly, through one of its campaigns, or through its software. Prompts prefer techniques attributed to the group or its campaigns, and use software-only links only when nothing better exists. Run `npm test` afterwards (the tests check the data file too), then commit `data/attack-groups.json`.

A scheduled GitHub Actions workflow (`.github/workflows/update-attack.yml`) runs this every Monday and opens a pull request when MITRE has published something new.

## Testing

- **Unit tests** (`tests/unit`): the STIX transform (against a small hand-made bundle), the committed ATT&CK data, the prompt builder, the rate limiter and the `/api/scenario` route with a mocked OpenAI client.
- **End-to-end tests** (`tests/e2e`): run the production build in Chromium against a local mock of the OpenAI API (`tests/e2e/mock-openai.mjs`), so no real key is needed. If Playwright's browser isn't installed yet, run `npx playwright install chromium` first.

CI (`.github/workflows/ci.yml`) runs lint, type-check, unit tests, build and end-to-end tests on every pull request and on pushes to `main`. Dependabot proposes dependency updates weekly.

## Project structure

```
app/                     Next.js App Router pages and the /api/scenario route
components/              Layout, sidebar, header, footer and page components
constants/               Industries, company sizes, languages
data/attack-groups.json  Derived ATT&CK data (generated, committed)
lib/attack.ts            Server-only access to the ATT&CK data
lib/scenario/            Prompt builder, LLM settings, rate limiter
messages/                UI translations (en, es, pt)
scripts/                 ATT&CK update script and transform
tests/                   Unit and end-to-end tests
docs/UPGRADE_PLAN.md     Modernisation plan and progress
```

Colors come from a small set of light and dark mode tokens in `app/[locale]/globals.css`, exposed as Tailwind colors (`bg-surface`, `text-muted`, `bg-accent`, ...) in `tailwind.config.ts`. Use those tokens rather than raw palette classes.

## Contributing

Contributions are welcome. Please open an issue or pull request; CI must pass before merging.

## License and attribution

MitreMesh is open-source software under the [MIT License](LICENSE).

MITRE ATT&CK® data © The MITRE Corporation, used under the [ATT&CK Terms of Use](https://attack.mitre.org/resources/legal-and-branding/terms-of-use/). ATT&CK® is a registered trademark of The MITRE Corporation. This project is not affiliated with or endorsed by MITRE.

Generated scenarios are written by a language model and may contain mistakes. Review them before use.
