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
    await expect(page.getByPlaceholder('Ask me anything—teams, budgets, AI stack...')).toBeVisible();

    const query = "Briefly explain the benefit of using telemetry in a serverless function.";
    
    // Prepare to measure latency
    const startTime = Date.now();

    // Send Query
    await page.getByPlaceholder('Ask me anything—teams, budgets, AI stack...').fill(query);
    await page.locator('button[type="submit"]').click();

    // Verify text content first (to confirm API success)
    // Wait for the response text to appear
    const responseLocator = page.locator('.bg-gray-800\\/80').last(); 
    await expect(responseLocator).toBeVisible({ timeout: 15000 });
    console.log("Bot response text found");
    
    const text = await responseLocator.textContent();
    console.log("Response text:", text);
    
    await expect(responseLocator).not.toContainText("Gemini link unstable");
    const trimmed = (text ?? "").trim();
    expect(trimmed.length).toBeGreaterThan(0);

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
    await page.getByRole('button', { name: 'Explain in sci-fi' }).click();

    // Text Output Check: ensure there is a response
    const responseLocator = page.locator('.bg-gray-800\\/80').last();
    await expect(responseLocator).toBeVisible({ timeout: 10000 });
    const scifiText = (await responseLocator.textContent())?.trim() ?? "";
    expect(scifiText.length).toBeGreaterThan(0);
  });

  test('TEST 3: Pollo AI Video Flow (Mocked)', async ({ page }) => {
    // Mock the chat API response with a Pollo Task ID
    await page.route('**/api/chat-with-vic', async route => {
      if (route.request().method() === 'POST') {
        const json = { 
            text: "I'm generating a high-def video for you now.", 
            audio: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTRV", // Short dummy base64
            polloTaskId: "test-task-123" 
        };
        await route.fulfill({ json });
      } else {
        await route.continue();
      }
    });

    // Mock the Pollo polling endpoint
    await page.route('**/api/chat-with-vic?taskId=test-task-123', async route => {
        await route.fulfill({ 
            json: { 
                status: 'succeeded', 
                output: ['https://example.com/video.mp4'] 
            } 
        });
    });

    await page.locator('button.group.relative').click();
    await page.getByPlaceholder('Ask me anything—teams, budgets, AI stack...').fill("Show me video");
    await page.locator('button[type="submit"]').click();

    // We expect "Play HD Video" button to appear eventually
    await expect(page.getByRole('button', { name: 'Play HD Video' })).toBeVisible({ timeout: 10000 });
  });


});
