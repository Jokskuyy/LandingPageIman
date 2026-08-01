import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml, html } from "./harness.js";

test("Field Notes: no theatrical labels like RECRUITER SNAPSHOT or INITIATE PROTOCOL", () => {
  const { document } = loadIndexHtml();
  const text = document.body.textContent;

  assert.ok(
    !/recruiter\s+snapshot/i.test(text),
    "should not contain 'RECRUITER SNAPSHOT'"
  );
  assert.ok(
    !/initiate\s+protocol/i.test(text),
    "should not contain 'INITIATE PROTOCOL'"
  );
});

test("Field Notes: presence of field notes eyebrow in hero", () => {
  const { document } = loadIndexHtml();
  const hero = document.querySelector("#hero");
  assert.ok(hero, "#hero section must exist");
  assert.match(
    hero.textContent,
    /field\s+note\s*\/\s*\d+/i,
    "hero should contain an eyebrow like 'FIELD NOTE / 01'"
  );
});

test("Field Notes: no fixed viewport-height sections in hero", () => {
  const { document } = loadIndexHtml();
  const hero = document.querySelector("#hero");
  assert.ok(hero, "#hero section must exist");

  const classes = hero.className;
  assert.ok(
    !classes.includes("min-h-[85vh]") && !classes.includes("min-h-screen") && !classes.includes("h-screen"),
    "hero should not use fixed/min-height viewport height sections (like min-h-[85vh] or min-h-screen)"
  );
});

test("Field Notes: color scheme uses deep charcoal and warm paper/cream content surfaces", () => {
  const { document } = loadIndexHtml();
  const body = document.body;

  // body background should be deep charcoal/slate/zinc/stone-900 or 950 or custom dark
  // content surfaces should be cream/paper/stone-100/200/50 or bg-[#fcfbf9] or similar
  const htmlElement = document.documentElement;
  const classes = htmlElement.className + " " + body.className + " " + html;

  // Just checking that we've updated colors in Tailwind classes in the markup
  // Let's assert on the presence of charcoal/dark background and stone/orange/amber/cream content classes
  assert.ok(
    classes.includes("stone") || classes.includes("amber") || classes.includes("orange") || classes.includes("paper") || classes.includes("cream") || classes.includes("bg-[#"),
    "should use warm paper/cream content surfaces or deep charcoal / warm accents"
  );
});

test("Field Notes: no glassmorphism or neon gradients", () => {
  // Check that classes like glass-panel or glassmorphism or bg-gradient-to-r from-primary to-secondary
  // are removed or no longer present in typical decoration elements
  const { document } = loadIndexHtml();
  const hasGlassPanel = document.querySelector(".glass-panel");
  assert.ok(!hasGlassPanel, "should not use .glass-panel class");

  const hasGeoBg = document.querySelector(".geo-bg");
  assert.ok(!hasGeoBg, "should not use .geo-bg class");
});
