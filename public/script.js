// Initialize Lenis for smooth scrolling (skip if reduced motion)
const CONTENT_VERSION = '2025-11-25-v1';
const enableSmooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;

if (enableSmooth) {
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

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
}

// Custom Cursor
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

// Ensure cursor elements exist before adding listeners
if (cursorDot && cursorOutline) {
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
}

// Preloader Animation
function startLoader() {
    let counterElement = document.querySelector(".counter");
    if (!counterElement) return;

    let currentValue = 0;

    function updateCounter() {
        if(currentValue === 100) {
            return;
        }

        currentValue += Math.floor(Math.random() * 10) + 1;
        if(currentValue > 100) {
            currentValue = 100;
        }

        counterElement.textContent = currentValue;

        let delay = Math.floor(Math.random() * 200) + 50;
        setTimeout(updateCounter, delay);
    }
    
    updateCounter();
}

startLoader();

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

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

function runIntroSequence() {
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
    });

    tl.set(".preloader", {
        display: "none",
        pointerEvents: "none"
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
    }, 800);

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

// Run immediately if the page is already loaded (Next.js loads scripts after onload)
if (document.readyState === "complete") {
    runIntroSequence();
} else {
    window.addEventListener("load", runIntroSequence);
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

sections.forEach(section => {
    // Select elements to animate within the section
    const targets = section.querySelectorAll(".section-title, .about-text, .accordion-item, .contact-title, .contact-details, .social-links-large, .snap-card, .skill-card");
    
    if (targets.length > 0) {
        gsap.fromTo(targets, {
            y: 50,
            opacity: 0
        }, {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
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
        
        // Close other items (Optional: mimic simple behavior where multiple can be open or single)
        // For this design, let's keep multiple open possible, or close others for cleaner look.
        // Let's go with toggle behavior.
        
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


// Parallax Effect
document.addEventListener("mousemove", parallax);
function parallax(e) {
    document.querySelectorAll(".parallax").forEach(function(move){
        var moving_value = move.getAttribute("data-speed");
        var x = (e.clientX * moving_value) / 250;
        var y = (e.clientY * moving_value) / 250;

        move.style.transform = "translateX(" + x + "px) translateY(" + y + "px)";
    });
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

    // Clone items to allow seamless looping
    cards.forEach(card => track.appendChild(card.cloneNode(true)));

    // Continuous auto-scroll (never pauses, loops seamlessly)
    let lastTime = null;
    let loopWidth = 0;
    const pixelsPerSecond = 40; // Adjust for desired speed (positive for logic below)

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
            logo.textContent = (profile.name.split(' ')[0] || 'VIKRAM').toUpperCase() + '.';
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

    if (glowCards.length) {
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
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: "elastic.out(1, 0.5)"
                });
            });
        });
    }

    // --- Magnetic Buttons ---
    const magnets = document.querySelectorAll('.btn-primary, .social-btn, .btn-secondary, .nav-link');
    if (magnets.length) {
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
        const shuffled = [...cityPool].sort(() => 0.5 - Math.random()).slice(0, 3);
        locations.innerHTML = shuffled.map(city => `<li>${city}</li>`).join('');
    };

    const tick = () => {
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
    setInterval(tick, 3200);
    setInterval(rotateCities, 4200);
}

// --- Architecture Diagram ---
function initArchitectureLab() {
    const buttons = document.querySelectorAll('.arch-btn');
    const lines = document.querySelectorAll('.arch-svg [data-line]');
    const nodes = document.querySelectorAll('.arch-svg [data-node]');
    const explainer = document.getElementById('arch-explainer');
    if (!buttons.length || !lines.length || !nodes.length || !explainer) return;

    const flows = {
        chat: {
            lines: ['edge-api', 'api-vector', 'vector-llm', 'llm-api'],
            nodes: ['edge', 'api', 'vector', 'llm'],
            copy: 'LLM chat: Edge client hits API gateway, enriches with vector search, Gemini responds, and results return to client.'
        },
        telemetry: {
            lines: ['edge-api', 'api-telemetry', 'telemetry-governance'],
            nodes: ['edge', 'api', 'telemetry', 'governance'],
            copy: 'Telemetry stream: devices send metrics, API ships them to the telemetry bus, and governance runs anomaly checks.'
        },
        governance: {
            lines: ['edge-api', 'api-vector', 'vector-llm', 'llm-api', 'api-telemetry', 'telemetry-governance', 'governance-edge'],
            nodes: ['edge', 'api', 'vector', 'llm', 'telemetry', 'governance'],
            copy: 'Governance loop: combines LLM responses, vector evidence, telemetry traces, and pushes decisions back to the edge with risk flags.'
        }
    };

    const setFlow = (key) => {
        const flow = flows[key];
        if (!flow) return;
        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.flow === key));
        lines.forEach(line => line.classList.toggle('active', flow.lines.includes(line.dataset.line)));
        nodes.forEach(node => node.classList.toggle('active', flow.nodes.includes(node.dataset.node)));
        explainer.textContent = flow.copy;
    };

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

// --- Mini-Vic Chatbot (Enhanced Client-Side RAG) ---
function initMiniVicWidget() {
    const root = document.getElementById('mini-vic');
    const windowEl = root?.querySelector('.mini-vic-window');
    const toggle = root?.querySelector('[data-mini-toggle]');
    const closeBtn = root?.querySelector('[data-mini-close]');
    const muteBtn = root?.querySelector('[data-mini-mute]');
    const messages = document.getElementById('mini-vic-messages');
    const form = document.getElementById('mini-vic-form');
    const input = document.getElementById('mini-vic-input');
    const quickButtons = root?.querySelectorAll('[data-mini-prompt]');
    const audio = document.getElementById('mini-vic-audio');
    const speakingDot = root?.querySelector('[data-speaking-dot]');
    const speakingHalo = root?.querySelector('[data-speaking]');
    const videoAvatar = root?.querySelector('.mini-vic-avatar video');
    if (!root || !windowEl || !messages || !form || !input) return;

    let isOpen = false;
    let isMuted = false;
    let isSending = false;

    // 1. Knowledge Base (Extracted from CV content)
    const knowledgeBase = [
        {
            keywords: ['telemetry', 'websocket', 'realtime', 'latency', 'p95', 'anz'],
            text: "I implemented real-time WebSocket telemetry services for ANZ, handling 10k+ concurrent devices. We achieved P95 latency under 200ms, which was a huge win for customer experience."
        },
        {
            keywords: ['leadership', 'team', 'squads', 'manage', 'size', 'resources', 'lead'],
            text: "I lead 5+ cross-functional squads with up to 40 resources, including offshore teams. My style is servant leadership—clear guardrails, steady cadence, and removing blockers so the team can ship."
        },
        {
            keywords: ['stack', 'tech', 'technologies', 'language', 'framework', 'tools', 'python', 'react'],
            text: "My core stack is Python, TypeScript/React/Next.js, and Node.js/Express. For infra, I use Kubernetes, Docker, and Terraform across GCP, AWS, and Azure. Recently, I've been deep into LangChain and Langfuse for AI pipelines."
        },
        {
            keywords: ['ai', 'ml', 'genai', 'llm', 'rag', 'model', 'artificial'],
            text: "I specialize in bridging engineering with AI strategy. I've built RAG pipelines using Gemini and OpenAI, and I focus heavily on evaluation (using Phoenix/Langfuse) to reduce error rates in production."
        },
        {
            keywords: ['budget', 'cost', 'finance', 'money', 'portfolio'],
            text: "I've managed $5M+ program portfolios, ensuring we land on budget. I also drove cloud modernization that cut infrastructure costs by over 15%."
        },
        {
            keywords: ['certification', 'cert', 'scrum', 'agile', 'csm'],
            text: "I'm a Certified Scrum Master (CSM) and have extensive experience with SAFe and Agile delivery. I believe governance should enable speed, not slow it down."
        },
        {
            keywords: ['contact', 'email', 'phone', 'reach', 'hire'],
            text: "You can reach me at melbvicduque@gmail.com or 0433 224 556. I'm based in Melbourne."
        },
        {
            keywords: ['education', 'degree', 'university', 'study'],
            text: "I hold a Master of Computer Science (Honors) from Monash University and a Bachelor of Engineering from the University of Melbourne."
        },
        {
            keywords: ['philosophy', 'whimsy', 'life'],
            text: "I love diving deep into topics that spark genuine whimsy. My philosophy is simple: do what brings happiness and value, without causing harm."
        }
    ];

    // 2. Simple Matcher
    const findBestMatch = (query) => {
        const tokens = query.toLowerCase().match(/\b\w+\b/g) || [];
        let bestScore = 0;
        let bestAnswer = null;

        knowledgeBase.forEach(entry => {
            let score = 0;
            entry.keywords.forEach(kw => {
                if (tokens.includes(kw)) score += 3; // Exact keyword match
                tokens.forEach(t => {
                    if (kw.includes(t) && t.length > 3) score += 1; // Partial match
                });
            });
            if (score > bestScore) {
                bestScore = score;
                bestAnswer = entry.text;
            }
        });

        return bestScore > 0 ? bestAnswer : null;
    };

    const addMessage = (role, text) => {
        const bubble = document.createElement('div');
        bubble.className = `mini-vic-message ${role}`;
        bubble.innerHTML = text; // Allow HTML for formatting
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
        return bubble;
    };

    const setSpeaking = (state) => {
        if (state) {
            speakingDot?.classList.add('active');
            speakingHalo?.classList.add('active');
            videoAvatar?.classList.add('speaking');
            if (videoAvatar) {
                videoAvatar.currentTime = 0;
                videoAvatar.play().catch(e => console.log('Video autoplay blocked', e));
            }
        } else {
            speakingDot?.classList.remove('active');
            speakingHalo?.classList.remove('active');
            videoAvatar?.classList.remove('speaking');
            if (videoAvatar) videoAvatar.pause();
        }
    };

    const openWidget = () => {
        isOpen = true;
        root.classList.add('open');
        windowEl.classList.add('open');
        input.focus();
    };

    const closeWidget = () => {
        isOpen = false;
        root.classList.remove('open');
        windowEl.classList.remove('open');
    };

    const sendMessage = async (text, mode = 'normal') => {
        const trimmed = (text || '').trim();
        if (!trimmed || isSending) return;
        isSending = true;
        addMessage('user', trimmed);
        input.value = '';
        
        // Simulate thinking
        const typingId = 'typing-' + Date.now();
        const typingBubble = addMessage('bot', `<span id="${typingId}">...</span>`);
        setSpeaking(true);

        // Delay for realism
        await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

        let answer = findBestMatch(trimmed);
        if (!answer) {
            // Default fallback
            const fallbacks = [
                "That's an interesting question. While my CV RAG index is still learning that specific detail, I can tell you about my <b>cloud architecture</b>, <b>leadership style</b>, or <b>tech stack</b>. What would you like to know?",
                "I'm tuned to answer questions about my professional experience. Ask me about <b>telemetry</b>, <b>AI pipelines</b>, or <b>agile delivery</b>!",
                "I don't have that exact info in my index yet. But I can discuss how I reduced delivery times by 30% or my work with <b>LLMs</b>."
            ];
            answer = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        // Apply "Mode" flavor
        if (mode === 'scifi') {
            answer = "⚙️ <i>Processing...</i> " + answer.replace('I ', 'Unit Vic ').replace('my ', 'local ').replace('team', 'crew').replace('leadership', 'command protocols');
        }

        const typingEl = document.getElementById(typingId);
        if (typingEl && typingEl.parentElement) {
            typingEl.parentElement.innerHTML = answer;
        }
        
        setSpeaking(false);
        isSending = false;
    };

    toggle?.addEventListener('click', () => isOpen ? closeWidget() : openWidget());
    closeBtn?.addEventListener('click', closeWidget);
    muteBtn?.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(input.value);
    });

    quickButtons?.forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-mini-prompt') || '';
            const mode = btn.getAttribute('data-mode') || 'normal';
            sendMessage(prompt, mode);
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
            openWidget();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTelemetryPanel();
    initArchitectureLab();
    initProjectPreviews();
    initTerminalOverlay();
    initMiniVicWidget();
});
