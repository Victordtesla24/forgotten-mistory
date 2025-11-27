const { test, expect } = require('@playwright/test');

test.describe('Portfolio Website Functional Requirements', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for preloader to finish before running assertions on page content
        // The preloader has a delay of 3.5s + animation time. 
        // We'll wait for the preloader to be hidden.
        await page.waitForSelector('.preloader', { state: 'hidden', timeout: 30000 });
    });

    test('Requirement 1: Design & Theme', async ({ page }) => {
        // Check background color - Body is transparent to reveal WebGL background
        const body = page.locator('body');
        await expect(body).toHaveCSS('background-color', /rgba\(0, 0, 0, 0\)|rgb\(10, 10, 10\)/);

        // Check Fonts (checking one element for each font family)
        const heroTitle = page.locator('.hero-title');
        await expect(heroTitle).toHaveCSS('font-family', /(Roboto Condensed|Playfair Display)/);
        
        const bodyText = page.locator('body');
        await expect(bodyText).toHaveCSS('font-family', /(Inter|Source Sans Pro)/);
    });

    test('Requirement 2: Preloader', async ({ page }) => {
        test.setTimeout(120000); // Explicit timeout for heavy WebGL/animation test
        // Reload to catch the preloader
        await page.reload();
        // Wait for the preloader to disappear again
        await page.waitForSelector('.preloader', { state: 'hidden', timeout: 60000 });
    });

    test('Requirement 3: Navigation', async ({ page }) => {
        test.setTimeout(120000);
        // Logo
        await expect(page.locator('.logo')).toHaveText('VIKRAM.');

        // Menu Toggle
        const menuToggle = page.locator('.menu-toggle');
        await expect(menuToggle).toBeVisible();
        await expect(menuToggle).toHaveText('Menu');

        // Open Menu
        const adminControls = page.locator('.admin-controls');
        await adminControls.evaluate((el) => (el.style.pointerEvents = 'none'));
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
        // Increase timeout to account for text scramble animation
        await expect(page.locator('.hero-title')).toContainText("Vikram", { timeout: 15000 });
        await expect(page.locator('.hero-subtitle')).toContainText("Senior Technical Program Manager & AI Solution Architect");
        
        const githubLink = page.locator('.hero-links a[href="https://github.com/Victordtesla24"]');
        await expect(githubLink).toBeVisible();
        
        const youtubeLink = page.locator('.hero-links a[href="https://youtube.com/@vicd0ct"]');
        await expect(youtubeLink).toBeVisible();
        
        const talkLink = page.locator('.hero-links .btn-primary[href="#contact"]');
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
        
        const items = expSection.locator('.accordion-item');
        await expect(items).toHaveCount(8);

        await expect(items.first().locator('.role')).toContainText('Senior Delivery Lead');
        await expect(items.last().locator('.role')).toContainText('Independent AI Consulting & Upskilling');
    });

    test('Requirement 7: Work Section', async ({ page }) => {
        const workSection = page.locator('#work');
        await expect(workSection.locator('.section-title')).toHaveText('Current Projects in the Pipeline');
        
        const projectCards = workSection.locator('.project-card');
        await expect(projectCards.count()).resolves.toBeGreaterThan(0);
        
        await expect(projectCards.first().locator('h3')).toContainText('EFDDH Jira Analytics');
    });

    test('Requirement 8: Contact Section', async ({ page }) => {
        const contactSection = page.locator('#contact');
        await expect(contactSection.locator('.contact-title')).toContainText("Let's ship");
        await expect(contactSection.locator('a[href="mailto:sarkar.vikram@gmail.com"]')).toBeVisible();
        
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
        await expect(aboutText).toBeVisible();
    });

});
