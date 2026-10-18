# Preview verification — 2026-10-18

This records the local prototype phase only. Production migration and final
performance acceptance have not been completed.

- Existing root project: **53/53 tests passed**, Tailwind build passed. Build
  printed the existing outdated Browserslist data notice.
- Browser: Microsoft Edge **155.0.4283.62**, Windows, viewports **1440×900** and
  **1280×720**. All three directions rendered; no horizontal desktop overflow.
- Runnable browser check: **passed**, all four project dialogs, native panel
  scrolling without route movement, Enter/Escape and focus restoration,
  scroll forward/stop/reverse, direct destination jumps, physical Previous,
  exact contact email, reduced motion, 3D failure/retry, URL hash navigation.
- Zero uncaught page exceptions during the successful final browser-check run.
  Earlier failed checks are retained as diagnostic logs in ignored tmp/tool
  output; they are not described as successful checks.
- Independent reviewer reproduced source-fetch failure across destination
  changes, then confirmed Retry archives recovers all four projects. The
  source-error state finding was fixed and verified by that reviewer.
- Foreground PNG: 1672×941 RGBA, **alpha 0 at the window center**. The star field,
  planets and moons seen through the window are actual Three.js geometry.
- Root HTML, JS, styles, Tailwind config and dependency files have zero diff.
  This remains a local prototype branch, with no production deployment.

## Usability and accessibility, scoped to this preview

| Nielsen # | Status | Evidence or limit |
| --- | --- | --- |
| 1 System status | Lulus | Current destination, progress, holding/transit/reading state; 3D fallback status and recovery exercised |
| 2 Familiar language | Lulus | Plain section names and business project content; roleplay is confined to the guide |
| 3 User control | Lulus | Reverse scroll, direct jumps, physical Previous/Next; Escape/Return restore scroll and focus |
| 4 Consistency | Lulus | Same route and project data in A/B/C; native links and dialog; system reduced motion takes priority |
| 5 Error prevention | Lulus | Main route held during project reading; edge destination buttons disabled; no external writes |
| 6 Recognition | Lulus | Destination list and four named project buttons stay visible in their respective destination; optional scene labels |
| 7 Efficiency | Lulus | Keyboard project entry/return, direct navigation and always accessible Contact |
| 8 Focus/readability | Temuan: batas prototype | Actual render inspected at two desktop sizes; dense B/C briefings may scroll. Full text-size/contrast audit and complete content migration remain for production |
| 9 Error recovery | Lulus | 3D off/retry and source failure/retry verified; failure message persists when revisiting Work |
| 10 Help | Lulus | Scroll/stop hint, named project controls and labeled return. Prototype switcher explains that layout choice is made in chat |

Visible focus styles, semantic controls, native dialog containment and reduced
motion are implemented. This is not a full accessibility conformance audit or
usability study. Desktop animation performance has not been benchmarked;
there is no 60fps claim. Mobile is deferred as explicitly requested.

## Remaining implementation work after layout choice

- Migrate all original factual content and links into production progressive
  enhancement; preserve useful existing fragment links and CV behavior.
- Implement the complete short moon approach/orbit choreography and the final
  guide animation, without requiring visitors to wait for dialogue.
- Validate final production loading/context loss, keyboard paths, all external
  destinations, wider desktop sizes, real hardware frame timing, and delivery
  checks against the actual production diff.
- Keep prototype routes/switchers out of the release and retain them as a
  reference on this prototype branch.
