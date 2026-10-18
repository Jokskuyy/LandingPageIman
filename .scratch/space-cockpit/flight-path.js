// A single continuous space, with fixed planets and a winding pilot-eye route.
import { Vector3, Quaternion, Matrix4, CatmullRomCurve3, MathUtils } from './node_modules/three/build/three.module.js';

const up = new Vector3(0, 1, 0);
export const waypoints = [
  new Vector3(-12, 6, 40),
  new Vector3(0, 2, 16),
  new Vector3(24, 11, -27),
  new Vector3(-14, -5, -69),
  new Vector3(18, 6, -116)
];
export const flightCurve = new CatmullRomCurve3(waypoints, false, 'centripetal');
const distances = [19, 22, 20, 24], sides = [8.5, 11, -12, 9];
export const planetSpecs = [2.4, 3.1, 2.75, 3.8].map((radius, index) => {
  const forward = flightCurve.getTangent((index + 1) / 4).normalize();
  const right = forward.clone().cross(up).normalize();
  const position = waypoints[index + 1].clone().addScaledVector(forward, distances[index]).addScaledVector(right, sides[index]);
  position.y += [1, 2.2, -.8, 2.5][index];
  return { position, radius, tilt: [.28, -.38, .16, -.25][index] };
});
export const moonOffsets = [
  new Vector3(-4.2, 1.8, 2.8), new Vector3(2.8, 2.7, 3.8),
  new Vector3(-2.7, -2.2, 3.5), new Vector3(4.4, -1.4, 2)
];
const headings = waypoints.map((position, index) => {
  const planet = planetSpecs[Math.max(0, index - 1)].position;
  const right = planet.clone().sub(position).normalize().cross(up).normalize();
  const focus = planet.clone().addScaledVector(right, -[4.8, 4.1, 3, 4.2, 3.7][index]);
  return new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position, focus, up));
});

export function scrollToTravel(progress) {
  const bounded = MathUtils.clamp(progress, 0, 4.999);
  const index = Math.floor(bounded);
  return Math.min(4, index + MathUtils.smootherstep(bounded - index, .2, 1));
}
export function dampTravel(current, target, seconds, immediate = false) {
  if (immediate || Math.abs(target - current) < .0001) return target;
  return MathUtils.damp(current, target, 10, MathUtils.clamp(seconds, 0, .05));
}
export function sampleFlight(travel, position, quaternion) {
  const value = MathUtils.clamp(travel, 0, 4), index = Math.min(3, Math.floor(value));
  flightCurve.getPoint(value / 4, position);
  quaternion.slerpQuaternions(headings[index], headings[index + 1], MathUtils.smootherstep(value - index, 0, 1));
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
