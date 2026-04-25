// js/starfield.js
// Animated twinkling starfield with subtle parallax
export function initStarfield() {
  const canvas = document.createElement('canvas');
  canvas.id = 'starfield-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '0',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 260;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      // Colorful stars: blue, white, yellow, pink
      const colorChoices = [
        [200,230,255], // blue-white
        [255,255,255], // white
        [255,245,200], // yellowish
        [255,200,245]  // pinkish
      ];
      const color = colorChoices[Math.floor(Math.random()*colorChoices.length)];
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.7 + 0.3,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.012 + 0.004,
        twinklePhase: Math.random() * Math.PI * 2,
        depth: Math.random() * 0.9 + 0.1,
        color,
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
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const alpha = Math.max(0, Math.min(1, star.alpha + twinkle * 0.28));
      const parallaxY = (star.y - scrollY * star.depth * 0.07) % canvas.height;
      const drawY = parallaxY < 0 ? parallaxY + canvas.height : parallaxY;
      ctx.save();
      ctx.beginPath();
      ctx.arc(star.x, drawY, star.radius, 0, Math.PI * 2);
      ctx.shadowColor = `rgba(${star.color[0]},${star.color[1]},${star.color[2]},${0.7*alpha})`;
      ctx.shadowBlur = 12 * star.radius;
      ctx.fillStyle = `rgba(${star.color[0]},${star.color[1]},${star.color[2]},${alpha})`;
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}
