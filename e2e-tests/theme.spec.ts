import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Theme Switcher', () => {
  test('should default to the OS color scheme preference', async ({ page }) => {
    await test.step('defaults to dark when the OS prefers dark', async () => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    await test.step('defaults to light when the OS prefers light', async () => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto('/');
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });
  });

  test('should toggle the theme and persist the choice in localStorage', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    const toggle = page.getByTestId('theme-toggle');
    const html = page.locator('html');

    await test.step('starts in light theme', async () => {
      await expect(html).not.toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    await test.step('switching to dark theme updates the DOM and localStorage', async () => {
      await toggle.click();
      await expect(html).toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
    });

    await test.step('the persisted choice survives a reload', async () => {
      await page.reload();
      await expect(html).toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('switching back to light theme updates the DOM and localStorage', async () => {
      await toggle.click();
      await expect(html).not.toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    });
  });

  test('theme toggle should have an accessible, state-reflecting label', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toHaveAccessibleName(/switch to dark theme/i);

    await toggle.click();
    await expect(toggle).toHaveAccessibleName(/switch to light theme/i);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`home page should not have accessibility violations in ${colorScheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');
      await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test(`game details page should not have accessibility violations in ${colorScheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/game/1');
      await page.waitForSelector('[data-testid="game-details"]', { timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test(`about page should not have accessibility violations in ${colorScheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/about');
      await page.waitForSelector('[data-testid="about-section"]', { timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
