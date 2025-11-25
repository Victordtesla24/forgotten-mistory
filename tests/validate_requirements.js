const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// 1. Setup Environment
const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../style.css');
const jsPath = path.resolve(__dirname, '../script.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const cssContent = fs.readFileSync(cssPath, 'utf-8');
const jsContent = fs.readFileSync(jsPath, 'utf-8');

const dom = new JSDOM(htmlContent, {
    runScripts: "dangerously",
    resources: "usable",
    url: "file://" + htmlPath,
    beforeParse(window) {
        // Mock matchMedia
        window.matchMedia = window.matchMedia || function () {
            return {
                matches: false,
                addListener: function () { },
                removeListener: function () { }
            };
        };
        // Mock requestAnimationFrame
        window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
        window.cancelAnimationFrame = (id) => clearTimeout(id);
        
        // Mock GSAP (simplistic mock to prevent errors if script tries to run)
        window.gsap = {
            registerPlugin: () => {},
            timeline: () => ({
                to: () => {},
                from: () => {},
                fromTo: () => {}
            }),
            to: () => {},
            from: () => {},
            fromTo: () => {}
        };
        window.ScrollTrigger = {};
        
        // Mock Lenis
        window.Lenis = class {
            constructor() {}
            raf() {}
        };
    }
});

const { window } = dom;
const { document } = window;

// Helper function for logging
const results = [];
function assert(desc, condition, expected = true) {
    const status = condition === expected ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${desc}`);
    results.push({ description: desc, status, expected, actual: condition });
}

// 2. Define Requirements & Run Tests

console.log('--- Starting Validation of Requirements ---');

// REQ-001: Design Aesthetics - Dark Theme
// We check if the CSS variable or body background is set to #0a0a0a
const hasDarkTheme = cssContent.includes('--bg-color: #0a0a0a') || cssContent.includes('background-color: #0a0a0a');
assert('REQ-001: Design Aesthetics - Dark Theme defined in CSS', hasDarkTheme);

// REQ-002: Preloader
const preloaderExists = document.querySelector('.preloader') !== null;
const counterExists = document.querySelector('.counter') !== null;
assert('REQ-002: Preloader element exists', preloaderExists);
assert('REQ-002: Counter element exists', counterExists);

// REQ-003: Navigation
const logo = document.querySelector('.logo');
const menuToggle = document.querySelector('.menu-toggle');
const navOverlay = document.querySelector('.nav-overlay');
assert('REQ-003: Logo "VICTOR." exists', logo && logo.textContent.trim() === 'VICTOR.');
assert('REQ-003: Menu Toggle button exists', menuToggle !== null);
assert('REQ-003: Navigation Overlay exists', navOverlay !== null);

const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const expectedLinks = ['Home', 'About', 'Experience', 'Work', 'Contact'];
const actualLinks = navLinks.map(l => l.textContent.trim());
assert('REQ-003: All Navigation Links present', JSON.stringify(actualLinks) === JSON.stringify(expectedLinks));

// REQ-004: Hero Section
const heroTitle = document.querySelector('.hero-title');
const heroSubtitle = document.querySelector('.hero-subtitle');
const heroLinks = document.querySelectorAll('.hero-links a');
const avatar = document.querySelector('#avatar-container');

assert('REQ-004: Hero Title contains "Victor"', heroTitle && heroTitle.textContent.includes('Victor'));
assert('REQ-004: Hero Subtitle is correct', heroSubtitle && heroSubtitle.textContent.includes('Creative Developer & Tech Enthusiast'));
assert('REQ-004: 3 Hero Action Links exist', heroLinks.length === 3);
assert('REQ-004: Avatar placeholder exists', avatar !== null);

// REQ-005: About Section
const aboutTitle = document.querySelector('#about .section-title');
const aboutText = document.querySelector('.about-text');
assert('REQ-005: About Section Title exists', aboutTitle && aboutTitle.textContent === 'About Me');
assert('REQ-005: About descriptive text exists', aboutText && aboutText.textContent.length > 0);

// REQ-006: Experience Section
const expTitle = document.querySelector('#experience .section-title');
const timelineItems = document.querySelectorAll('.timeline-item');
assert('REQ-006: Experience Section Title exists', expTitle && expTitle.textContent === 'Experience');
assert('REQ-006: At least 3 Experience items listed', timelineItems.length >= 3);

// REQ-007: Work Section
const workTitle = document.querySelector('#work .section-title');
const projects = document.querySelectorAll('.project-card');
assert('REQ-007: Work Section Title exists', workTitle && workTitle.textContent === 'Selected Work');
assert('REQ-007: At least 2 Project Cards listed', projects.length >= 2);

// REQ-008: Contact Section
const contactTitle = document.querySelector('.contact-title');
const emailLink = document.querySelector('.contact-email');
const socialLinks = document.querySelectorAll('.social-links a');
assert('REQ-008: Contact Title exists', contactTitle && contactTitle.textContent === 'Have an idea?');
assert('REQ-008: Email link is correct', emailLink && emailLink.href.includes('mailto:contact@victor.com'));
assert('REQ-008: Social links present in footer/contact area', socialLinks.length > 0);

// REQ-009: Interactivity (Static Check)
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
assert('REQ-009: Custom Cursor elements exist', cursorDot !== null && cursorOutline !== null);

const parallaxElements = document.querySelectorAll('.parallax');
assert('REQ-009: Parallax elements defined', parallaxElements.length > 0);

const hasGsapScript = htmlContent.includes('gsap.min.js');
const hasLenisScript = htmlContent.includes('lenis.min.js');
assert('REQ-009: GSAP script included', hasGsapScript);
assert('REQ-009: Lenis script included', hasLenisScript);

// 3. Generate Report
const failedTests = results.filter(r => r.status === 'FAIL');
const reportPath = path.resolve(__dirname, 'test_summary_report.md');

let reportContent = '# Test Summary Report\n\n';
reportContent += `**Date:** ${new Date().toLocaleString()}\n`;
reportContent += `**Total Tests:** ${results.length}\n`;
reportContent += `**Passed:** ${results.length - failedTests.length}\n`;
reportContent += `**Failed:** ${failedTests.length}\n\n`;

reportContent += '| Requirement | Status | Expected | Actual |\n';
reportContent += '|---|---|---|---|\n';
results.forEach(r => {
    reportContent += `| ${r.description} | ${r.status} | ${r.expected} | ${r.actual} |\n`;
});

fs.writeFileSync(reportPath, reportContent);
console.log(`\nReport generated at: ${reportPath}`);

if (failedTests.length > 0) {
    console.error('\nSOME TESTS FAILED. See report for details.');
    process.exit(1);
} else {
    console.log('\nALL TESTS PASSED.');
    process.exit(0);
}
