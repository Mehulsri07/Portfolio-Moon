// js/cursor-trail.js
// Glowing particle trail that follows the mouse
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-trail-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '6',
    pointerEvents: 'none',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];
  let mouse = { x: -100, y: -100 };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Spawn particles on movement
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: mouse.x + (Math.random() - 0.5) * 4,
        y: mouse.y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
        radius: Math.random() * 2.5 + 1,
      });
    }
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 195, 230, ${p.life * 0.4})`;
      ctx.fill();
    }

    // Limit particle count for performance
    if (particles.length > 80) {
      particles.splice(0, particles.length - 80);
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
