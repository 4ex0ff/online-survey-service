import { expect, test } from "@playwright/test";

test("user can register, login and open dashboard", async ({ page }) => {
  const uniqueEmail = `student-${Date.now()}@example.com`;
  const password = "strongpass123";

  await page.goto("/register");
  await page.locator('input[name="name"]').fill("Учебный пользователь");
  await page.locator('input[name="email"]').fill(uniqueEmail);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="passwordConfirmation"]').fill(password);
  await page.locator(".register-button-primary").click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator(".form-success")).toBeVisible();

  await page.locator('input[name="email"]').fill(uniqueEmail);
  await page.locator('input[name="password"]').fill(password);
  await page.locator(".login-button-primary").click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".dashboard-title-label")).toHaveText("Сервис опросов");
  await expect(page.locator(".dashboard-empty strong")).toContainText("опрос");
});
