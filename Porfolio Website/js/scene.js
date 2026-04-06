import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050609');

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 0, 10.8);

  // Strong directional light strictly from the right (+X) for deep contrast
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 3, 2);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Very dim, cool-toned ambient light so the left side is deeply shaded
  const ambientLight = new THREE.AmbientLight(0xa0a5b0, 0.22);
  scene.add(ambientLight);

  // subtle star field
  const starsCount = 1200;
  const starsGeometry = new THREE.BufferGeometry();
  const starsPos = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    const r = 80 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    starsPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    starsPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starsPos[i * 3 + 2] = r * Math.cos(phi);
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xd0d8f0,
    size: 0.12,
    transparent: true,
    opacity: 0.6,
  });
  scene.add(new THREE.Points(starsGeometry, starsMaterial));

  return { scene, camera, renderer };
}

export function createBloomComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.58,
    0.42,
    0.38
  );
  composer.addPass(bloomPass);

  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);

  return { composer, bloomPass };
}
