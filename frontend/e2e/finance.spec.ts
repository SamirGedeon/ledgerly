import { test, expect } from "@playwright/test";
import { DateTime } from "luxon";
async function login(
  page: import("@playwright/test").Page,
  email = "owner@ledgerly.test",
) {
  await page.goto("/");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Ledgerly-demo-2026!");
  await page.getByRole("button", { name: "Entrar no meu espaço" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu negócio, em perspectiva." }),
  ).toBeVisible();
}
test("owner creates category and budget, records an expense and voids it", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  const category = `Categoria ${Date.now()}`;
  const description = `Despesa ${Date.now()}`;
  await page.getByRole("link", { name: "Categorias", exact: true }).click();
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(category);
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(
    page.getByRole("heading", { name: category, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Orçamentos", exact: true }).click();
  await page.getByRole("button", { name: "Definir orçamento" }).click();
  await page
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: category });
  await page.getByLabel("Limite (R$)").fill("100.00");
  await page.getByRole("button", { name: "Salvar orçamento" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("link", { name: "Transações", exact: true }).click();
  await page.getByRole("button", { name: "Nova transação" }).click();
  await page.getByLabel("Descrição", { exact: true }).fill(description);
  await page.getByLabel("Valor (R$)").fill("123.45");
  await page
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: category });
  await page.getByRole("button", { name: "Salvar transação" }).click();
  await expect(
    page.locator(".entry-row").filter({ hasText: description }),
  ).toContainText("123,45");
  await page.getByRole("link", { name: "Orçamentos", exact: true }).click();
  const budget = page.locator(".budget-card").filter({ hasText: category });
  await expect(budget).toContainText("123%");
  await expect(budget).toContainText("Limite excedido");
  await page.getByRole("link", { name: "Transações", exact: true }).click();
  await page
    .getByRole("button", { name: `Anular ${description}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar anulação" }).click();
  await expect(
    page.locator(".entry-row").filter({ hasText: description }),
  ).toContainText("Anulado");
  await page.getByRole("link", { name: "Orçamentos", exact: true }).click();
  await expect(
    page.locator(".budget-card").filter({ hasText: category }),
  ).toContainText("0%");
  expect(errors).toEqual([]);
});
test("CSV import is idempotent and invalid files roll back; exports download", async ({
  page,
}) => {
  await login(page);
  const stamp = Date.now();
  const month = DateTime.now().setZone("America/Sao_Paulo").toFormat("yyyy-MM");
  const csv = `external_id,date,description,kind,amount,category\nimport-${stamp}-1,${month}-02,Receita ${stamp},income,1000.00,Projetos\nimport-${stamp}-2,${month}-03,Licenca ${stamp},expense,49.90,Software\n`;
  await page.getByRole("link", { name: "Transações", exact: true }).click();
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  await page.getByLabel("Conteúdo CSV").fill(csv);
  await page
    .getByRole("button", { name: "Importar arquivo", exact: true })
    .click();
  await expect(page.locator(".success")).toHaveText(
    "2 importadas · 0 já existentes",
  );
  await page
    .getByRole("button", { name: "Importar arquivo", exact: true })
    .click();
  await expect(page.locator(".success")).toHaveText(
    "0 importadas · 2 já existentes",
  );
  const invalid = `external_id,date,description,kind,amount,category\nrollback-${stamp},${month}-02,Rollback ${stamp},income,10.00,Projetos\ninvalid-${stamp},${month}-03,Invalid,expense,12.345,Software\n`;
  await page.getByLabel("Conteúdo CSV").fill(invalid);
  await page
    .getByRole("button", { name: "Importar arquivo", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Row 3");
  await page.getByRole("button", { name: "Fechar importação" }).click();
  await page.getByLabel("Buscar transações").fill(`Rollback ${stamp}`);
  await expect(
    page.getByRole("heading", { name: "Nenhum movimento por aqui" }),
  ).toBeVisible();
  await page.getByLabel("Buscar transações").fill(`Receita ${stamp}`);
  await expect(page.locator(".entry-row")).toHaveCount(1);
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const file = await promise;
  expect(file.suggestedFilename()).toBe(`ledgerly-${month}.csv`);
  const stream = await file.createReadStream();
  let text = "";
  for await (const chunk of stream!) text += chunk.toString();
  expect(text).toContain(`Receita ${stamp}`);
  expect(text).toContain("1000.00");
});
test("viewer has no write controls and the dashboard fits a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "viewer@ledgerly.test");
  await expect(
    page.getByRole("button", { name: "Nova transação" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Transações", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Importar", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Categorias", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Nova categoria" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar no meu espaço" }),
  ).toBeVisible();
});
