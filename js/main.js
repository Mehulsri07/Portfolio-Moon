// main.js
window.addEventListener('error', e => console.error('Global Error:', e));
window.addEventListener('unhandledrejection', e => console.error('Promise Error:', e));

// Import visual effects
import { initStarfield } from './starfield.js';
import { initCursorTrail } from './cursor-trail.js';
import { initHoverEffects } from './hover-effects.js';
import { initTransitions } from './transitions.js?v=2';
import { initArmRig } from './arm-rig.js';

// Initialize visual effects
initStarfield();
initCursorTrail();
initHoverEffects();
initTransitions();
initArmRig();
