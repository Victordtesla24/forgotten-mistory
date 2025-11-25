const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
const cssContent = fs.readFileSync(path.resolve(__dirname, '../style.css'), 'utf-8');

const dom = new JSDOM(htmlContent, {
  runScripts: "dangerously",
  resources: "usable",
  url: "file://" + path.resolve(__dirname, '../index.html')
});

const { window } = dom;
const { document } = window;

// Helper to mock requestAnimationFrame for GSAP/Lenis
window.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16); // 60fps approximation
};
window.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

// Mocking essential browser APIs not fully present in JSDOM
window.matchMedia = window.matchMedia || function() {
    return {
        matches: false,
        addListener: function() {},
        removeListener: function() {}
    };
};

function runTests() {
    let passed = 0;
    let failed = 0;
    const results = [];

    function test(name, condition) {
        try {
            if (condition()) {
                console.log(`✅ PASS: ${name}`);
                results.push({ name, status: 'PASS' });
                passed++;
            } else {
                console.error(`❌ FAIL: ${name}`);
                results.push({ name, status: 'FAIL', error: 'Condition met false' });
                failed++;
            }
        } catch (e) {
            console.error(`❌ FAIL: ${name} - Error: ${e.message}`);
            results.push({ name, status: 'FAIL', error: e.message });
            failed++;
        }
    }

    console.log("Starting Static & Structural Tests...\n");

    // REQ-001: Design Aesthetics - Dark Theme (Check CSS variable)
    test('REQ-001: Dark Theme defined in CSS', () => {
        return cssContent.includes('--bg-color: #0a0a0a');
    });

    // REQ-002: Preloader - Existence
    test('REQ-002: Preloader exists in DOM', () => {
        return document.querySelector('.preloader') !== null;
    });

    // REQ-003: Main Template - Hero Section
    test('REQ-003: Hero Section exists', () => {
        return document.querySelector('#hero') !== null;
    });

    // REQ-006: Content Integration - GitHub Link
    test('REQ-006: GitHub Link present', () => {
        const link = document.querySelector('a[href="https://github.com/Victordtesla24"]');
        return link !== null;
    });

    // REQ-006: Content Integration - YouTube Link
    test('REQ-006: YouTube Link present', () => {
        const link = document.querySelector('a[href="https://youtube.com/@vicd0ct?si=HLl19AeCvhJvSZso"]');
        return link !== null;
    });

    // REQ-007: Custom Cursor
    test('REQ-007: Custom Cursor elements present', () => {
        return document.querySelector('.cursor-dot') !== null && 
               document.querySelector('.cursor-outline') !== null;
    });

    // REQ-008: Responsive Navigation
    test('REQ-008: Navigation elements present', () => {
        return document.querySelector('.menu-toggle') !== null &&
               document.querySelector('.nav-overlay') !== null;
    });

    // REQ-009: Avatar Placeholder
    test('REQ-009: Avatar Placeholder present', () => {
        return document.querySelector('#avatar-container') !== null;
    });

    // Verify script inclusion
    test('Scripts included', () => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const hasGsap = scripts.some(s => s.src.includes('gsap.min.js'));
        const hasScrollTrigger = scripts.some(s => s.src.includes('ScrollTrigger.min.js'));
        const hasLenis = scripts.some(s => s.src.includes('lenis.min.js'));
        const hasMainScript = scripts.some(s => s.src.includes('script.js'));
        
        return hasGsap && hasScrollTrigger && hasLenis && hasMainScript;
    });

    console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
    
    if (failed > 0) {
        process.exit(1);
    }
}

// Give JSDOM a moment to "load" scripts if needed, though mostly we are checking static DOM
setTimeout(runTests, 1000);
