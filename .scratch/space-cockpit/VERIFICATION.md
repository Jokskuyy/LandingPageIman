# Preview verification — 2026-10-18

This records the local prototype phase only. Production migration and final
performance acceptance have not been completed.

- Existing root project: **53/53 tests passed**, Tailwind build passed. Build
  printed the existing outdated Browserslist data notice.
- Browser: Microsoft Edge **155.0.4283.62**, Windows, viewports **1440×900** and
  **1280×720** and the taller in-app-browser shape **1290×955**. All three
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
- Standard-motion browser check: **passed**, actual incremental wheel travel
  through all five destinations and back to Work, moon panel stays closed
  during approach, Escape return preserves focus/scroll. Test-only RAF counter
  did not increase during 600 ms after the scene settled.
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
- Foreground PNG: 1672×941 RGBA, **alpha 0 at the window center**. The star field,
  planets and moons seen through the window are actual Three.js geometry.
- Root HTML, JS, styles, Tailwind config and dependency files have zero diff.
  This remains a local prototype branch, with no production deployment.

## Usability and accessibility, scoped to this preview

| Nielsen # | Status | Evidence or limit |
| --- | --- | --- |
| 1 System status | Lulus | Active destination and compact progress visible; route-state announcements retained; 3D fallback and recovery exercised |
| 2 Familiar language | Lulus | Plain section names and business project content; roleplay is confined to the guide |
| 3 User control | Lulus | Reverse scroll, direct jumps, physical Previous/Next; Escape cancels approach; Return restores scroll and focus |
| 4 Consistency | Lulus | Same route and project data in A/B/C; native links and dialog; system reduced motion takes priority |
| 5 Error prevention | Lulus | Main route held during project reading; edge destination buttons disabled; no external writes |
| 6 Recognition | Lulus | Destination list and four named project buttons remain; secondary controls have labeled disclosures; duplicate scene labels removed |
| 7 Efficiency | Lulus | Keyboard project entry/return, direct navigation and always accessible Contact |
| 8 Focus/readability | Temuan: batas prototype | Quiet HUD and path/planet framing inspected at two desktop sizes; dark backing preserves nav contrast over planets; dense briefings may scroll. Full text-size/contrast audit and complete content migration remain for production |
| 9 Error recovery | Lulus | 3D off/retry, real context loss/retry and source failure/retry verified; destination preserved after reload; source failure survives revisiting Work |
| 10 Help | Lulus | Scroll-to-follow-light hint, named project controls and labeled return; Preview disclosure explains that layout choice is made in chat |

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
