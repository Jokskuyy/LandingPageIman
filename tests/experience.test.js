// Experience section assertions (task 10.5).
//
// Property 4: Experience entries omit only missing fields.
// For all experience entries in the Experience_Section, any field (role,
// company, duration, or a responsibility item) that is empty is absent from the
// rendered entry while every populated field of that entry still renders.
// Validates: Requirement 3.4
//
// The deliverable is a single hand-authored static index.html, so this property
// is verified deterministically (per the design's Testing Strategy) by parsing
// the rendered document and asserting over the #experience section: the
// populated role/company/duration fields render together as their own elements,
// the four responsibility items render as distinct individually-visible
// elements, and no empty/blank field element is rendered.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml } from "./harness.js";

// Note: the duration uses an en-dash "–" (U+2013), not a hyphen-minus.
const EXPECTED_ROLE = "Front-End Intern";
const EXPECTED_COMPANY = "Mantra (Teman Transisi)";
const EXPECTED_DURATION = "03/2025 – 10/2025";
const EXPECTED_RESPONSIBILITIES = [
  "Responsive web platform front-end development",
  "Responsive admin dashboard UI implementation",
  "Front-end data validation for CRUD operations",
  "Collaboration with back-end developers for API integration within a Laravel framework",
];

// Collapse whitespace so assertions are robust to source indentation/newlines.
const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();

// Some field elements wrap a decorative material-symbols-outlined icon span
// alongside the real text (e.g. a calendar glyph next to the duration). Return
// the element's visible text with those icon ligatures removed.
function visibleText(el) {
  if (!el) return "";
  const clone = el.cloneNode(true);
  clone.querySelectorAll(".material-symbols-outlined").forEach((n) => n.remove());
  return normalize(clone.textContent);
}

function getExperienceSection(document) {
  const section = document.querySelector("#experience");
  assert.ok(section, "#experience section should exist");
  return section;
}

// The visible responsibility text lives in the <span> that is NOT the decorative
// material-symbols-outlined icon span.
function getResponsibilityTexts(section) {
  const items = [...section.querySelectorAll("ul li")];
  return items.map((li) => {
    const textSpan = li.querySelector("span:not(.material-symbols-outlined)");
    // Fall back to the li's own text (minus the icon ligature) if no dedicated span.
    return normalize(textSpan ? textSpan.textContent : li.textContent);
  });
}

test("experience role renders as its own element with the populated value", () => {
  const { document } = loadIndexHtml();
  const section = getExperienceSection(document);

  const role = section.querySelector("h4");
  assert.ok(role, "the role should render as an <h4> element");
  assert.equal(normalize(role.textContent), EXPECTED_ROLE);
});

test("experience company renders as its own element with the populated value", () => {
  const { document } = loadIndexHtml();
  const section = getExperienceSection(document);

  const companyEl = [...section.querySelectorAll("p")].find(
    (p) => normalize(p.textContent) === EXPECTED_COMPANY
  );
  assert.ok(companyEl, `a company element with text "${EXPECTED_COMPANY}" should render`);
});

test("experience duration renders as its own element with the en-dash value", () => {
  const { document } = loadIndexHtml();
  const section = getExperienceSection(document);

  const durationEl = [...section.querySelectorAll("span")].find(
    (el) => visibleText(el) === EXPECTED_DURATION
  );
  assert.ok(
    durationEl,
    `a duration element with text "${EXPECTED_DURATION}" (en-dash) should render`
  );
});

test("role, company, and duration render together within the same entry", () => {
  const { document } = loadIndexHtml();
  const section = getExperienceSection(document);

  const entry = section.querySelector("article");
  assert.ok(entry, "the experience entry (<article>) should exist");

  const entryText = normalize(entry.textContent);
  assert.ok(entryText.includes(EXPECTED_ROLE), "entry should contain the role");
  assert.ok(entryText.includes(EXPECTED_COMPANY), "entry should contain the company");
  assert.ok(entryText.includes(EXPECTED_DURATION), "entry should contain the duration");
});

test("four distinct, individually visible responsibility items render", () => {
  const { document } = loadIndexHtml();
  const section = getExperienceSection(document);

  const items = [...section.querySelectorAll("ul li")];
  assert.equal(items.length, 4, "exactly four responsibility list items should render");

  const texts = getResponsibilityTexts(section);

  // Each expected responsibility is present as its own item.
  for (const expected of EXPECTED_RESPONSIBILITIES) {
    assert.ok(
      texts.includes(expected),
      `a responsibility item with text "${expected}" should render`
    );
  }

  // Items are distinct (no duplicates collapsing four into fewer).
  assert.equal(new Set(texts).size, 4, "the four responsibility items should be distinct");
});

test("no empty or blank field elements are rendered in the entry", () => {
  const { document } = loadIndexHtml();
  const section = getExperienceSection(document);

  // No empty responsibility list items.
  const items = [...section.querySelectorAll("ul li")];
  for (const li of items) {
    assert.ok(
      normalize(li.textContent).length > 0,
      "no responsibility list item should be empty/blank"
    );
  }

  // The populated role/company/duration fields are non-empty (omit-only-missing:
  // since all are populated here, none should render as a blank element).
  const role = section.querySelector("h4");
  assert.ok(normalize(role.textContent).length > 0, "role element should not be blank");

  const responsibilityTexts = getResponsibilityTexts(section);
  for (const txt of responsibilityTexts) {
    assert.ok(txt.length > 0, "each rendered responsibility text should be non-empty");
  }
});
