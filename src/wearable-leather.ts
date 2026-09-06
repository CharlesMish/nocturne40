import * as THREE from 'three';

export interface WearableLeatherOptions {
  /** Unstretched centerline length in millimetres, starting at the spring bar. */
  length: number;
  sample: (s: number) => { p: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3 };
  withBuckle: boolean;
  /** Centers of real, through-thickness adjustment holes, in millimetres. */
  holes: number[];
}

const smooth = (t: number) => { const u = THREE.MathUtils.clamp(t, 0, 1); return u * u * (3 - 2 * u); };

/** A closed leather solid in millimetres. The sampler bends its centerline;
 * neither its length nor the spring-bar and buckle bores are scaled. */
export function buildWearableLeather(hide: THREE.Material, options: WearableLeatherOptions): THREE.Group {
  const { sample, withBuckle } = options;
  // The short dimension ends at its buckle pin. The long dimension includes
  // the 0.8 mm folded tip, so its last surface station precedes that tip.
  const length = options.length - (withBuckle ? 0 : .8);
  if (length < 30) throw new Error('Wearable leather requires at least 30 mm of centerline.');
  const holes = [...options.holes].sort((a, b) => a - b);
  if (holes.some((s, i) => s < 10 || s > length - 10 || (i > 0 && s - holes[i - 1] < 3.3))) {
    throw new Error('Adjustment holes must clear the folded ends and one another.');
  }
  if (withBuckle && holes.length) throw new Error('Adjustment holes belong on the long strap.');

  const root = new THREE.Group(); root.name = 'wearable_strap_construction';
  const positions: number[] = [], uvs: number[] = [], triangles: number[][] = [[], [], []];
  const vertices = new Map<string, number>();
  const point = (p: THREE.Vector3, u: number, material: number, smoothing = material) => {
    const key = `${material}:${smoothing}:` + p.toArray().map(v => Math.round(v * 1e8)).join(',');
    const old = vertices.get(key); if (old !== undefined) return old;
    const index = positions.length / 3;
    positions.push(p.x, p.y, p.z); uvs.push(p.x / 4, (material === 2 ? u : surfaceDistance(u, p.x)) / 4); vertices.set(key, index); return index;
  };
  const face = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, material: number, normal: THREE.Vector3, ua: number, ub: number, uc: number, smoothing = material) => {
    const cross = b.clone().sub(a).cross(c.clone().sub(a));
    if (cross.lengthSq() < 1e-18) throw new Error('Degenerate leather triangle.');
    const ia = point(a, ua, material, smoothing), ib = point(b, ub, material, smoothing), ic = point(c, uc, material, smoothing);
    if (cross.dot(normal) > 0) triangles[material].push(ia, ib, ic);
    else triangles[material].push(ia, ic, ib);
  };
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, material: number, normal: THREE.Vector3, u0: number, u1: number, smoothing = material) => {
    // A rapidly rounding outline can make the last surface cell concave.
    // Choose its interior diagonal instead of reversing one folded triangle.
    const orientation = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3) => q.clone().sub(p).cross(r.clone().sub(p)).dot(normal);
    if (orientation(a, b, c) * orientation(b, d, c) < 0 && orientation(a, b, d) * orientation(a, d, c) > 0) {
      face(a, b, d, material, normal, u0, u1, u1, smoothing);
      face(a, d, c, material, normal, u0, u1, u0, smoothing);
      return;
    }
    face(a, b, c, material, normal, u0, u1, u0, smoothing);
    face(b, d, c, material, normal, u1, u1, u0, smoothing);
  };
  const halfWidth = (u: number) => 9 - smooth((u - 4) / 21);
  const height = (u: number, x: number) => {
    const t = smooth((u - 4) / 21), edge = .80 - .10 * t, center = 1.15 - .35 * t;
    return edge + (center - edge) * Math.cos(x / halfWidth(u) * Math.PI / 2) ** 2;
  };
  const skive = (u: number) => .065 * smooth((u - 6) / 2);
  // A semicircular end flows tangentially into the 16 mm sides. The mapping
  // blends before the cap so its longitudinal surface cells stay unfolded.
  const surfaceDistance = (u: number, x: number) => {
    const q = x / halfWidth(u), retreat = withBuckle ? 0 : 8 * (1 - Math.sqrt(Math.max(0, 1 - q * q))) * smooth((u - (length - 16)) / 16);
    return u - retreat;
  };
  const surfaceFrame = (u: number, x: number) => sample(surfaceDistance(u, x));
  const surface = (u: number, x: number, top: boolean) => {
    const f = surfaceFrame(u, x), h = height(u, x);
    const p = f.p.clone().addScaledVector(f.normal, top ? h : -h + skive(u)); p.x = x; return p;
  };
  // Fixed central columns are shared by hole patches and the 1 mm buckle fork.
  const columns = (u: number) => {
    const w = halfWidth(u), out: number[] = [];
    for (let i = 0; i <= 16; i++) out.push(-w + (w - 1.4) * i / 16);
    out.push(-.5, 0, .5, 1.4);
    for (let i = 1; i <= 16; i++) out.push(1.4 + (w - 1.4) * i / 16);
    return out;
  };
  const forkStart = length - 1.8, tailSideStart = length - 4;
  const rowSet = new Set<number>([0, 4, 6, 8, 25, length - 8, tailSideStart, forkStart, length]);
  for (let s = .75; s < length; s += .75) rowSet.add(s);
  for (const s of holes) { rowSet.add(s - 1.6); rowSet.add(s + 1.6); }
  const rows = [...rowSet].filter(s => s >= 0 && s <= length).sort((a, b) => a - b);

  for (let j = 0; j < rows.length - 1; j++) {
    const u0 = rows[j], u1 = rows[j + 1], mid = (u0 + u1) / 2, c0 = columns(u0), c1 = columns(u1);
    for (let i = 0; i < c0.length - 1; i++) {
      if (i >= 16 && i < 20 && holes.some(s => mid > s - 1.6 && mid < s + 1.6)) continue;
      if (withBuckle && i >= 17 && i < 19 && mid > forkStart) continue;
      for (const top of [true, false]) {
        const normal = sample(mid).normal.clone().multiplyScalar(top ? 1 : -1), material = top || mid < 6 ? 0 : 1;
        quad(surface(u0, c0[i], top), surface(u1, c1[i], top), surface(u0, c0[i + 1], top), surface(u1, c1[i + 1], top), material, normal, u0, u1);
      }
    }
  }

  // Only the narrow central patch is triangulated around each oval. The rest
  // of the padded surface retains its dense, regular longitudinal mesh.
  for (const center of holes) {
    const lo = center - 1.6, hi = center + 1.6, innerRows = rows.filter(u => u > lo && u < hi);
    const contour = [-1.4, -.5, 0, .5, 1.4].map(x => new THREE.Vector2(x, lo));
    for (const u of innerRows) contour.push(new THREE.Vector2(1.4, u));
    for (const x of [1.4, .5, 0, -.5, -1.4]) contour.push(new THREE.Vector2(x, hi));
    for (const u of [...innerRows].reverse()) contour.push(new THREE.Vector2(-1.4, u));
    const oval = Array.from({ length: 64 }, (_, i) => { const a = i * Math.PI / 32; return new THREE.Vector2(.65 * Math.cos(a), center + 1.3 * Math.sin(a)); });
    const domain = [...contour, ...oval], patch = THREE.ShapeUtils.triangulateShape(contour, [oval]);
    for (const top of [true, false]) for (const tri of patch) {
      const [a, b, c] = tri.map(i => domain[i]);
      face(surface(a.y, a.x, top), surface(b.y, b.x, top), surface(c.y, c.x, top), top ? 0 : 1,
        sample((a.y + b.y + c.y) / 3).normal.clone().multiplyScalar(top ? 1 : -1), a.y, b.y, c.y);
    }
    for (let i = 0; i < oval.length; i++) {
      const a = oval[i], b = oval[(i + 1) % oval.length], angle = (i + .5) * Math.PI / 32;
      const inward = new THREE.Vector3(-Math.cos(angle) / .65, 0, 0).addScaledVector(sample(center).tangent, -Math.sin(angle) / 1.3).normalize();
      // The punched wall shares positions with the lining but has its own
      // normals; smoothing it into the underside creates false diagonal bands.
      quad(surface(a.y, a.x, true), surface(b.y, b.x, true), surface(a.y, a.x, false), surface(b.y, b.x, false), 1, inward, a.y, b.y, 3);
    }
  }

  const nose = (u: number, x: number, a: number, attachment = false) => {
    const f = surfaceFrame(u, x), h = height(u, x), sk = skive(u);
    const p = f.p.clone().addScaledVector(f.normal, sk / 2 + (h - sk / 2) * Math.cos(a));
    p.addScaledVector(f.tangent, (attachment ? -h : .8) * Math.sin(a)); p.x = x; return p;
  };
  const noseSteps = 24;
  const addNose = (u: number, xs: number[], attachment = false, material = 0) => {
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < noseSteps; j++) {
      const a = Math.PI * j / noseSteps, b = Math.PI * (j + 1) / noseSteps, mid = (a + b) / 2;
      const f = sample(u), normal = f.normal.clone().multiplyScalar(Math.cos(mid)).addScaledVector(f.tangent, (attachment ? -1 : 1) * Math.sin(mid));
      quad(nose(u, xs[i], a, attachment), nose(u, xs[i], b, attachment), nose(u, xs[i + 1], a, attachment), nose(u, xs[i + 1], b, attachment), material, normal, u, u);
    }
  };
  addNose(0, columns(0), true);
  const tailColumns = columns(length);
  if (withBuckle) {
    addNose(length, tailColumns.slice(0, 18)); addNose(length, tailColumns.slice(19));
    addNose(forkStart, [-.5, 0, .5], false, 2);
  } else addNose(length, tailColumns);

  // A local planar side patch makes an actual cross-strap cylindrical bore.
  // Every boundary sample matches the regular grid and the folded nose.
  const sidePatch = (contour3: THREE.Vector3[], hole3: THREE.Vector3[][], sign: number) => {
    // Transform noise can turn a straight edge into microscopic zigzags.
    // Quantize only Earcut's planar input; preserve every real 3D boundary.
    const planar = (p: THREE.Vector3) => new THREE.Vector2(Math.round(p.y * 1e9) / 1e9, Math.round(p.z * 1e9) / 1e9);
    const contour = contour3.map(planar), holes2 = hole3.map(h => h.map(planar));
    const all = [...contour3, ...hole3.flat()];
    for (const tri of THREE.ShapeUtils.triangulateShape(contour, holes2)) {
      const [a, b, c] = tri.map(i => all[i]); face(a, b, c, 2, new THREE.Vector3(sign, 0, 0), a.y, b.y, c.y);
    }
  };
  const boreRing = (u: number, x: number, radius: number) => Array.from({ length: 48 }, (_, i) => {
    const a = i * Math.PI / 24, f = sample(u), p = f.p.clone().addScaledVector(f.tangent, radius * Math.cos(a)).addScaledVector(f.normal, radius * Math.sin(a)); p.x = x; return p;
  });
  const rootSideRows = rows.filter(u => u <= 4), tailSideRows = rows.filter(u => u >= tailSideStart);
  for (const sign of [-1, 1]) {
    const rootContour = [...rootSideRows].reverse().map(u => surface(u, sign * halfWidth(u), true));
    for (let j = 1; j <= noseSteps; j++) rootContour.push(nose(0, sign * 9, Math.PI * j / noseSteps, true));
    for (const u of rootSideRows.slice(1)) rootContour.push(surface(u, sign * halfWidth(u), false));
    sidePatch(rootContour, [boreRing(0, sign * 9, .4)], sign);

    for (let j = 0; j < rows.length - 1; j++) {
      const a = rows[j], b = rows[j + 1]; if (a < 4 || (withBuckle && b > tailSideStart)) continue;
      quad(surface(a, sign * halfWidth(a), true), surface(b, sign * halfWidth(b), true), surface(a, sign * halfWidth(a), false), surface(b, sign * halfWidth(b), false), 2, new THREE.Vector3(sign, 0, 0), a, b);
    }
    if (withBuckle) {
      const endContour = tailSideRows.map(u => surface(u, sign * 8, true));
      for (let j = 1; j <= noseSteps; j++) endContour.push(nose(length, sign * 8, Math.PI * j / noseSteps));
      for (const u of [...tailSideRows].reverse().slice(1)) endContour.push(surface(u, sign * 8, false));
      sidePatch(endContour, [boreRing(length, sign * 8, .29)], sign);

      const forkRows = rows.filter(u => u >= forkStart), forkContour = forkRows.map(u => surface(u, sign * .5, true));
      for (let j = 1; j <= noseSteps; j++) forkContour.push(nose(length, sign * .5, Math.PI * j / noseSteps));
      for (const u of [...forkRows].reverse().slice(1)) forkContour.push(surface(u, sign * .5, false));
      for (let j = noseSteps - 1; j > 0; j--) forkContour.push(nose(forkStart, sign * .5, Math.PI * j / noseSteps));
      sidePatch(forkContour, [boreRing(length, sign * .5, .29)], -sign);
    } else {
      const contour = Array.from({ length: noseSteps + 1 }, (_, j) => nose(length, sign * halfWidth(length), Math.PI * j / noseSteps));
      sidePatch(contour, [], sign);
    }
  }
  const boreWall = (u: number, radius: number, left: number, right: number) => {
    const a = boreRing(u, left, radius), b = boreRing(u, right, radius);
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length, angle = (i + .5) * Math.PI / 24, f = sample(u);
      const inward = f.tangent.clone().multiplyScalar(-Math.cos(angle)).addScaledVector(f.normal, -Math.sin(angle));
      quad(a[i], a[j], b[i], b[j], 1, inward, u, u, 4);
    }
  };
  boreWall(0, .4, -9, 9);
  if (withBuckle) { boreWall(length, .29, -8, -.5); boreWall(length, .29, .5, 8); }

  const geometry = new THREE.BufferGeometry(), index: number[] = [];
  for (let material = 0; material < 3; material++) { geometry.addGroup(index.length, triangles[material].length, material); index.push(...triangles[material]); }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(index); geometry.computeVertexNormals();
  const lining = new THREE.MeshPhysicalMaterial({ color: 0x947a5f, roughness: .88, metalness: 0 });
  const edge = new THREE.MeshPhysicalMaterial({ color: 0x3c2d24, roughness: .64, metalness: 0 });
  const band = new THREE.Mesh(geometry, [hide, lining, edge]); band.name = 'strap_band'; root.add(band);
  // Retain the accepted quiet seam: fine matching thread follows the actual
  // padded surface, with developed spacing that survives a change of pose.
  const thread = new THREE.MeshStandardMaterial({ color: 0x5a4434, roughness: .94 });
  for (const side of [-1, 1]) for (let distance = 3; distance + 1.15 <= length - 3; distance += 2) {
    const path = Array.from({ length: 6 }, (_, i) => {
      const u = distance + 1.15 * i / 5, x = side * .895 * halfWidth(u);
      return surface(u, x, true).addScaledVector(surfaceFrame(u, x).normal, .005);
    });
    const stitch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 6, .045, 6, false), thread);
    stitch.name = 'strap_stitch'; root.add(stitch);
  }
  root.userData.construction = { centerlineLengthMm: length, pinToPinMm: withBuckle ? options.length : null, pinToEndMm: withBuckle ? null : options.length, rootWidthMm: 18, bodyWidthMm: 16, rootThicknessMm: 2.3, bodyThicknessMm: 1.535, rootBoreDiameterMm: .8,
    buckleBoreDiameterMm: withBuckle ? .58 : null, forkWidthMm: withBuckle ? 1 : null, adjustmentHoleCentersMm: holes, adjustmentHoleWidthMm: 1.3, adjustmentHoleLengthMm: 2.6, grainTileMm: 4, joinedReturn: true };
  return root;
}
