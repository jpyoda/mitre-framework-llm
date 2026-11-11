import { expect, test } from "@playwright/test";

test("home page shows the welcome text, active nav and ATT&CK version", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to MitreMesh");
  await expect(page.getByRole("link", { name: "Welcome" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/MITRE ATT&CK® Enterprise v\d+\.\d+/)).toBeVisible();
  await expect(page.getByText("Optional. The server has its own key")).toBeVisible();
});

test("generates a scenario with the server key and streams it in", async ({ page, request }) => {
  await page.goto("/scenario");
  await expect(page.getByRole("link", { name: "Scenario" })).toHaveAttribute("aria-current", "page");

  const selects = page.locator("section select");
  await selects.nth(0).selectOption("Healthcare");
  await selects.nth(2).selectOption("G0007");

  const apiCall = page.waitForRequest("**/api/scenario");
  await page.getByRole("button", { name: "Generate Scenario" }).click();
  const sent = await apiCall;

  // The browser sends only the choices: no key, no ATT&CK data.
  expect(sent.headers()["x-openai-api-key"]).toBeUndefined();
  expect(sent.postDataJSON()).toEqual({
    industry: "Healthcare",
    size: "Small (1-50 employees)",
    groupId: "G0007",
    locale: "en",
  });

  const result = page.locator(".prose");
  await expect(result.getByRole("heading", { name: "Test scenario" })).toBeVisible();
  await expect(result.getByRole("cell", { name: "T1566.001" })).toBeVisible();
  await expect(result.getByText("EDR alert on a finance laptop")).toBeVisible();

  // The server built the prompt from the ATT&CK data and used the configured
  // model. Tests run in parallel, so find this test's call by its content.
  const calls: { auth: string; body: { model: string; messages: { content: string }[] } }[] =
    await (await request.get("http://localhost:4010/__requests")).json();
  const last = calls.findLast((c) => c.body.messages[1].content.includes("Industry: Healthcare"))!;
  expect(last.auth).toBe("Bearer sk-e2e-server");
  expect(last.body.model).toBe("e2e-model");
  expect(last.body.messages[1].content).toContain("APT28 (MITRE ATT&CK G0007)");
  expect(last.body.messages[1].content).toContain("Industry: Healthcare");
});

test("shows a translated error when the user's key is rejected", async ({ page }) => {
  await page.goto("/es/scenario");
  await page.getByLabel("Clave de API de OpenAI").fill("sk-bad");
  await page.getByRole("button", { name: "Generar Escenario" }).click();
  await expect(page.getByText("La clave de API de OpenAI fue rechazada")).toBeVisible();
  await expect(page.locator(".prose")).toHaveCount(0);
});

test("unknown locales return 404", async ({ request }) => {
  expect((await request.get("/de/scenario")).status()).toBe(404);
});

test("switching language keeps the current page", async ({ page }) => {
  await page.goto("/scenario");
  await page.getByRole("button", { name: "🇺🇸 English" }).click();
  await page.getByRole("menuitem", { name: "🇪🇸 Spanish" }).click();
  await expect(page).toHaveURL(/\/es\/scenario$/);
  await expect(page.getByRole("heading", { name: "Generar Escenario" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Escenario" })).toHaveAttribute("aria-current", "page");
});

test("English URLs have no locale prefix", async ({ page }) => {
  await page.goto("/en/scenario");
  await expect(page).toHaveURL(/localhost:\d+\/scenario$/);
});
