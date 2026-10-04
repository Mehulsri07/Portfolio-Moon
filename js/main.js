// main.js
window.addEventListener('error', e => console.error('Global Error:', e));
window.addEventListener('unhandledrejection', e => console.error('Promise Error:', e));

import { createScrollController, createAnimationLoop } from './animation.js';

// Import visual effects
import { initStarfield } from './starfield.js';
import { initCursorTrail } from './cursor-trail.js';
import { initHoverEffects } from './hover-effects.js';
import { initTransitions } from './transitions.js?v=2';

const canvas = document.getElementById('moon-canvas');
const labels = document.getElementById('labels');
const loadingEl = document.getElementById('moon-loading');
const loadingFill = loadingEl?.querySelector('.moon-loading-fill');
const loadingBar = loadingEl?.querySelector('.moon-loading-bar');

// Navigation first: the Coding/Creativity labels must appear on scroll
// even if Three.js, the CDN or WebGL fails below.
const scrollState = createScrollController(labels);

// Initialize visual effects
initStarfield();
initCursorTrail();
initHoverEffects();
initTransitions();

function setLoadingProgress(p) {
  if (!loadingFill || !loadingBar) return;
  const pct = Math.round(Math.min(100, Math.max(0, p * 100)));
  loadingFill.style.transform = `scaleX(${pct / 100})`;
  loadingBar.setAttribute('aria-valuenow', String(pct));
}

function finishLoading() {
  loadingEl?.classList.add('done');
  loadingEl?.setAttribute('aria-busy', 'false');
}

async function startMoon() {
  // Loaded lazily so a failed three.js download cannot take the page's links with it
  const [{ createScene, createBloomComposer, updateSceneTheme }, { loadPortfolioModel }, { setupInteraction }] =
    await Promise.all([import('./scene.js'), import('./loader.js'), import('./interaction.js')]);

  const { scene, camera, renderer, keyLight, fillLight, ambientLight } = createScene(canvas);
  const { composer, bloomPass } = createBloomComposer(renderer, scene, camera);

  updateSceneTheme(scene, { keyLight, fillLight, ambientLight }, 'dark');
  bloomPass.strength = 0.15;

  let activeModel = null;

  createAnimationLoop({
    composer,
    renderer,
    scene,
    camera,
    getMoon: () => activeModel,
    scrollState,
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.setSize(window.innerWidth, window.innerHeight);
  });

  loadingEl?.classList.remove('done');
  loadingEl?.setAttribute('aria-busy', 'true');
  setLoadingProgress(0);

  activeModel = await loadPortfolioModel(scene, 'moon', {
    renderer,
    onProgress: setLoadingProgress,
  });

  setLoadingProgress(1);

  setupInteraction({
    canvas,
    camera,
    moon: activeModel,
    isInteractive: () => scrollState.moonFade > 0.18,
  });
}

startMoon()
  .catch((err) => console.error('Moon scene failed to start:', err))
  .finally(finishLoading);
