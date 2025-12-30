/**
 * Lightweight Parallax Scrolling Effect
 * Pure Vanilla JavaScript - No Dependencies
 */

class ParallaxController {
    constructor() {
        this.scrollY = window.scrollY;
        this.ticking = false;
        this.parallaxElements = [];
        
        this.init();
    }
    
    init() {
        // Find all elements with data-parallax attribute
        this.parallaxElements = Array.from(document.querySelectorAll('[data-parallax]'));
        
        // Add scroll listener with performance optimization
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            this.requestTick();
        }, { passive: true });
        
        // Initial update
        this.update();
    }
    
    requestTick() {
        if (!this.ticking) {
            requestAnimationFrame(() => this.update());
            this.ticking = true;
        }
    }
    
    update() {
        this.parallaxElements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            const direction = el.dataset.parallaxDirection || 'up';
            const offset = el.dataset.parallaxOffset || 0;
            
            let transform = 0;
            
            switch(direction) {
                case 'up':
                    transform = -(this.scrollY * speed) + offset;
                    el.style.transform = `translateY(${transform}px)`;
                    break;
                case 'down':
                    transform = (this.scrollY * speed) + offset;
                    el.style.transform = `translateY(${transform}px)`;
                    break;
                case 'left':
                    transform = -(this.scrollY * speed) + offset;
                    el.style.transform = `translateX(${transform}px)`;
                    break;
                case 'right':
                    transform = (this.scrollY * speed) + offset;
                    el.style.transform = `translateX(${transform}px)`;
                    break;
                case 'scale':
                    const scale = 1 + (this.scrollY * speed / 1000);
                    el.style.transform = `scale(${scale})`;
                    break;
                case 'rotate':
                    transform = this.scrollY * speed;
                    el.style.transform = `rotate(${transform}deg)`;
                    break;
                case 'opacity':
                    const opacity = Math.max(0, Math.min(1, 1 - (this.scrollY * speed / 500)));
                    el.style.opacity = opacity;
                    break;
            }
        });
        
        this.ticking = false;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ParallaxController();
    });
} else {
    new ParallaxController();
}

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll reveal animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);
    
    // Observe elements with scroll-reveal class
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
});
