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

    // WCAG 2.2 AA included: the target-size rule holds the career chips and every other control to 24 px at least.
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
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
