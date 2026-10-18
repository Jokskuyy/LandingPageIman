import assert from 'node:assert/strict';
import { Vector3, Quaternion } from './node_modules/three/build/three.module.js';
import { waypoints, planetSpecs, moonOffsets, flightCurve, sampleFlight, scrollToTravel, dampTravel, moonTour } from './flight-path.js';

const position = new Vector3(), rotation = new Quaternion();
for (let i = 0; i < waypoints.length; i++) {
  sampleFlight(i, position, rotation);
  assert(position.distanceTo(waypoints[i]) < 1e-8, 'Arrival must reach its waypoint');
  assert(Math.abs(rotation.length() - 1) < 1e-8);
}
const line = waypoints[4].clone().sub(waypoints[0]).normalize();
assert(waypoints.some(point => point.clone().sub(waypoints[0]).cross(line).length() > 20), 'Route regressed to a straight line');
assert(Math.max(...waypoints.map(p => p.y)) - Math.min(...waypoints.map(p => p.y)) > 12, 'Route lost vertical depth');
let clearance = Infinity;
for (let i = 0; i <= 1000; i++) {
  sampleFlight(i / 250, position, rotation);
  assert([...position, ...rotation].every(Number.isFinite));
  for (const planet of planetSpecs) clearance = Math.min(clearance, position.distanceTo(planet.position) - planet.radius);
}
assert(clearance > 2, `Route intersects a planet: clearance ${clearance}`);
for (const offset of moonOffsets) {
  const moon = planetSpecs[0].position.clone().add(offset), tour = moonTour(waypoints[1], moon);
  assert(tour.getPoint(0).distanceTo(waypoints[1]) < 1e-8);
  assert(tour.getPoint(1).distanceTo(moon) > 3, 'Moon approach gets too close');
  for (let i = 0; i <= 200; i++) assert(tour.getPoint(i / 200).distanceTo(planetSpecs[0].position) > planetSpecs[0].radius + .5, 'Moon tour intersects its parent planet');
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
console.log(`Flight path passed: 1001 route samples, 804 moon samples, minimum planetary clearance ${clearance.toFixed(2)} units; continuous curves, reversible scroll and frame-independent settling.`);
