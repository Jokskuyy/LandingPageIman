// Task 10.4 — Skills category check.
//
// Property 3: Skill categories are non-empty and web-skills ordered first.
//   For all skill categories rendered in the Skills_Section, the category
//   container appears only if it contains at least one skill, and within each
//   category every Non_Web_Focus skill (if present) appears after all
//   Web_Development_Focus skills.
//
// In addition to the universal invariants, this file pins the concrete category
// membership and ordering required by the design (the four labeled categories
// and their skill tokens), verified deterministically against the single
// rendered index.html.
//
// Validates: Requirements 5.6, 5.7

import test from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml } from "./harness.js";

const { document } = loadIndexHtml();

// The expected four categories, in the order the design fixes them, with the
// exact skill membership. Frontend additionally requires React.js and
// TypeScript to be listed first, in that order.
const EXPECTED_CATEGORIES = [
  {
    label: "Frontend",
    skills: ["React.js", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS"],
  },
  {
    label: "Backend",
    skills: ["Python", "PHP", "Node.js", "Express.js", "Laravel"],
  },
  {
    label: "Databases",
    skills: ["MySQL", "PostgreSQL", "Supabase", "Firebase"],
  },
  {
    label: "Architecture & Tools",
    skills: ["Git", "Docker", "REST API", "MVC", "Microservices"],
  },
];

// Known Non_Web_Focus skills (platform-specific mobile, etc.). None of these are
// expected to appear in the skills matrix, but the ordering invariant is checked
// against this set so the property is meaningful if such a token is ever added.
const NON_WEB_SKILLS = new Set([
  "Android Studio",
  "Java/Kotlin",
  "Kotlin",
  "Retrofit",
  "Jetpack Compose",
]);

/**
 * Select the rendered skill-category cards within #skills.
 *
 * Each category card holds exactly one <h4> label and a flex-wrap container of
 * <span> skill chips. We treat any element inside #skills that has an <h4> and a
 * chip container as a category card, ignoring the section heading (an <h2>/<h3>
 * pair that has no chip container).
 */
function getSkillCards() {
  const skills = document.querySelector("#skills");
  assert.ok(skills, "an #skills section should exist");

  const grid = skills.querySelector(".grid");
  assert.ok(grid, "the #skills section should contain a grid of category cards");

  // Direct children of the grid are the category cards.
  return Array.from(grid.children).filter((card) => card.querySelector("h4"));
}

/** Read a card's label and its ordered list of skill-token strings. */
function readCard(card) {
  const label = card.querySelector("h4").textContent.trim();
  // The chip container is the flex-wrap div; its <span> children are the tokens.
  const chipContainer = card.querySelector("div.flex.flex-wrap");
  const tokens = chipContainer
    ? Array.from(chipContainer.querySelectorAll("span")).map((s) =>
        s.textContent.trim(),
      )
    : [];
  return { label, tokens };
}

test("Skills: exactly four labeled categories in the expected order", () => {
  const cards = getSkillCards();
  const labels = cards.map((c) => c.querySelector("h4").textContent.trim());
  assert.equal(cards.length, 4, "there should be exactly four skill categories");
  assert.deepEqual(
    labels,
    EXPECTED_CATEGORIES.map((c) => c.label),
    "category labels should be Frontend, Backend, Databases, Architecture & Tools in order",
  );
});

test("Skills (Property 3): every rendered category is non-empty", () => {
  // 5.7 — no empty category container is rendered.
  for (const card of getSkillCards()) {
    const { label, tokens } = readCard(card);
    assert.ok(
      tokens.length >= 1,
      `category "${label}" should render at least one skill token`,
    );
    for (const token of tokens) {
      assert.ok(
        token.length > 0,
        `category "${label}" should not render an empty skill token`,
      );
    }
  }
});

test("Skills (Property 3): web skills are ordered before any non-web skill", () => {
  // 5.6 — within each category, a Non_Web_Focus skill (if present) appears after
  // all Web_Development_Focus skills.
  for (const card of getSkillCards()) {
    const { label, tokens } = readCard(card);
    let seenNonWeb = false;
    for (const token of tokens) {
      const isNonWeb = NON_WEB_SKILLS.has(token);
      if (isNonWeb) {
        seenNonWeb = true;
      } else if (seenNonWeb) {
        assert.fail(
          `category "${label}" lists web skill "${token}" after a non-web skill`,
        );
      }
    }
  }
});

test("Skills: each category has the exact expected membership and order", () => {
  const cards = getSkillCards();
  const byLabel = new Map(
    cards.map((card) => {
      const { label, tokens } = readCard(card);
      return [label, tokens];
    }),
  );

  for (const expected of EXPECTED_CATEGORIES) {
    const tokens = byLabel.get(expected.label);
    assert.ok(tokens, `category "${expected.label}" should be present`);
    assert.deepEqual(
      tokens,
      expected.skills,
      `category "${expected.label}" should list its skills in the expected order`,
    );
  }
});

test("Skills: Frontend lists React.js and TypeScript first, in that order", () => {
  const cards = getSkillCards();
  const frontend = cards
    .map(readCard)
    .find((c) => c.label === "Frontend");
  assert.ok(frontend, "a Frontend category should exist");
  assert.deepEqual(
    frontend.tokens.slice(0, 2),
    ["React.js", "TypeScript"],
    "Frontend should list React.js then TypeScript first",
  );
});
