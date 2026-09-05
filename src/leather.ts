import * as THREE from "three";
import { arcStudy } from "./design";

/** Authored padded leather, with a continuous folded nose and a through bore.
 * Local Y follows the strap; local X is the spring-bar axis, all in mm. */
export function paddedLeather(hide: THREE.Material, withBuckle = false, refined = false, constructed = false, seated = false) {
  const root = new THREE.Group(); root.name = 'strap_construction';
  const points = (seated && arcStudy() ? [[3.14,.02],[5.1,.02],[7.6,-.22],[10.8,-1.10],[14.4,-2.85],[18.5,-5.9],[22.2,-10.3],[25.1,-16.6],[26.4,-24]] : seated ? [[3.14,.02],[5.6,.02],[8,-.14],[10.8,-.75],[14.4,-2.5],[18.5,-5.6],[22.2,-10.1],[25.1,-16.6],[26.4,-24]] : constructed ? [[3.14,.02],[5.4,.02],[8,-.20],[11.5,-1.1],[15.5,-3.1],[19.6,-6.7],[23.1,-11.4],[25.4,-17.2],[26.4,-24]] : refined ? [[3.14,.02],[4.4,.02],[6.6,-.22],[9.2,-.8],[12.8,-2.2],
    [17,-5.2],[20.8,-9.6],[23.8,-15],[25.6,-21],[26.1,-24]] : [[3.14,.02],[5.3,.02],[8,-.23],[12.6,-1.6],[17.6,-4.5],
    [22,-9.1],[25,-15],[26.5,-21],[26.8,-24]]).map(([y,z])=>new THREE.Vector3(0,y,z));
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const frames = Array.from({length:97},(_,i)=>{
    const t=i/96, p=curve.getPointAt(t), tangent=curve.getTangentAt(t);
    if (i===0) tangent.set(0,1,0);
    return {t,p,tangent,normal:new THREE.Vector3(0,-tangent.z,tangent.y)};
  });
  // Perimeter descriptors: top, rounded tail, underside, folded attachment.
  const perimeter: {t:number; y:number; z:number; ny:number; nz:number; h:number; kind:number}[]=[];
  const push=(f:typeof frames[number], h:number, kind:number, along=0)=>perimeter.push({
    t:f.t,y:f.p.y+f.tangent.y*along,z:f.p.z+f.tangent.z*along,ny:f.normal.y,nz:f.normal.z,h,kind});
  frames.forEach(f=>push(f,1,0));
  for(let i=1;i<16;i++) {const a=Math.PI*i/16;push(frames[96],Math.cos(a),2,0.8*Math.sin(a));}
  [...frames].reverse().forEach(f=>push(f,-1,1));
  for(let i=1;i<24;i++) {const a=Math.PI*i/24;push(frames[0],-Math.cos(a),0,-1.1*Math.sin(a));}
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  const n=perimeter.length, across=32;
  const length=curve.getLength();
  const surfaceHeight=(t:number,q:number)=>{const edge=refined ? .80-.10*t : .62,center=refined ? 1.15-.35*t : 1.1-.3*t;return edge+(center-edge)*Math.cos(q*Math.PI/2)**2;};
  const sample=(j:number,q:number)=>{
    const f=perimeter[j];
    let ht=surfaceHeight(f.t,q);
    // The return occupies the existing underside thickness. A smooth skive
    // reduces the lining side beyond it, without an overlapping offset sheet.
    if(seated&&f.kind===1){const u=THREE.MathUtils.clamp((f.t-.14)/.055,0,1);ht-=.065*u*u*(3-2*u);}
    // Nose radius also tapers to the edge; top and underside join exactly.
    const nose=j>2*97+14;
    const y=nose ? 3.14+(f.y-3.14)*ht/1.1 : f.y;
    return new THREE.Vector3(q*(9-f.t), y+f.ny*f.h*ht,f.z+f.nz*f.h*ht);
  };
  for(let i=0;i<=across;i++) for(let j=0;j<n;j++) {
    const q=-1+2*i/across,p=sample(j,q); positions.push(p.x,p.y,p.z);uvs.push(seated ? p.x/4 : i/across,seated ? (j<=96 ? perimeter[j].t*length : j>208 ? -Math.PI*1.1*(j-208)/24 : perimeter[j].t*length)/4 : perimeter[j].t);
  }
  const geometry=new THREE.BufferGeometry();
  for(let j=0;j<n;j++) {
    const start=indices.length;
    for(let i=0;i<across;i++) {
      const a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+j,d=(i+1)*n+(j+1)%n;
      indices.push(a,c,b,b,c,d);
    }
    geometry.addGroup(start,indices.length-start,perimeter[j].kind===1 && !(seated && perimeter[j].t<.18) ? 1 : 0);
  }
  // Edge-painted end faces with a real spring-bar hole, including its lining.
  const boreRadius=refined ? .4 : .29;
  const bore=Array.from({length:48},(_,i)=>new THREE.Vector2(3.14+boreRadius*Math.cos(i/48*2*Math.PI),.02+boreRadius*Math.sin(i/48*2*Math.PI)));
  const end = frames[96].p;
  const bores = [bore];
  if (withBuckle) bores.push(Array.from({length:48},(_,i)=>new THREE.Vector2(end.y+.29*Math.cos(i/48*2*Math.PI),end.z+.29*Math.sin(i/48*2*Math.PI))));
  const holeBases:number[][]=[[],[]];
  for(const sign of [-1,1]) {
    const contour=Array.from({length:n},(_,j)=>{const p=sample(j,sign);return new THREE.Vector2(p.y,p.z);});
    const base=positions.length/3;
    for(let j=0;j<n;j++) {const p=sample(j,sign);positions.push(p.x,p.y,p.z);uvs.push(perimeter[j].t,.5);}
    bores.forEach((hole,k)=>{
      holeBases[sign<0?0:1].push(positions.length/3);
      for(const p of hole) {positions.push(sign*(k===0?9:8),p.x,p.y);uvs.push(.5,.5);}
    });
    const start=indices.length;
    for(const tri of THREE.ShapeUtils.triangulateShape(contour,bores)) {
      const [a,b,c]=tri.map(k=>base+k);
      // Orient explicitly from coordinates, independent of triangulator winding.
      const ab=new THREE.Vector3().fromArray(positions,b*3).sub(new THREE.Vector3().fromArray(positions,a*3));
      const ac=new THREE.Vector3().fromArray(positions,c*3).sub(new THREE.Vector3().fromArray(positions,a*3));
      if(ab.cross(ac).x*sign>0) indices.push(a,b,c); else indices.push(a,c,b);
    }
    geometry.addGroup(start,indices.length-start,2);
  }
  const start=indices.length;
  for(let k=0;k<bores.length;k++) for(let j=0;j<48;j++) {const a=holeBases[0][k]+j,b=holeBases[0][k]+(j+1)%48,c=holeBases[1][k]+j,d=holeBases[1][k]+(j+1)%48;indices.push(a,c,b,b,c,d);}
  geometry.addGroup(start,indices.length-start,1);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const lining=new THREE.MeshPhysicalMaterial({color:0x947a5f,roughness:.88,metalness:0});
  const edge=new THREE.MeshPhysicalMaterial({color:0x3c2d24,roughness:.64,metalness:0});
  const band=new THREE.Mesh(geometry,[hide,lining,edge]);band.name='strap_band'; root.add(band);
  if (constructed && !seated) {
    // Skived return under the attachment: follows the same surface instead of
    // placing a flat patch across the bend. It tapers into the lining at the end.
    const under: number[]=[], uv:number[]=[], tris:number[]=[];
    const rows=18, cols=24;
    for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++) {
      const t=.018+.17*j/rows, q=(-1+2*i/cols)*.975;
      const p=curve.getPointAt(t), d=curve.getTangentAt(t), normal=new THREE.Vector3(0,-d.z,d.y);
      const edge=.8-.1*t, h=edge+(1.15-.35*t-edge)*Math.cos(q*Math.PI/2)**2;
      const skive=.035+.13*Math.sin(Math.PI*j/rows);
      p.addScaledVector(normal,-h-skive);p.x=q*(9-t);
      under.push(p.x,p.y,p.z);uv.push(i/cols,t);
      if(j<rows&&i<cols){const a=j*(cols+1)+i,b=a+cols+1;tris.push(a,b,a+1,a+1,b,b+1);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(under,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(tris);g.computeVertexNormals();
    const fold=new THREE.Mesh(g,lining);fold.name='strap_skived_return';root.add(fold);
    // Fine matching thread, about 0.09 mm diameter, kept inside the painted edge.
    const thread=new THREE.MeshStandardMaterial({color:0x5a4434,roughness:.94});
    for(const side of [-1,1]) for(let j=0;j<18;j++) {
      const t=.07+j*.047;
      const path=Array.from({length:5},(_,i)=>{
        const u=t+.027*i/4, q=side*.895, p=curve.getPointAt(u), d=curve.getTangentAt(u);
        const edge=.8-.1*u,h=edge+(1.15-.35*u-edge)*Math.cos(q*Math.PI/2)**2;
        p.addScaledVector(new THREE.Vector3(0,-d.z,d.y),h+.025);p.x=q*(9-u);return p;
      });
      const stitch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),6,.045,6,false),thread);stitch.name='strap_stitch';root.add(stitch);
    }
  }
  if(seated){
    const thread=new THREE.MeshStandardMaterial({color:0x5a4434,roughness:.94});
    for(const side of [-1,1]) for(let distance=3;distance<length-3;distance+=2){
      const path=Array.from({length:6},(_,i)=>{const t=(distance+1.15*i/5)/length,q=side*.895,p=curve.getPointAt(t),d=curve.getTangentAt(t);p.addScaledVector(new THREE.Vector3(0,-d.z,d.y),surfaceHeight(t,q)+.005);p.x=q*(9-t);return p;});
      const stitch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),6,.045,6,false),thread);stitch.name='strap_stitch';root.add(stitch);
    }
    root.userData.construction={joinedReturn:true,returnLengthMm:.18*length,skiveDepthMm:.065,grainTileMm:4};
  }
  root.userData.dimensions={width:18,tailWidth:16,attachmentThickness:refined?2.3:2.2,tailThickness:seated?1.535:1.6,edgeThickness:refined?1.6:1.24,boreDiameter:boreRadius*2};
  return {root,frames};
}

export function fittedHardware(bar:THREE.Material, hide:THREE.Material, frames:ReturnType<typeof paddedLeather>['frames'], refined = false) {
  const group=new THREE.Group(); group.name='strap_hardware';
  // Cross-section in XZ, centered on the revised path. The keeper clears leather
  // on every side; no inherited translation or width multiplier is retained.
  const f=frames[48],hw=9-f.t+.28,ht=(refined ? 1.15-.35*f.t : 1.1-.3*f.t)+.25;
  const shape=new THREE.Shape();shape.moveTo(-hw-.55,-ht-.45);shape.lineTo(hw+.55,-ht-.45);shape.lineTo(hw+.55,ht+.45);shape.lineTo(-hw-.55,ht+.45);shape.closePath();
  const hole=new THREE.Path();hole.moveTo(-hw,-ht);hole.lineTo(-hw,ht);hole.lineTo(hw,ht);hole.lineTo(hw,-ht);hole.closePath();shape.holes.push(hole);
  const g=new THREE.ExtrudeGeometry(shape,{depth:2.6,bevelEnabled:true,bevelSize:.10,bevelThickness:.10,bevelSegments:3});
  g.translate(0,0,-1.3);g.rotateX(Math.PI/2);
  const keeper=new THREE.Mesh(g,hide);keeper.name='strap_keeper';keeper.position.copy(f.p);keeper.rotation.x=Math.atan2(f.tangent.z,f.tangent.y);group.add(keeper);
  const end=frames[96], buckle=new THREE.Group();buckle.name='buckle';buckle.position.copy(end.p);buckle.rotation.x=Math.atan2(end.tangent.z,end.tangent.y);
  const metal=(w:number,h:number,d:number,x:number,y:number,z:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bar);m.position.set(x,y,z);buckle.add(m);};
  // 16.6 mm clear opening for the 16 mm tail. Frame begins beyond the leather tip.
  metal(.8,6,.65,-8.7,3,0);metal(.8,6,.65,8.7,3,0);metal(18.2,.8,.65,0,5.6,0);
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,17.6,48),bar);
  pin.rotation.z=Math.PI/2;pin.name='buckle_pin';buckle.add(pin);
  metal(.35,5.5,.3,0,2.7,.5);group.add(buckle);
  return group;
}
