// js/starfield.js
// Animated twinkling starfield with subtle parallax
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'starfield-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '0',
    pointerEvents: 'none',
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 200;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.4 + 0.3,
        alpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        // Parallax depth layer: 0.2 = far, 1.0 = near
        depth: Math.random() * 0.8 + 0.2,
      });
    }
  }

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  let time = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 1;

    for (const star of stars) {
      // Twinkling
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const alpha = star.alpha + twinkle * 0.25;

      // Subtle parallax on scroll
      const parallaxY = (star.y - scrollY * star.depth * 0.05) % canvas.height;
      const drawY = parallaxY < 0 ? parallaxY + canvas.height : parallaxY;

      ctx.beginPath();
      ctx.arc(star.x, drawY, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 210, 230, ${Math.max(0, Math.min(1, alpha))})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();
