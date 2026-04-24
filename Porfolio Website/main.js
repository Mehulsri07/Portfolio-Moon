// main.js
import { createScene, createBloomComposer, updateSceneTheme } from './js/scene.js?v=20';
import { loadPortfolioModel } from './js/loader.js?v=20';
import { createScrollController, createAnimationLoop } from './js/animation.js?v=20';
import { setupInteraction } from './js/interaction.js?v=20';

// Import visual effects
import { initStarfield } from './js/starfield.js';
import { initCursorTrail } from './js/cursor-trail.js';
import { initHoverEffects } from './js/hover-effects.js';
import { initTransitions } from './js/transitions.js';

const canvas = document.getElementById('moon-canvas');
const labels = document.getElementById('labels');
const loadingEl = document.getElementById('moon-loading');
const loadingFill = loadingEl?.querySelector('.moon-loading-fill');
const loadingBar = loadingEl?.querySelector('.moon-loading-bar');

const LAZY_LOAD_SCROLL_PX = 8;

const { scene, camera, renderer, keyLight, fillLight, ambientLight } = createScene(canvas);
const sceneComponents = { keyLight, fillLight, ambientLight };
const { composer, bloomPass } = createBloomComposer(renderer, scene, camera);

const scrollState = createScrollController(labels);

let activeModel = null;
let modelLoadStarted = false;
let currentModelType = 'moon';

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

async function loadThemeModel(type) {
  if (activeModel) {
    scene.remove(activeModel);
    activeModel = null;
  }

  loadingEl?.classList.remove('done');
  loadingEl?.setAttribute('aria-busy', 'true');
  setLoadingProgress(0);

  try {
    const loadedModel = await loadPortfolioModel(scene, type, {
      renderer,
      onProgress: setLoadingProgress,
    });

    activeModel = loadedModel;
    currentModelType = type;

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
    console.error(`${type} model failed to load:`, err);
    loadingEl?.classList.add('done');
    loadingEl?.setAttribute('aria-busy', 'false');
  }
}

function beginLazyLoad() {
  if (modelLoadStarted) return;
  modelLoadStarted = true;
  loadThemeModel(currentModelType);
}

function tryBeginLazyLoad(event) {
  if (modelLoadStarted) return;
  if (window.scrollY >= LAZY_LOAD_SCROLL_PX) {
    beginLazyLoad();
    return;
  }
  if (event?.type === 'wheel') {
    beginLazyLoad();
  }
}


window.addEventListener('scroll', tryBeginLazyLoad, { passive: true });
window.addEventListener('wheel', tryBeginLazyLoad, { passive: true });

// Force load immediately
beginLazyLoad();

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
