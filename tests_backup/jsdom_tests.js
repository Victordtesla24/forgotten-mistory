const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { test } = require('node:test');
const assert = require('node:assert');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Mock browser environment
const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

// Mock requestAnimationFrame to prevent scripts from hanging or erroring
window.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 0);
};
window.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

// Helper to wait for DOM updates (basic)
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('Requirement 1: Design & Theme', () => {
    // Fonts
    const linkTags = Array.from(document.querySelectorAll('link'));
    const fontLinks = linkTags.filter(link => link.href && link.href.includes('fonts.googleapis.com'));
    assert.ok(fontLinks.length > 0, 'Google Fonts should be linked');
    
    // We can't easily check computed styles for external CSS in JSDOM without loading the CSS file and parsing it,
    // or using a robust resource loader which might be flaky here.
    // Instead, we check if the CSS file is linked.
    const styleLink = linkTags.find(link => link.href.includes('style.css'));
    assert.ok(styleLink, 'style.css should be linked');
});

test('Requirement 2: Preloader', () => {
    const preloader = document.querySelector('.preloader');
    const counter = document.querySelector('.counter');
    assert.ok(preloader, 'Preloader element exists');
    assert.ok(counter, 'Counter element exists');
});

test('Requirement 3: Navigation', () => {
    const logo = document.querySelector('.logo');
    assert.strictEqual(logo.textContent.trim(), 'VICTOR.', 'Logo text matches');

    const menuToggle = document.querySelector('.menu-toggle');
    assert.ok(menuToggle, 'Menu toggle exists');

    const navOverlay = document.querySelector('.nav-overlay');
    assert.ok(navOverlay, 'Nav overlay exists');

    const links = Array.from(document.querySelectorAll('.nav-links a')).map(a => a.textContent.trim());
    const expectedLinks = ['Home', 'About', 'Experience', 'Work', 'Contact'];
    expectedLinks.forEach(link => {
        assert.ok(links.includes(link), `Navigation should include ${link}`);
    });
});

test('Requirement 4: Hero Section', () => {
    const title = document.querySelector('.hero-title');
    assert.ok(title.textContent.includes("Hello, I'm"), 'Hero title missing "Hello, I\'m"');
    assert.ok(title.textContent.includes("Victor"), 'Hero title missing "Victor"');

    const subtitle = document.querySelector('.hero-subtitle');
    assert.strictEqual(subtitle.textContent.trim(), 'Creative Developer & Tech Enthusiast');

    const links = document.querySelectorAll('.hero-links a');
    assert.ok(links.length >= 3, 'Hero should have at least 3 links');
    
    const github = document.querySelector('a[href*="github.com"]');
    assert.ok(github, 'GitHub link exists');
});

test('Requirement 5: About Section', () => {
    const section = document.querySelector('#about');
    assert.ok(section, 'About section exists');
    
    const title = section.querySelector('.section-title');
    assert.strictEqual(title.textContent.trim(), 'About Me');
    
    const text = section.querySelector('.about-text');
    assert.ok(text.textContent.length > 0, 'About text should not be empty');
});

test('Requirement 6: Experience Section', () => {
    const section = document.querySelector('#experience');
    assert.ok(section, 'Experience section exists');
    
    const title = section.querySelector('.section-title');
    assert.strictEqual(title.textContent.trim(), 'Experience');
    
    const items = section.querySelectorAll('.timeline-item');
    assert.ok(items.length >= 3, 'Should have at least 3 experience items');
    
    const roles = Array.from(items).map(i => i.querySelector('h3').textContent.trim());
    assert.ok(roles.includes('Senior Developer'), 'Senior Developer role missing');
    assert.ok(roles.includes('Full Stack Engineer'), 'Full Stack Engineer role missing');
    assert.ok(roles.includes('Junior Developer'), 'Junior Developer role missing');
});

test('Requirement 7: Work Section', () => {
    const section = document.querySelector('#work');
    assert.ok(section, 'Work section exists');
    
    const title = section.querySelector('.section-title');
    assert.strictEqual(title.textContent.trim(), 'Current Project in the Pipeline');
    
    const cards = section.querySelectorAll('.project-card');
    assert.ok(cards.length > 0, 'Should have project cards');
    
    const firstCardTitle = cards[0].querySelector('h3').textContent.trim();
    assert.ok(firstCardTitle.toLowerCase().includes('github'), 'First project card should mention GitHub');
});

test('Requirement 8: Contact Section', () => {
    const section = document.querySelector('#contact');
    assert.ok(section, 'Contact section exists');
    
    const title = section.querySelector('.contact-title');
    assert.ok(title.textContent.trim().startsWith('Let’s ship'), 'Contact title should show CTA');
    
    const email = section.querySelector('a[href^="mailto:"]');
    assert.strictEqual(email.getAttribute('href'), 'mailto:melbvicduque@gmail.com', 'Email link matches');
    
    const socialLinks = section.querySelectorAll('.social-links-large a');
    assert.ok(socialLinks.length >= 2, 'Social links exist');
});

test('Requirement 9: Interactivity', () => {
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');
    assert.ok(cursorDot, 'Cursor dot exists');
    assert.ok(cursorOutline, 'Cursor outline exists');
    
    const scrollSection = document.querySelector('[data-scroll-section]');
    assert.ok(scrollSection, 'Scroll sections are marked');
    
    const parallax = document.querySelector('.parallax');
    assert.ok(parallax, 'Parallax elements exist');
});
