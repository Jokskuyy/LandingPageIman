# Cockpit design exploration — not production

Question: how should a client portfolio divide space between the panoramic
window, the readable briefing, and the guide inside the cockpit?

Run from the repository root:

```powershell
npm.cmd ci --prefix .scratch/space-cockpit --ignore-scripts --no-audit --no-fund
node .scratch/space-cockpit/serve.mjs
```

Open http://127.0.0.1:43188/.scratch/space-cockpit/?variant=A
The bottom A/B/C buttons change the preview and its URL; they do not approve a
production direction. Left/right arrows also switch directions. Choose through
chat before the full implementation, per the owner's UI guide.

| Direction | Composition | Tradeoff |
| --- | --- | --- |
| A — Panoramic bridge | Horizontal navigation, briefing on left, guide on right | Recommended for the brief: broad exterior view and readable introduction |
| B — Command console | Permanent left navigation and reading console | Consistent reading area; narrower exterior view |
| C — Navigation chart | Vertical route, central exterior view, wide lower briefing | More of a navigation chart; less height for detailed text |

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
an approach. Minimal motion skips the journey. Rendering stops when settled.

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
npx.cmd --yes --package @playwright/cli playwright-cli -s=cockpit-preview run-code --filename .scratch/space-cockpit/check-motion.js
```

Screenshots and temporary browser logs go in ignored `tmp/cockpit-preview/`.
The browser check covers 1440×900 and 1280×720, variant switching, all four
projects, panel scrolling, keyboard entry/Escape, focus and scroll restoration,
forward/stop/reverse, direct destinations, contact href, physical controls,
reduced motion, 3D fallback/retry and context-loss recovery on a fragment URL.
The standard-motion check exercises gradual wheel travel, a settled render
counter, actual moon approach, return and reverse travel. External destinations are preserved,
not sent messages or submitted forms. A preview pass is not a production
acceptance or a final 60fps benchmark.

Read-only independent review also exercised failure of the source HTML and
retry. Its source-error-state finding was fixed: the failure message now survives
destination changes and Retry archives reloads the four projects.
