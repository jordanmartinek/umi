/* ============================================
   UMI UMI — Interactive Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initPetals();
    initScrollReveal();
    initNavbarScroll();
    initSmoothScroll();
});

/* ============================================
   Floating Petals
   ============================================ */

function initPetals() {
    const container = document.getElementById('petals');
    const petalSymbols = ['🌸', '✿', '❀', '🌺', '💮', '⚘'];
    const maxPetals = 12;

    function createPetal() {
        if (container.children.length >= maxPetals) return;

        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.textContent = petalSymbols[Math.floor(Math.random() * petalSymbols.length)];

        const startX = Math.random() * 100;
        const duration = 10 + Math.random() * 15;
        const delay = Math.random() * 5;
        const size = 10 + Math.random() * 14;

        petal.style.left = `${startX}%`;
        petal.style.animationDuration = `${duration}s`;
        petal.style.animationDelay = `${delay}s`;
        petal.style.fontSize = `${size}px`;
        petal.style.opacity = 0.2 + Math.random() * 0.3;

        container.appendChild(petal);

        // Remove petal after animation completes
        setTimeout(() => {
            if (petal.parentNode) {
                petal.parentNode.removeChild(petal);
            }
        }, (duration + delay) * 1000);
    }

    // Create initial petals
    for (let i = 0; i < 6; i++) {
        setTimeout(createPetal, i * 800);
    }

    // Continuously add petals
    setInterval(createPetal, 3000);
}

/* ============================================
   Scroll Reveal Animation
   ============================================ */

function initScrollReveal() {
    // Add reveal class to elements
    const revealSelectors = [
        '.collection-card',
        '.product-card',
        '.testimonial-card',
        '.about-image',
        '.about-content',
        '.section-header',
        '.newsletter-content'
    ];

    revealSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${index * 0.1}s`;
        });
    });

    // Intersection Observer for reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

/* ============================================
   Navbar Scroll Effect
   ============================================ */

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

/* ============================================
   Smooth Scrolling for Anchor Links
   ============================================ */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80; // navbar height
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: top,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ============================================
   Mobile Navigation Toggle
   ============================================ */

const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });
}
