import assert from 'node:assert/strict';
import { Vector3, Quaternion, PerspectiveCamera } from './node_modules/three/build/three.module.js';
import { waypoints, planetSpecs, moonOffsets, flightCurve, sampleFlight, scrollToTravel, dampTravel, moonTour, travelToDistance, traceDrop } from './flight-path.js';

const position = new Vector3(), rotation = new Quaternion();
for (let i = 0; i < waypoints.length; i++) {
  assert(scrollToTravel(i)===i,'A snapped section must use its exact camera waypoint');
  sampleFlight(i, position, rotation);
  assert(position.distanceTo(waypoints[i]) < 1e-8, 'Arrival must reach its waypoint');
  assert(Math.abs(rotation.length() - 1) < 1e-8);
}
assert(scrollToTravel(-1)===0 && scrollToTravel(5)===4,'Scroll must stay within the five stations');
assert(scrollToTravel(.1)>.08 && scrollToTravel(.9)<.92,'Manual scroll must move the camera near station edges without a dead zone');
const line = waypoints[4].clone().sub(waypoints[0]).normalize();
assert(waypoints.some(point => point.clone().sub(waypoints[0]).cross(line).length() > 20), 'Route regressed to a straight line');
assert(Math.max(...waypoints.map(p => p.y)) - Math.min(...waypoints.map(p => p.y)) > 12, 'Route lost vertical depth');
let clearance = Infinity;
for (let i = 0; i <= 1000; i++) {
  sampleFlight(i / 250, position, rotation);
  assert(flightCurve.getPointAt(travelToDistance(i / 250)).distanceTo(position) < .001, 'Trace progress no longer matches the camera position');
  assert([...position, ...rotation].every(Number.isFinite));
  for (const planet of planetSpecs) clearance = Math.min(clearance, position.distanceTo(planet.position) - planet.radius);
}
assert(clearance > 2, `Route intersects a planet: clearance ${clearance}`);
assert(travelToDistance(0) === 0 && travelToDistance(4) === 1, 'Trace must cover the complete flight');
// Project the future route into the open window throughout the journey.
let framed = 0;
for (const [variant,width,height] of [['A',1440,900],['B',1085,738],['C',1380,648],['A',1280,720],['B',925,590.4],['C',1220,518.4]]) {
  const camera = new PerspectiveCamera(43, width / height, .1, 160), projected = new Vector3();
  camera.setViewOffset(width,height,variant === 'A' ? -width*.03 : 0,height*.08,width,height);
  for (let i=0;i<=156;i++) {
    const travel=i/40;
    sampleFlight(travel,camera.position,camera.quaternion); camera.updateMatrixWorld();
    let visible=0;
    for (let j=1;j<=40;j++) {
      const distance=travelToDistance(travel)+j*.004;
      if (distance>1) continue;
      flightCurve.getPointAt(distance,projected); projected.y-=traceDrop(distance); projected.project(camera);
      if (Math.abs(projected.x)<.82 && projected.y>-.6 && projected.y<.42 && projected.z>-1 && projected.z<1) visible++;
    }
    assert(visible>=5, `${variant}: route leaves the window at travel ${travel}`);
    framed++;
  }
  for (const [i,planet] of planetSpecs.entries()) {
    sampleFlight(i+1,camera.position,camera.quaternion); camera.updateMatrixWorld();
    const right = new Vector3(1,0,0).applyQuaternion(camera.quaternion);
    const vertical = new Vector3(0,1,0).applyQuaternion(camera.quaternion);
    for (const edge of [right,right.clone().negate(),vertical,vertical.clone().negate()]) {
      projected.copy(planet.position).addScaledVector(edge,planet.radius).project(camera);
      assert(projected.x>.05 && projected.x<.85 && projected.y>-.6 && projected.y<.64 && projected.z<1, `${variant}: arrival planet clips the window`);
    }
  }
}
for (const offset of moonOffsets) {
  const moon = planetSpecs[0].position.clone().add(offset), tour = moonTour(waypoints[1], moon);
  assert(tour.getPoint(0).distanceTo(waypoints[1]) < 1e-8);
  assert(tour.getPoint(1).distanceTo(moon) > 3, 'Moon approach gets too close');
  for (let i = 0; i <= 200; i++) assert(tour.getPoint(i / 200).distanceTo(planetSpecs[0].position) > planetSpecs[0].radius + .5, 'Moon tour intersects its parent planet');
}
for (const [width,height] of [[1440,900],[1280,720],[1290,955],[1068,955]]) {
  const camera=new PerspectiveCamera(43,width/height,.1,160), projected=new Vector3();
  sampleFlight(1,camera.position,camera.quaternion);
  camera.setViewOffset(width,height,-width*.03,height*.08,width,height); camera.updateMatrixWorld();
  const right=new Vector3(1,0,0).applyQuaternion(camera.quaternion), vertical=new Vector3(0,1,0).applyQuaternion(camera.quaternion);
  for (const offset of moonOffsets) {
    const moon=planetSpecs[0].position.clone().add(offset);
    assert(offset.length()>planetSpecs[0].radius+.7,'A moon intersects its parent');
    for (const edge of [right,right.clone().negate(),vertical,vertical.clone().negate()]) {
      projected.copy(moon).addScaledVector(edge,.67).project(camera);
      assert(projected.x>.04 && projected.x<.9 && projected.y>-.24 && projected.y<.6 && projected.z<1,`${width}x${height}: project moon clips the open window`);
    }
    const tour=moonTour(waypoints[1],moon);
    for (let i=0;i<=200;i++) for (const other of moonOffsets) {
      assert(tour.getPoint(i/200).distanceTo(planetSpecs[0].position.clone().add(other))>1,'Moon tour intersects another moon');
    }
    for (let i=0;i<=40;i++) {
      projected.lerpVectors(tour.getPoint(1),moon,i/40);
      assert(projected.distanceTo(planetSpecs[0].position)>planetSpecs[0].radius+.15,'Parent planet hides the selected moon at the end of its approach');
    }
  }
}
for (const boundary of [1, 2, 3]) {
  const before = flightCurve.getTangent(boundary / 4 - 1e-5), after = flightCurve.getTangent(boundary / 4 + 1e-5);
  assert(before.angleTo(after) < .01, 'Route has an abrupt corner');
  assert(Math.abs(scrollToTravel(boundary - 1e-5) - scrollToTravel(boundary + 1e-5)) < .001, 'Scroll has a segment jump');
}
let current = 0;
for (let i = 0; i < 60; i++) current = dampTravel(current, 1, 1 / 60);
assert(Math.abs(current - 1) < .0001, 'Motion does not settle after input stops');
assert(dampTravel(.2, 2, .016, true) === 2, 'Reduced motion must be immediate');
assert(dampTravel(1, 0, .016) < 1 && dampTravel(1, 0, .016) > 0, 'Reverse motion must ease without overshooting');
assert(Math.abs(dampTravel(0, 1, 1 / 30) - dampTravel(dampTravel(0, 1, 1 / 60), 1, 1 / 60)) < 1e-8, 'Damping depends on frame rate');
console.log(`Flight path passed: 1001 route samples, 804 moon samples, ${framed} window-framing cases; four project moons visible at four desktop sizes with clear approaches; minimum planetary clearance ${clearance.toFixed(2)} units; aligned trace, visible arrivals, reversible scroll and frame-independent settling.`);
