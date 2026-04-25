import * as THREE from 'three';

export function setupInteraction({ canvas, camera, moon, isInteractive }) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onClick(event) {
    if (!moon) return;
    if (isInteractive && !isInteractive()) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(moon, true);

    if (!intersects.length) return;

    const target = event.clientX < window.innerWidth / 2 ? '/pages/coding.html' : '/pages/creativity.html';

    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '0';

    setTimeout(() => {
      window.location.href = target;
    }, 420);
  }

  canvas.addEventListener('click', onClick);
}