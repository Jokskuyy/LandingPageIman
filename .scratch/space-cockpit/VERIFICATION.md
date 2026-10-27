# Preview verification — 2026-10-18

This records the local prototype phase only. Production migration and final
performance acceptance have not been completed.

- Existing root project: **53/53 tests passed**, Tailwind build passed. Build
  printed the existing outdated Browserslist data notice.
- Browser: Microsoft Edge **155.0.4283.62**, Windows, viewports **1440×900** and
  **1280×720**, **1290×955** and the narrower in-app-browser shape **1068×955**. All three
  directions rendered; no horizontal desktop overflow. Guide narration sits on
  the lower deck so it does not cover the arrival planet at the taller ratio.
- Runnable browser check: **passed**, all four project dialogs, native panel
  scrolling without route movement, Enter/Escape and focus restoration,
  scroll forward/stop/reverse, direct destination jumps, physical Previous,
  exact contact email, reduced motion, 3D failure/retry, URL hash navigation.
  Preview/Flight controls start collapsed; native Enter/Space/Tab access and
  visible focus were exercised without hiding the primary destination links.
- Flight model regression: **passed**, 1001 route samples and 804 moon-tour
  samples; minimum route clearance from planet surfaces **3.21 world units**.
  Checks cover non-linear lateral/vertical positions, continuous curve tangents,
  finite normalized camera orientation, reversible scroll and frame-independent
  settling. The trace's arc-length progress agrees with camera position at all
  1001 samples. **942 projection cases** cover three layouts, two viewport sizes
  and 157 positions through the journey; at least five future-route samples
  remain in the clear window rectangle. Arrival sphere bounds also remain in
  the right side of the window. This is geometry evidence, not a frame-rate
  benchmark or proof against every cockpit/overlay occlusion.
- Standard-motion station check: **passed**, a 24 px gesture remains free;
  successive short gestures and a mid-route reversal keep their native scroll
  distance. Mid-route pauses stay stable and resize preserves fractional
  position. Approaching within 22% of the next station and pausing 280 ms
  settles forward or backward, with section and hash matching camera arrival.
  Page Up, Home and End also reach exact stops. Scroll position
  and HOLDING status stayed unchanged for 500 ms while ambient RAF continued.
  Toggling Minimal stopped the test-only RAF counter for 500 ms after settling.
  Moon panel stays closed during approach; route keys cannot leave it; Escape
  return restores focus, scroll and HOLDING status. Direct navigation cancels a
  pending wheel snap and waits for an approach to return before departure.
- Free-flight review identified native pixel rounding near arrivals, controls
  using the last visited station after passing it, and paused status lost on
  resize. Progress now aligns within one scroll pixel at a station; step
  controls use the actual route position; resize preserves direction and
  re-arms the pause check. Regression covers a near-arrival input, an odd-height
  viewport, controls after passing a station, and resized paused position/status.
  Targeted independent browser retests closed all three findings with zero
  console errors; the complete final normal-motion regression also passed.
- Zero uncaught page exceptions during the successful final browser-check run.
  Earlier failed checks are retained as diagnostic logs in ignored tmp/tool
  output; they are not described as successful checks.
- Independent reviewer reproduced source-fetch failure across destination
  changes, then confirmed Retry archives recovers all four projects. The
  source-error state finding was fixed and verified by that reviewer.
- Motion review exercised Escape during approach, navigation during approach,
  panel return/focus/scroll, reduced motion and idle render stop. Reviewer found
  Retry 3D could fail after context loss on an identical fragment URL. Fixed
  with explicit reload; new browser regression proves recovery to **3D ONLINE**
  with `#selected-work` preserved. Targeted independent re-review passed.
- Quiet-interface review confirmed keyboard disclosures and recovery. It found
  an arc-length UV mismatch and navigation contrast loss against bright planets;
  both were fixed and independently rechecked. Actual midturn/arrival C renders
  supplemented the projection tests; reviewer found no further framing issue.
  The last small Opening-height/first-planet-height adjustment was checked
  locally with the same regression and freshly reloaded Opening/Work renders;
  an additional reviewer turn was unavailable because of the account usage limit.
- Station review reproduced early hash changes, route keys interrupting moon
  approach, and stale RETURNING status after return. All were fixed and the
  reviewer retested their reproduction paths successfully, along with viewport
  resize while reading a project and a short wheel gesture after return.
- Ambient scene adds twelve instanced asteroids and two sparse shooting-star
  trails behind the planets. Standard motion continues while parked; the
  existing motion control and system preference freeze/disable the effects.
  Independent review found the initial asteroid wrap edges were still visible;
  wrap bounds now derive from the horizontal frustum plus a safety margin.
  Reviewer rechecked 72 projection combinations including conservative rock
  bounds; the nearest edge remains outside the viewport (|NDC x| >= 1.012).
  The final browser recording also held the station for a 14-second explicit
  idle check without page exceptions; asteroids remain visible behind planets.
- Foreground PNG: 1672×941 RGBA, **alpha 0 at the window center**. The star field,
  planets and moons seen through the window are actual Three.js geometry.
- Selected A guide now appears as a translucent cyan hologram above a console
  projector, with a visible light cone and a blue/green neon dialogue panel.
  The existing sprite sheet is reused; no new runtime dependency or raster
  asset was added. Browser checks verify that the figure is centered above the
  emitter and both projector/dialogue stay in bounds at all twelve layout/size
  combinations. System reduced motion and local Minimal pause hologram effects.
  Independent review found no issue in A at 1440×900 and 1280×720, including
  dialogue readability, control clearance, and both motion-pause paths.
- Root HTML, JS, styles, Tailwind config and dependency versions remain unchanged.
  The root package adds only a separate static packaging command for `/cockpit/`.
- Central display update: the scroll hint, route track and percentage now sit
  inside the console's black monitor. The hint is accessible HTML text with
  cyan styling; the former generated footer hint is removed. Fresh renders
  at 1068×955 and 1280×720 confirm placement in A, and the twelve layout/size
  browser matrix, normal-motion station checks, 53 root tests, build and flight
  geometry regression passed again after this HTML/CSS change.

## Approved online test route

The owner approved publishing `/cockpit/` to the existing GitHub Pages site;
the main portfolio remains the archive source and homepage. The initial static build
uses an explicit nine-file allowlist, rewrites the relative root/CV URLs for
the shallower route and includes Three.js's module/core files and MIT license.
The hidden design workspace, preview server and checks remain outside the
Jekyll output. A second build produced identical hashes for all nine files.

All **54 root tests** pass, including the packaged module graph and links under
the `/LandingPageIman/` project prefix. Root CSS build and the prototype's
geometry regression also pass. The existing browser checks now use the open
tab's directory to exercise both the local packaged route and the public URL.
Both browser suites passed on the packaged route served beneath the exact
`/LandingPageIman/cockpit/` prefix: all twelve desktop layout/size combinations,
four project panels, keyboard/focus return, source links, reduced/normal motion,
free flight, directional arrival, resize and 3D context-loss recovery.
Independent deployment review was attempted but unavailable because the
reviewer reached the account usage limit; no independent approval is claimed.

## Usability and accessibility, scoped to this preview

Online arrival-sync correction: the public route reproduced progress
**1.0016339869 / 25%** with Opening still active after overshooting Work by
two native scroll pixels. An exact arrival worked. `finishScroll` selected
the next integer in the direction of travel, skipping the nearby station.
It now prefers a newly reached station within 2% of a leg, or a return after
leaving the current station's radius. A departure flag resets on actual
arrival, so small departures retain free flow. The existing 22% directional
approach, 280 ms pause and camera-owned arrival callback remain unchanged.
`check-arrivals.js` failed before the fix and passed afterward: sixteen cases.
Twelve two-pixel overshoots cover forward/reverse travel at three interior stations,
at 1280×720 and 1290×955. It checks briefing, hash and holding status, plus
24 px departures that must remain free. Four revisits cover leaving Work by
45% of a leg and returning two pixels past it in either direction at both
heights, including recovery of all four project controls. This revisit bug
was found by independent review and reproduced in the permanent regression.
The reviewer retested both excursions and returns on the generated route:
Work returns to HOLDING with all project controls enabled, 24 px departures
remain FREE, source/generated files match and console errors are zero.
The published JavaScript cache key is updated to `20261018-arrival-v11`.

| Nielsen # | Status | Evidence or limit |
| --- | --- | --- |
| 1 System status | Lulus | Camera crossings synchronize section/nav/hash; actual parked arrivals alone confirm HOLDING and enable project entry; compact progress and 3D recovery exercised |
| 2 Familiar language | Lulus | Plain section names and business project content; roleplay is confined to the guide |
| 3 User control | Lulus | Small gestures and mid-route pauses stay free; directional snap near planets; keyboard stations and direct jumps; Escape/Return preserve route/focus; Minimal freezes decoration |
| 4 Consistency | Lulus | Same route and project data in A/B/C; native links and dialog; system reduced motion takes priority over continuous decoration |
| 5 Error prevention | Lulus | Project entry disabled during transit; route keys held during moon travel; direct departure waits for moon return; edge destination buttons disabled; no external writes |
| 6 Recognition | Lulus | Destination list and four named project buttons remain; secondary controls have labeled disclosures; duplicate scene labels removed |
| 7 Efficiency | Lulus | Keyboard project entry/return, direct navigation and always accessible Contact |
| 8 Focus/readability | Temuan: batas prototype | Quiet HUD and path/planet framing inspected; hologram shares cockpit lighting and leaves the exterior visible, dialogue has dark backing and neon text. Dense briefings may scroll. Full text-size/contrast audit and complete content migration remain for production |
| 9 Error recovery | Lulus | 3D off/retry, real context loss/retry and source failure/retry verified; destination preserved after reload; source failure survives revisiting Work |
| 10 Help | Lulus | Scroll-to-follow-light hint inside the central console display, named project controls and labeled return; Preview disclosure explains that layout choice is made in chat |

Visible focus styles, semantic controls, native dialog containment and reduced
motion are implemented. This is not a full accessibility conformance audit or
usability study. Desktop animation performance has not been benchmarked;
there is no 60fps claim. Mobile is deferred as explicitly requested.

## Passed sections — 2026-10-19

The 2% correction above was incomplete: live probes with 4%, 12% and 35%
overshoot retained Opening after Work had been passed. The current controller
records the station crossed by native scroll for the landing target. After
280 ms of quiet, the existing 22% approach radius also catches overshoots of
that station. Leaving an exactly parked station does not register a crossing.

Section activation now follows actual damped camera crossings independently
of parking. A longer overshoot keeps FREE FLIGHT and its native position while
updating briefing, navigation, hash and a Passing announcement. HOLDING,
arrival announcements and enabled project controls require parked arrival.
Reduced motion and text fallback use the same section travel record. Review
found that context loss could occur after native scroll crossed a station but
before the camera did; sharing that record fixes the handoff to text mode.

`check-crossings.js` failed before the fix and covers 41 cases across standard
motion, a taller viewport, reduced motion and text fallback, including a real
WebGL context loss during that handoff. The existing station check now expects
a passed station's section while retaining FREE FLIGHT. Independent targeted
review passed departures in both directions, reversals, multi-stop skips,
fragment entry, fractional resize and context-loss recovery. The JavaScript
cache key is `20261019-crossings-v12`.

The 41-case crossing regression, 16-case arrival regression, twelve desktop
layout/size combinations and normal-motion station flow all pass on the
generated local route. All 54 root tests, the root CSS build, flight geometry
regression, JavaScript syntax and diff checks pass. The browser matrix now
waits for HOLDING after closing a moon panel, because a hidden dialog can
precede its queued return handler; this avoids starting the next project
while the previous return is still beginning.

## Project moons — 2026-10-19

Four plain .32-unit moons have become larger textured worlds with crater rims,
small emissive details and different silhouettes: a blue survey moon, a green
communication orbit, a copper mineral moon and an icy violet ring system.
Their fictional motifs do not change project facts. A dedicated browser module
owns these visuals; the allowlisted static bundle now contains ten files.

Moon anchors are composed in the Work camera's frame so all four remain in the
open window, including 1068×955. A six-unit approach distance and a gradual
lens offset frame the visited moon at the right side of the window. The A
archive panel is narrower and the backdrop lighter, preserving a visible moon
beside readable project evidence. Route positions and snap policy are unchanged.

Hovering or focusing a named project highlights its moon. Direct raycast clicks
open that same archive and return focus to its named button. Focus and pointer
targets are recorded separately: independent review found that pointer movement
over empty space erased the keyboard target; its regression now preserves the
focused project. A departing route or context loss clears stale targeting.
Rotation and decorative orbits use the existing ambient clock, respecting
Minimal/reduced motion and hidden/context-lost scheduling.

The sixteen-case moon browser check exercises each project in normal motion,
a tall viewport, reduced motion and text fallback. It checks direct 3D clicks,
focus/hover association, project evidence, panel overflow and return/focus/station
restoration. Geometry checks also cover visible moon bounds at four A sizes,
approaches clear of other moons and the final line of sight past their parent.
Independent targeted review passed all four direct clicks, focus regression,
resize during approach/detail, Escape cancellation and real context loss with
continued project access in text fallback. No uncaught page errors were found.
The entry, stylesheet, flight geometry and moon module use `20261019-moons-v13`.

The crossing suite's fallback departure exposed a pre-existing test race:
rounded HOLDING can precede native smooth-scroll completion. An event trace
reproduced two swallowed 24 px gestures in three immediate departures, without
a snap call or prevented wheel event. Waiting for the target's native scrollend
produced three FREE departures at the expected position. The test now awaits
that event after navigation; its departure distance and assertions are unchanged.

The generated local route passed all 16 moon, 41 crossing and 16 arrival cases,
the twelve layout/size browser matrix and normal-motion station flow. All 54
root tests, the CSS build, extended geometry check, syntax and diff checks pass.

The existing Nielsen table also applies to these states: the active moon is
recognizable (#1/#6), named buttons remain keyboard alternatives (#3/#7), color
is paired with names/silhouettes (#4), transit guards prevent stale entry (#5),
the window stays free of permanent labels (#8), fallback retains the archive
(#9) and the guide explains project selection (#2/#10). Actual motion/render
verification is desktop only; there is no new accessibility-conformance or
hardware frame-rate claim.

## Responsive bridge — 2026-10-19

The owner's new request extends the selected Panoramic A test route to phone
and tablet; it supersedes the earlier desktop-only scope. Portrait screens use
an open upper window and lower reading console, with a horizontal destination
strip, compact hologram/projector and a scrolling project sheet. Landscape
screens up to 1000px use a split console. Safe-area insets and dynamic viewport
height are applied without changing the five-station scroll/snap policy.

`check-responsive.js` passed in touch-enabled Edge 155.0.4283.62 contexts at
320×568, 390×844, 430×932, 768×1024, 1024×1366, 844×390 and 667×375. Each size
checks five destinations, section/hash alignment, active-nav visibility,
horizontal overflow, 44px primary targets, all four visible moon bodies,
project sheet bounds and native tap/open/return focus. Native touch input also
exercises sky travel that remains FREE FLIGHT, horizontal navigation, reading
and project scrolling isolated from route position, keyboard reading, rotation,
text fallback and Retry 3D. No page exceptions or unexpected console errors
were recorded by the final check. A closed dialog can precede its queued return
handler, so the check waits for HOLDING before inspecting the restored station.
The moon check samples the center and four body edges against both UI bounds
and the actual cockpit PNG alpha mask. Screenshot review prompted a lower
tablet/compact-landscape framing so upper moons clear the ceiling and nav;
small portrait screens retain the higher framing that clears the reader.

The geometry check adds 1099 responsive route projections, moon bounds and
clearance at the same seven sizes. Portrait framing keeps horizontal coverage
and raises the Work moon group clear of the reader; the approach is 4.2 units
for portrait and six for landscape. Phone rendering is capped at 1.25 device
pixels per CSS pixel. This is a resolution budget, not a measured frame rate.

Independent read-only review found two valid defects: 1024px portrait initially
retained desktop framing, and rotation could leave the selected destination
outside the navigation strip. Portrait layout now follows orientation and
navigation recenters on resize as well as section changes. Targeted retests
closed both findings. At 320×568 the top moon body starts below navigation
(112.75px vs 101.6px) and the lowest ends above the reader (195.78px vs 200px).
The reviewer also verified a 20px coarse-pointer miss still selects its moon,
real context loss, rotation/return/focus and native route swipes; page errors: 0.

One exploratory Chromium `synthesizeScrollGesture` call emitted pointer events
without useful scrolling and a later call stalled. That probe was stopped.
The final regression uses native `dispatchTouchEvent` start/move/end input;
actual touchmove and scroll events verified route movement (0 to 115px) and
FREE FLIGHT. No runtime wheel/touch interception was added to work around the
tool's synthesis behavior.

| Nielsen heuristic | Status | Responsive evidence |
| --- | --- | --- |
| 1. System status | Pass | Current destination, hash, route status and Retry state follow actual arrival/recovery. |
| 2. Familiar language | Pass | Named destinations/projects and SWIPE guidance describe the available actions. |
| 3. Control and freedom | Pass | Free route swipe, independent panel scroll, Return and preserved station/focus. |
| 4. Consistency | Pass | Existing palette/projector, native nav/dialog and 44px primary controls retained. |
| 5. Error prevention | Pass | Disabled project entry in transit; gestures in panels do not move the route. |
| 6. Recognition | Pass | All four project buttons visible in portrait; active destination stays in the nav after rotation. |
| 7. Efficiency | Pass | Native touch travel, direct navigation, named buttons, 3D tapping and keyboard reading. |
| 8. Focus | Pass | Compact controls preserve the sky; project sheet replaces cramped desktop overlay. |
| 9. Recovery | Pass | Text fallback retains project access; Retry restores 3D; context-loss return independently verified. |
| 10. Help | Pass | Existing guide and console provide selection/travel cues; controls remain available from the header. |

These are scoped interaction/visual checks, not full accessibility conformance.
Physical phone/tablet hardware, Safari, cutout rendering and device frame timing
remain unverified; the evidence is Chromium touch/viewport emulation.

The final generated local route also passes the existing twelve desktop
layout/size combinations, normal-motion station flow, 41 crossing cases,
16 arrival cases and 16 moon visits. All 54 root tests, root CSS build,
geometry regression, JavaScript syntax and diff checks pass. The root CSS build
retains its existing outdated Browserslist-data notice. The static bundle stays
at ten allowlisted files; the original homepage and its stylesheet are unchanged.
The entry, stylesheet and flight module cache key is `20261019-responsive-v14`.

## Tab identity and refresh — 2026-10-19

The tab now reads **Iman Nugraha — Space Portfolio** and uses its own pixel
spaceship SVG, shipped as the eleventh allowlisted static file. The root
portfolio title/favicon are separate. Entry JavaScript uses `20261019-tab-v15`.

Refresh initializes Opening through the existing immediate route/arrival path,
so scroll, camera, briefing, hash and 0% agree. Initial direct fragment links
and later hash navigation still work. Retry 3D stores a one-use history marker
before its internal reload; startup captures it before clearing history state,
so recovery retains the station and a later ordinary refresh starts over.

`check-reload.js` passes standard/reduced motion, a phone viewport and text
fallback. It refreshes Contact, an open project and paused free flight; checks
Opening/0%/closed modal/current text; exercises direct fragments, hash changes,
Retry and the next manual refresh. Title and favicon HTTP checks pass, with
zero page/console errors. Read-only independent review found no issue in the
initialization/recovery ordering or test coverage, and confirmed source/public
SVG equality and the publishing asset test.

The final local run also passes all 54 root tests, CSS build, flight geometry,
syntax/diff checks, twelve desktop layout combinations, station flow, 16 arrival
cases, 41 crossing cases, 16 moon visits and the seven-size responsive check.

The existing Nielsen review remains applicable: #1 status and #2 identity are
updated together; #3 direct navigation, #4 consistent icon/title, #5 consumed
recovery state and #6 identifiable tab are verified by the reload check.
#7 refresh is immediate; #8 adds no visible page UI; #9 Retry preserves recovery;
#10 existing route guidance remains available. Each is a scoped pass; this is
not a new full accessibility or physical-browser conformance claim.

## Orbital Initialization — local verification, 2026-10-27

The supplied OldMasters reference was adapted to the existing vanilla JS,
Barlow Condensed / IBM Plex Mono and sage/brass bridge identity. This changes
the `/cockpit/` entrance, not the root portfolio or factual content.

- `npm.cmd test`: 62 passed, including eight intro lifecycle tests.
- `npm.cmd run build` and `npm.cmd run build:cockpit`: passed. Tailwind reports
  the existing outdated caniuse-lite database notice; no dependency update was
  made for this intro.
- `npm.cmd test --prefix .scratch/space-cockpit`: passed the existing route,
  moon approach and responsive projection checks.
- Real Chromium on `http://127.0.0.1:43188/cockpit/`: `check-intro.js` passed
  fifteen scenarios. They cover keyboard/button entry, pointer parallax and
  neutral settling, stable controls, forward wheel plus continued momentum,
  Skip while preparing and after ready fallback, reload/session behavior,
  unavailable sessionStorage, delayed imports and their 10s text fallback,
  late scene recovery, archive timeout/retry, failed interior/SVG fallback,
  Skip before the intro module arrives, cold/warm deep links, real WebGL
  context loss, native touch entry and subsequent navigation.
- Intro render inspection: 1440x900, 820x1180, 390x844 and 844x390. Essential
  controls remain inside each viewport. Screenshots were inspected, including
  the expanding window and the revealed bridge. One WebGL context is created;
  completed overlay removal and aborted event signals were checked in-browser.
- Intro console capture: no uncaught page exceptions. The two console errors
  are deliberately injected archive timeout and failed interior requests;
  ordinary cases emitted no console errors or warnings in this run.
- Independent read-only review found a cold-load flash and first-frame
  deep-link race. Both were fixed, followed by passing cold/warm browser cases
  and the reviewer's nine targeted tests. Follow-up review has no remaining
  concrete finding. The reviewer did not independently run the browser suite.
- Existing cockpit browser regression scripts all passed: `check-browser.js`,
  `check-stations.js`, `check-arrivals.js`, `check-crossings.js`, `check-moons.js`,
  `check-responsive.js` and `check-reload.js`. The seven-size responsive suite
  explicitly seeds the completed-session key to test the underlying cockpit;
  its first-visit intro coverage is in the fifteen-scenario suite above.

The three-second fill is fiction, has no numeric loading percentage or
progressbar role, and does not enable entry. First painted scene or fallback,
interior or fallback, and archives or retry state must all be available.
The intro reuses planet meshes/materials and the existing WebGL renderer with
a temporary orthographic diorama; it restores the parked cockpit render before
opening the aperture. Skip exposes the existing loading/recovery controls.

Scoped Nielsen/a11y review for the changed entrance:

| # | Result | Evidence |
| --- | --- | --- |
| 1 Status visibility | Pass | Stage labels; readiness held beyond 3s; actual fallback status remains after Skip. |
| 2 Familiar language | Pass | Existing English bridge/Captain vocabulary; clear Enter/Skip actions. |
| 3 Control and freedom | Pass | Visible Skip from first HTML paint; original portfolio link; Retry 3D / archives. |
| 4 Consistency | Pass | Existing typefaces, colors and button treatment; cockpit destinations unchanged. |
| 5 Error prevention | Pass | Entry disabled until both gates; wheel/touch quarantine; one completion write. |
| 6 Recognition | Pass | Primary action and forward-scroll hint appear together; no remembered commands. |
| 7 Efficiency | Pass | Keyboard, click, wheel, native swipe and per-tab bypass; storage failure remains functional. |
| 8 Focus and hierarchy | Pass | Actual screenshots at four sizes; stable word/control layer; decoration is aria-hidden. |
| 9 Error recovery | Pass | Import delay/context loss/interior failure/archive timeout exercised with their recovery paths. |
| 10 Assistance | Pass | Scroll hint, existing flight controls and readable-portfolio recovery link. |

Visible focus, semantic buttons/dialog/status, background inertness and focus
restoration were inspected/tested. Reduced motion freezes pointer/decorative
motion and uses short fades. These are scoped checks, not a full WCAG or
screen-reader certification. Physical phones/tablets, Safari/WebKit and GPU
frame-time/memory profiling remain unverified. Failure/slow cases use local
browser request interception, not an outage of the live website.

GitHub Pages is configured to publish only `main`. `vercel.json` disables
Vercel Git deployments for this feature branch and `staging`, per the official
[Git configuration](https://vercel.com/docs/project-configuration/git-configuration).
This guard does not claim to disable manual/provider deployment outside Git.
No staging hosting or production release is part of this change.

## Startup clock correction — 2026-10-27

The reported missing fill/planet animation was reproduced before the fix.
`node --test --test-name-pattern='preparing the application' tests/orbital-intro.test.js`
failed with progress `0.5` instead of `0` while initialization was still pending.
Browser sampling of production `2317366` confirmed fill before the celestial
canvas and large single-frame jumps:

| Profile | Fill consumed before scene | Largest fill step |
| --- | --- | --- |
| Normal | 6.08 percentage points | 42.83 percentage points |
| Three.js import delayed 1400ms | 57.48 | 25.93 |
| CPU throttled 6x | 26.78 | 72.75 |

The controller previously advanced a wall clock from construction. Procedural
scene creation and shader/texture first use blocked that clock's RAF delivery,
then the next callback caught up and skipped the entrance. The fix holds the
outlined `Preparing Bridge` stage until application readiness and an intro
warmup render complete. All celestial materials are rendered hidden once,
then the canvas is cleared before it is revealed. The cinematic clock starts
at zero, advances by delivered frame deltas capped at 50ms and pauses in hidden
tabs. Skip/error/context-loss still settle the preparation and release work.

`check-startup.js` passed on the local packaged route after the fix:

| Profile | Fill before prepared scene | Largest fill step | Observed cinematic interval |
| --- | --- | --- | --- |
| Normal | 0 | 1.39 percentage points | 2972ms |
| Import delayed 1400ms | 0 | 1.67 | 2979ms |
| CPU throttled 6x | 0 | 1.67 | 3208ms |

The sampled interval starts when the observer first sees `initializing`, so it
can omit the first observation frame. These measurements demonstrate preserved
animation time, not a general FPS or load-speed improvement. Initialization
can still take longer on slow hardware; that time is now outside the sequence.
The before run used production and the after run used local files, so no
network/loading-time speedup is claimed.

- 68 root tests passed, including 14 controller lifecycle/timing tests.
- Route/moon geometry checks and both builds passed. The existing Browserslist
  database notice remains; dependencies were not changed.
- All 15 intro browser scenarios passed. No uncaught page exceptions; console
  errors were limited to the deliberately injected archive timeout/image fail.
- All seven existing cockpit browser suites passed, plus a separate same-scene
  test of all four moon visits after intro handoff, Contact, focus/position
  return and reload/session bypass. These cases produced no errors.
- Independent read-only review is clear and its 14 targeted tests passed.
- The browser CLI initially had an `about:blank` selected tab after closing
  temporary profiling pages. Reopening the packaged URL fixed this harness
  precondition; no application change was made for that tooling error.

Scoped Nielsen review remains pass for all ten entrance heuristics: #1 now
shows preparation before the fictional sequence; #2 uses the same language;
#3 retains Skip/recovery; #4 retains the same design; #5 prevents skipped
animation and early entry; #6 retains visible actions; #7 retains input/session
paths; #8 preserves composition; #9 recovery remains tested; #10 existing hints
remain. Keyboard/reduced-motion, responsive layouts and cleanup passed the
same browser coverage. Physical devices, Safari/WebKit and GPU profiling remain
unverified. This is a local/staging fix, not evidence of a new production deploy.

## Mini Me removal — 2026-10-27

The owner requested removing Mini Me. The bridge no longer renders the
character, dialogue, hologram beam or projector. Their CSS and runtime state
updates were deleted. The 1,060,637-byte officer sprite remains a historical
source reference but is neither requested nor copied into the public package.
The build removes that exact generated file from older output directories;
the package now contains 12 files. Destination announcements, flight controls,
route and moon interactions, factual content and the startup clock fix remain.

Verified on the local packaged route `http://127.0.0.1:43188/cockpit/`:

- All 69 root tests, route/moon geometry checks, `build:cockpit` and the root
  build passed. The only build notice was the existing Browserslist database.
- All 15 intro scenarios and seven cockpit browser suites passed. Coverage
  includes 16 arrivals, 41 crossing cases, 16 moon cases, refresh/recovery,
  keyboard/focus, reduced motion and seven responsive sizes from 320x568 to
  1024x1366, including landscape and native Chromium touch input.
- No uncaught page errors. The intro suite's console errors came only from
  its deliberately injected archive timeout and interior-image failure;
  the other seven suites returned empty error arrays.
- Current desktop 1440x900, tablet 820x1180 and phone 390x844 screenshots were
  inspected. Mini Me is absent; controls/content remain readable and no
  horizontal overflow was found. All three recorded zero sprite requests.
- Startup profiles again consumed zero fill before the prepared scene and
  stayed at or below 1.67 percentage points per observed frame. Observed
  cinematic intervals were 2965ms normally, 2972ms with a 1400ms delayed
  Three.js import and 3354ms with 6x CPU throttling. These preserve animation
  time; they do not establish a hardware FPS improvement.
- Independent read-only review found no blockers. Its CSS AST comparison
  confirmed that rules for other UI elements remain unchanged; all seven
  authored/generated file pairs match the publish transform.

Scoped Nielsen evaluation: **#1 pass** (arrival/live status remains), **#2
pass** (existing route language), **#3 pass** (Skip, return and Retry), **#4
pass** (same controls and visual tokens), **#5 pass** (no stale character
callbacks or sprite output), **#6 pass** (visible destinations and project
choices), **#7 pass** (keyboard, touch and motion preferences), **#8 pass**
(removed the requested decorative guide while retaining the composition),
**#9 pass** (fallback/context-loss recovery), **#10 pass** (scroll/swipe and
flight-control hints remain). This is scoped browser evidence, not a complete
accessibility certification. Physical devices, Safari/WebKit and hardware GPU
profiling remain unverified. This change targets staging; no production
release is included.

## Skip Intro removal — 2026-10-27

The owner requested removing the Skip Intro button. Its markup, styles,
listener and pre-module click bypass were removed from authored and generated
files. Initial keyboard focus is on the intro title; readiness moves it to
Enter the Bridge. Tab and Shift+Tab stay on that available action. Entry by
button, forward scroll or touch still waits for the prepared sequence.

Removing the early bypass exposed a module-failure trap during independent
review. The bootstrap now watches module load errors and a ten-second module
deadline, then reveals and focuses the existing portfolio recovery link.
Normal controller startup cancels the watch. Late modules honor the abandoned
gate without reopening the intro or storing fictional completion. When the
scene recovers, focus moves from the recovery status to the briefing heading
before that status is hidden. Existing scene/archive/interior fallback paths
and their deadlines remain in place.

Validation on `http://127.0.0.1:43188/cockpit/`:

- All 69 root tests, geometry checks, the cockpit build and root build passed.
  The existing Browserslist database notice remains; no dependencies changed.
- All 18 intro browser scenarios passed, including aborted main/controller
  modules, the real ten-second pending-module deadline, late recovery/focus,
  keyboard, storage failure, reduced motion, touch and session/deep links.
- All seven cockpit browser suites passed: 16 arrival cases, 41 crossings,
  16 moon cases, keyboard/focus, normal/minimal rendering, error recovery,
  reload and seven touch-emulated sizes from 320x568 to 1024x1366.
- No uncaught page errors. Console errors were limited to deliberately
  injected archive timeout, image failure and two module request failures.
- Current ready-state screenshots inspected at 1440x900, 820x1180, 390x844
  and 844x390: no Skip control, no overflow, visible Enter focus and readable
  status/actions. The published package remains 12 files; seven authored and
  generated browser files match the publish transform.
- All three startup profiles passed with zero fill before the prepared scene
  and largest observed fill steps at most 1.67 percentage points. Sampled
  cinematic intervals were 2959ms normal, 2986ms with a 1400ms delayed import
  and 3042ms with 6x CPU throttling. These measure preserved sequence time,
  not hardware FPS.
- Independent read-only review is clear after addressing the bootstrap trap
  and recovery focus. Four bootstrap checks passed. The first browser attempt
  failed its momentum fixture while capturing an image inside the wheel loop;
  a diagnostic recorded a 1345ms gap, beyond the 350ms quiet window. Removing
  that capture keeps the continuous-input fixture continuous; product input
  quarantine timing was not changed. The complete rerun passed.

Scoped Nielsen review: **#1 pass** (preparing/ready/failure status), **#2 pass**
(existing bridge language), **#3 pass** (requested Skip removal with bounded
failure recovery and normal entry), **#4 pass** (same visual tokens/actions),
**#5 pass** (no early entry or module-failure trap), **#6 pass** (visible Enter
and scroll hint), **#7 pass** (keyboard, touch, session bypass and reduced
motion), **#8 pass** (requested control removed), **#9 pass** (tested portfolio
and 3D recovery), **#10 pass** (preparation note and entry hint). Physical
devices, Safari/WebKit, screen-reader usability and hardware GPU profiling
remain unverified. PR CI is not configured. This change targets staging and
does not include a production release.

## Historical implementation notes after layout choice

- Migrate all original factual content and links into production progressive
  enhancement; preserve useful existing fragment links and CV behavior.
- Carry the demonstrated curved journey and moon approach/orbit into the
  chosen production layout; finalize guide animation without dialogue waiting.
- Validate final production loading/context loss, keyboard paths, all external
  destinations, wider desktop sizes, real hardware frame timing, and delivery
  checks against the actual production diff.
- Keep prototype routes/switchers out of the release and retain them as a
  reference on this prototype branch.
