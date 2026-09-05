import * as THREE from 'three';

/** A size envelope, not anatomy or a strap-fit simulation. Dimensions are mm. */
export function wristReference(circumference: number) {
  const ratio = 1.35;
  // Ramanujan's ellipse perimeter approximation, scaled to the chosen size.
  const h = ((ratio - 1) / (ratio + 1)) ** 2;
  const unitPerimeter = Math.PI * (ratio + 1) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
  const minor = circumference / unitPerimeter, major = minor * ratio;
  const top = -3.57, center = top - minor;
  const geometry = new THREE.CylinderGeometry(1, 1, 86, 128, 1, false);
  geometry.rotateZ(Math.PI / 2);
  geometry.scale(1, major, minor);
  geometry.translate(0, 0, center);
  const material = new THREE.MeshStandardMaterial({color: 0x766f65, roughness: .96, metalness: 0});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'wrist_size_reference';
  mesh.scale.setScalar(.001);
  mesh.userData.dimensions = {circumference, width: 2 * major, depth: 2 * minor, top, shape: 'ellipse', pose: 'open display'};
  return mesh;
}

export function referenceSize(): number | null {
  const value = new URLSearchParams(location.search).get('reference');
  if (!value) return null;
  const size = Number(value);
  return Number.isFinite(size) && size >= 130 && size <= 220 ? size : null;
}
