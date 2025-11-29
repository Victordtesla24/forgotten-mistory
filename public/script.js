// Initialize Lenis for smooth scrolling (skip if reduced motion)
const CONTENT_VERSION = '2025-11-25-v1';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const enableSmooth = !prefersReducedMotion;
let lenis = null;
let lenisScroll = 0;

if (enableSmooth) {
    try {
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
            });

            // Keep ScrollTrigger in sync with Lenis so parallax timelines stay active
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                lenis.on('scroll', ({ scroll }) => {
                    lenisScroll = scroll;
                    ScrollTrigger.update();
                });

                ScrollTrigger.scrollerProxy(document.documentElement, {
                    scrollTop(value) {
                        if (lenis && typeof lenis.scrollTo === 'function') {
                            return arguments.length ? lenis.scrollTo(value) : lenisScroll;
                        }
                        return window.scrollY;
                    },
                    getBoundingClientRect() {
                        return {
                            top: 0,
                            left: 0,
                            width: window.innerWidth,
                            height: window.innerHeight
                        };
                    },
                    pinType: document.documentElement.style.transform ? 'transform' : 'fixed'
                });
            }

            function raf(time) {
                if (!document.hidden) {
                    lenis.raf(time);
                }
                requestAnimationFrame(raf);
            }

            requestAnimationFrame(raf);

            // Refresh ScrollTrigger after Lenis starts so scrubbed animations bind correctly
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.defaults({ scroller: document.documentElement });
                ScrollTrigger.refresh();
            }
        } else {
            console.warn('Lenis not defined, skipping smooth scroll.');
        }
    } catch (e) {
        console.warn('Lenis init failed:', e);
    }
}

// Custom Cursor
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");
const canUseCustomCursor = !prefersReducedMotion && !hasCoarsePointer;

function initCursorTrail() {
    if (prefersReducedMotion || hasCoarsePointer) return;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursorTrail, { once: true });
        return;
    }

    const TRAIL_COUNT = 20;
    const FADE_DURATION = 500;
    const trailDots = [];
    let poolIndex = 0;

    const createDot = () => {
        const trailDot = document.createElement('div');
        trailDot.className = 'cursor-trail';
        trailDot.style.opacity = '0';
        trailDot.style.transform = 'translate(-50%, -50%) scale(0.2)';
        document.body.appendChild(trailDot);
        return trailDot;
    };

    for (let i = 0; i < TRAIL_COUNT; i++) {
        trailDots.push(createDot());
    }

    const animateDot = (x, y) => {
        const dot = trailDots[poolIndex];
        poolIndex = (poolIndex + 1) % TRAIL_COUNT;

        dot.style.transition = 'none';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        dot.style.opacity = '1';
        dot.style.transform = 'translate(-50%, -50%) scale(1)';

        requestAnimationFrame(() => {
            dot.style.transition = `opacity ${FADE_DURATION}ms linear, transform ${FADE_DURATION}ms ease-out`;
            dot.style.opacity = '0';
            dot.style.transform = 'translate(-50%, -50%) scale(0.2)';
        });
    };

    document.addEventListener('mousemove', (event) => {
        animateDot(event.clientX, event.clientY);
    });
}

// Ensure cursor elements exist before adding listeners
if (canUseCustomCursor && cursorDot && cursorOutline) {
    document.body.classList.add('cursor-enhanced');

    window.addEventListener("mousemove", function (e) {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;
        
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Hover effect for links
    const links = document.querySelectorAll('a, .menu-toggle, button, .accordion-header, .social-btn');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            cursorOutline.style.borderColor = 'transparent';
        });
        link.addEventListener('mouseleave', () => {
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorOutline.style.backgroundColor = 'transparent';
            cursorOutline.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        });
    });
} else {
    document.body.classList.remove('cursor-enhanced');
}

if (canUseCustomCursor) {
    initCursorTrail();
}
// Preloader Animation
function startLoader() {
        let counterElement = document.querySelector(".counter");
        if (!counterElement) {
            // If element missing, assume loaded or broken HTML, try to run intro immediately if possible
            console.warn('Counter element missing, skipping loader.');
            runIntroSequence();
            return;
        }

        if (prefersReducedMotion) {
            counterElement.textContent = '100';
            runIntroSequence(true);
            return;
        }

        let currentValue = 0;

        function updateCounter() {
            if(currentValue === 100) {
                runIntroSequence();
                return;
            }

            // Faster increment to avoid failsafe
            currentValue += Math.floor(Math.random() * 12) + 2;
            if(currentValue > 100) {
                currentValue = 100;
            }

            counterElement.textContent = currentValue;

            // Faster delay
            let delay = Math.floor(Math.random() * 100) + 20;
            setTimeout(updateCounter, delay);
        }
        
        updateCounter();
        
        // Force loader to finish if it takes too long (failsafe for slow networks/tests)
        setTimeout(() => {
            const p = document.querySelector(".preloader");
            if (p && getComputedStyle(p).display !== 'none') {
                try {
                    // Only warn if it really stuck, but typically with faster settings this won't happen
                    if (currentValue < 100) {
                        console.warn('Loader failsafe triggering.');
                    }
                    // Try standard exit
                    if (typeof runIntroSequence === 'function') {
                        runIntroSequence();
                    }
                } catch(e) { console.warn(e); }

                // Hard remove fallback
                setTimeout(() => {
                    if (p && getComputedStyle(p).display !== 'none') {
                        p.style.display = 'none';
                        p.remove();
                        document.body.style.overflow = 'auto'; // Ensure scrollable
                    }
                }, 500);
            }
        }, 4000); // Increased failsafe time
    }

// GSAP Animations
try {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
} catch (e) { console.warn('GSAP/ScrollTrigger missing', e); }

// --- Scramble Text Effect Class ---
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

function runIntroSequence(forceInstant = false) {
    // Guard against multiple runs
    if (window._introRun) return;
    window._introRun = true;

    const showContentInstantly = () => {
        const p = document.querySelector(".preloader");
        if (p) {
            p.style.display = 'none';
            p.remove();
        }
        const heroNameEl = document.querySelector('.reveal-text');
        if (heroNameEl) {
            heroNameEl.style.opacity = '1';
            heroNameEl.style.transform = 'none';
        }
        const heroSubtitleEl = document.querySelector('.hero-subtitle');
        if (heroSubtitleEl) {
            heroSubtitleEl.style.opacity = '1';
            heroSubtitleEl.style.transform = 'translateY(0)';
        }
        const heroLinksEl = document.querySelector('.hero-links');
        if (heroLinksEl) {
            heroLinksEl.style.opacity = '1';
            heroLinksEl.style.transform = 'translateY(0)';
        }
        document.body.style.overflow = 'auto';
    };

    if (forceInstant || prefersReducedMotion || typeof gsap === 'undefined') {
        if (typeof gsap === 'undefined') {
            console.warn('GSAP missing, forcing content visible');
        }
        showContentInstantly();
        return;
    }

    const tl = gsap.timeline();

    // Preloader Exit
    tl.to(".counter", {
        duration: 0.25,
        delay: 0.5,
        opacity: 0,
    });

    tl.to(".loader-ring", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut"
    }, "-=0.4");

    tl.to(".preloader", {
        duration: 0.8,
        height: 0,
        ease: "power4.inOut",
        onComplete: () => {
            const p = document.querySelector(".preloader");
            if (p) {
                p.style.display = "none";
                p.remove(); // Remove from DOM
            }
            document.body.style.overflow = 'auto'; // Enable scroll
        }
    });

    // Trigger scramble after curtain goes up
    setTimeout(() => {
        const heroNameEl = document.querySelector('.reveal-text');
        if (heroNameEl) {
            gsap.set(heroNameEl, { opacity: 1, y: 0 });
            const scrambler = new TextScramble(heroNameEl);
            const finalName = heroNameEl.innerText;
            scrambler.setText(finalName);
        }
    }, 1000);

    tl.to(".hero-subtitle", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.5
    }, "-=0.5");

    tl.to(".hero-links", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.8");
}

// Run loader safely
try {
    // If document already loaded, running startLoader might be late if it relies on listeners?
    // No, it just finds elements.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startLoader);
    } else {
        startLoader();
    }
} catch (e) {
    console.error("Loader init failed", e);
    // Emergency exit
    const p = document.querySelector(".preloader");
    if(p) p.style.display = 'none';
}

// Navigation
const menuToggle = document.querySelector('.menu-toggle');
const navOverlay = document.querySelector('.nav-overlay');
const navLinks = document.querySelectorAll('.nav-link');

if (menuToggle && navOverlay) {
    menuToggle.addEventListener('click', () => {
        navOverlay.classList.toggle('active');
        if(navOverlay.classList.contains('active')) {
            menuToggle.textContent = "Close";
            document.body.style.overflow = 'hidden';
        } else {
            menuToggle.textContent = "Menu";
            document.body.style.overflow = 'auto';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navOverlay.classList.remove('active');
            menuToggle.textContent = "Menu";
            document.body.style.overflow = 'auto';
        });
    });
}

// Scroll Animations for Sections
const sections = document.querySelectorAll('[data-scroll-section]');

// Helper to split text for animation
function splitText(element) {
    if (!element) return;
    const text = element.innerText;
    element.innerHTML = '';
    const chars = text.split('').map(char => {
        const span = document.createElement('span');
        span.innerText = char;
        span.style.display = 'inline-block';
        // Preserve spaces
        if (char === ' ') span.style.width = '0.3em'; 
        return span;
    });
    chars.forEach(span => element.appendChild(span));
    return chars;
}

sections.forEach(section => {
    // Select elements to animate within the section
    const targets = section.querySelectorAll(".about-text, .accordion-item, .contact-details, .social-links-large, .snap-card, .skill-card");
    const title = section.querySelector(".section-title");
    const contactTitle = section.querySelector(".contact-title");
    
    if (prefersReducedMotion || typeof gsap === 'undefined') {
        if (targets.length > 0) {
            targets.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        }
        if (title) {
            title.style.opacity = '1';
            title.style.clipPath = 'none';
        }
        if (contactTitle) {
            contactTitle.style.opacity = '1';
            contactTitle.style.transform = 'none';
        }
        return;
    }

    // Animate Section Title with Clip Path Reveal & Split Text Animation
    if (title) {
        const chars = splitText(title);

        gsap.set(title, { 
            clipPath: "inset(0 0 100% 0)",
            opacity: 1 
        });

        if (chars && chars.length > 0) {
            gsap.set(chars, { 
                opacity: 0, 
                y: 20,
                display: 'inline-block'
            });

            const titleTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                    onLeaveBack: () => {
                        gsap.set(title, { clipPath: "inset(0 0 100% 0)" });
                        gsap.set(chars, { opacity: 0, y: 20 });
                    }
                }
            });

            titleTimeline
                .to(title, {
                    clipPath: "inset(0 0 0% 0)",
                    duration: 1.2,
                    ease: "power4.out"
                })
                .to(chars, {
                    opacity: 1,
                    y: 0,
                    duration: 0.75,
                    stagger: {
                        each: 0.12,
                        from: "start"
                    },
                    ease: "power2.out"
                }, "-=0.6");
        } else {
            gsap.to(title, {
                clipPath: "inset(0 0 0% 0)",
                duration: 1.2,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse"
                }
            });
        }
    }

    // Specific enhancement for Contact Title (often larger/center)
    if (contactTitle) {
        const chars = splitText(contactTitle);
        if (chars) {
            gsap.fromTo(chars, {
                opacity: 0,
                y: 50,
                rotateX: -90
            }, {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.8,
                stagger: {
                    each: 0.02,
                    from: "start"
                },
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: contactTitle,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            });
        }
    }

    // Staggered Reveal for Content with enhanced timing
    if (targets.length > 0) {
        gsap.fromTo(targets, {
            y: 50,
            opacity: 0,
            clipPath: "inset(0 0 15% 0)"
        }, {
            y: 0,
            opacity: 1,
            clipPath: "inset(0 0 0% 0)",
            duration: 1,
            stagger: {
                each: 0.12,
                from: "start"
            },
            ease: "power3.out",
            scrollTrigger: {
                trigger: section,
                start: "top 75%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    }
});

// Accordion Functionality
const accordionHeaders = document.querySelectorAll('.accordion-header');

accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const content = item.querySelector('.accordion-content');
        
        const isActive = item.classList.contains('active');
        
        // Close all others?
        document.querySelectorAll('.accordion-item').forEach(otherItem => {
             if (otherItem !== item) {
                 otherItem.classList.remove('active');
                 otherItem.querySelector('.accordion-content').style.height = 0;
             }
        });

        if (isActive) {
            item.classList.remove('active');
            content.style.height = 0;
        } else {
            item.classList.add('active');
            content.style.height = content.scrollHeight + "px";
        }
    });
});

// Snapshot (About) Expanders
const snapCards = document.querySelectorAll('[data-snap]');

if (snapCards.length) {
    snapCards.forEach((card, index) => {
        const header = card.querySelector('.snap-header');
        const body = card.querySelector('.snap-body');
        if (!header || !body) return;

        const closeCard = () => {
            card.classList.remove('open');
            body.style.height = 0;
            header.setAttribute('aria-expanded', 'false');
        };

        const openCard = () => {
            card.classList.add('open');
            body.style.height = body.scrollHeight + "px";
            header.setAttribute('aria-expanded', 'true');
        };

        header.addEventListener('click', () => {
            const isOpen = card.classList.contains('open');
            // Close siblings for clarity
            snapCards.forEach(other => {
                if (other !== card) {
                    const otherBody = other.querySelector('.snap-body');
                    const otherHeader = other.querySelector('.snap-header');
                    other.classList.remove('open');
                    if (otherBody) otherBody.style.height = 0;
                    if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
                }
            });

            if (isOpen) {
                closeCard();
            } else {
                openCard();
            }
        });

        // Open the first card by default for quick context
        if (index === 0) {
            requestAnimationFrame(() => openCard());
        }
    });
}

// Skills (expandable)
const skillCards = document.querySelectorAll('.skill-card[data-skill]');

if (skillCards.length) {
    const closeSkill = (card) => {
        const body = card.querySelector('.skill-body');
        const header = card.querySelector('.skill-header');
        card.classList.remove('open');
        if (body) body.style.height = 0;
        if (header) header.setAttribute('aria-expanded', 'false');
    };

    const openSkill = (card) => {
        const body = card.querySelector('.skill-body');
        const header = card.querySelector('.skill-header');
        card.classList.add('open');
        if (body) body.style.height = body.scrollHeight + "px";
        if (header) header.setAttribute('aria-expanded', 'true');
    };

    skillCards.forEach((card, index) => {
        const header = card.querySelector('.skill-header');
        const body = card.querySelector('.skill-body');
        if (!header || !body) return;

        header.addEventListener('click', () => {
            const isOpen = card.classList.contains('open');
            skillCards.forEach(other => {
                if (other !== card) closeSkill(other);
            });

            if (isOpen) {
                closeSkill(card);
            } else {
                openSkill(card);
            }
        });

        if (index === 0) {
            requestAnimationFrame(() => openSkill(card));
        }
    });

    window.addEventListener('resize', () => {
        skillCards.forEach(card => {
            if (card.classList.contains('open')) {
                const body = card.querySelector('.skill-body');
                if (body) body.style.height = body.scrollHeight + "px";
            }
        });
    });
}


// Parallax Effect - Scroll-linked with scrub for smooth scroll-connected animations
const allowParallax = !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches;

// Initialize scroll-linked parallax with GSAP ScrollTrigger
function initScrollParallax() {
    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        // If reduced motion or GSAP missing, ensure parallax elements are visible
        document.querySelectorAll('.parallax, [data-parallax]').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        return;
    }

    // Scroll-linked parallax with scrub: 0.5 for smooth scroll-connected movement
    document.querySelectorAll('.parallax, [data-parallax]').forEach(el => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 0.5;
        const direction = el.getAttribute('data-parallax-direction') || 'vertical';
        
        // Calculate movement based on speed factor
        const yMovement = speed * 100;
        const xMovement = speed * 50;
        
        gsap.fromTo(el, 
            {
                y: direction === 'horizontal' ? 0 : -yMovement,
                x: direction === 'horizontal' ? -xMovement : 0
            },
            {
                y: direction === 'horizontal' ? 0 : yMovement,
                x: direction === 'horizontal' ? xMovement : 0,
                ease: "none",
                scrollTrigger: {
                    trigger: el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.5, // Smooth scroll-linked animation
                    invalidateOnRefresh: true
                }
            }
        );
    });
}

// Mouse-based parallax (complementary to scroll parallax)
if (allowParallax) {
    document.addEventListener("mousemove", parallax);
}

function parallax(e) {
    // Mouse parallax for elements without scroll parallax conflict
    document.querySelectorAll(".parallax-mouse").forEach(function(move){
        var moving_value = move.getAttribute("data-speed") || 1;
        var x = (e.clientX * moving_value) / 250;
        var y = (e.clientY * moving_value) / 250;

        if (typeof gsap !== 'undefined') {
             gsap.to(move, {
                x: x,
                y: y,
                duration: 0.5,
                overwrite: 'auto' 
             });
        } else {
             move.style.transform = "translateX(" + x + "px) translateY(" + y + "px)";
        }
    });
}

// Initialize scroll parallax when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollParallax);
} else {
    initScrollParallax();
}

/* 
    Content Editor & Image Upload Functionality 
*/
let isEditMode = false;
const editButton = document.getElementById('toggle-edit-mode');
const resetButton = document.getElementById('reset-content');
const editableElements = document.querySelectorAll('.editable');
const uploadBtn = document.getElementById('upload-btn');
const imageUploadInput = document.getElementById('image-upload');
const profileImage = document.getElementById('profile-image');

if (editButton) {
    editButton.addEventListener('click', () => {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode-active', isEditMode);
        
        editButton.innerHTML = isEditMode ? '<i class="fas fa-save"></i> Save Changes' : '<i class="fas fa-pen"></i> Edit Mode';
        
        editableElements.forEach(el => {
            el.contentEditable = isEditMode;
            if (isEditMode) {
                el.style.border = "1px dashed #666";
                el.style.minWidth = "20px";
            } else {
                el.style.border = "none";
                el.style.minWidth = "0";
                // Save to local storage
                const key = el.getAttribute('data-key');
                if (key) localStorage.setItem(key, el.innerText);
            }
        });

        if (uploadBtn) {
            uploadBtn.style.display = isEditMode ? 'block' : 'none';
        }
        if (resetButton) {
            resetButton.style.display = isEditMode ? 'block' : 'none';
        }
    });
}

if (resetButton) {
    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure? This will reset all manual edits to the default website content.')) {
            localStorage.clear();
            localStorage.setItem('content-version', CONTENT_VERSION);
            location.reload();
        }
    });
}

// Load saved content
window.addEventListener('load', () => {
    const savedVersion = localStorage.getItem('content-version');
    if (savedVersion !== CONTENT_VERSION) {
        localStorage.clear();
        localStorage.setItem('content-version', CONTENT_VERSION);
        console.log('Local storage cleared due to version mismatch.');
    }

    editableElements.forEach(el => {
        const key = el.getAttribute('data-key');
        if (key) {
            const savedContent = localStorage.getItem(key);
            if (savedContent) {
                el.innerText = savedContent;
            }
        }
    });

    fetchGitHubProfile();
    fetchGitHubRepos();
    hydrateVideos();
    initCarousel();
});

function initCarousel() {
    const track = document.getElementById('projects-carousel');
    if (!track) return;

    const cards = Array.from(track.children);
    if (!cards.length) return;

    if (prefersReducedMotion) {
        return;
    }

    // Clone items to allow seamless looping
    cards.forEach(card => track.appendChild(card.cloneNode(true)));

    // Continuous auto-scroll (never pauses, loops seamlessly)
    let lastTime = null;
    let loopWidth = 0;
    const pixelsPerSecond = 40; // Adjust for desired speed (positive for logic below)
    let isPaused = document.hidden;

    document.addEventListener('visibilitychange', () => {
        isPaused = document.hidden;
        if (!isPaused) {
            lastTime = null;
        }
    });

    const setup = () => {
        loopWidth = track.scrollWidth / 2;
        // Start at the "end" (cloned set) so we can scroll leftwards (items move right)
        // Check if we are near 0 to avoid resetting user interaction if we allowed it
        if (track.scrollLeft < 10) {
            track.scrollLeft = loopWidth;
        }
    };

    // Initial setup with a slight delay to ensure layout is stable
    setTimeout(setup, 100);
    window.addEventListener('resize', () => {
        loopWidth = track.scrollWidth / 2;
    });

    const loop = (timestamp) => {
        if (lastTime === null) lastTime = timestamp;
        const delta = timestamp - lastTime;
        lastTime = timestamp;

        if (isPaused) {
            requestAnimationFrame(loop);
            return;
        }

        // Move continuously from left to right (Items move ->)
        // This corresponds to decreasing scrollLeft
        track.scrollLeft -= (pixelsPerSecond * delta) / 1000;

        // If we reach the start (0), jump back to the middle (loopWidth)
        if (track.scrollLeft <= 0) {
            track.scrollLeft = loopWidth;
        }
        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
}

if (uploadBtn && imageUploadInput) {
    uploadBtn.addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (profileImage) {
                    profileImage.src = e.target.result;
                    localStorage.setItem('profile-image', e.target.result);
                }
            }
            reader.readAsDataURL(file);
        }
    });
}

async function fetchGitHubProfile() {
    try {
        const response = await fetch('https://api.github.com/users/Victordtesla24');
        if (!response.ok) throw new Error('Profile request failed');
        const profile = await response.json();

        const heroName = document.querySelector('[data-key="hero-name"]');
        const logo = document.querySelector('[data-key="logo"]');

        // Only update if we have a valid full name, otherwise keep static default
        if (heroName && !localStorage.getItem('hero-name') && profile.name && profile.name.includes(' ')) {
            heroName.textContent = profile.name;
        }

        if (logo && !localStorage.getItem('logo') && profile.name) {
            const namePart = profile.name.split(' ')[0].replace(/\.$/, '');
            logo.textContent = (namePart || 'VIKRAM').toUpperCase() + '.';
        }
    } catch (err) {
        console.warn('Could not hydrate GitHub profile', err);
    }
}

async function fetchGitHubRepos() {
    const repoContainer = document.getElementById('github-projects');
    if (!repoContainer) return;

    repoContainer.innerHTML = '<p class="repo-description">Syncing live repositories...</p>';

    try {
        const response = await fetch('https://api.github.com/users/Victordtesla24/repos?per_page=10&sort=updated');
        if (!response.ok) throw new Error('Unable to fetch repos');
        const repos = await response.json();

        const curated = repos
            .filter(repo => !repo.fork)
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 4);

        if (!curated.length) {
            repoContainer.innerHTML = '<p class="repo-description">No public repositories available right now.</p>';
            return;
        }

        repoContainer.innerHTML = curated.map(repo => {
            const description = repo.description || 'No description provided yet.';
            return `
                <a class="repo-card" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
                    <h3>${repo.name}</h3>
                    <p class="repo-description">${description}</p>
                    <div class="repo-meta">
                        <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                        <span><i class="fas fa-code"></i> ${repo.language || 'Mixed stack'}</span>
                        <span><i class="fas fa-sync"></i> Updated ${new Date(repo.pushed_at).toLocaleDateString()}</span>
                    </div>
                </a>
            `;
        }).join('');
    } catch (err) {
        repoContainer.innerHTML = '<p class="repo-description">Unable to load live GitHub activity right now. Try again later.</p>';
        console.warn('Could not load repos', err);
    }
}

function hydrateVideos() {
    const list = document.getElementById('video-list');
    if (!list) return;

    const latestVideos = [
        { id: "9meaN-ZZAvc", title: "Part 2: I Coded a 7,000-Year-Old Algorithm (It Actually Works)" },
        { id: "TDOubaCAw7I", title: "Part 1: How 7,000 years old Sanskrit Verses mapped the Cosmos without Computers" },
        { id: "6RT2caAAYfs", title: "प्राचीन अल्गोरिदम (भाग ३): प्राचीन भारताचे हे 'अल्गोरिदम' आज जगासाठी का महत्वाचे आहे? 🌍✨" },
        { id: "c_M_LSB65RA", title: "प्राचीन अल्गोरिदम (भाग २): ७००० वर्ष जुने संस्कृत श्लोक जेव्हा 'पायथन कोड' (Python Code) बनतात! 🐍💻" },
        { id: "_L-jRltlZI4", title: "प्राचीन अल्गोरिदम (भाग १):  ५००० वर्षांपूर्वी टेलिस्कोपशिवाय भारतीय ऋषींनी अवकाश कसे मोजले? 🔭" }
    ];

    list.innerHTML = latestVideos.map(video => `
        <a class="video-item" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">
            <span>${video.title}</span>
            <i class="fas fa-arrow-right"></i>
        </a>
    `).join('');
}

// --- Spotlight / Glow Effect for Cards ---
document.addEventListener('DOMContentLoaded', () => {
    const glowCards = document.querySelectorAll('.meta-card, .skill-card, .project-card, .repo-card, .glass-card');

    if (!prefersReducedMotion && glowCards.length) {
        glowCards.forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Spotlight pos
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                // 3D Tilt
                if (typeof gsap !== 'undefined') {
                    const rotateX = ((y - centerY) / centerY) * -5; // -5 to 5 deg
                    const rotateY = ((x - centerX) / centerX) * 5;  // -5 to 5 deg

                    gsap.to(card, {
                        perspective: 1000,
                        rotateX: rotateX,
                        rotateY: rotateY,
                        scale: 1.02,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                }
            });

            card.addEventListener('mouseleave', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(card, {
                        rotateX: 0,
                        rotateY: 0,
                        scale: 1,
                        duration: 0.6,
                        ease: "elastic.out(1, 0.5)"
                    });
                }
            });
        });
    }

    // --- Magnetic Buttons ---
    const magnets = document.querySelectorAll('.btn-primary, .social-btn, .btn-secondary, .nav-link');
    if (magnets.length && typeof gsap !== 'undefined' && !prefersReducedMotion) {
        magnets.forEach(magnet => {
            magnet.addEventListener('mousemove', function(e) {
                const rect = magnet.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                // Move button towards mouse
                gsap.to(magnet, {
                    x: x * 0.5,
                    y: y * 0.5,
                    rotate: x * 0.05,
                    duration: 0.4,
                    ease: "power3.out"
                });
            });

            magnet.addEventListener('mouseleave', function() {
                gsap.to(magnet, {
                    x: 0,
                    y: 0,
                    rotate: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.3)"
                });
            });
        });
    }
});

// --- Live Telemetry ---
function buildSparkline(values, width = 160, height = 40) {
    if (!values.length) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const spread = Math.max(1, max - min);
    const step = width / Math.max(1, values.length - 1);
    return values.map((val, idx) => {
        const x = idx * step;
        const y = height - ((val - min) / spread) * (height - 8) - 4;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}

function initTelemetryPanel() {
    const badge = document.querySelector('[data-latency]');
    const value = document.querySelector('[data-latency-number]');
    const spark = document.querySelector('[data-latency-spark]');
    const load = document.querySelector('[data-load]');
    const loadMeter = document.querySelector('[data-load-meter]');
    const coffee = document.querySelector('[data-coffee]');
    const locations = document.getElementById('telemetry-locations');
    if (!badge || !value || !spark || !load || !loadMeter || !coffee || !locations) return;

    const latencyHistory = Array.from({ length: 14 }, () => 150 + Math.random() * 70);
    let coffeeCount = 1.0;
    let telemetryPaused = document.hidden;

    document.addEventListener('visibilitychange', () => {
        telemetryPaused = document.hidden;
    });

    const cityPool = [
        'Melbourne · Edge POP',
        'Sydney · API Gateway',
        'Singapore · Vector cache',
        'Mumbai · Observability',
        'Frankfurt · LLM mirror',
        'Dallas · CDN',
        'Tokyo · Realtime ingest',
        'London · Control plane'
    ];

    const rotateCities = () => {
        if (telemetryPaused) return;
        const shuffled = [...cityPool].sort(() => 0.5 - Math.random()).slice(0, 3);
        locations.innerHTML = shuffled.map(city => `<li>${city}</li>`).join('');
    };

    const tick = () => {
        if (telemetryPaused) return;
        const nextLatency = Math.max(120, Math.round(165 + (Math.random() * 80 - 40)));
        latencyHistory.push(nextLatency);
        if (latencyHistory.length > 22) latencyHistory.shift();
        badge.textContent = `${nextLatency} ms`;
        value.textContent = `${(nextLatency / 1000).toFixed(3)} s`;
        spark.setAttribute('d', buildSparkline(latencyHistory));

        const nextLoad = Math.max(18, Math.min(92, Math.round(30 + Math.random() * 60)));
        load.textContent = `${nextLoad}%`;
        loadMeter.style.width = `${nextLoad}%`;

        coffeeCount = Math.min(4.5, Math.round((coffeeCount + Math.random() * 0.35) * 10) / 10);
        coffee.textContent = `${coffeeCount.toFixed(1)} cups`;
    };

    rotateCities();
    tick();
    if (prefersReducedMotion) return;

    setInterval(tick, 3200);
    setInterval(rotateCities, 4200);
}

// --- Architecture Diagram ---
function initArchitectureLab() {
    const buttons = document.querySelectorAll('.arch-btn');
    const lines = document.querySelectorAll('.arch-svg [data-line]');
    const nodes = document.querySelectorAll('.arch-svg [data-node]');
    const explainer = document.getElementById('arch-explainer');
    const svgRoot = document.querySelector('.arch-svg');
    const metricCards = document.querySelectorAll('.arch-metric');
    const explainerTitle = explainer?.querySelector('[data-arch-headline]');
    const explainerBody = explainer?.querySelector('[data-arch-description]');
    const explainerBadge = explainer?.querySelector('[data-arch-badge]');
    const explainerNote = explainer?.querySelector('[data-arch-note]');
    const archWrapper = document.querySelector('.arch-wrapper');
    const archLegend = document.querySelector('.arch-legend');
    const legendTitle = archLegend?.querySelector('.arch-legend-title');
    const legendSubtitle = archLegend?.querySelector('.arch-legend-subtitle');
    const legendItems = archLegend ? archLegend.querySelectorAll('[data-legend-node]') : [];
    const nodeChips = document.querySelectorAll('[data-arch-chip]');
    if (!buttons.length || !lines.length || !nodes.length || !explainer || typeof gsap === 'undefined') return;

    const flows = {
        chat: {
            lines: ['edge-api', 'api-vector', 'vector-llm', 'llm-api'],
            nodes: ['edge', 'api', 'vector', 'llm'],
            headline: 'LLM Chat Path',
            badge: 'Live LLM chat',
            note: 'Edge → API → Vector → Gemini → Telemetry → Governance',
            accent: '#ff7350',
            copy: 'LLM chat: Edge client hits API gateway, enriches with vector search, Gemini responds, and the experience returns to the user in milliseconds.',
            metrics: {
                latency: '160 ms P95',
                throughput: '12k req/s',
                vectorHits: '3 shards'
            }
        },
        telemetry: {
            lines: ['edge-api', 'api-telemetry', 'telemetry-governance'],
            nodes: ['edge', 'api', 'telemetry', 'governance'],
            headline: 'Telemetry Stream',
            badge: 'Telemetry stream',
            note: 'Edge → API → Telemetry → Governance loop',
            accent: '#00f2fe',
            copy: 'Telemetry stream: Dev kits emit thousands of metrics, API forwards them to the telemetry bus, and governance monitors for drift.',
            metrics: {
                latency: '210 ms P95',
                throughput: '22k events/s',
                vectorHits: 'Observability lens'
            }
        },
        governance: {
            lines: ['edge-api', 'api-vector', 'vector-llm', 'llm-api', 'api-telemetry', 'telemetry-governance', 'governance-edge'],
            nodes: ['edge', 'api', 'vector', 'llm', 'telemetry', 'governance'],
            headline: 'Governance & Quality',
            badge: 'Governance watch',
            note: 'Edge → API → Vector → Gemini → Telemetry → Governance → Edge',
            accent: '#c65cff',
            copy: 'Governance loop: LLM responses mix vector evidence and telemetry traces, then risk flags are returned to the edge.',
            metrics: {
                latency: '320 ms P95',
                throughput: '6.5k decisions/hr',
                vectorHits: '4 shards'
            }
        }
    };

    const packetMap = new Map();

    const stopPacket = (lineId) => {
        const packet = packetMap.get(lineId);
        if (!packet) return;
        cancelAnimationFrame(packet.raf);
        packet.dot.remove();
        packetMap.delete(lineId);
    };

    const startPacket = (line) => {
        if (!line || packetMap.has(line.dataset.line)) return;
        if (!svgRoot) return;
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '2');
        dot.classList.add('flow-dot', 'active');
        svgRoot.appendChild(dot);

        // Support for PATH (curves) and LINE (straight)
        const isPath = line.tagName.toLowerCase() === 'path';
        let length = 0;
        let x1, y1, x2, y2;

        if (isPath) {
            length = line.getTotalLength();
        } else {
            x1 = parseFloat(line.getAttribute('x1'));
            y1 = parseFloat(line.getAttribute('y1'));
            x2 = parseFloat(line.getAttribute('x2'));
            y2 = parseFloat(line.getAttribute('y2'));
        }

        const duration = 1400 + Math.random() * 700;

        const entry = { dot, raf: null, start: null };
        const animate = (ts) => {
            if (entry.start === null) entry.start = ts;
            const progress = ((ts - entry.start) % duration) / duration;
            
            // Simple ease
            const eased = 0.5 - Math.cos(progress * Math.PI * 2) / 2; 
            
            if (isPath) {
                const point = line.getPointAtLength(progress * length); // Linear along path looks better for data flow
                dot.setAttribute('cx', point.x.toFixed(2));
                dot.setAttribute('cy', point.y.toFixed(2));
            } else {
                const cx = x1 + (x2 - x1) * eased;
                const cy = y1 + (y2 - y1) * eased;
                dot.setAttribute('cx', cx.toFixed(2));
                dot.setAttribute('cy', cy.toFixed(2));
            }
            entry.raf = requestAnimationFrame(animate);
        };
        entry.raf = requestAnimationFrame(animate);
        packetMap.set(line.dataset.line, entry);
    };

    const refreshPackets = (activeLines) => {
        packetMap.forEach((_, id) => {
            if (!activeLines.includes(id)) stopPacket(id);
        });
        activeLines.forEach(lineId => {
            const line = svgRoot?.querySelector(`[data-line="${lineId}"]`);
            startPacket(line);
        });
    };

    const updateMetrics = (metrics = {}) => {
        metricCards.forEach((card) => {
            const key = card.dataset.key;
            if (!key) return;
            const valueEl = card.querySelector('[data-metric-value]');
            if (!valueEl) return;
            const nextValue = metrics[key];
            if (nextValue) {
                valueEl.textContent = nextValue;
            }
        });
    };

    const setFlow = (key) => {
        const flow = flows[key];
        if (!flow) return;

        if (archWrapper) {
            archWrapper.dataset.flow = key;
            archWrapper.style.setProperty('--arch-accent', flow.accent || '#ff7350');
        }

        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.flow === key));

        gsap.to(lines, {
            stroke: (i, el) => flow.lines.includes(el.dataset.line) ? flow.accent : 'rgba(255, 255, 255, 0.1)',
            strokeWidth: (i, el) => flow.lines.includes(el.dataset.line) ? 1.5 : 0.5,
            duration: 0.5,
            stagger: 0.05
        });

        nodeChips.forEach(chip => {
            const nodeName = chip.dataset.archChip;
            const isActive = flow.nodes.includes(nodeName);
            gsap.to(chip, {
                scale: isActive ? 1.1 : 1,
                boxShadow: isActive ? `0 0 15px ${flow.accent}`: 'none',
                duration: 0.3,
                ease: 'power2.out'
            });
            chip.classList.toggle('active', isActive);
        });
        
        if (explainerTitle) explainerTitle.textContent = flow.headline || 'Architecture path';
        if (explainerBody) {
            gsap.fromTo(explainerBody, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
            explainerBody.textContent = flow.copy;
        }
        if (explainerBadge) {
            explainerBadge.textContent = flow.badge || 'Live feed';
            if (flow.accent) {
                explainerBadge.style.setProperty('background-color', flow.accent);
                explainerBadge.style.setProperty('box-shadow', `0 8px 20px ${flow.accent}40`);
            }
        }
        if (explainerNote) explainerNote.textContent = flow.note || '';
        
        if (legendTitle) legendTitle.textContent = `Path components · ${flow.headline}`;
        if (legendSubtitle) legendSubtitle.textContent = flow.badge || 'Live feed';
        
        legendItems.forEach(item => {
            const nodeName = item.dataset.legendNode;
            const isActive = flow.nodes.includes(nodeName);
            gsap.to(item, {
                scale: isActive ? 1.05 : 1,
                opacity: isActive ? 1 : 0.5,
                duration: 0.3,
            });
            item.classList.toggle('active', isActive);
        });

        updateMetrics(flow.metrics);
        refreshPackets(flow.lines);
    };

    // Event Delegation for Architecture Chips (handles React re-renders)
    const wrapper = document.querySelector('.arch-wrapper');
    const tooltip = document.getElementById('arch-tooltip');

    if (wrapper) {
        wrapper.addEventListener('click', (e) => {
            const chip = e.target.closest('.arch-node-chip');
            if (chip) {
                const nodeKey = chip.getAttribute('data-arch-chip');
                for (const [flowKey, flowData] of Object.entries(flows)) {
                    if (flowData.nodes.includes(nodeKey)) {
                        setFlow(flowKey);
                        break;
                    }
                }
            }
        });
        // Ensure cursor pointers on chips if CSS misses it
        const chips = wrapper.querySelectorAll('.arch-node-chip');
        chips.forEach(c => {
            c.style.cursor = 'pointer';
            c.addEventListener('mouseenter', (e) => {
                gsap.to(c, {scale: 1.05, duration: 0.2});
                if (tooltip) {
                    const title = c.querySelector('.chip-title')?.textContent || '';
                    const desc = c.querySelector('.chip-desc')?.textContent || '';
                    tooltip.innerHTML = `<strong>${title}</strong><br/><span style="font-size:0.8em; color:#ccc">${desc}</span>`;
                    tooltip.style.opacity = '1';
                }
            });
            c.addEventListener('mousemove', (e) => {
                if (tooltip) {
                    const rect = wrapper.getBoundingClientRect();
                    tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                    tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
                }
            });
            c.addEventListener('mouseleave', () => {
                gsap.to(c, {scale: 1, duration: 0.2});
                if (tooltip) tooltip.style.opacity = '0';
            });
        });
    }

    buttons.forEach(btn => btn.addEventListener('click', () => setFlow(btn.dataset.flow)));
    setFlow('chat');
}

// --- Project Hover Previews ---
function buildPreviewVisual(type) {
    if (type === 'terminal') {
        return `
            <div class="preview-lines">
                <span>> deploying service...</span>
                <span class="glow">checks: P95 &lt;200ms</span>
                <span>> vector hits: 3 shards</span>
                <span>> tests: 28/28 green</span>
            </div>`;
    }
    if (type === 'chart') {
        return `
            <div class="preview-bars">
                <span style="height:65%"></span>
                <span style="height:40%"></span>
                <span style="height:78%"></span>
                <span style="height:52%"></span>
                <span style="height:88%"></span>
            </div>`;
    }
    if (type === 'doc') {
        return `
            <div class="preview-doc">
                <div class="line long"></div>
                <div class="line"></div>
                <div class="line long"></div>
                <div class="line short"></div>
            </div>`;
    }
    if (type === 'wave') {
        return `
            <div class="preview-wave">
                <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>`;
    }
    return `
        <div class="preview-ui">
            <div class="block wide"></div>
            <div class="block"></div>
            <div class="block wide"></div>
            <div class="block"></div>
        </div>`;
}

function initProjectPreviews() {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;

    const fallbackVariants = ['terminal', 'ui', 'chart', 'ui', 'terminal', 'wave', 'doc', 'terminal'];

    cards.forEach((card, idx) => {
        const variant = card.dataset.preview || fallbackVariants[idx % fallbackVariants.length];
        const label = card.dataset.previewLabel || 'Live preview';
        const image = card.querySelector('.project-image');
        if (!image) return;

        const preview = document.createElement('div');
        preview.className = `project-preview ${variant}`;
        preview.setAttribute('aria-hidden', 'true');
        preview.innerHTML = `
            <div class="preview-visual">${buildPreviewVisual(variant)}</div>
            <div class="preview-meta">${label} · auto-play</div>
        `;
        image.appendChild(preview);
    });
}

// --- Konami / Terminal ---
function initTerminalOverlay() {
    const overlay = document.getElementById('terminal-overlay');
    const log = document.getElementById('terminal-log');
    const input = document.getElementById('terminal-input');
    const form = document.getElementById('terminal-form');
    const closeBtn = document.getElementById('terminal-close');
    if (!overlay || !log || !input || !form) return;

    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a','Enter'];
    let konamiBuffer = [];
    let typeBuffer = '';

    const printLine = (text) => {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = text;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
    };

    const openTerminal = () => {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        input.focus();
    };

    const closeTerminal = () => {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    };

    const handleCommand = (cmd) => {
        if (cmd === 'help') {
            printLine('Commands: help, stack, telemetry, sudo hire vic, clear, close');
            return;
        }
        if (cmd === 'stack') {
            printLine('Stack: Python, TypeScript/React/Next.js, Node/Express, GCP/AWS/Azure, Kubernetes, Terraform, LangChain/Langfuse, Supabase.');
            return;
        }
        if (cmd === 'telemetry') {
            const latency = document.querySelector('[data-latency]')?.textContent || 'n/a';
            const load = document.querySelector('[data-load]')?.textContent || 'n/a';
            const coffee = document.querySelector('[data-coffee]')?.textContent || 'n/a';
            printLine(`Telemetry => latency: ${latency}, load: ${load}, coffee: ${coffee}`);
            return;
        }
        if (cmd === 'sudo hire vic') {
            printLine('Granting sudo... ✅ Let’s talk about leading AI delivery with measurable outcomes.');
            return;
        }
        if (cmd === 'clear') {
            log.innerHTML = '';
            return;
        }
        if (cmd === 'close' || cmd === 'exit') {
            closeTerminal();
            return;
        }
        printLine(`Command not found: ${cmd}`);
    };

    window.addEventListener('keydown', (e) => {
        if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
        konamiBuffer.push(e.key);
        konamiBuffer = konamiBuffer.slice(-konami.length);
        if (konamiBuffer.join(',') === konami.join(',')) {
            openTerminal();
        }
        if (/^[a-z ]$/i.test(e.key)) {
            typeBuffer = (typeBuffer + e.key.toLowerCase()).slice(-30);
            if (typeBuffer.endsWith('help') || typeBuffer.endsWith('sudo hire vic')) {
                openTerminal();
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmd = input.value.trim().toLowerCase();
        if (!cmd) return;
        printLine(`$ ${cmd}`);
        input.value = '';
        handleCommand(cmd);
    });

    closeBtn?.addEventListener('click', closeTerminal);
}

// Init all interactive elements safely
function initAllFeatures() {
    // --- Avatar Hover Video ---
    const avatarContainer = document.getElementById('avatar-container');
    const video = document.getElementById('profile-image');
    const staticImg = document.getElementById('avatar-static');

    if (avatarContainer && video && staticImg) {
        // Remove existing listeners to prevent duplicates if re-run
        const newContainer = avatarContainer.cloneNode(true);
        if (avatarContainer.parentNode) {
            avatarContainer.parentNode.replaceChild(newContainer, avatarContainer);
        }
        
        // Re-select after replace
        const freshContainer = document.getElementById('avatar-container');
        const freshVideo = document.getElementById('profile-image'); // IDs are unique
        const freshStatic = document.getElementById('avatar-static');

        if (freshContainer && freshVideo && freshStatic) {
             freshContainer.addEventListener('mouseenter', () => {
                freshVideo.play().then(() => {
                    freshStatic.style.opacity = '0';
                }).catch(e => console.warn('Video play interrupted', e));
            });

            freshContainer.addEventListener('mouseleave', () => {
                freshStatic.style.opacity = '1';
                setTimeout(() => {
                    freshVideo.pause();
                    freshVideo.currentTime = 0;
                }, 500);
            });
        }
    }

    initTelemetryPanel();
    initArchitectureLab();
    initProjectPreviews();
    initTerminalOverlay();
    
    // Safety fallback
    setTimeout(() => {
        const preloader = document.querySelector(".preloader");
        if (preloader && getComputedStyle(preloader).display !== 'none') {
            preloader.style.display = "none";
            preloader.style.pointerEvents = "none";
            document.body.style.overflow = "auto";
        }
    }, 4000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllFeatures);
} else {
    initAllFeatures();
}
