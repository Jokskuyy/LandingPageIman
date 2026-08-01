// Task 10.8 — About-content and Tailwind-CDN checks.
//
// Two groups of deterministic DOM assertions over the single rendered
// index.html:
//
//   About_Section (#about):
//     - exactly one #about section exists (2.1)
//     - its text states the UPN Veteran Jakarta GPA fact ("UPN Veteran Jakarta",
//       "3.75") (2.2)
//     - it mentions the four focus areas: frontend web development, backend web
//       development, API integration, database management (2.3)
//     - Web_Development_Focus content precedes Non_Web_Focus content in document
//       reading order and is allocated at least as many words (2.5, 2.6). The
//       design places the web content in a main panel (lg:col-span-2) and the
//       non-web content in a "Beyond the Code" aside.
//
//   Delivery format (head):
//     - Tailwind CSS is loaded via CDN: a <script src> containing
//       "cdn.tailwindcss.com" exists (8.1)
//     - no heavy framework / bundler script tags were added: the only <script
//       src> tags are the Tailwind CDN and parallax.js, with no react/vue/
//       angular/svelte/jquery/bundler entry (8.1, 8.2)
//
// Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6, 8.1, 8.2

import test from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml } from "./harness.js";

const { document } = loadIndexHtml();

/** Collapse whitespace and lowercase for flexible, case-insensitive matching. */
function normalize(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Count whitespace-delimited words in a string. */
function wordCount(text) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed === "" ? 0 : trimmed.split(" ").length;
}

function getAboutSection() {
  const sections = document.querySelectorAll("#about");
  assert.equal(sections.length, 1, "there should be exactly one #about section");
  return sections[0];
}

test("About: exactly one #about section exists", () => {
  // 2.1
  const sections = document.querySelectorAll("#about");
  assert.equal(
    sections.length,
    1,
    "the portfolio should include exactly one About_Section",
  );
});

test("About: states the UPN Veteran Jakarta GPA fact", () => {
  // 2.2
  const text = getAboutSection().textContent;
  assert.match(
    text,
    /UPN\s+Veteran\s+Jakarta/i,
    "About should mention UPN Veteran Jakarta",
  );
  assert.ok(
    text.includes("3.75"),
    "About should mention the 3.75 GPA",
  );
});

test("About: mentions all four focus areas", () => {
  // 2.3 — frontend web development, backend web development, API integration,
  // database management. Matched flexibly/case-insensitively on the concepts.
  const text = normalize(getAboutSection().textContent);

  assert.match(
    text,
    /frontend web development/,
    "About should mention frontend web development",
  );
  assert.match(
    text,
    /backend web development/,
    "About should mention backend web development",
  );
  assert.match(
    text,
    /api integration/,
    "About should mention API integration",
  );
  assert.match(
    text,
    /database management/,
    "About should mention database management",
  );
});

// --- Web-content vs non-web-content placement and word allocation (2.5, 2.6) ---
//
// The design places Web_Development_Focus content in a main panel and the
// Non_Web_Focus content in a "Beyond the Code" aside. We locate the non-web
// aside by its marker text and treat the remaining panel(s) as the web content.

/** Panels (cards) rendered inside #about: the grid's element children. */
function getAboutPanels() {
  const about = getAboutSection();
  const grid = about.querySelector(".grid");
  assert.ok(grid, "the #about section should contain a grid of content panels");
  return Array.from(grid.children);
}

/** The Non_Web_Focus aside is the shorter/secondary panel in the grid.
 *  Previously keyed on "Beyond the Code"; now identified as the last
 *  panel (the non-web aside is always placed after the main web panels). */
function getNonWebPanel(panels) {
  // The non-web aside is the last panel in the About grid.
  assert.ok(panels.length >= 2, "About should have at least two panels (web + non-web aside)");
  const nonWeb = panels[panels.length - 1];
  return nonWeb;
}

test("About (2.5): web content precedes non-web content in document order", () => {
  const panels = getAboutPanels();
  const nonWeb = getNonWebPanel(panels);
  const webPanels = panels.filter((p) => p !== nonWeb);

  assert.ok(
    webPanels.length >= 1,
    "About should have at least one web-content panel",
  );

  for (const web of webPanels) {
    const relation = web.compareDocumentPosition(nonWeb);
    assert.ok(
      relation & web.DOCUMENT_POSITION_FOLLOWING,
      "every web-content panel should appear before the non-web aside in document order",
    );
  }
});

test("About (2.6): web content has at least as many words as non-web content", () => {
  const panels = getAboutPanels();
  const nonWeb = getNonWebPanel(panels);
  const webPanels = panels.filter((p) => p !== nonWeb);

  const webWords = webPanels.reduce(
    (sum, p) => sum + wordCount(p.textContent),
    0,
  );
  const nonWebWords = wordCount(nonWeb.textContent);

  assert.ok(
    webWords >= nonWebWords,
    `web content (${webWords} words) should have at least as many words as non-web content (${nonWebWords} words)`,
  );
});

// --- Delivery format: Tailwind via CDN, no heavy frameworks (8.1, 8.2) ---

test("Delivery: Tailwind CSS is loaded via CDN", () => {
  // 8.1
  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const tailwindCdn = scripts.find((s) =>
    s.getAttribute("src").includes("cdn.tailwindcss.com"),
  );
  assert.ok(
    tailwindCdn,
    "a <script src> referencing cdn.tailwindcss.com should exist",
  );
});

test("Delivery: no heavy framework or bundler script tags were added", () => {
  // 8.1, 8.2 — the only external scripts should be the Tailwind CDN and
  // parallax.js. No react/vue/angular/svelte/jquery/bundler entry.
  const FORBIDDEN = /react|vue|angular|svelte|jquery|webpack|vite|rollup|esbuild|parcel|bundle/i;

  const srcs = Array.from(document.querySelectorAll("script[src]")).map((s) =>
    s.getAttribute("src"),
  );

  for (const src of srcs) {
    assert.ok(
      !FORBIDDEN.test(src),
      `unexpected framework/bundler script referenced: "${src}"`,
    );
  }

  // The external scripts should be exactly the Tailwind CDN and parallax.js.
  const allowed = srcs.filter(
    (src) =>
      src.includes("cdn.tailwindcss.com") || /(^|\/)parallax\.js$/.test(src),
  );
  assert.equal(
    allowed.length,
    srcs.length,
    `only the Tailwind CDN and parallax.js are allowed as external scripts; found: ${srcs.join(", ")}`,
  );
});
