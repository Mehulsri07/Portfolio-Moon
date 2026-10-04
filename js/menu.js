// js/menu.js
// Mobile menu for the sub-pages. The hamburger stays above the open menu
// and turns into the close button.
(function () {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => setOpen(!menu.classList.contains('open')));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      btn.focus();
    }
  });
})();
