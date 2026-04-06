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

function ease(t) {
  return t * t * (3 - 2 * t);
}

export function createAnimationLoop({ renderer, scene, camera, getMoon, scrollState }) {
  const state = {
    currentY: -5.5,
    currentRotY: Math.PI,
  };

  function animate() {
    requestAnimationFrame(animate);

    const moon = getMoon();

    if (moon) {
      const eased = ease(scrollState.scrollProgress);
      const targetY = eased * 5.5 - 5.5;
      const targetRotY = Math.PI * (1 - eased);

      state.currentY += (targetY - state.currentY) * 0.08;
      state.currentRotY += (targetRotY - state.currentRotY) * 0.08;

      moon.position.y = state.currentY;
      moon.rotation.y = state.currentRotY;
      moon.rotation.x = Math.sin(eased * Math.PI) * 0.05;
    }

    renderer.render(scene, camera);
  }

  animate();
}
