# Muhammad Iman Nugraha — portfolio

A static, English-language portfolio for Junior Fullstack Developer applications.
Published at https://jokskuyy.github.io/LandingPageIman/ through GitHub Pages from
the root of the `main` branch.

## Develop and verify

```sh
npm ci
npm run build
npm test
python -m http.server 43187 --bind 127.0.0.1
```

Open http://127.0.0.1:43187/. Tailwind 3.4 compiles `styles/input.css` to the
committed `styles/site.css`; rebuild CSS after changing HTML classes or styles.
Update the stylesheet's `v` query in `index.html` when publishing CSS changes so
returning visitors receive the matching stylesheet instead of a cached version.
There is no browser-side Tailwind compiler or frontend framework runtime.
Keep asset and CV links relative so they also work under the Pages project path.

The project gallery progressively enhances ordinary project links into keyboard
accessible tabs. Without JavaScript, all four projects remain visible in order.
Existing project fragments also open the matching panel when JavaScript runs.

The tests check content, links, accessibility structure and navigation/contact/
gallery behavior. Browser verification covers 1280×720, 1440×900 and 390×844 layouts,
keyboard navigation, visible primary actions and a page with JavaScript absent.

## Content and evidence

The two primary projects are Dashboard Profile UPNVJ and Smart Home IoT. Project
descriptions distinguish screenshots, architecture diagrams and concept artwork.
Repository links provide implementation/test evidence; do not turn the presence
of a test file into a claim that its suite was run. The owner confirmed full
implementation of Dashboard and Smart Home. Smart Home is a coursework simulator.

Current education: Informatics graduate, UPN Veteran Jakarta, 2022–2026,
GPA 3.76/4.00. Historical `portfolio_prompt.md` describes an earlier iteration;
its student status and GPA are superseded by the current page and CV.

## CV

The public PDF is `output/pdf/muhammad-iman-nugraha-cv.pdf`. Rebuild and visually
validate it using the instructions in `scripts/cv/README.md`. It must remain one
page with selectable text and active links. Intermediate renders belong in the
ignored `tmp/` directory.

## Publishing

Commit the HTML, JavaScript, rebuilt CSS, referenced images and final PDF.
Publishing `main` triggers the existing GitHub Pages build. Verify the public
page, relative assets and PDF after the Pages deployment finishes.
The Albion demo is deployed independently from its own repository; update its
portfolio screenshot only after checking the released calculator.

### Cockpit test route

The owner approved publishing the selected Panoramic bridge at
`https://jokskuyy.github.io/LandingPageIman/cockpit/` for testing. The main
portfolio remains at the project root and supplies the project archive and CV.
The selected bridge adapts to desktop, tablet and phone screens. Portrait views
keep the sky above a scrolling reading console; compact landscape views use a
split layout. The full production redesign remains separate work.

```sh
npm ci --prefix .scratch/space-cockpit --ignore-scripts --no-audit --no-fund
npm run build:cockpit
```

Commit the generated `cockpit/` directory with its source changes. The build
copies an explicit list of browser files, adjusts relative project paths and
includes Three.js 0.186.1's two ESM files and MIT license. No `node_modules`,
preview server, test scripts or workspace logs are included. Keep the original
`.scratch/space-cockpit/` as the local design reference; GitHub Pages' existing
Jekyll build excludes that hidden directory. Do not add `.nojekyll` to publish it.

The existing `.scratch/space-cockpit/check-browser.js`, `check-stations.js`,
`check-arrivals.js`, `check-crossings.js`, `check-moons.js`, `check-responsive.js`
and `check-reload.js`
use the browser tab's current directory as their base. Open the packaged route
before running them to check the published files rather than the workspace.

### Orbital Initialization

The cockpit opens with a three-second fictional orbital sequence: illuminated
IMAN lettering, navigation rings and the bridge's procedural planets. Readiness
is separate from this timeline: entry waits for the first rendered 3D frame (or
the text fallback), the interior image (or SVG fallback), and project archives
(or their existing retry state). Interior/archive deadlines are eight seconds;
the optional 3D import has a ten-second fallback deadline. Skip Intro is usable
even before the modules arrive and reveals the normal preparing/recovery view.

The stage stays outlined at `Preparing Bridge` until that preparation and an
intro warmup pass have finished. The shared renderer draws all intro materials
while hidden, then clears to the outlined starting frame. Only then does the
three-second fill/reveal start. Its clock follows presented animation frames,
caps a delayed frame at 50ms and pauses in hidden tabs, so loading or shader
work cannot consume the beginning. A slow device can stretch the sequence;
Skip remains available throughout.

The DOM controller is authored in `.scratch/space-cockpit/orbital-intro.js`, with
isolated styles in `orbital-intro.css`. It shares the cockpit's renderer and
planet geometry/materials. Enter returns that renderer to its original host
before opening the orbital aperture; the camera remains at its route position.
The guide and welcome are revealed after handoff, and continued wheel/touch
input is consumed until it has been quiet for 350ms. Reduced motion uses a
180ms initialization and 120ms fade without parallax.

Successful entry/skip stores `iman:orbital-intro:v1=complete` in sessionStorage.
Reloads then bypass the intro while preserving the existing Opening reset,
deliberate fragment links and one-use Retry 3D recovery rule. If storage is
blocked, entry still works and the next visit can show the intro again.

`npm test` includes controller lifecycle checks. Run `check-intro.js` with the
existing Playwright CLI against `/cockpit/` for first-session and failure cases.
`check-startup.js` measures the fill before the celestial scene is prepared and
its largest frame step under normal, delayed-import and CPU-throttled startup.
The responsive cockpit suite intentionally bypasses the intro; its first-visit
layouts are covered by `check-intro.js`. The static allowlist now packages
thirteen files and continues to exclude the source workspace and browser tests.

Local-only staging is enforced for `feat/orbital-intro` and `staging` with
[`git.deploymentEnabled`](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled)
in `vercel.json`. GitHub Pages still publishes only `main`; releasing that
branch requires the owner's approval.
