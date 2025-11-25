const { test, expect } = require('@playwright/test');

test.describe('Portfolio Website Requirements', () => {

  test.beforeEach(async ({ page }) => {
    // Go to the local index.html. 
    // Assuming we are serving it or opening the file directly.
    // For this test environment, we might need to use a file path or a local server.
    // I'll try to use the file protocol first.
    await page.goto('file://' + process.cwd() + '/index.html');
  });

  test('REQ-001: Design Aesthetics - Dark Theme', async ({ page }) => {
    const bodyBackgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // rgb(10, 10, 10) is #0a0a0a
    expect(bodyBackgroundColor).toBe('rgb(10, 10, 10)');
  });

  test('REQ-002: Preloader - Animation and Removal', async ({ page }) => {
    // Check if preloader exists initially
    const preloader = page.locator('.preloader');
    await expect(preloader).toBeVisible();

    // The counter should be present
    const counter = page.locator('.counter');
    await expect(counter).toBeVisible();

    // Wait for the preloader to disappear (animation takes roughly 4-5s total in script.js)
    await expect(preloader).not.toBeVisible({ timeout: 10000 });
  });

  test('REQ-003: Main Template Animations - Hero Text Reveal', async ({ page }) => {
    // Wait for preloader to finish
    await expect(page.locator('.preloader')).not.toBeVisible({ timeout: 10000 });

    // Check if hero title has the reveal class and becomes visible/animated
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toBeVisible();
    
    // Check if GSAP set opacity to 1 (or close to it) for revealed elements
    const subtitle = page.locator('.hero-subtitle');
    await expect(subtitle).toHaveCSS('opacity', '1');
  });

  test('REQ-006: Content Integration - GitHub Link', async ({ page }) => {
    // Wait for preloader to finish
    await expect(page.locator('.preloader')).not.toBeVisible({ timeout: 10000 });

    const githubLink = page.locator('a[href="https://github.com/Victordtesla24"]');
    await expect(githubLink.first()).toBeVisible();
  });

  test('REQ-006: Content Integration - YouTube Link', async ({ page }) => {
    // Wait for preloader to finish
    await expect(page.locator('.preloader')).not.toBeVisible({ timeout: 10000 });

    const youtubeLink = page.locator('a[href="https://youtube.com/@vicd0ct?si=HLl19AeCvhJvSZso"]');
    await expect(youtubeLink).toBeVisible();
  });

  test('REQ-007: Custom Cursor - Existence', async ({ page }) => {
    const cursorDot = page.locator('.cursor-dot');
    const cursorOutline = page.locator('.cursor-outline');
    
    await expect(cursorDot).toBeAttached();
    await expect(cursorOutline).toBeAttached();
  });

  test('REQ-008: Responsive Navigation - Menu Toggle', async ({ page }) => {
    const menuToggle = page.locator('.menu-toggle');
    const navOverlay = page.locator('.nav-overlay');

    // Initially hidden (transform translateY -100% in CSS, but let's check class)
    await expect(navOverlay).not.toHaveClass(/active/);

    // Click Menu
    await menuToggle.click();

    // Should be active now
    await expect(navOverlay).toHaveClass(/active/);
    
    // Links should be visible (or at least in the DOM)
    await expect(page.locator('.nav-link').first()).toBeVisible();
  });

  test('REQ-009: Avatar Placeholder - Existence', async ({ page }) => {
    // Wait for preloader to finish
    await expect(page.locator('.preloader')).not.toBeVisible({ timeout: 10000 });
    
    const avatarContainer = page.locator('#avatar-container');
    await expect(avatarContainer).toBeVisible();
  });

});
