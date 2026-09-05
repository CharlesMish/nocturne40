import * as THREE from 'three';

type Frame={t:number;p:THREE.Vector3;tangent:THREE.Vector3;normal:THREE.Vector3};

function roundedRect(x0:number,y0:number,x1:number,y1:number,r:number){
  const s=new THREE.Shape();s.moveTo(x0+r,y0);s.lineTo(x1-r,y0);s.quadraticCurveTo(x1,y0,x1,y0+r);
  s.lineTo(x1,y1-r);s.quadraticCurveTo(x1,y1,x1-r,y1);s.lineTo(x0+r,y1);s.quadraticCurveTo(x0,y1,x0,y1-r);
  s.lineTo(x0,y0+r);s.quadraticCurveTo(x0,y0,x0+r,y0);s.closePath();return s;
}

/** Small physical corrections to the existing hardware; local units are mm. */
export function finishedHardware(bar:THREE.Material,hide:THREE.Material,frames:Frame[]){
  const group=new THREE.Group();group.name='strap_hardware';
  // Follow the leather farther down, leaving a useful two-layer channel above
  // the short strap. This remains an open display pose, not a fitted closure.
  const f=frames[72],halfWidth=9-f.t,top=1.15-.35*f.t,under=-top+.065;
  const minZ=under-.20,maxZ=top+1.535+.25,clearHalfWidth=halfWidth+.24;
  const outer=roundedRect(-clearHalfWidth-.45,minZ-.4,clearHalfWidth+.45,maxZ+.4,.85);
  const hole=roundedRect(-clearHalfWidth,minZ,clearHalfWidth,maxZ,.43);
  outer.holes.push(new THREE.Path(hole.getPoints(12).reverse()));
  const keeperGeometry=new THREE.ExtrudeGeometry(outer,{depth:2.6,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:4,curveSegments:12});
  // Stock extrusion UVs use millimetres; leather is authored as a 4 mm tile.
  const uv=keeperGeometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);
  keeperGeometry.translate(0,0,-1.3);keeperGeometry.rotateX(Math.PI/2);
  const keeper=new THREE.Mesh(keeperGeometry,hide);keeper.name='strap_keeper';keeper.position.copy(f.p);keeper.rotation.x=Math.atan2(f.tangent.z,f.tangent.y);
  keeper.userData.clearance={innerWidthMm:2*(clearHalfWidth-.06),innerHeightMm:maxZ-minZ-.12,secondTailMm:1.535};group.add(keeper);

  const end=frames[96],buckle=new THREE.Group();buckle.name='buckle';buckle.position.copy(end.p);buckle.rotation.x=Math.atan2(end.tangent.z,end.tangent.y);
  // Single U outline: the existing 18.2 by 6 mm envelope and 16.6 mm opening,
  // with real edge radii instead of three coplanar, overlapping boxes.
  const frame=new THREE.Shape();frame.moveTo(-9.02,.08);frame.lineTo(-8.38,.08);frame.lineTo(-8.38,4.98);
  frame.quadraticCurveTo(-8.38,5.28,-8.08,5.28);frame.lineTo(8.08,5.28);frame.quadraticCurveTo(8.38,5.28,8.38,4.98);
  frame.lineTo(8.38,.08);frame.lineTo(9.02,.08);frame.lineTo(9.02,5.22);frame.quadraticCurveTo(9.02,5.92,8.32,5.92);
  frame.lineTo(-8.32,5.92);frame.quadraticCurveTo(-9.02,5.92,-9.02,5.22);frame.closePath();
  const frameGeometry=new THREE.ExtrudeGeometry(frame,{depth:.49,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:5,curveSegments:18});frameGeometry.translate(0,0,-.245);
  const frameMesh=new THREE.Mesh(frameGeometry,bar);frameMesh.name='buckle_frame';buckle.add(frameMesh);
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,17.6,48),bar);pin.rotation.z=Math.PI/2;pin.name='buckle_pin';buckle.add(pin);

  const circle=(r:number)=>Array.from({length:96},(_,i)=>new THREE.Vector2(r*Math.cos(2*Math.PI*i/96),r*Math.sin(2*Math.PI*i/96)));
  const eyeShape=new THREE.Shape(circle(.45));eyeShape.holes.push(new THREE.Path(circle(.285).reverse()));
  const eyeGeometry=new THREE.ExtrudeGeometry(eyeShape,{depth:.55,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:3,curveSegments:48});eyeGeometry.translate(0,0,-.275);eyeGeometry.rotateY(Math.PI/2);
  const eye=new THREE.Mesh(eyeGeometry,bar);eye.name='buckle_tongue_eye';buckle.add(eye);

  // The thin tongue joins the eye and lands on the frame's z=0.325 mm face.
  // XY here is the tongue's longitudinal Y / height Z cross-section.
  const tongueShape=new THREE.Shape();tongueShape.moveTo(.20,.26);tongueShape.bezierCurveTo(.65,.32,1.0,.38,1.5,.39);
  tongueShape.lineTo(5.58,.36);tongueShape.quadraticCurveTo(5.75,.36,5.75,.455);tongueShape.quadraticCurveTo(5.75,.55,5.58,.55);
  tongueShape.lineTo(1.5,.63);tongueShape.bezierCurveTo(.85,.62,.45,.49,.20,.46);tongueShape.closePath();
  const tongueGeometry=new THREE.ExtrudeGeometry(tongueShape,{depth:.33,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:4,curveSegments:18});
  // x -> y, y -> z, z -> x; a proper cyclic rotation preserves winding.
  tongueGeometry.translate(0,0,-.165);tongueGeometry.applyMatrix4(new THREE.Matrix4().set(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1));
  const tongue=new THREE.Mesh(tongueGeometry,bar);tongue.name='buckle_tongue';buckle.add(tongue);
  buckle.userData.dimensions={outerWidthMm:18.2,outerLengthMm:6,frameThicknessMm:.65,openingMm:16.6,pinDiameterMm:.48,eyeMinBoreMm:.53,eyeWidthMm:.59};
  group.add(buckle);return group;
}
