// Property 6: No freelance or service-provider terminology appears (task 10.7).
//
// Validates: Requirements 7.1
//
// Deterministic scan of the *rendered* document text. We read
// document.body.textContent (NOT the raw HTML) so that HTML comments and the
// authoring placeholder tokens ([GITHUB_URL_PLACEHOLDER] /
// [LINKEDIN_URL_PLACEHOLDER]) are excluded from the scan — only text a visitor
// can actually read is checked.
//
// Each prohibited term is matched case-insensitively with word boundaries so we
// never flag a term that is merely a substring of an unrelated, legitimate word.
// This matters here because the rendered portfolio intentionally contains
// legitimate technical content that *looks* close to a prohibited term:
//   - "Microservices" / "Services communicate with devices ..."  (Req 4.4)
//   - "end-to-end client-server communication"                   (Req 4.6)
// Word-boundary matching keeps "microservices" from matching "services", and
// matching the plural "clients" (not the singular "client") keeps
// "client-server" from being flagged. The bare technical word "Services" in the
// Smart Home IoT description is a microservices component reference, not a
// service-provider offering, so "services" is matched only in a clear
// service-provider/offering context (see SERVICE_PROVIDER_OFFERING below).

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml } from "./harness.js";

/**
 * Collapse all runs of whitespace (newlines, indentation from the source markup)
 * into single spaces so multi-word phrases like "for hire" match even when the
 * underlying markup wraps across lines or nests elements.
 */
function renderedText(document) {
  return (document.body.textContent || "").replace(/\s+/g, " ");
}

// Prohibited freelance / service-provider terms (case-insensitive, whole-word).
// Mirrors the list in Requirement 7.1 / design Property 6.
const PROHIBITED = [
  { name: "freelance", re: /\bfreelance\b/i },
  { name: "freelancer", re: /\bfreelancer\b/i },
  { name: "satisfaction", re: /\bsatisfaction\b/i },
  { name: "for hire", re: /\bfor hire\b/i },
  { name: "hire me", re: /\bhire me\b/i },
  // Plural "clients" only — the singular in "client-server" (Req 4.6) is allowed.
  { name: "clients", re: /\bclients\b/i },
  { name: "client work", re: /\bclient work\b/i },
  { name: "pricing", re: /\bpricing\b/i },
  { name: "packages", re: /\bpackages\b/i },
  { name: "available for hire", re: /\bavailable for hire\b/i },
  { name: "service offering", re: /\bservice offerings?\b/i },
  // Available-for-hire phrasing variants.
  { name: "for hire (any)", re: /\b(?:now|currently)?\s*available for hire\b/i },
];

// "services" is only prohibited as a service-provider *offering*, not as the
// generic technical word (e.g. "Services communicate ..." in a microservices
// architecture, Req 4.4). We therefore require an offering context around it.
const SERVICE_PROVIDER_OFFERING =
  /\b(?:freelance|web|development|design|consulting|professional|digital|software|my|our|premium|quality)\s+services\b/i;

test("no prohibited freelance/service-provider term appears in rendered body text", () => {
  const { document } = loadIndexHtml();
  const text = renderedText(document);

  const hits = [];
  for (const { name, re } of PROHIBITED) {
    const m = text.match(re);
    if (m) hits.push(`"${name}" -> matched "${m[0]}"`);
  }

  const offering = text.match(SERVICE_PROVIDER_OFFERING);
  if (offering) hits.push(`"services (offering)" -> matched "${offering[0]}"`);

  assert.equal(
    hits.length,
    0,
    `expected zero freelance/service-provider terms in visible text, found: ${hits.join(
      "; "
    )}`
  );
});

test("scan targets rendered text, not source tokens or comments", () => {
  const { document } = loadIndexHtml();
  const text = renderedText(document);

  // The authoring placeholder tokens live in href attributes, not visible text,
  // so the rendered body text must not surface them as readable content.
  assert.ok(
    !text.includes("[GITHUB_URL_PLACEHOLDER]"),
    "placeholder token should not appear in visible body text"
  );
  assert.ok(
    !text.includes("[LINKEDIN_URL_PLACEHOLDER]"),
    "placeholder token should not appear in visible body text"
  );
  // Sanity: we are actually scanning real content.
  assert.ok(text.length > 0, "rendered body text should be non-empty");
});

test("legitimate technical terms are not false-positives (word-boundary care)", () => {
  const { document } = loadIndexHtml();
  const text = renderedText(document);

  // These legitimate phrases SHOULD be present and must NOT trip the scan.
  // (They are the close-but-allowed neighbours of prohibited terms.)
  for (const { re } of PROHIBITED) {
    // "Microservices" must not be flagged by any prohibited matcher.
    assert.ok(
      !re.test("Microservices architecture"),
      `prohibited matcher ${re} wrongly flags "Microservices"`
    );
    // "client-server" must not be flagged by the plural "clients" matcher.
    assert.ok(
      !re.test("end-to-end client-server communication"),
      `prohibited matcher ${re} wrongly flags "client-server"`
    );
  }

  // The generic technical word "Services" (microservices components) is allowed.
  assert.ok(
    !SERVICE_PROVIDER_OFFERING.test("Services communicate with devices over MQTT"),
    "technical 'Services communicate ...' must not match the offering pattern"
  );
});
