import * as THREE from 'three';

/** Local polygonal blind bore. Clips only the inner lug surface; retains its
 * interpolated normals and all remote geometry. Coordinates are lug-local mm. */
export function receiveSpringTip(source:THREE.BufferGeometry, sign:number){
  type V={p:THREE.Vector3;n:THREE.Vector3;uv:THREE.Vector2};
  const count=48,r=.25,cy=3.14,cz=-.18,depth=9.68;
  const planes=Array.from({length:count},(_,i)=>{const a=(i+.5)*Math.PI*2/count;return [Math.cos(a),Math.sin(a)]});
  const apothem=r*Math.cos(Math.PI/count);
  const value=(v:V,i:number)=>planes[i][0]*(v.p.y-cy)+planes[i][1]*(v.p.z-cz)-apothem;
  const clip=(poly:V[],i:number,inside:boolean)=>{
    const out:V[]=[];
    for(let j=0;j<poly.length;j++){
      const a=poly[j],b=poly[(j+1)%poly.length],da=value(a,i),db=value(b,i);
      const ina=inside?da<=0:da>=0,inb=inside?db<=0:db>=0;
      if(ina)out.push(a);
      if(ina!==inb){const t=da/(da-db);out.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t)});}
    }return out;
  };
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[];
  const emit=(a:V,b:V,c:V)=>{for(const v of [a,b,c]){positions.push(...v.p.toArray());normals.push(...v.n.toArray());uvs.push(...v.uv.toArray());}};
  const edges=new Map<string,[V,V]>();
  const key=(p:THREE.Vector3)=>p.toArray().map(x=>x.toFixed(6)).join(',');
  const boundary=(poly:V[])=>{
    for(let j=0;j<poly.length;j++){
      const a=poly[j],b=poly[(j+1)%poly.length];
      if(a.p.distanceToSquared(b.p)<1e-16)continue;
      if(planes.some((_,i)=>Math.abs(value(a,i))<1e-7&&Math.abs(value(b,i))<1e-7)&&planes.every((_,i)=>value(a,i)<1e-7&&value(b,i)<1e-7))edges.set([key(a.p),key(b.p)].sort().join('|'),[a,b]);
    }
  };
  const emitPoly=(poly:V[])=>{for(let j=1;j<poly.length-1;j++)emit(poly[0],poly[j],poly[j+1]);};
  const pos=source.attributes.position,nor=source.attributes.normal,uv=source.attributes.uv,index=source.index!;
  for(let i=0;i<index.count;i+=3){
    const tri=Array.from({length:3},(_,j)=>{const k=index.getX(i+j);return {p:new THREE.Vector3().fromBufferAttribute(pos,k),n:new THREE.Vector3().fromBufferAttribute(nor,k),uv:new THREE.Vector2(uv.getX(k),uv.getY(k))}});
    if(tri.some(v=>sign*v.p.x>=depth)||Math.min(...tri.map(v=>v.p.y))>cy+r||Math.max(...tri.map(v=>v.p.y))<cy-r||Math.min(...tri.map(v=>v.p.z))>cz+r||Math.max(...tri.map(v=>v.p.z))<cz-r){emitPoly(tri);continue;}
    let remaining=tri;
    for(let j=0;j<count&&remaining.length>=3;j++){emitPoly(clip(remaining,j,false));remaining=clip(remaining,j,true);}
    boundary(remaining);
  }
  const triangle=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,normal:THREE.Vector3)=>{
    if(b.clone().sub(a).cross(c.clone().sub(a)).dot(normal)<0)[b,c]=[c,b];
    emit(...[a,b,c].map(p=>({p,n:normal,uv:new THREE.Vector2()})) as [V,V,V]);
  };
  for(const [a,b] of edges.values()){
    const c=a.p.clone().setX(sign*depth),d=b.p.clone().setX(sign*depth);
    const n=new THREE.Vector3(0,cy-(a.p.y+b.p.y)/2,cz-(a.p.z+b.p.z)/2).normalize();
    triangle(a.p,b.p,c,n);triangle(b.p,d,c,n);
    triangle(c,d,new THREE.Vector3(sign*depth,cy,cz),new THREE.Vector3(-sign,0,0));
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.userData.socket={diameter:.5,depth:.5,axis:[cy,cz],boundarySegments:edges.size};return g;
}

