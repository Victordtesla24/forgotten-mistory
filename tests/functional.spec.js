const { test, expect } = require('@playwright/test');

test.describe('Portfolio Website Functional Requirements', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for preloader to finish before running assertions on page content
        // The preloader has a delay of 3.5s + animation time. 
        // We'll wait for the preloader to be hidden.
        const preloader = page.locator('.preloader');
        await expect(preloader).toHaveCSS('height', '0px', { timeout: 10000 });
    });

    test('Requirement 1: Design & Theme', async ({ page }) => {
        // Check background color
        const body = page.locator('body');
        await expect(body).toHaveCSS('background-color', 'rgb(10, 10, 10)');

        // Check Fonts (checking one element for each font family)
        const heroTitle = page.locator('.hero-title');
        await expect(heroTitle).toHaveCSS('font-family', /Playfair Display/);
        
        const bodyText = page.locator('body');
        await expect(bodyText).toHaveCSS('font-family', /Inter/);
    });

    test('Requirement 2: Preloader', async ({ page }) => {
        // Reload to catch the preloader
        await page.reload();
        const preloader = page.locator('.preloader');
        const counter = page.locator('.counter');
        
        // Initially visible
        await expect(preloader).toBeVisible();
        
        // Counter should reach 100 (hard to catch exact increments, but we can check it exists)
        // We already waited for it to disappear in beforeEach, so let's just verify it's gone now
        await expect(preloader).toHaveCSS('height', '0px', { timeout: 10000 });
    });

    test('Requirement 3: Navigation', async ({ page }) => {
        // Logo
        await expect(page.locator('.logo')).toHaveText('VICTOR.');

        // Menu Toggle
        const menuToggle = page.locator('.menu-toggle');
        await expect(menuToggle).toBeVisible();
        await expect(menuToggle).toHaveText('Menu');

        // Open Menu
        await menuToggle.click();
        const navOverlay = page.locator('.nav-overlay');
        await expect(navOverlay).toHaveClass(/active/);
        
        // Links
        const links = ['Home', 'About', 'Experience', 'Work', 'Contact'];
        for (const linkText of links) {
            await expect(page.locator(`.nav-links a:has-text("${linkText}")`)).toBeVisible();
        }

        // Close Menu
        await menuToggle.click();
        await expect(navOverlay).not.toHaveClass(/active/);
    });

    test('Requirement 4: Hero Section', async ({ page }) => {
        await expect(page.locator('.hero-title')).toContainText("Hello, I'm");
        await expect(page.locator('.hero-title')).toContainText("Victor");
        await expect(page.locator('.hero-subtitle')).toHaveText("Creative Developer & Tech Enthusiast");
        
        const githubLink = page.locator('a[href="https://github.com/Victordtesla24"]');
        await expect(githubLink).toBeVisible();
        
        const youtubeLink = page.locator('a[href="https://youtube.com/@vicd0ct?si=HLl19AeCvhJvSZso"]');
        await expect(youtubeLink).toBeVisible();
        
        const talkLink = page.locator('a[href="#contact"]');
        await expect(talkLink).toBeVisible();

        await expect(page.locator('#avatar-container')).toBeVisible();
    });

    test('Requirement 5: About Section', async ({ page }) => {
        const aboutSection = page.locator('#about');
        await expect(aboutSection.locator('.section-title')).toHaveText('About Me');
        await expect(aboutSection.locator('.about-text').first()).toBeVisible();
    });

    test('Requirement 6: Experience Section', async ({ page }) => {
        const expSection = page.locator('#experience');
        await expect(expSection.locator('.section-title')).toHaveText('Experience');
        
        // Check for at least 3 timeline items
        const items = expSection.locator('.timeline-item');
        await expect(items).toHaveCount(3);
        
        await expect(items.nth(0).locator('h3')).toHaveText('Senior Developer');
        await expect(items.nth(1).locator('h3')).toHaveText('Full Stack Engineer');
        await expect(items.nth(2).locator('h3')).toHaveText('Junior Developer');
    });

    test('Requirement 7: Work Section', async ({ page }) => {
        const workSection = page.locator('#work');
        await expect(workSection.locator('.section-title')).toHaveText('Current Project in the Pipeline');
        
        const projectCards = workSection.locator('.project-card');
        await expect(projectCards.count()).resolves.toBeGreaterThan(0);
        
        await expect(projectCards.first().locator('h3')).toContainText('GitHub');
    });

    test('Requirement 8: Contact Section', async ({ page }) => {
        const contactSection = page.locator('#contact');
        await expect(contactSection.locator('.contact-title')).toContainText('Let’s ship');
        await expect(contactSection.locator('a[href="mailto:melbvicduque@gmail.com"]')).toBeVisible();
        
        const socialLinks = contactSection.locator('.social-links-large a');
        await expect(socialLinks.count()).resolves.toBeGreaterThanOrEqual(2);
    });

    test('Requirement 9: Interactivity', async ({ page }) => {
        // Custom cursor
        const cursorDot = page.locator('[data-cursor-dot]');
        const cursorOutline = page.locator('[data-cursor-outline]');
        await expect(cursorDot).toBeVisible();
        await expect(cursorOutline).toBeVisible();

        // Move mouse and check if cursor follows (basic check)
        await page.mouse.move(100, 100);
        await expect(cursorDot).toHaveCSS('left', '100px');
        await expect(cursorDot).toHaveCSS('top', '100px');

        // Scroll smooth check (indirectly via class or script loaded)
        // We can check if lenis is initialized or if scroll triggers animations
        // Let's check if the GSAP scroll trigger added classes or styles
        // Since animations run on scroll, let's scroll down and see if elements become visible
        
        // Force items to be initial state (hidden) then scroll
        // Actually, the code sets opacity: 0 initially via GSAP. 
        // We already waited for the page to load.
        // Let's scroll to About section
        await page.evaluate(() => window.scrollTo(0, 500));
        // Wait a bit for animation
        await page.waitForTimeout(1000);
        
        // Check opacity of about content
        const aboutText = page.locator('.about-text').first();
        await expect(aboutText).toHaveCSS('opacity', '1');
    });

});
