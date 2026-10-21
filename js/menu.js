// js/menu.js
// Mobile menu for every page. The hamburger stays above the open menu
// and turns into the close button. Also marks the sub-page nav once scrolled.
(function () {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  // Sub-pages: the nav bar stays clear over the corner moon until the page scrolls
  const nav = document.querySelector('.nav');
  if (nav) {
    const mark = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', mark, { passive: true });
    mark();
  }

  if (!btn || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.setAttribute('aria-expanded', 'false');
  // Same-page links (#about, #contact) should close the menu as they scroll
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  btn.addEventListener('click', () => setOpen(!menu.classList.contains('open')));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      btn.focus();
    }
  });
})();
