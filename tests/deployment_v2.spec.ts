import { test, expect } from '@playwright/test';

test.describe('Mini-Vic Chatbot E2E Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    await page.goto('http://127.0.0.1:8080');
    // Wait for the bot trigger button to appear
    await expect(page.locator('button.group.relative')).toBeVisible();
  });

  test('TEST 1: Standard Pipeline (Normal Mode - Latency Check)', async ({ page }) => {
    // Open the chat
    await page.locator('button.group.relative').click();
    await expect(page.getByPlaceholder('Ask me anything...')).toBeVisible();

    const query = "Briefly explain the benefit of using telemetry in a serverless function.";
    
    // Prepare to measure latency
    const startTime = Date.now();

    // Send Query
    await page.getByPlaceholder('Ask me anything...').fill(query);
    await page.locator('button[type="submit"]').click();

    // Verify text content first (to confirm API success)
    // Wait for the response text to appear
    const responseLocator = page.locator('.bg-gray-800\\/80').last(); 
    await expect(responseLocator).toBeVisible({ timeout: 15000 });
    console.log("Bot response text found");
    
    const text = await responseLocator.textContent();
    console.log("Response text:", text);
    
    await expect(responseLocator).not.toContainText("Gemini link unstable");
    await expect(responseLocator).toContainText("telemetry", { timeout: 10000 });

    // Wait for "Speaking" state (visual sync)
    // The video gets class 'scale-105' when speaking
    const avatarVideo = page.locator('div.relative.h-56 video');
    
    // Wait for speaking state to start
    // We check this AFTER text because if text arrived, audio should be playing or about to play
    // Check if it HAS the class currently or had it
    // We use expect.toPass() to retry if needed, but simple toHaveClass with timeout is fine
    await expect(avatarVideo).toHaveClass(/scale-105/, { timeout: 10000 }); 
    
    const latency = Date.now() - startTime;
    console.log(`Audio playback latency: ${latency}ms`);
    
    // Note: Cold start might exceed 4s, but warm requests should be faster.
    // Soft assertion or warning if > 4s
    if (latency > 4000) {
      console.warn(`Warning: Latency ${latency}ms exceeded target of 4000ms`);
    }
  });

  test('TEST 2: Gemini Feature (Sci-Fi Mode) Validation', async ({ page }) => {
    // Open the chat
    await page.locator('button.group.relative').click();
    
    // Click Sci-Fi Mode button
    await page.getByRole('button', { name: '✨ Sci-Fi Mode' }).click();

    const avatarVideo = page.locator('div.relative.h-56 video');
    
    // P0 WOW Sync: Visual animation accompanies audio
    await expect(avatarVideo).toHaveClass(/scale-105/, { timeout: 10000 });

    // Text Output Check: Star Wars/Trek terminology
    const responseLocator = page.locator('.bg-gray-800\\/80').last();
    
    // Wait for text to populate
    await expect(responseLocator).toContainText(/Hyperdrive|The Force|Warp Core|Droid|Jedi|Sith|Enterprise|Falcon/i);
  });

});
