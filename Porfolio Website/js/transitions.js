// js/transitions.js
// Cinematic fade-out transition for page navigation
(function () {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        background: '#0a0a0b',
        zIndex: '9999',
        opacity: '0',
        pointerEvents: 'none',
        transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
    });
    document.body.appendChild(overlay);

    // Fade-in on page load (reveal from black)
    overlay.style.opacity = '1';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.style.opacity = '0';
        });
    });

    // Intercept internal link clicks for fade-out
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');

        // Skip external links, anchors, and javascript: links
        if (!href) return;
        if (link.target === '_blank') return;
        if (href.startsWith('#')) return;
        if (href.startsWith('javascript:')) return;
        if (href.startsWith('http') && !href.includes(window.location.host)) return;

        e.preventDefault();

        overlay.style.pointerEvents = 'all';
        overlay.style.opacity = '1';

        setTimeout(() => {
            window.location.href = href;
        }, 400);
    });

    // Handle browser back/forward navigation
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }
    });
})();
