# Cockpit design exploration — not production

Question: how should a client portfolio divide space between the panoramic
window, the readable briefing, and the guide inside the cockpit?

Run from the repository root:

```powershell
npm.cmd ci --prefix .scratch/space-cockpit --ignore-scripts --no-audit --no-fund
node .scratch/space-cockpit/serve.mjs
```

Open http://127.0.0.1:43188/.scratch/space-cockpit/?variant=A
Open the small **Preview A/B/C** disclosure at the bottom left to compare
layouts. Its buttons change the preview and URL; they do not approve a
production direction. Left/right arrows also switch layouts. Choose through
chat before the full implementation, per the owner's UI guide.

| Direction | Composition | Tradeoff |
| --- | --- | --- |
| A — Panoramic bridge | Horizontal navigation, briefing on left, guide on right | Recommended for the brief: broad exterior view and readable introduction |
| B — Command console | Compact navigation and reading console on the left | Consistent reading area; narrower exterior view |
| C — Navigation chart | Thin navigation, open central window, wide lower briefing | More room for the flight path; less height for detailed text |

## Confirmed decisions

- Existing HTML, Tailwind CSS and vanilla JavaScript remain the production stack.
- Three.js supplies actual 3D planets and moons. No frontend framework is added.
- The client-facing route is Opening → Selected Work → Capabilities → About &
  Experience → Contact. Projects are optional moons, with the actual source HTML
  as evidence. Business claims may not be invented.
- On 2026-10-18 the owner asked for a more immersive physical interior, controls
  above and below, and supplied a pilot-eye cockpit reference. The revised alpha
  foreground follows that architecture with one much wider front window.
- The same day, the owner referenced https://sebastien-lempens.com/ to replace
  snappy, linear planet transitions. The preview now uses one fixed 3D world:
  a winding camera path with lateral/vertical depth, gradual turns, subtle bank,
  frame-independent easing and a longer scroll route. The cockpit stays fixed.
- The owner then requested a quieter interface and a shimmering trace of the
  route. Duplicate floating project labels, large status/navigation instruments,
  and the permanent layout switcher were removed from the default view. Native
  **Flight controls** and **Preview** disclosures retain the secondary controls.
  The guide is smaller and speaks one short sentence per destination.
- Camera heading follows a lookahead on the actual route. Planets are placed
  beside the arrival direction, preserving the view of the route and a clear
  reading area. The first leg is level and the first planet sits lower so it is
  visible through the canopy from Opening as well as Work.
- The owner clarified that smooth travel must still snap to each planet and
  section while allowing some free flow. Four equal scroll legs join five
  exact camera waypoints. Manual scrolling now controls distance directly,
  with frame-independent damping instead of a per-leg dead zone. Small input
  can leave a planet without jumping a whole section or being pulled back.
  Stopping mid-route keeps the position and shows **FREE FLIGHT**. After
  280 ms without root scrolling, the ship settles at the next planet only
  within the final 22% of the leg in the current direction. Continued input
  resets that wait; forward and reverse use the same rule. Resize preserves
  the fractional journey position. Content, active navigation and URL hash
  update together after arrival. Direct navigation, Page Up/Down, Home/End
  and body Space still travel to exact stations. Previous/Next uses the ship's
  actual position even after passing a planet without stopping there.
- Twelve small, low-poly asteroids drift and rotate continuously behind the
  planets, rendered in one instanced draw. Two staggered shooting-star trails
  cross the distant layer occasionally. Wrapping happens beyond the camera's
  horizontal frustum so asteroids do not jump across the visible window.
  These decorative objects have no interactive labels or UI controls.
- The route uses two lightweight Three.js tubes with a soft glow and glints.
  Arc-length mapping keeps the trace aligned with the camera's position. It
  sits below the ship and rises toward its endpoint, then clears at Contact.
  Glints advance with ambient motion while the ship can stay parked; reduced
  motion keeps the trace steady. It is hidden during optional moon visits.
- The guide uses the existing avatar as an identity reference. The fictional
  uniform and pixel-art roleplay do not claim actual military experience.
- Mobile adaptation is a future phase, outside this prototype and current scope.

## Scope and source

The root `index.html` is unchanged. The prototype fetches its four project
articles for detail panels, preserving links, descriptions, and evidence.
Summary content is grounded in that page. The new scene, physical ceiling/deck,
the three compositions, forward/backward route, moon panels, direct navigation,
motion control and recovery demonstrate the design direction.

Moon entry now follows a curved approach and short orbital arc (1450 ms), then
opens the project panel. Return reverses that path (950 ms); Escape can cancel
an approach. Route keys are held during moon travel; direct navigation cancels
the approach and waits for the return before departing. Focus, station and
holding status are restored after return, including a resized viewport.
Minimal motion skips the journey, freezes the asteroids, hides shooting-star
trails and stops rendering when settled. Standard motion keeps the ambient
scene alive while parked. Hidden tabs and lost WebGL contexts do not keep
scheduling frames.

This is not the production migration. Complete skills/background migration,
all original fragment aliases, production progressive enhancement, final
performance measurements and release checks remain after a layout is chosen.

## Isolation and checks

Everything is on `prototype/space-cockpit`, based on local `staging` at
`6ce027f`. Nothing from this directory is referenced by production entry points,
the Tailwind content scan, root package files or the published main branch.
The prototype has its own pinned Three.js dependency and lockfile; its
`node_modules/` is ignored. Do not merge the exploration into production.

Existing project baseline: `npm.cmd test` (53 tests) and `npm.cmd run build`.
Flight-curve regression: `npm.cmd test --prefix .scratch/space-cockpit`.
Browser check, with the local server running:

```powershell
npx.cmd --yes --package @playwright/cli playwright-cli -s=cockpit-preview open http://127.0.0.1:43188/.scratch/space-cockpit/ --browser msedge
npx.cmd --yes --package @playwright/cli playwright-cli -s=cockpit-preview run-code --filename .scratch/space-cockpit/check-browser.js
npx.cmd --yes --package @playwright/cli playwright-cli -s=cockpit-preview run-code --filename .scratch/space-cockpit/check-stations.js
```

Screenshots and temporary browser logs go in ignored `tmp/cockpit-preview/`.
The browser check covers 1440×900, 1280×720 and 1290×955, variant switching, all four
projects, panel scrolling, keyboard entry/Escape, focus and scroll restoration,
forward/stop/reverse, direct destinations, contact href, keyboard access to the
collapsed menus and physical controls,
reduced motion, 3D fallback/retry and context-loss recovery on a fragment URL.
The standard-motion check exercises small input without forced station jumps,
continuous forward/reverse travel, stable mid-route pauses, resize, directional
arrival snap at all five stations, continuing ambient frames, paused rendering
in minimal motion, actual moon approach/return, navigation during
approach, reverse travel, keyboard stations and cancellation of pending snaps.
Geometry checks include 942 projections of the future route through the window
and the bounds of each arrival planet in all three layouts at both desktop sizes.
External destinations are preserved,
not sent messages or submitted forms. A preview pass is not a production
acceptance or a final 60fps benchmark.

Read-only independent review also exercised failure of the source HTML and
retry. Its source-error-state finding was fixed: the failure message now survives
destination changes and Retry archives reloads the four projects.
