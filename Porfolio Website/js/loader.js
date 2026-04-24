// js/loader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const MODEL_URL = 'assets/models/moon.glb';
const FALLBACK_MOON_TEXTURE = 'assets/moon_1024.jpg';

// Draco decoder for compressed GLTF meshes
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.152.2/examples/jsm/libs/draco/gltf/');

export function setMoonOpacity(moon, opacity) {
  if (!moon) return;
  const v = THREE.MathUtils.clamp(opacity, 0, 1);

  if (!moon.userData.opacityMaterials) {
    moon.userData.opacityMaterials = [];
    moon.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (mat) moon.userData.opacityMaterials.push(mat);
      });
    });
  }

  for (const mat of moon.userData.opacityMaterials) {
    mat.transparent = v < 1;
    mat.opacity = v;
    mat.depthWrite = v > 0.99;
    if ('alphaMode' in mat && typeof mat.alphaMode === 'string') {
      mat.alphaMode = v < 1 ? 'BLEND' : 'OPAQUE';
    }
    mat.needsUpdate = true;
  }
}

function applyMoonMaterial(mesh, texture, renderer) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  mats.forEach((mat) => {
    if (!mat) return;

    if (texture && !mat.map) {
      mat.map = texture;
      mat.needsUpdate = true;
    }

    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
      mat.roughness = THREE.MathUtils.clamp(mat.roughness ?? 1, 0.55, 0.98);
      mat.metalness = THREE.MathUtils.clamp(mat.metalness ?? 0, 0, 0.12);
      mat.emissive = new THREE.Color(0x3a4a62);
      mat.emissiveIntensity = 0.32;
    }
  });

  if (renderer && texture) {
    const maxA = renderer.capabilities.getMaxAnisotropy?.() ?? 8;
    texture.anisotropy = Math.min(8, maxA);
  }
}

export async function loadMoonModel(scene, options = {}) {
  const { onProgress, renderer } = options;

  const texLoader = new THREE.TextureLoader();
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  const gltf = await gltfLoader.loadAsync(MODEL_URL, (e) => {
    if (!onProgress) return;
    if (e.lengthComputable && e.total > 0) {
      onProgress(e.loaded / e.total);
    }
  });

  const moon = gltf.scene;

  let needsFallbackTexture = false;
  moon.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (m && !m.map) {
        needsFallbackTexture = true;
        return;
      }
    }
  });

  let moonTexture = null;
  if (needsFallbackTexture) {
    moonTexture = await texLoader.loadAsync(FALLBACK_MOON_TEXTURE).catch(() => null);
    if (moonTexture) {
      moonTexture.colorSpace = THREE.SRGBColorSpace;
    }
  }

  moon.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      applyMoonMaterial(child, moonTexture, renderer);
    }
  });

  const box = new THREE.Box3().setFromObject(moon);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const targetDiameter = 6.4;
  moon.scale.setScalar((targetDiameter / maxDim) * 1.06);

  moon.position.set(0, -5.5, 0);
  moon.rotation.set(0, 0, 0);

  scene.add(moon);

  // Make the moon visible and fully opaque after loading
  setMoonOpacity(moon, 1);
  moon.visible = true;

  return moon;
}
