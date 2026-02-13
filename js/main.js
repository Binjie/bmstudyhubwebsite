// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
    // Mobile nav toggle
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.querySelector('.site-nav');
    
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            siteNav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Close mobile nav when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.site-nav') && !event.target.closest('.nav-toggle')) {
            siteNav.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    siteNav.classList.remove('active');
                    if (navToggle) navToggle.classList.remove('active');
                }
            }
        });
    });
    
    // Add animation to cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe cards for animation
    document.querySelectorAll('.feature-card, .course-card, .blog-card, .game-card').forEach(card => {
        observer.observe(card);
    });
});