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
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050609');

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 0, 10.8);

  // Primary light: directly above, slightly forward — matches the photo
  // Top-down illumination creates the dramatic half-dark crescent at the bottom
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(2, 12, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);

  // Subtle cool fill from the left — keeps dark side from being pure black
  const fillLight = new THREE.DirectionalLight(0x8899bb, 0.18);
  fillLight.position.set(-6, 2, 3);
  scene.add(fillLight);

  // Very dim, warm ambient so the terminator line has depth
  const ambientLight = new THREE.AmbientLight(0x9090a0, 0.14);
  scene.add(ambientLight);

  // Subtle star field
  const starsCount = 1400;
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
    size: 0.11,
    transparent: true,
    opacity: 0.55,
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
    0.45,   // strength — subtle glow
    0.55,   // radius
    0.72    // threshold — only very bright areas bloom
  );
  composer.addPass(bloomPass);

  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);

  return { composer, bloomPass };
}