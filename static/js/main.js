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

    // Showcase search and category filtering
    const showcaseTools = document.querySelector('[data-showcase-tools]');
    if (showcaseTools) {
        const searchInput = showcaseTools.querySelector('[data-showcase-search]');
        const filterButtons = showcaseTools.querySelectorAll('[data-showcase-filter]');
        const showcaseItems = document.querySelectorAll('[data-showcase-item]');
        const countEl = document.querySelector('[data-showcase-count]');
        const emptyEl = document.querySelector('[data-showcase-empty]');
        let activeCategory = 'all';

        const updateShowcaseList = () => {
            const query = searchInput.value.trim().toLowerCase();
            let visibleCount = 0;

            showcaseItems.forEach(item => {
                const itemCategory = item.dataset.showcaseCategory || '';
                const searchText = item.dataset.showcaseSearch || '';
                const matchesCategory = activeCategory === 'all' || itemCategory === activeCategory;
                const matchesSearch = !query || searchText.includes(query);
                const isVisible = matchesCategory && matchesSearch;

                item.hidden = !isVisible;
                if (isVisible) visibleCount += 1;
            });

            if (countEl) {
                countEl.textContent = visibleCount === 1 ? '1 item' : `${visibleCount} items`;
            }

            if (emptyEl) {
                emptyEl.hidden = visibleCount > 0;
            }
        };

        searchInput.addEventListener('input', updateShowcaseList);

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeCategory = button.dataset.showcaseFilter || 'all';
                filterButtons.forEach(item => item.classList.remove('is-active'));
                button.classList.add('is-active');
                updateShowcaseList();
            });
        });

        showcaseTools.addEventListener('submit', event => {
            event.preventDefault();
        });
    }

    // Games search plus difficulty and catalog filtering
    const gamesTools = document.querySelector('[data-games-tools]');
    if (gamesTools) {
        const searchInput = gamesTools.querySelector('[data-games-search]');
        const difficultyButtons = gamesTools.querySelectorAll('[data-games-difficulty]');
        const categoryButtons = gamesTools.querySelectorAll('[data-games-category]');
        const gameItems = document.querySelectorAll('[data-games-item]');
        const emptyEl = document.querySelector('[data-games-empty]');
        let activeDifficulty = 'all';
        let activeCategory = 'all';

        const updateGamesList = () => {
            const query = searchInput.value.trim().toLowerCase();
            let visibleCount = 0;

            gameItems.forEach(item => {
                const itemDifficulty = item.dataset.gamesDifficulty || '';
                const itemCategory = item.dataset.gamesCategory || '';
                const searchText = item.dataset.gamesSearch || '';
                const matchesDifficulty = activeDifficulty === 'all' || itemDifficulty === activeDifficulty;
                const matchesCategory = activeCategory === 'all' || itemCategory === activeCategory;
                const matchesSearch = !query || searchText.includes(query);
                const isVisible = matchesDifficulty && matchesCategory && matchesSearch;

                item.hidden = !isVisible;
                if (isVisible) visibleCount += 1;
            });

            if (emptyEl) {
                emptyEl.hidden = visibleCount > 0;
            }
        };

        searchInput.addEventListener('input', updateGamesList);

        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeDifficulty = button.dataset.gamesDifficulty || 'all';
                difficultyButtons.forEach(item => item.classList.remove('is-active'));
                button.classList.add('is-active');
                updateGamesList();
            });
        });

        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeCategory = button.dataset.gamesCategory || 'all';
                categoryButtons.forEach(item => item.classList.remove('is-active'));
                button.classList.add('is-active');
                updateGamesList();
            });
        });

        gamesTools.addEventListener('submit', event => {
            event.preventDefault();
        });
    }

    // Notes search, category filtering, and progressive loading
    const notesTools = document.querySelector('[data-notes-tools]');
    if (notesTools) {
        const searchInput = notesTools.querySelector('[data-notes-search]');
        const filterButtons = notesTools.querySelectorAll('[data-notes-filter]');
        const noteItems = Array.from(document.querySelectorAll('[data-notes-item]'));
        const countEl = document.querySelector('[data-notes-count]');
        const emptyEl = document.querySelector('[data-notes-empty]');
        const loadMoreButton = document.querySelector('[data-notes-load-more]');
        const pageSize = 8;
        let activeCategory = 'all';
        let visibleLimit = pageSize;

        const updateNotesList = () => {
            const query = searchInput.value.trim().toLowerCase();
            const matchedItems = noteItems.filter(item => {
                const itemCategory = item.dataset.notesCategory || '';
                const searchText = item.dataset.notesSearch || '';
                const matchesCategory = activeCategory === 'all' || itemCategory === activeCategory;
                const matchesSearch = !query || searchText.includes(query);
                return matchesCategory && matchesSearch;
            });

            noteItems.forEach(item => {
                item.hidden = true;
            });

            matchedItems.slice(0, visibleLimit).forEach(item => {
                item.hidden = false;
            });

            if (countEl) {
                countEl.textContent = matchedItems.length === 1 ? '1 note' : `${matchedItems.length} notes`;
            }

            if (emptyEl) {
                emptyEl.hidden = matchedItems.length > 0;
            }

            if (loadMoreButton) {
                loadMoreButton.hidden = matchedItems.length <= visibleLimit;
            }
        };

        searchInput.addEventListener('input', () => {
            visibleLimit = pageSize;
            updateNotesList();
        });

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeCategory = button.dataset.notesFilter || 'all';
                visibleLimit = pageSize;
                filterButtons.forEach(item => item.classList.remove('is-active'));
                button.classList.add('is-active');
                updateNotesList();
            });
        });

        if (loadMoreButton) {
            loadMoreButton.addEventListener('click', () => {
                visibleLimit += pageSize;
                updateNotesList();
            });
        }

        notesTools.addEventListener('submit', event => {
            event.preventDefault();
        });

        updateNotesList();
    }

});
