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
the main portfolio remains the archive source and homepage. The static build
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
| 1 System status | Lulus | Camera arrival synchronizes active destination, content, hash and HOLDING status; compact progress and 3D recovery exercised |
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

## Remaining implementation work after layout choice

- Migrate all original factual content and links into production progressive
  enhancement; preserve useful existing fragment links and CV behavior.
- Carry the demonstrated curved journey and moon approach/orbit into the
  chosen production layout; finalize guide animation without dialogue waiting.
- Validate final production loading/context loss, keyboard paths, all external
  destinations, wider desktop sizes, real hardware frame timing, and delivery
  checks against the actual production diff.
- Keep prototype routes/switchers out of the release and retain them as a
  reference on this prototype branch.
