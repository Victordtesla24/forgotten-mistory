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

window.addEventListener("load", () => {
    const tl = gsap.timeline();

    // Preloader Exit
    tl.to(".counter", {
        duration: 0.25,
        delay: 3.0,
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

    // Fully remove preloader from flow to prevent lingering text
    tl.set(".preloader", {
        display: "none",
        pointerEvents: "none"
    });

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

    // --- Trigger Scramble on Hero Name ---
    // Delay slightly to sync with preloader exit
    setTimeout(() => {
        const heroNameEl = document.querySelector('.reveal-text');
        if (heroNameEl) {
            // Ensure opacity is 1 so we can see the effect
            gsap.set(heroNameEl, { opacity: 1, y: 0 });
            
            const scrambler = new TextScramble(heroNameEl);
            // If there's a saved name in local storage, use it, otherwise default
            const finalName = heroNameEl.innerText; 
            
            // Start with something cryptic or just scramble the final name
            scrambler.setText(finalName);
        }
    }, 800); // wait for preloader curtain to go up

    tl.to(".hero-subtitle", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.5 // slight delay after name starts scrambling
    }, "-=0.5");

    tl.to(".hero-links", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.8");

    // --- Telemetry Widget Activation ---
    setTimeout(() => {
        const widget = document.getElementById('telemetry-widget');
        if(widget) {
            widget.style.opacity = 1;
            initTelemetryLogs();
        }
    }, 2500);
});

// --- Telemetry Logic ---
function initTelemetryLogs() {
    const logContainer = document.getElementById('telemetry-log');
    if(!logContainer) return;

    const messages = [
        "Initializing neural interface...",
        "Loading asset: 4200_particles.obj",
        "Connecting to GitHub API...",
        "Fetching user: Victordtesla24",
        "Analysis: 15+ years program leadership",
        "Optimizing delivery pipelines...",
        "Telemetry socket: CONNECTED",
        "Latency check: 12ms",
        "Rendering 3D context...",
        "System status: NOMINAL"
    ];

    let index = 0;

    function addLog(msg) {
        const div = document.createElement('div');
        div.className = 'log-line';
        div.innerText = `> ${msg}`;
        logContainer.appendChild(div);

        // Keep only last 4 logs
        if(logContainer.children.length > 4) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    // Initial burst
    const burst = setInterval(() => {
        addLog(messages[index]);
        index++;
        if(index >= messages.length) {
            clearInterval(burst);
            startRandomLogs();
        }
    }, 300);

    function startRandomLogs() {
        const randomLogs = [
            "Monitoring cluster health...",
            "Garbage collection: 24ms",
            "Syncing repo data...",
            "Updating layout engine...",
            "User interaction detected",
            "Evaluating constraints...",
            "Packet loss: 0.0%",
            "Buffer flush complete"
        ];

        setInterval(() => {
            const msg = randomLogs[Math.floor(Math.random() * randomLogs.length)];
            addLog(msg);
        }, 4000); // New log every 4s
    }
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
    const targets = section.querySelectorAll(".section-title, .about-text, .accordion-item, .project-card, .contact-title, .contact-details, .social-links-large, .snap-card");
    
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

    const savedImage = localStorage.getItem('profile-image');
    if (savedImage && profileImage) {
        profileImage.src = savedImage;
    }

    fetchGitHubProfile();
    fetchGitHubRepos();
    hydrateVideos();
});

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

        if (profileImage && !localStorage.getItem('profile-image')) {
            profileImage.src = profile.avatar_url;
        }

        const heroName = document.querySelector('[data-key="hero-name"]');
        const logo = document.querySelector('[data-key="logo"]');

        if (heroName && !localStorage.getItem('hero-name')) {
            heroName.textContent = profile.name || 'Vikram Deshpande';
        }

        if (logo && !localStorage.getItem('logo')) {
            logo.textContent = (profile.name || 'VIKRAM') + '.';
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
