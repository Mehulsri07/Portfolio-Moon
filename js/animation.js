// js/animation.js

// Moon radius in world units after loader.js scales the model (6.4 * 1.06 / 2)
const BASE_RADIUS = 3.392;

// Constant idle spin: 1.5 revolutions per minute, in radians per second
const SPIN_RAD_PER_SEC = (1.5 * 2 * Math.PI) / 60;

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function ease(t) {
  return t * t * (3 - 2 * t);
}

// Two scroll phases:
//   scrollProgress  0 → 1  the moon rises into the centre and the Coding/Creativity labels appear
//   aboutProgress   0 → 1  About scrolls in and the moon slides out to sit on the right edge
export function createScrollController(labelsEl, aboutEl) {
  const state = { scrollProgress: 0, aboutProgress: 0 };

  function onScroll() {
    const vh = window.innerHeight;
    state.scrollProgress = clamp01((window.scrollY - vh * 0.15) / (vh * 0.6));
    // Done by the time About's top is a quarter of the way up the screen
    state.aboutProgress = aboutEl
      ? clamp01((1 - aboutEl.getBoundingClientRect().top / vh) / 0.75)
      : 0;

    labelsEl.classList.toggle('show', state.scrollProgress > 0.85 && state.aboutProgress < 0.2);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  return state;
}

// Key light: overhead while the moon rises, then from the left-front once it parks on the
// right edge, so its bright side faces the About text
const LIGHT_TOP = [2, 12, 4];
const LIGHT_PARKED = [-10, 5, 7];

export function createAnimationLoop({ composer, renderer, scene, camera, getMoon, scrollState, keyLight }) {
  const state = {
    x: 0,
    y: -5.5,
    rotY: Math.PI,
    scale: 1,
    opacity: 1,
    appliedOpacity: 1,
    spin: 0,
    light: 0,
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    // Clamp so a backgrounded tab doesn't jump the spin when it comes back
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (!reduceMotion.matches) state.spin = (state.spin + dt * SPIN_RAD_PER_SEC) % (2 * Math.PI);

    const moon = getMoon();

    if (moon) {
      moon.userData.baseScale ??= moon.scale.x;

      const rise = ease(scrollState.scrollProgress);
      const side = ease(scrollState.aboutProgress);

      // Where the right edge of the screen is, in world units on the moon's plane
      const d = camera.position.z;
      const halfH = d * Math.tan((camera.fov * Math.PI) / 360);
      const halfW = halfH * camera.aspect;

      // Parked size: as tall as the screen on wide windows. On portrait screens that
      // would cover everything, so it stays smaller and fades behind the text instead.
      const narrow = camera.aspect < 1;
      const apparent = narrow ? halfW * 0.95 : halfH * 1.1;            // on-screen radius
      const radius = (apparent * d) / Math.sqrt(d * d + apparent * apparent); // undo perspective bulge
      const parkedScale = radius / BASE_RADIUS;

      const target = {
        x: side * halfW,
        y: lerp(rise * 5.5 - 5.5, 0, side),
        rotY: Math.PI * (1 - rise) - side * 0.9,
        scale: lerp(1, parkedScale, side),
        opacity: narrow ? lerp(1, 0.28, side) : 1,
      };

      target.light = side;

      for (const k of ['x', 'y', 'rotY', 'scale', 'opacity', 'light']) {
        state[k] += (target[k] - state[k]) * 0.08;
      }

      moon.position.x = state.x;
      moon.position.y = state.y;
      moon.rotation.y = state.rotY + state.spin;
      moon.rotation.x = Math.sin(rise * Math.PI) * 0.05 * (1 - side);
      moon.scale.setScalar(moon.userData.baseScale * state.scale);

      if (keyLight) {
        keyLight.position.set(
          lerp(LIGHT_TOP[0], LIGHT_PARKED[0], state.light),
          lerp(LIGHT_TOP[1], LIGHT_PARKED[1], state.light),
          lerp(LIGHT_TOP[2], LIGHT_PARKED[2], state.light),
        );
      }

      // Fade the whole canvas rather than the moon's materials: the page behind it is the
      // same navy, so only the moon and stars dim. Only touch the style on visible changes.
      if (Math.abs(state.opacity - state.appliedOpacity) > 0.01) {
        state.appliedOpacity = state.opacity;
        renderer.domElement.style.opacity = state.opacity.toFixed(2);
      }
    }

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  animate();
}
