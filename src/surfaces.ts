import * as THREE from "three";

/** Small edge breaks retain the authored planes; they do not smooth the whole case. */
export function refinedLathe(points: THREE.Vector2[], segments = 512, edgeBreak = 0.045, analytic = false) {
  const closed = points[0].distanceTo(points[points.length - 1]) < 1e-7;
  const source = closed ? points.slice(0, -1) : points;
  const path: THREE.Vector2[] = [];
  const meridianNormals: THREE.Vector2[] = [];
  for (let i = 0; i < source.length; i++) {
    const p = source[i];
    if (!closed && (i === 0 || i === source.length - 1)) {
      path.push(p.clone());
      const d=i===0 ? source[1].clone().sub(p) : p.clone().sub(source[i-1]);
      meridianNormals.push(new THREE.Vector2(d.y,-d.x).normalize()); continue;
    }
    const prev = source[(i + source.length - 1) % source.length];
    const next = source[(i + 1) % source.length];
    const cut = Math.min(edgeBreak, p.distanceTo(prev) * 0.2, p.distanceTo(next) * 0.2);
    const a = p.clone().lerp(prev, cut / p.distanceTo(prev));
    const b = p.clone().lerp(next, cut / p.distanceTo(next));
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      path.push(a.clone().multiplyScalar((1-t)**2).addScaledVector(p, 2*t*(1-t)).addScaledVector(b, t*t));
      const d=p.clone().sub(a).multiplyScalar(1-t).addScaledVector(b.clone().sub(p),t);
      meridianNormals.push(new THREE.Vector2(d.y,-d.x).normalize());
    }
  }
  if (closed) { path.push(path[0].clone()); meridianNormals.push(meridianNormals[0].clone()); }
  const geometry = new THREE.LatheGeometry(path, segments);
  geometry.rotateX(Math.PI / 2);
  if (analytic) {
    const normals=[];
    for(let i=0;i<=segments;i++) for(const n of meridianNormals) {
      const a=i/segments*Math.PI*2;normals.push(n.x*Math.sin(a),-n.x*Math.cos(a),n.y);
    }
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  }
  // Anisotropic steel needs a continuous azimuth tangent. Screen derivatives
  // across the long lathe quads produced alternating triangular highlights.
  const tangents: number[]=[];
  for(let i=0;i<=segments;i++) for(let j=0;j<path.length;j++) {
    const a=i/segments*Math.PI*2; tangents.push(Math.cos(a),Math.sin(a),0,1);
  }
  geometry.setAttribute('tangent',new THREE.Float32BufferAttribute(tangents,4));
  return geometry;
}

/** A closed 0.30 mm optical shell. Dimensions remain local millimetres. */
export function crystalShell(analytic = false) {
  const radius = 16.48, sag = 1.55, rim = 0.16, thickness = 0.30;
  const R = (radius * radius + sag * sag) / (2 * sag);
  const theta = Math.asin(radius / R);
  const pts = [new THREE.Vector2(radius + 0.05, 0), new THREE.Vector2(radius, 0.03)];
  for (let i = 0; i <= 80; i++) {
    const t = theta * (1 - i / 80);
    pts.push(new THREE.Vector2(Math.sin(t)*R, rim + Math.cos(t)*R - (R-sag)));
  }
  for (let i = 80; i >= 0; i--) {
    const t = theta * (1 - i / 80);
    pts.push(new THREE.Vector2(Math.sin(t)*R, rim + Math.cos(t)*R - (R-sag) - thickness));
  }
  pts.push(pts[0].clone());
  const geometry = new THREE.LatheGeometry(pts, 512);
  geometry.rotateX(Math.PI / 2);
  if (analytic) {
    const pos=geometry.attributes.position, normal=geometry.attributes.normal;
    for(let i=0;i<pos.count;i++) {
      const j=i%pts.length;
      if(j<2||j>163)continue;
      const sign=j<=82 ? 1 : -1;
      const x=pos.getX(i)/R,y=pos.getY(i)/R;
      normal.setXYZ(i,sign*x,sign*y,sign*Math.sqrt(Math.max(0,1-x*x-y*y)));
    }
  }
  return geometry;
}

export function opticalGlass(coated = false) {
  const material = new THREE.MeshPhysicalMaterial({color: 0xffffff, metalness: 0,
    roughness: 0.005, transmission: 1, ior: 1.5, thickness: 0.30,
    opacity: 1, transparent: false, side: THREE.FrontSide, envMapIntensity: 0.8,
    specularIntensity: coated ? 0.32 : 1});
  // The studio cards represent finite photographic sources. Exclude the
  // viewer's legacy punctual specular lobe on this material only.
  material.onBeforeCompile = shader => {
    // Three's minimum specular roughness also selects a blurred transmission
    // mip. Keep the polished optical image sharp while retaining that floor
    // for reflection antialiasing.
    shader.fragmentShader = shader.fragmentShader.replace('#include <transmission_pars_fragment>',
      THREE.ShaderChunk.transmission_pars_fragment.replace(
        'float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );',
        'float lod = 0.0;'));
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>',
      '#include <lights_fragment_end>\nreflectedLight.directSpecular = vec3(0.0);');
  };
  material.customProgramCacheKey = () => 'nocturne-card-glass-v2';
  return material;
}

export function reflectionStudio(bright = false, flank = false) {
  const room = new THREE.Scene();
  room.background = bright ? new THREE.Color().setRGB(.85,.85,.85) : new THREE.Color().setRGB(0.45, 0.46, 0.48);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d')!; const data=ctx.createImageData(128,128);
  const smooth=(x:number)=>{const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
  for(let y=0;y<128;y++) for(let x=0;x<128;x++) {
    const i=(y*128+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=255;
    const feather = bright ? 5 : flank ? 28 : 18;
    data.data[i+3]=255*smooth(Math.min(x,127-x)/feather)*smooth(Math.min(y,127-y)/feather);
  }
  ctx.putImageData(data,0,0);const map=new THREE.CanvasTexture(canvas);
  const cards = bright
    ? [[-4,2,5,2,8,3.2], [4,-1,4,1.2,8,.025], [0,5,2,8,2,2.4]]
    : flank ? [[-4,2,4,5,8,2.2],[4,-1,1,2,7,.10],[0,5,2,7,3,1.4]] : [[-3,4,6,6,1.5,2.2], [5,1,2,2,7,2], [-4,-3,1,2,5,1.4]];
  for (const [x,y,z,w,h,power] of cards) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({
      color: new THREE.Color().setScalar(power), map, transparent:true, side: THREE.DoubleSide}));
    card.position.set(x,y,z); card.lookAt(0,0,0); room.add(card);
  }
  return room;
}
