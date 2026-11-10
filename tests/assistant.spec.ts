import { expect, test } from '@playwright/test';

import { MINIVIC_CHAT_ORIGIN } from '@/lib/assistant/origin';

import { open } from './support';

test.describe('when the live assistant cannot answer', () => {
  test.beforeEach(async ({ page }) => {
    // Both routes a send tries refuse the connection, so the built-in answer is all there is.
    await page.route(`${MINIVIC_CHAT_ORIGIN}/**`, (route) => route.abort());
    await page.route('**/api/chat**', (route) => route.abort());
  });

  test('a question about Vikram still gets a true answer, with the notice in view', async ({
    page,
  }) => {
    await open(page, '/');
    await page.getByRole('button', { name: 'Ask Mini Vic' }).first().click();
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();

    await panel.getByRole('textbox', { name: 'Your question for Mini Vic' }).fill(
      'Where is Vikram based?',
    );
    await panel.getByRole('button', { name: 'Send' }).click();

    const log = panel.getByRole('log', { name: 'Conversation with Mini Vic' });
    await expect(log).toContainText('Melbourne');

    // A reader must not take the built-in summary for the live assistant: the line
    // that says so has to be inside the visible part of the conversation.
    const notice = log.getByText('built-in summary of the CV');
    await expect(notice).toBeVisible();
    await expect
      .poll(async () => {
        const [logBox, noticeBox] = await Promise.all([log.boundingBox(), notice.boundingBox()]);
        if (!logBox || !noticeBox) return false;
        return noticeBox.y >= logBox.y && noticeBox.y + noticeBox.height <= logBox.y + logBox.height;
      })
      .toBe(true);
  });
});
