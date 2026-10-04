// js/animation.js
export function createScrollController(labelsEl) {
  const state = { scrollProgress: 0 };

  function onScroll() {
    const sy = window.scrollY;
    const raw = sy - window.innerHeight * 0.15;
    const range = window.innerHeight * 0.6;

    state.scrollProgress = Math.max(0, Math.min(1, raw / range));

    if (state.scrollProgress > 0.85) {
      labelsEl.classList.add('show');
    } else {
      labelsEl.classList.remove('show');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return state;
}
