// main.js
window.addEventListener('error', e => console.error('Global Error:', e));
window.addEventListener('unhandledrejection', e => console.error('Promise Error:', e));

import { createScene, createBloomComposer, updateSceneTheme } from './scene.js';
import { loadPortfolioModel } from './loader.js';
import { createScrollController, createAnimationLoop } from './animation.js';
import { setupInteraction } from './interaction.js';

// Import visual effects
import { initStarfield } from './starfield.js';
import { initCursorTrail } from './cursor-trail.js';
import { initHoverEffects } from './hover-effects.js';
import { initTransitions } from './transitions.js';

const canvas = document.getElementById('moon-canvas');
const labels = document.getElementById('labels');
const loadingEl = document.getElementById('moon-loading');
const loadingFill = loadingEl?.querySelector('.moon-loading-fill');
const loadingBar = loadingEl?.querySelector('.moon-loading-bar');

const { scene, camera, renderer, keyLight, fillLight, ambientLight } = createScene(canvas);
const sceneComponents = { keyLight, fillLight, ambientLight };

const { composer, bloomPass } = createBloomComposer(renderer, scene, camera);

const scrollState = createScrollController(labels);

let activeModel = null;

// Initial theme update
updateSceneTheme(scene, sceneComponents, 'dark');
bloomPass.strength = 0.15;

// Initialize visual effects
initStarfield();
initCursorTrail();
initHoverEffects();
initTransitions();

function setLoadingProgress(p) {
  if (!loadingFill || !loadingBar) return;
  const pct = Math.round(Math.min(100, Math.max(0, p * 100)));
  loadingFill.style.width = `${pct}%`;
  loadingBar.setAttribute('aria-valuenow', String(pct));
}

async function loadModel() {
  loadingEl?.classList.remove('done');
  loadingEl?.setAttribute('aria-busy', 'true');
  setLoadingProgress(0);

  try {
    activeModel = await loadPortfolioModel(scene, 'moon', {
      renderer,
      onProgress: setLoadingProgress,
    });

    setLoadingProgress(1);
    loadingEl?.classList.add('done');
    loadingEl?.setAttribute('aria-busy', 'false');

    setupInteraction({
      canvas,
      camera,
      moon: activeModel,
      isInteractive: () => scrollState.moonFade > 0.18,
    });

  } catch (err) {
    console.error('Moon model failed to load:', err);
    loadingEl?.classList.add('done');
    loadingEl?.setAttribute('aria-busy', 'false');
  }
}

loadModel();

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