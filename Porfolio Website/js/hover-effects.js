// ── Matrix Rain (Coding Side) ─────────────────────────────────────
(function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]<>~;:アイウエオカキクケコサシスセソタチツテト';
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = new Array(columns).fill(1);

    function draw() {
        // Semi-transparent black to create fade trail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            // Vary green hue slightly per column
            const hue = 120 + Math.sin(i * 0.3) * 15;
            const brightness = 40 + Math.random() * 30;
            ctx.fillStyle = `hsl(${hue}, 100%, ${brightness}%)`;

            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            ctx.fillText(char, x, y);

            // Bright head character
            if (Math.random() > 0.6) {
                ctx.fillStyle = `hsl(${hue}, 80%, 85%)`;
                ctx.fillText(char, x, y);
            }

            // Reset drop randomly after it passes the screen
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }

        // Recalculate columns on resize
        const newCols = Math.floor(canvas.width / fontSize);
        if (newCols !== columns) {
            columns = newCols;
            drops = new Array(columns).fill(1);
        }
    }

    setInterval(draw, 45);
})();


// ── Abstract Moving Blobs (Creativity Side) ───────────────────────
(function initCreativity() {
    const canvas = document.getElementById('creativity-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Floating orbs with organic motion
    const orbs = [];
    const orbCount = 7;
    const palette = [
        { h: 280, s: 80, l: 55 },  // purple
        { h: 320, s: 90, l: 50 },  // magenta/pink
        { h: 200, s: 85, l: 55 },  // cyan
        { h: 30, s: 90, l: 55 },  // warm orange
        { h: 260, s: 70, l: 65 },  // lavender
        { h: 340, s: 85, l: 50 },  // rose
        { h: 180, s: 75, l: 50 },  // teal
    ];

    for (let i = 0; i < orbCount; i++) {
        const col = palette[i % palette.length];
        orbs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 100 + Math.random() * 180,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            phase: Math.random() * Math.PI * 2,
            speed: 0.003 + Math.random() * 0.005,
            col,
        });
    }

    // Small floating particles
    const particles = [];
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 1 + Math.random() * 2.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            alpha: 0.3 + Math.random() * 0.5,
            hue: palette[Math.floor(Math.random() * palette.length)].h,
        });
    }

    let time = 0;

    function draw() {
        time++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw big blurred orbs
        for (const orb of orbs) {
            orb.phase += orb.speed;
            orb.x += orb.vx + Math.sin(orb.phase) * 0.5;
            orb.y += orb.vy + Math.cos(orb.phase * 0.7) * 0.5;

            // Soft wrapping
            if (orb.x < -orb.r) orb.x = canvas.width + orb.r;
            if (orb.x > canvas.width + orb.r) orb.x = -orb.r;
            if (orb.y < -orb.r) orb.y = canvas.height + orb.r;
            if (orb.y > canvas.height + orb.r) orb.y = -orb.r;

            const pulseR = orb.r + Math.sin(orb.phase * 1.2) * 20;
            const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, pulseR);
            const { h, s, l } = orb.col;
            gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0.45)`);
            gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, 0.15)`);
            gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);

            ctx.beginPath();
            ctx.arc(orb.x, orb.y, pulseR, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw small sparkle particles
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const flicker = p.alpha + Math.sin(time * 0.05 + p.x) * 0.15;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${flicker})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
})();
