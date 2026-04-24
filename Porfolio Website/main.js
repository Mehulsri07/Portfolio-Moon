// main.js
import { createScene, createBloomComposer } from './js/scene.js';
import { loadMoonModel } from './js/loader.js?v=2';
import { createScrollController, createAnimationLoop } from './js/animation.js?v=4';
import { setupInteraction } from './js/interaction.js';

const canvas = document.getElementById('moon-canvas');
const labels = document.getElementById('labels');
const loadingEl = document.getElementById('moon-loading');
const loadingFill = loadingEl?.querySelector('.moon-loading-fill');
const loadingBar = loadingEl?.querySelector('.moon-loading-bar');

const LAZY_LOAD_SCROLL_PX = 8;

const { scene, camera, renderer } = createScene(canvas);
const { composer, bloomPass } = createBloomComposer(renderer, scene, camera);

const scrollState = createScrollController(labels);

let moon = null;
let moonLoadStarted = false;

function setLoadingProgress(p) {
  if (!loadingFill || !loadingBar) return;
  const pct = Math.round(Math.min(100, Math.max(0, p * 100)));
  loadingFill.style.width = `${pct}%`;
  loadingBar.setAttribute('aria-valuenow', String(pct));
}

function beginMoonLazyLoad() {
  if (moonLoadStarted) return;
  moonLoadStarted = true;

  loadingEl?.classList.remove('done');
  loadingEl?.setAttribute('aria-busy', 'true');
  setLoadingProgress(0);

  loadMoonModel(scene, {
    renderer,
    onProgress: setLoadingProgress,
  })
    .then((loadedMoon) => {
      moon = loadedMoon;
      setLoadingProgress(1);
      loadingEl?.classList.add('done');
      loadingEl?.setAttribute('aria-busy', 'false');
      setupInteraction({
        canvas,
        camera,
        moon,
        isInteractive: () => scrollState.moonFade > 0.18,
      });
    })
    .catch((err) => {
      console.error('Moon model failed to load:', err);
      loadingEl?.classList.add('done');
      loadingEl?.setAttribute('aria-busy', 'false');
    });
}

function tryBeginMoonLazyLoad(event) {
  if (moonLoadStarted) return;
  if (window.scrollY >= LAZY_LOAD_SCROLL_PX) {
    beginMoonLazyLoad();
    return;
  }
  if (event?.type === 'wheel') {
    beginMoonLazyLoad();
  }
}

window.addEventListener('scroll', tryBeginMoonLazyLoad, { passive: true });
window.addEventListener('wheel', tryBeginMoonLazyLoad, { passive: true });

// Force moon to load immediately on page load
beginMoonLazyLoad();

createAnimationLoop({
  composer,
  renderer,
  scene,
  camera,
  getMoon: () => moon,
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
