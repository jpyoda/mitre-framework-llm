# MitreMesh

Welcome to MitreMesh - The convergence of MITRE's framework and dynamic scenario generation. We offer a comprehensive net of incident response tests tailored for cybersecurity professionals.

## Introduction

Dive deep into the MITRE ATT&CK framework - the golden key to decoding the strategies, techniques, and procedures (TTPs) employed by cyber adversaries. Translating this intricate knowledge into tangible testing scenarios often poses a significant challenge.

Enter AttackGen. We leverage advanced language models to promptly craft realistic attack scenarios mirroring specific threat actor techniques.

## Features

- Dynamic Scenario Generation: Real-time attack scenarios based on industry, company size, and threat actor groups.
- Tailored Experiences: Customize scenarios according to specific requirements.
- In-depth MITRE ATT&CK Exploration: Understand, explore, and apply the MITRE ATT&CK framework effectively.

## Getting Started

### Prerequisites

- Ensure you have Next.js installed.
- Node.js 22 or later.
- An OpenAI API key, either set on the server or entered by each user in the sidebar.

### Kickstart Your Experience

1. Setup: Clone the repository and install dependencies:
   git clone https://github.com/jpyoda/mitre-framework-llm.git
   cd mitre-framework-llm
   npm install

2. Configuration: copy `.env.example` to `.env.local`. All settings are optional:
   - `OPENAI_API_KEY`: the server's key. Without it, users enter their own key in the sidebar. That key is sent to this app's server with each request and is never stored or logged.
   - `LLM_MODEL`: model name (default `gpt-5-mini`).
   - `OPENAI_BASE_URL`: an OpenAI-compatible endpoint, such as Azure OpenAI or a local Ollama or vLLM server.
   - `SCENARIO_RATE_LIMIT`: scenarios per IP per hour when the server key is used (default 10, `0` turns it off).

3. Run the Application:
   npm run dev

4. Navigate to the Scenario page.
5. Select your company's industry, size, and the desired threat actor group.
6. Experience the magic as a cyber-attack scenario springs to life.

## MITRE ATT&CK data

Threat actor data comes from [MITRE ATT&CK®](https://attack.mitre.org/) Enterprise, currently **v20.1**. The app reads a compact file, `data/attack-groups.json`, built from MITRE's official STIX release ([mitre-attack/attack-stix-data](https://github.com/mitre-attack/attack-stix-data)). It holds each group's techniques grouped by tactic, plus its software and campaigns. Revoked and deprecated objects are left out. The file is only read on the server: the browser gets the group list, and `/api/scenario` builds the prompt and calls the model server-side.

To update it to the latest ATT&CK release:

    npm run update:attack

Use `npm run update:attack -- --version 20.1` to pin a release, or `--input <bundle.json>` to build from a bundle you already downloaded. Commit the regenerated `data/attack-groups.json`.

## Contribution

We warmly welcome contributions! Whether it's feature enhancements, bug fixes, or documentation improvements, your efforts are appreciated. Kindly ensure to read our Contribution Guidelines before submitting a pull request.

## License

MitreMesh is open-source software licensed under MIT License.
