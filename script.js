// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
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

    tl.to(".preloader", {
        duration: 0.8,
        height: 0,
        ease: "power4.inOut",
    });

    // Hero Text Reveal
    tl.from(".reveal-text", {
        y: 120,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.1
    }, "-=0.3");

    tl.to(".hero-subtitle", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.8");

    tl.to(".hero-links", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.8");
});

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
    const targets = section.querySelectorAll(".section-title, .about-text, .accordion-item, .project-card, .contact-title, .contact-details, .social-links-large");
    
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
    });
}

// Load saved content
window.addEventListener('load', () => {
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
