// js/arm-rig.js
// Scroll-driven kinematic arm rig — "Creation of Adam" motif
//
// Left hand  (maroon): Coding track      → pages/coding.html
// Right hand (teal):   Creativity track  → pages/creativity.html
//
// Motion model:
//   Both hands rotate around an off-canvas pivot so they arc through
//   space rather than spinning in place.
//   Left  hand: pivot below-left  of element, rotates CCW (+75° → 0°)
//   Right hand: pivot above-right of element, rotates CCW (-75° → 0°)
//   Both complete at the same eased scroll-progress value — no stagger.

// ─── Constants ───────────────────────────────────────────────────────────────

export const SCROLL_ZONE_START = () => window.innerHeight;
export const SCROLL_ZONE_END   = () => window.innerHeight * 3;

// Starting rotation angles (degrees). Both rotate toward 0° at progress=1.
// Left  starts at +90° and rotates CCW (decreasing) to 0° — sweeps up from below.
// Right starts at -90° and rotates CCW (increasing) to 0° — descends from above.
const LEFT_START_ANGLE  =  90;
const RIGHT_START_ANGLE = -90;

// Sub-layer kinematic wobble — small sine-curve deviation mid-arc,
// self-corrects to 0° at rest. Keep low to avoid dither warp.
export const MAX_DEVIATION_PALM   = 6;
export const MAX_DEVIATION_FINGER = 3;

// Transform-origins for sub-layers (% of shared 2500×1350 canvas)
export const LEFT_ARM_ORIGIN   = '52% 35%';
export const LEFT_PALM_ORIGIN  = '86% 35%';
export const RIGHT_ARM_ORIGIN  = '48% 47%';
export const RIGHT_PALM_ORIGIN = '18% 49%';

// ─── Scroll state ────────────────────────────────────────────────────────────

export const scrollState = {
  progress:      0,
  easedProgress: 0,
  isSettled:     false,
};

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Smoothstep easing: t² × (3 − 2t) */
export function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

/** Returns scroll progress clamped to [0, 1] */
export function computeScrollProgress(scrollY) {
  const start = SCROLL_ZONE_START();
  const end   = SCROLL_ZONE_END();
  return Math.min(1, Math.max(0, (scrollY - start) / (end - start)));
}

/**
 * Get the current fingertip screen position for a hand, used to anchor
 * the spill overlay origin each frame.
 *
 * We use getBoundingClientRect() on the container after the CSS transform
 * has been applied — this gives us the actual rotated bounding box, and
 * we pick the corner that the fingertip lives in.
 *
 * Left hand fingertip is near the RIGHT edge of its bounding box.
 * Right hand fingertip is near the LEFT edge of its bounding box.
 *
 * @param {'left'|'right'} side
 * @param {HTMLElement} el
 * @returns {{ x: number, y: number }}
 */
function getFingertipPosition(side, el) {
  const r = el.getBoundingClientRect();
  if (side === 'left') {
    // Fingertip is roughly at the right-center of the rotated element
    return { x: r.right, y: r.top + r.height * 0.45 };
  } else {
    // Fingertip is roughly at the left-center of the rotated element
    return { x: r.left, y: r.top + r.height * 0.45 };
  }
}

// ─── DOM references ───────────────────────────────────────────────────────────

const handConfig = {
  left: {
    container:     null,
    armLayer:      null,
    palmLayer:     null,
    fingerLayer:   null,
    deviationSign: 1,
    startAngle:    LEFT_START_ANGLE,
  },
  right: {
    container:     null,
    armLayer:      null,
    palmLayer:     null,
    fingerLayer:   null,
    deviationSign: -1,
    startAngle:    RIGHT_START_ANGLE,
  },
};

// ─── Core animation ───────────────────────────────────────────────────────────

/**
 * Apply rotation-based arc transform for the current scroll progress.
 * Both hands complete their arc at the same progress value — no stagger.
 *
 * @param {number} progress - Raw [0,1] scroll progress
 */
export function applyArmTransforms(progress) {
  const eased     = easeInOut(progress);
  const deviation = Math.sin(progress * Math.PI);  // 0 at 0 and 1, peak at 0.5

  for (const side of ['left', 'right']) {
    const cfg = handConfig[side];
    if (!cfg.container) continue;

    // Rotate from startAngle → 0° using eased progress.
    // Hands are corner-anchored (left: bottom:0, right: top:0) — no translateY needed.
    const angle = cfg.startAngle * (1 - eased);
    cfg.container.style.transform = `rotate(${angle}deg)`;

    // Sub-layer kinematic wobble
    if (cfg.palmLayer) {
      cfg.palmLayer.style.transformOrigin =
        side === 'left' ? LEFT_PALM_ORIGIN : RIGHT_PALM_ORIGIN;
      cfg.palmLayer.style.transform =
        `rotate(${deviation * MAX_DEVIATION_PALM * cfg.deviationSign}deg)`;
    }
    if (cfg.fingerLayer) {
      cfg.fingerLayer.style.transformOrigin = 'center';
      cfg.fingerLayer.style.transform =
        `rotate(${-deviation * MAX_DEVIATION_FINGER * cfg.deviationSign}deg)`;
    }
  }

  // Settled state — enable pointer-events only when fully at rest
  const wasSettled      = scrollState.isSettled;
  scrollState.isSettled = progress >= 1;

  if (scrollState.isSettled !== wasSettled) {
    const pe = scrollState.isSettled ? 'auto' : 'none';
    for (const side of ['left', 'right']) {
      const el = handConfig[side].container;
      if (!el) continue;
      el.style.pointerEvents = pe;
      el.classList.toggle('settled', scrollState.isSettled);
    }
  }
}

// ─── Hover / spill ────────────────────────────────────────────────────────────

const isFinePtrDevice = window.matchMedia('(hover: hover) and (pointer: fine)');

const spillState = { activeHand: null, lastHovered: null };

const spillOverlays = { left: null, right: null };

/**
 * Update spill overlay origin to the live fingertip position.
 * Called on every hover-enter and on each rAF frame while a hand is hovered.
 */
function updateSpillOrigin(side) {
  const cfg = handConfig[side];
  if (!cfg.container) return;
  const { x, y } = getFingertipPosition(side, cfg.container);
  document.documentElement.style.setProperty('--spill-x', `${x}px`);
  document.documentElement.style.setProperty('--spill-y', `${y}px`);
}

function handleHover(type, side, handEl) {
  if (!isFinePtrDevice.matches) return;

  const overlay = spillOverlays[side];

  if (type === 'enter') {
    spillState.activeHand  = side;
    spillState.lastHovered = side;
    updateSpillOrigin(side);
    if (overlay) overlay.classList.add('active');
    handEl.classList.add('hovered');
    tintMatrixCanvas(side);
  } else {
    if (spillState.activeHand === side) spillState.activeHand = null;
    if (overlay) overlay.classList.remove('active');
    handEl.classList.remove('hovered');
    if (!spillState.activeHand) untintMatrixCanvas();
  }
}

function tintMatrixCanvas(side) {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  canvas.style.filter = side === 'left'
    ? 'sepia(0.4) saturate(1.2) hue-rotate(330deg)'
    : 'hue-rotate(150deg) saturate(1.4)';
}

function untintMatrixCanvas() {
  const canvas = document.getElementById('matrix-canvas');
  if (canvas) canvas.style.filter = '';
}

// ─── Click / keyboard navigation ─────────────────────────────────────────────

let isNavigating = false;

/**
 * Pulse animation + page navigation.
 * Each hand has its own href from the <a> element — no shared hardcoded URL.
 * Guard: only fires when arms are fully settled at rest.
 */
function handleClick(event, linkEl, handEl) {
  event.preventDefault();
  if (!scrollState.isSettled) return;
  if (isNavigating) return;

  isNavigating = true;

  // Restart animation if re-clicked mid-pulse
  handEl.classList.remove('pulsing');
  void handEl.offsetWidth;
  handEl.classList.add('pulsing');

  // href comes from the individual <a> element — distinct per hand
  const href = linkEl.getAttribute('href');

  handEl.addEventListener('animationend', () => {
    handEl.classList.remove('pulsing');
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity    = '0';
    setTimeout(() => { window.location.href = href; }, 320);
  }, { once: true });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initArmRig() {
  // ── DOM references ──────────────────────────────────────────────────────
  handConfig.left.container  = document.getElementById('hand-left');
  handConfig.right.container = document.getElementById('hand-right');

  if (handConfig.left.container) {
    handConfig.left.armLayer    = handConfig.left.container.querySelector('.arm-layer');
    handConfig.left.palmLayer   = handConfig.left.container.querySelector('.palm-layer');
    handConfig.left.fingerLayer = handConfig.left.container.querySelector('.finger-layer');
    if (handConfig.left.armLayer)
      handConfig.left.armLayer.style.transformOrigin = LEFT_ARM_ORIGIN;
  }

  if (handConfig.right.container) {
    handConfig.right.armLayer    = handConfig.right.container.querySelector('.arm-layer-r');
    handConfig.right.palmLayer   = handConfig.right.container.querySelector('.palm-layer-r');
    handConfig.right.fingerLayer = handConfig.right.container.querySelector('.finger-layer-r');
    if (handConfig.right.armLayer)
      handConfig.right.armLayer.style.transformOrigin = RIGHT_ARM_ORIGIN;
  }

  // Set initial off-canvas rotation before any scroll
  applyArmTransforms(0);

  // ── Spill overlays ──────────────────────────────────────────────────────
  spillOverlays.left  = document.getElementById('spill-maroon');
  spillOverlays.right = document.getElementById('spill-teal');

  // ── Hover wiring (fine-pointer only) ───────────────────────────────────
  if (isFinePtrDevice.matches) {
    for (const side of ['left', 'right']) {
      const cfg = handConfig[side];
      if (!cfg.container) continue;
      cfg.container.addEventListener('pointerenter',
        () => handleHover('enter', side, cfg.container));
      cfg.container.addEventListener('pointerleave',
        () => handleHover('leave', side, cfg.container));
    }
  }

  // ── Click + keyboard navigation ─────────────────────────────────────────
  // Each hand's <a> carries its own href — left → coding, right → creativity.
  // Tab order follows DOM order: hand-left first, hand-right second.
  for (const side of ['left', 'right']) {
    const cfg    = handConfig[side];
    if (!cfg.container) continue;
    const linkEl = cfg.container.querySelector('.hand-link');
    if (!linkEl) continue;

    linkEl.addEventListener('click',
      (e) => handleClick(e, linkEl, cfg.container));

    linkEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e, linkEl, cfg.container);
      }
    });
  }

  // ── Scroll listener ─────────────────────────────────────────────────────
  let rafScheduled = false;

  window.addEventListener('scroll', () => {
    scrollState.progress      = computeScrollProgress(window.scrollY);
    scrollState.easedProgress = easeInOut(scrollState.progress);

    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(() => {
        rafScheduled = false;
        applyArmTransforms(scrollState.progress);

        // Keep spill origin tracking the rotated fingertip every frame
        if (spillState.activeHand) updateSpillOrigin(spillState.activeHand);
      });
    }
  }, { passive: true });

  // ── One-shot rAF for correct initial state ──────────────────────────────
  requestAnimationFrame(() => {
    applyArmTransforms(computeScrollProgress(window.scrollY));
  });

  // ── Resize ──────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    applyArmTransforms(scrollState.progress);
  }, { passive: true });
}
