// A single continuous space, with fixed planets and a winding pilot-eye route.
import { Vector3, Quaternion, Matrix4, CatmullRomCurve3, MathUtils } from './node_modules/three/build/three.module.js';

const up = new Vector3(0, 1, 0);
export const waypoints = [
  new Vector3(-12, 2, 40),
  new Vector3(0, 2, 16),
  new Vector3(24, 11, -27),
  new Vector3(-14, -5, -69),
  new Vector3(-38, 6, -116)
];
export const flightCurve = new CatmullRomCurve3(waypoints, false, 'centripetal');
const routeLengths = flightCurve.getLengths();
// Tube UVs measure arc length; camera arrivals use the curve's parameter.
export function travelToDistance(travel) {
  const sample = MathUtils.clamp(travel / 4, 0, 1) * (routeLengths.length - 1);
  const index = Math.floor(sample);
  return MathUtils.lerp(routeLengths[index], routeLengths[Math.min(index + 1, routeLengths.length - 1)], sample - index) / routeLengths.at(-1);
}
export function traceDrop(distance) {
  return 2.6 * (1 - MathUtils.smoothstep(distance, .85, 1));
}
const ahead = new Vector3(), view = new Matrix4(), heading = new Quaternion();
const distances = [22, 24, 23, 28], sides = [7, 6.5, 6.5, 7];
export const planetSpecs = [2.4, 3.1, 2.75, 3.4].map((radius, index) => {
  sampleCourse(index + 1, new Vector3(), heading);
  const forward = new Vector3(0,0,-1).applyQuaternion(heading);
  const right = new Vector3(1,0,0).applyQuaternion(heading);
  const position = waypoints[index + 1].clone().addScaledVector(forward, distances[index]).addScaledVector(right, sides[index]);
  position.addScaledVector(new Vector3(0,1,0).applyQuaternion(heading), index === 0 ? -3.4 : -.4);
  return { position, radius, tilt: [.28, -.38, .16, -.25][index] };
});
export const moonOffsets = [
  new Vector3(-4.2, 1.8, 2.8), new Vector3(2.8, 2.7, 3.8),
  new Vector3(-2.7, -2.2, 3.5), new Vector3(4.4, -1.4, 2)
];
const arrivalRotations = planetSpecs.map((planet,index) => {
  sampleCourse(index+1,new Vector3(),heading);
  const right = new Vector3(1,0,0).applyQuaternion(heading);
  const localUp = new Vector3(0,1,0).applyQuaternion(heading);
  const focus = planet.position.clone().addScaledVector(right,-4.8).addScaledVector(localUp,1.2);
  return new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(waypoints[index+1],focus,up));
});

export function scrollToTravel(progress) {
  const bounded = MathUtils.clamp(progress, 0, 4);
  const index = Math.floor(bounded);
  return Math.min(4, index + MathUtils.smootherstep(bounded - index, 0, 1));
}
export function dampTravel(current, target, seconds, immediate = false) {
  if (immediate || Math.abs(target - current) < .0001) return target;
  return MathUtils.damp(current, target, 10, MathUtils.clamp(seconds, 0, .05));
}
function sampleCourse(travel, position, quaternion) {
  const value = MathUtils.clamp(travel, 0, 4);
  flightCurve.getPoint(value / 4, position);
  flightCurve.getPointAt(Math.min(1, travelToDistance(value) + .055), ahead);
  if (ahead.distanceToSquared(position) < .0001) ahead.copy(position).add(flightCurve.getTangent(1));
  quaternion.setFromRotationMatrix(view.lookAt(position, ahead, up));
}
export function sampleFlight(travel, position, quaternion) {
  sampleCourse(travel,position,quaternion);
  const stop = Math.round(MathUtils.clamp(travel,0,4));
  if (stop>0) quaternion.slerp(arrivalRotations[stop-1],1-MathUtils.smootherstep(Math.abs(travel-stop),0,.24));
}

export function moonTour(homePosition, moonPosition) {
  const planet = planetSpecs[0];
  const fromPlanet = homePosition.clone().sub(planet.position).normalize();
  const toMoon = moonPosition.clone().sub(planet.position).normalize();
  const outside = fromPlanet.clone().add(toMoon).normalize();
  const waypoint = planet.position.clone().addScaledVector(outside, planet.radius + 7);
  waypoint.y += 1.5;
  const approach = moonPosition.clone().sub(waypoint).normalize().multiplyScalar(-3.4);
  const orbitEnd = approach.clone().applyAxisAngle(up, -.42);
  return new CatmullRomCurve3([
    homePosition.clone(), waypoint,
    moonPosition.clone().add(approach), moonPosition.clone().add(orbitEnd)
  ], false, 'centripetal');
}
