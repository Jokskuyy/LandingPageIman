// Property 5: Profile links are never dead anchors (task 10.6).
//
// Validates: Requirements 1.7, 6.4
//
// Deterministic DOM assertions over the whole rendered index.html:
//   - No <a> element anywhere in the document is a dead anchor (href="#").
//   - Every GitHub/LinkedIn profile link uses a documented placeholder token
//     ([GITHUB_URL_PLACEHOLDER] / [LINKEDIN_URL_PLACEHOLDER]) or a real https URL.
//   - The email contact uses a mailto: link.
//
// In-page navigation anchors (e.g. #about, #projects) are explicitly allowed:
// they are not the prohibited bare-"#" dead anchor.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml } from "./harness.js";

const GITHUB_PLACEHOLDER = "[GITHUB_URL_PLACEHOLDER]";
const LINKEDIN_PLACEHOLDER = "[LINKEDIN_URL_PLACEHOLDER]";

/** All anchor elements in document order. */
function allAnchors(document) {
  return Array.from(document.querySelectorAll("a"));
}

/**
 * Heuristic: is this anchor a GitHub or LinkedIn *profile* link?
 * We look at the href and the accessible naming (aria-label / title / text)
 * for "github" or "linkedin" so the check covers hero, contact, and footer.
 */
function classifyProfileLink(anchor) {
  const href = (anchor.getAttribute("href") || "").trim();
  const label = [
    anchor.getAttribute("aria-label") || "",
    anchor.getAttribute("title") || "",
    anchor.textContent || "",
  ]
    .join(" ")
    .toLowerCase();

  const mentionsGitHub =
    href === GITHUB_PLACEHOLDER ||
    /github/i.test(href) ||
    /github/.test(label);
  const mentionsLinkedIn =
    href === LINKEDIN_PLACEHOLDER ||
    /linkedin/i.test(href) ||
    /linkedin/.test(label);

  if (mentionsGitHub) return "github";
  if (mentionsLinkedIn) return "linkedin";
  return null;
}

/** A valid profile href is a documented placeholder or a real https URL. */
function isValidProfileHref(href) {
  return (
    href === GITHUB_PLACEHOLDER ||
    href === LINKEDIN_PLACEHOLDER ||
    /^https:\/\/\S+/i.test(href)
  );
}

test("no anchor anywhere is a dead '#' anchor", () => {
  const { document } = loadIndexHtml();
  const dead = allAnchors(document).filter(
    (a) => (a.getAttribute("href") || "").trim() === "#"
  );
  assert.equal(
    dead.length,
    0,
    `expected zero dead "#" anchors, found ${dead.length}: ` +
      dead.map((a) => a.outerHTML).join(" | ")
  );
});

test("in-page navigation anchors (#section) are allowed and present", () => {
  const { document } = loadIndexHtml();
  const inPageNav = allAnchors(document).filter((a) => {
    const href = (a.getAttribute("href") || "").trim();
    return href.startsWith("#") && href.length > 1; // e.g. #about, not bare #
  });
  assert.ok(
    inPageNav.length > 0,
    "expected at least one in-page navigation anchor like #about"
  );
  // And none of them is the bare dead anchor.
  for (const a of inPageNav) {
    assert.notEqual((a.getAttribute("href") || "").trim(), "#");
  }
});

test("every GitHub/LinkedIn profile link uses a placeholder token or https URL", () => {
  const { document } = loadIndexHtml();
  const profileLinks = allAnchors(document)
    .map((a) => ({ anchor: a, kind: classifyProfileLink(a) }))
    .filter((x) => x.kind !== null);

  assert.ok(
    profileLinks.length > 0,
    "expected to find at least one GitHub/LinkedIn profile link"
  );

  for (const { anchor } of profileLinks) {
    const href = (anchor.getAttribute("href") || "").trim();
    assert.ok(
      isValidProfileHref(href),
      `profile link href must be a documented placeholder or https URL, got "${href}" in: ${anchor.outerHTML}`
    );
    assert.notEqual(href, "#", "a profile link must never be a dead '#' anchor");
  }
});

test("at least one GitHub and one LinkedIn link exist (placeholders honored)", () => {
  const { document } = loadIndexHtml();
  const kinds = allAnchors(document)
    .map(classifyProfileLink)
    .filter((k) => k !== null);

  assert.ok(kinds.includes("github"), "expected at least one GitHub profile link");
  assert.ok(
    kinds.includes("linkedin"),
    "expected at least one LinkedIn profile link"
  );
});

test("the email contact uses a mailto: link", () => {
  const { document } = loadIndexHtml();
  const mailtoLinks = allAnchors(document).filter((a) =>
    (a.getAttribute("href") || "").trim().toLowerCase().startsWith("mailto:")
  );

  assert.ok(
    mailtoLinks.length > 0,
    "expected at least one email contact link using mailto:"
  );

  // Any anchor that references an email address (text or aria-label) must do so
  // via a mailto: href rather than a dead '#' anchor.
  const emailRef = allAnchors(document).filter((a) => {
    const label = [
      a.getAttribute("aria-label") || "",
      a.getAttribute("title") || "",
      a.textContent || "",
      a.getAttribute("href") || "",
    ]
      .join(" ")
      .toLowerCase();
    return /@|mailto:|email/.test(label);
  });

  for (const a of emailRef) {
    const href = (a.getAttribute("href") || "").trim();
    assert.ok(
      href.toLowerCase().startsWith("mailto:"),
      `email contact link must use mailto:, got "${href}" in: ${a.outerHTML}`
    );
  }
});
