import * as THREE from 'three';
import { buildWearableLeather } from './wearable-leather';
import { finishedHardware } from './strap-hardware';

export type WearableOptions={pose:'open'|'closed';circumference:number};
type Sample={p:THREE.Vector3;tangent:THREE.Vector3;normal:THREE.Vector3};
const SHORT=65,LONG=115,HOLE_PITCH=6;
const COS=Math.cos(.21),SIN=Math.sin(.21);
const world=(y:number,z:number)=>new THREE.Vector3(0,y,z);
const local=(p:THREE.Vector3,withBuckle:boolean)=>{
  const y=(withBuckle?p.y:-p.y)-19.1,z=p.z+.35;
  return world(COS*y-SIN*z,SIN*y+COS*z+.2);
};

/** Piecewise arc-length lookup. Samples and dimensions use developed mm, so a
 * different pose changes curvature without multiplying the leather's length. */
class MeasuredPath{
  readonly distances:number[]=[0];readonly length:number;
  constructor(readonly points:THREE.Vector3[]){
    for(let i=1;i<points.length;i++)this.distances.push(this.distances[i-1]+points[i].distanceTo(points[i-1]));
    this.length=this.distances.at(-1)!;
  }
  sample(s:number):Sample{
    const distance=THREE.MathUtils.clamp(s,0,this.length);let lo=0,hi=this.distances.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(this.distances[mid]<=distance)lo=mid;else hi=mid;}
    const t=(distance-this.distances[lo])/(this.distances[hi]-this.distances[lo]||1);
    const p=this.points[lo].clone().lerp(this.points[hi],t);
    const a=this.points[Math.min(lo+1,this.points.length-1)].clone().sub(this.points[Math.max(0,lo-1)]).normalize();
    const b=this.points[Math.min(hi+1,this.points.length-1)].clone().sub(this.points[Math.max(0,hi-1)]).normalize();
    const tangent=a.lerp(b,t).normalize();return {p,tangent,normal:world(-tangent.z,tangent.y)};
  }
}
function bezier(points:THREE.Vector3[],t:number){const p=points.map(v=>v.clone());for(let n=p.length-1;n>0;n--)for(let i=0;i<n;i++)p[i].lerp(p[i+1],t);return p[0];}
const smooth=(t:number)=>{const u=THREE.MathUtils.clamp(t,0,1);return u*u*(3-2*u);};
function ellipse(circumference:number){
  const ratio=1.35,h=((ratio-1)/(ratio+1))**2;
  const b=circumference/(Math.PI*(ratio+1)*(1+3*h/(10+Math.sqrt(4-3*h))));
  return {a:ratio*b,b,zc:-3.57-b};
}
function guide(circumference:number,clearance:number){
  const {a,b,zc}=ellipse(circumference),r=world(19.1+COS*3.14-SIN*.18,-.35-SIN*3.14-COS*.18),t=world(COS,-SIN);
  const q=r.clone().addScaledVector(t,1.96),end=world(a+clearance,zc),k=1/(b*b/a+clearance);
  const control=[q,q.clone().addScaledVector(t,4),q.clone().addScaledVector(t,8),end.clone().add(world(-20*k,8)),end.clone().add(world(0,4)),end];
  const points=[r,q];for(let i=1;i<=320;i++)points.push(bezier(control,i/320));
  for(let i=1;i<=420;i++){
    const angle=Math.PI/2+i/420*Math.PI/2,normal=world(Math.sin(angle)/a,Math.cos(angle)/b).normalize();
    points.push(world(a*Math.sin(angle),zc+b*Math.cos(angle)).addScaledVector(normal,clearance));
  }
  points.push(...points.slice(0,-1).reverse().map(p=>world(-p.y,p.z)));
  return new MeasuredPath(points);
}
function shortPath(base:MeasuredPath){
  // Lift the last twelve developed millimetres enough for the returning leather
  // to clear the underside of the buckle. Reintegrate that lift before trimming.
  const construct=(end:number)=>new MeasuredPath(Array.from({length:521},(_,i)=>{
    const s=end*i/520,f=base.sample(s);return f.p.addScaledVector(f.normal,1.8*smooth((s-end+12)/12));
  }));
  let lo=60,hi=65;for(let i=0;i<28;i++){const mid=(lo+hi)/2;if(construct(mid).length>SHORT)hi=mid;else lo=mid;}
  const end=(lo+hi)/2;return {path:construct(end),guideEnd:end};
}
function closure(circumference:number,clearance:number){
  const base=guide(circumference,clearance),short=shortPath(base),pin=short.path.sample(SHORT);
  const at=(y:number,z:number)=>pin.p.clone().addScaledVector(pin.tangent,y).addScaledVector(pin.normal,z);
  const source=short.guideEnd+16,points:THREE.Vector3[]=[];
  const append=(p:THREE.Vector3)=>{if(!points.length||points.at(-1)!.distanceToSquared(p)>1e-18)points.push(p);};
  for(let s=base.length;s>source;s-=.18)append(base.sample(s).p);append(base.sample(source).p);
  const start=base.sample(source),landing=at(7.8,-1.24);
  const connection=[start.p,start.p.clone().addScaledVector(start.tangent,-3),landing.clone().addScaledVector(pin.tangent,2.4),landing];
  for(let i=1;i<=80;i++)append(bezier(connection,i/80));
  const line=(p:THREE.Vector3,steps=32)=>{const first=points.at(-1)!.clone();for(let i=1;i<=steps;i++)append(first.clone().lerp(p,i/steps));};
  // The ramp's actual hole plane crosses the existing curved tongue at z=.505.
  // A 2.6 by 1.3 mm punched oval clears the oblique passage of its thin section.
  const rampStart={y:4.90,z:-1.24},rampEnd={y:.55,z:2.43};
  const ramp=world(rampEnd.y-rampStart.y,rampEnd.z-rampStart.z).normalize();
  const turn=Math.acos(-ramp.y),radius=1.4,trim=radius*Math.tan(turn/2);
  const turnStart={y:rampStart.y+trim,z:rampStart.z};
  line(at(turnStart.y,turnStart.z));
  for(let i=1;i<=56;i++){
    const angle=turn*i/56;
    append(at(turnStart.y-radius*Math.sin(angle),turnStart.z+radius*(1-Math.cos(angle))));
  }
  const ratio=(.505-rampStart.z)/(rampEnd.z-rampStart.z);
  const holePoint=at(THREE.MathUtils.lerp(rampStart.y,rampEnd.y,ratio),.505);
  line(holePoint);const holeIndex=points.length-1;line(at(rampEnd.y,rampEnd.z));
  const tailJoin=short.path.sample(SHORT-7),tailLanding=tailJoin.p.clone().addScaledVector(tailJoin.normal,1.72);
  const transition=[points.at(-1)!.clone(),at(rampEnd.y+ramp.y*1.9,rampEnd.z+ramp.z*1.9),tailLanding.clone().addScaledVector(tailJoin.tangent,2),tailLanding];
  for(let i=1;i<=72;i++)append(bezier(transition,i/72));
  for(let s=SHORT-7-.18;s>=8;s-=.18){const f=short.path.sample(s);append(f.p.addScaledVector(f.normal,1.72));}
  const long=new MeasuredPath(points);
  return {short:short.path,long,holeDistance:long.distances[holeIndex],holePoint,pin,clearance,guideLength:base.length};
}
let middleHole:number|undefined;
const cached=new Map<number,ReturnType<typeof fit>>();
function fit(circumference:number){
  middleHole??=closure(170,1).holeDistance;
  const holes=Array.from({length:7},(_,i)=>middleHole!+(i-3)*HOLE_PITCH),initial=closure(circumference,1);
  let index=holes.findIndex(s=>s>=initial.holeDistance-1e-5);
  if(index<0)return {...initial,holes,index:6,fitted:false,reason:'The largest hole does not close over this reference.'};
  const target=holes[index];let lo=1,hi=3.5;
  if(closure(circumference,hi).holeDistance<target)return {...initial,holes,index,fitted:false,reason:'No closure within the allowed clearance envelope.'};
  for(let i=0;i<29;i++){const mid=(lo+hi)/2;if(closure(circumference,mid).holeDistance>target)hi=mid;else lo=mid;}
  return {...closure(circumference,(lo+hi)/2),holes,index,fitted:true,reason:''};
}
function fitted(circumference:number){let result=cached.get(circumference);if(!result){result=fit(circumference);cached.set(circumference,result);}return result;}
function openPath(length:number){
  const points=[world(3.14,.02)];
  const steps=Math.ceil(length/.16),ds=length/steps;
  for(let i=0;i<steps;i++){const s=(i+.5)*ds,angle=.14*(1-Math.exp(-Math.max(0,s-4)/16));points.push(points.at(-1)!.clone().add(world(Math.cos(angle)*ds,Math.sin(angle)*ds)));}
  return new MeasuredPath(points);
}

export function wearableSpecification(circumference=170){
  const f=fitted(circumference);
  return {shortPinToPinMm:SHORT,longPinToEndMm:LONG,holePitchMm:HOLE_PITCH,holeCentersMm:f.holes,selectedHole:f.index+1,requestedCircumferenceMm:circumference,centerlineClearanceMm:f.clearance,closed:f.fitted,reason:f.reason,engagementDistanceMm:f.holeDistance,engagementErrorMm:f.holeDistance-f.holes[f.index],guideLengthMm:f.guideLength};
}

export function createWearableStrap(hide:THREE.Material,bar:THREE.Material,withBuckle:boolean,options:WearableOptions){
  const fit=fitted(options.circumference),closed=options.pose==='closed'&&fit.fitted,length=withBuckle?SHORT:LONG;
  const path=closed?new MeasuredPath((withBuckle?fit.short:fit.long).points.map(p=>local(p,withBuckle))):openPath(length);
  const sample=(s:number)=>path.sample(s);
  const root=buildWearableLeather(hide,{length,sample,withBuckle,holes:withBuckle?[]:fit.holes});
  root.name='strap_construction';root.userData.wearable={...wearableSpecification(options.circumference),closed,closureAvailable:fit.fitted,pose:closed?'closed':'open',requestedPose:options.pose,part:withBuckle?'buckle':'tail',developedLengthMm:length,availablePathLengthMm:path.length};
  if(withBuckle){
    const frames=Array.from({length:97},(_,i)=>({t:i/96,...sample(length*i/96)}));
    const hardware=finishedHardware(bar,hide,frames),keeper=hardware.getObjectByName('strap_keeper')!;
    // A floating keeper follows the amount of tail beyond the chosen real hole.
    const keeperDistance=THREE.MathUtils.clamp((LONG-fit.holes[fit.index]-8)*.6,8,18),keeperFrame=sample(SHORT-keeperDistance);
    keeper.position.copy(keeperFrame.p);keeper.rotation.x=Math.atan2(keeperFrame.tangent.z,keeperFrame.tangent.y);
    keeper.userData.distanceFromPinMm=keeperDistance;
    root.add(hardware);
  }
  return root;
}
