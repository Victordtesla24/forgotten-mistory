const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

async function runTests() {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    
    // Setup VirtualConsole to catch logs
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("log", (message) => console.log("JSDOM Log:", message));
    virtualConsole.on("error", (message) => console.error("JSDOM Error:", message));
    virtualConsole.on("warn", (message) => console.warn("JSDOM Warn:", message));

    const dom = new JSDOM(html, {
        url: "http://localhost/",
        runScripts: "dangerously",
        resources: "usable",
        virtualConsole,
        pretendToBeVisual: true
    });

    const { window } = dom;
    const { document } = window;

    // Polyfills and Mocks
    window.matchMedia = window.matchMedia || function() {
        return {
            matches: false,
            addListener: function() {},
            removeListener: function() {}
        };
    };
    
    window.requestAnimationFrame = (callback) => {
        return setTimeout(callback, 0);
    };
    
    window.cancelAnimationFrame = (id) => {
        clearTimeout(id);
    };
    
    window.scrollTo = () => {}; 
    
    // Mock Element.animate if missing (JSDOM might not support it fully)
    window.HTMLElement.prototype.animate = function() {
        return {
            finished: Promise.resolve(),
            cancel: () => {},
            addEventListener: () => {}
        };
    };

    console.log("Starting Tests...");

    const results = [];

    function assert(condition, message, reqId) {
        if (condition) {
            console.log(`✓ [Req ${reqId}] PASS: ${message}`);
            results.push({ reqId, message, status: 'PASS' });
        } else {
            console.error(`✗ [Req ${reqId}] FAIL: ${message}`);
            results.push({ reqId, message, status: 'FAIL' });
        }
    }

    // Wait for a moment for potential initial scripts to run
    await new Promise(resolve => setTimeout(resolve, 1500));

    // --- Requirement 1: Design & Theme ---
    const fontsLink = document.querySelector('link[href*="fonts.googleapis.com"]');
    assert(fontsLink !== null, "Google Fonts link present", 1);
    
    // --- Requirement 2: Preloader ---
    const preloader = document.querySelector('.preloader');
    const counter = document.querySelector('.counter');
    assert(preloader !== null, "Preloader element exists", 2);
    assert(counter !== null, "Counter element exists", 2);
    
    // --- Requirement 3: Navigation ---
    const logo = document.querySelector('.logo');
    assert(logo && logo.textContent.includes('VICTOR.'), "Logo text is correct", 3);
    
    const menuToggle = document.querySelector('.menu-toggle');
    assert(menuToggle !== null, "Menu toggle button exists", 3);
    
    const navOverlay = document.querySelector('.nav-overlay');
    assert(navOverlay !== null, "Nav overlay exists", 3);
    
    const navLinks = Array.from(document.querySelectorAll('.nav-link')).map(l => l.textContent.trim());
    const expectedLinks = ['Home', 'About', 'Experience', 'Work', 'Contact'];
    const allLinksPresent = expectedLinks.every(link => navLinks.includes(link));
    assert(allLinksPresent, `All nav links present: ${expectedLinks.join(', ')}`, 3);

    // --- Requirement 4: Hero Section ---
    const heroTitle = document.querySelector('.hero-title');
    assert(heroTitle && heroTitle.textContent.includes("Victor"), "Hero title contains 'Victor'", 4);
    
    const heroSubtitle = document.querySelector('.hero-subtitle');
    assert(heroSubtitle && heroSubtitle.textContent.includes("Creative Developer"), "Hero subtitle is correct", 4);
    
    const githubLink = document.querySelector('a[href="https://github.com/Victordtesla24"]');
    assert(githubLink !== null, "GitHub link exists", 4);
    
    // --- Requirement 5: About Section ---
    const aboutSection = document.getElementById('about');
    assert(aboutSection !== null, "About section exists", 5);
    const aboutTitle = aboutSection ? aboutSection.querySelector('.section-title') : null;
    assert(aboutTitle && aboutTitle.textContent.includes("About Me"), "About section has title", 5);
    
    // --- Requirement 6: Experience Section ---
    const expSection = document.getElementById('experience');
    assert(expSection !== null, "Experience section exists", 6);
    const timelineItems = expSection ? expSection.querySelectorAll('.timeline-item') : [];
    assert(timelineItems.length >= 3, `Timeline has at least 3 items (found ${timelineItems.length})`, 6);
    
    // --- Requirement 7: Work Section ---
    const workSection = document.getElementById('work');
    assert(workSection !== null, "Work section exists", 7);
    const projectCards = workSection ? workSection.querySelectorAll('.project-card') : [];
    assert(projectCards.length > 0, "At least one project card exists", 7);
    
    // --- Requirement 8: Contact Section ---
    const contactSection = document.getElementById('contact');
    assert(contactSection !== null, "Contact section exists", 8);
    const mailLink = document.querySelector('a[href^="mailto:contact@victor.com"]');
    assert(mailLink !== null, "Mailto link exists", 8);
    
    // --- Requirement 9: Interactivity (Static Checks) ---
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');
    assert(cursorDot !== null && cursorOutline !== null, "Custom cursor elements exist", 9);

    // Summary
    const failures = results.filter(r => r.status === 'FAIL');
    console.log(`\nTest Summary: ${results.length} tests run, ${failures.length} failed.`);
    
    if (failures.length > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
