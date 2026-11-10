import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { THEME_KEY } from '@/components/site/theme';

import { open } from './support';

for (const theme of ['dark', 'light'] as const) {
  test(`axe reports no serious or critical violations on the home page in the ${theme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [THEME_KEY, theme],
    );
    await open(page, '/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.nodes
            .slice(0, 5)
            .map((node) => node.target.join(' '))
            .join(' | ')}`,
      );
    expect(blocking).toEqual([]);
  });
}
