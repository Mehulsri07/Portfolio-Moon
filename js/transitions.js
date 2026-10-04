// js/transitions.js
// Cinematic fade-out transition for page navigation
export function initTransitions() {
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

        // Leave new-tab clicks, downloads, and already-handled clicks to the browser
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;

        // Only fade for same-site page navigations (not mailto:, tel:, external, or in-page anchors)
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.hash) return;

        e.preventDefault();

        overlay.style.pointerEvents = 'all';
        overlay.style.opacity = '1';

        setTimeout(() => {
            window.location.href = url.href;
        }, 400);
    });

    // Handle browser back/forward navigation
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }
    });
}
