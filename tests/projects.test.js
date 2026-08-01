// Projects ordering and well-formedness checks (task 10.3).
//
// Verifies two Correctness Properties from the design over the #projects section
// of the static index.html, parsed deterministically via the jsdom harness:
//
//   Property 1: Web-focus projects precede the non-web project.
//   Property 2: Every rendered project is well-formed, incomplete ones omitted.
//
// Validates: Requirements 4.2, 4.7, 4.8, 4.10
//
// Per the design's Testing Strategy, these universally-quantified properties are
// checked deterministically against the single hand-authored document (there is
// no input space to randomize over), so they are expressed as example-free DOM
// assertions that quantify over *every* rendered project article.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml } from "./harness.js";

// The four featured projects in their required display order (Requirement 4.2).
const EXPECTED_ORDER = [
  "Dashboard Profile UPNVJ",
  "Smart Home IoT",
  "Albion Refining Calculator",
  "Recehin",
];

// The three Web_Development_Focus projects (Requirement 4.10).
const WEB_FOCUS_PROJECTS = [
  "Dashboard Profile UPNVJ",
  "Smart Home IoT",
  "Albion Refining Calculator",
];

// The single Non_Web_Focus project (Requirement 4.10).
const NON_WEB_PROJECT = "Recehin";

/**
 * Collect the rendered project articles from the #projects section in document
 * order. Each project is an <article>; its name is the <h3>, its description is
 * the long body <p> (`.leading-relaxed`), and its tech tokens are the <li> items
 * in the article's tech <ul>.
 *
 * @param {Document} document
 * @returns {{ name: string, description: string, techTokens: string[] }[]}
 */
function getRenderedProjects(document) {
  const section = document.querySelector("#projects");
  assert.ok(section, "#projects section should exist");

  const articles = section.querySelectorAll("article");
  return Array.from(articles).map((article) => {
    const heading = article.querySelector("h3");
    const descParagraph = article.querySelector("p.leading-relaxed");
    const techList = article.querySelector("ul");
    const techTokens = techList
      ? Array.from(techList.querySelectorAll("li"))
          .map((li) => li.textContent.trim())
          .filter((t) => t.length > 0)
      : [];

    return {
      name: heading ? heading.textContent.trim() : "",
      description: descParagraph ? descParagraph.textContent.trim() : "",
      techTokens,
    };
  });
}

// --- Property 1: Web-focus projects precede the non-web project -------------
// For all featured projects rendered in #projects, every Web_Development_Focus
// project appears earlier in document order than the Non_Web_Focus project.
// Validates: Requirements 4.2, 4.10

test("Property 1: rendered projects appear in the required display order", () => {
  const { document } = loadIndexHtml();
  const names = getRenderedProjects(document).map((p) => p.name);

  assert.deepEqual(
    names,
    EXPECTED_ORDER,
    "the four projects should render in the exact required order"
  );
});

test("Property 1: every web-focus project precedes the non-web project (Recehin)", () => {
  const { document } = loadIndexHtml();
  const names = getRenderedProjects(document).map((p) => p.name);

  const nonWebIndex = names.indexOf(NON_WEB_PROJECT);
  assert.notEqual(
    nonWebIndex,
    -1,
    `${NON_WEB_PROJECT} should be present in the projects section`
  );

  for (const webProject of WEB_FOCUS_PROJECTS) {
    const webIndex = names.indexOf(webProject);
    assert.notEqual(
      webIndex,
      -1,
      `${webProject} should be present in the projects section`
    );
    assert.ok(
      webIndex < nonWebIndex,
      `${webProject} (index ${webIndex}) should appear before ${NON_WEB_PROJECT} (index ${nonWebIndex})`
    );
  }
});

test("Property 1: the non-web project (Recehin) is rendered last", () => {
  const { document } = loadIndexHtml();
  const names = getRenderedProjects(document).map((p) => p.name);

  assert.equal(
    names[names.length - 1],
    NON_WEB_PROJECT,
    `${NON_WEB_PROJECT} should be the last rendered project`
  );
});

// --- Property 2: Every rendered project is well-formed ----------------------
// For all projects shown in #projects, each rendered project has a non-empty
// name, a description of 1–500 characters, and a tech stack with at least one
// technology; incomplete projects are omitted from the rendered output.
// Validates: Requirements 4.7, 4.8

test("Property 2: every rendered project has a non-empty name", () => {
  const { document } = loadIndexHtml();
  const projects = getRenderedProjects(document);

  assert.ok(projects.length > 0, "at least one project should be rendered");
  for (const project of projects) {
    assert.ok(
      project.name.length > 0,
      `a rendered project is missing its name (description: "${project.description.slice(0, 40)}...")`
    );
  }
});

test("Property 2: every rendered project has a description of 1–500 characters", () => {
  const { document } = loadIndexHtml();
  const projects = getRenderedProjects(document);

  for (const project of projects) {
    const len = project.description.length;
    assert.ok(
      len >= 1 && len <= 500,
      `project "${project.name}" should have a 1–500 char description but had ${len}`
    );
  }
});

test("Property 2: every rendered project has at least one tech token", () => {
  const { document } = loadIndexHtml();
  const projects = getRenderedProjects(document);

  for (const project of projects) {
    assert.ok(
      project.techTokens.length >= 1,
      `project "${project.name}" should have at least one tech token`
    );
  }
});

test("Property 2: no incomplete project is rendered (all rendered projects are well-formed)", () => {
  const { document } = loadIndexHtml();
  const projects = getRenderedProjects(document);

  // A rendered article is well-formed iff it has all three required parts.
  // The "omit incomplete" rule means: no rendered article may be missing any.
  for (const project of projects) {
    const wellFormed =
      project.name.length > 0 &&
      project.description.length >= 1 &&
      project.description.length <= 500 &&
      project.techTokens.length >= 1;
    assert.ok(
      wellFormed,
      `incomplete project rendered: ${JSON.stringify({
        name: project.name,
        descriptionLength: project.description.length,
        techTokens: project.techTokens.length,
      })}`
    );
  }
});

// ---------------------------------------------------------------------------
// Property 3: Project card content is truthful and synchronized
// Validates plan.md TDD acceptance criteria 1–6.
// ---------------------------------------------------------------------------

/** Helper: collect all <a> elements inside a project article. */
function getProjectLinks(article) {
  return Array.from(article.querySelectorAll("a")).map((a) => ({
    href: a.getAttribute("href"),
    target: a.getAttribute("target"),
    rel: a.getAttribute("rel"),
    text: a.textContent.trim(),
  }));
}

/** Helper: find the article whose h3 matches the given project name. */
function findArticle(document, name) {
  const section = document.querySelector("#projects");
  const articles = section.querySelectorAll("article");
  for (const article of articles) {
    const h3 = article.querySelector("h3");
    if (h3 && h3.textContent.trim() === name) return article;
  }
  return null;
}

// 1. Dashboard card uses correct image, live URL, and repo URL.
test("Property 3.1: Dashboard card uses imgs/dashboard-upnvj.png and correct links", () => {
  const { document } = loadIndexHtml();
  const article = findArticle(document, "Dashboard Profile UPNVJ");
  assert.ok(article, "Dashboard Profile UPNVJ article should exist");

  // Image check
  const imgHtml = article.innerHTML;
  assert.ok(
    imgHtml.includes("imgs/dashboard-upnvj.png"),
    "Dashboard card should use imgs/dashboard-upnvj.png"
  );

  // Links check
  const links = getProjectLinks(article);
  const liveLink = links.find((l) => l.href === "https://dashboard-profile-upnvj.vercel.app");
  assert.ok(liveLink, "Dashboard card should link to its live URL");

  const repoLink = links.find((l) => l.href === "https://github.com/Jokskuyy/dashboard-profile-upnvj");
  assert.ok(repoLink, "Dashboard card should link to its repo URL");
});

// 2. Albion card uses correct image, live URL, and repo URL.
test("Property 3.2: Albion card uses imgs/albioncalc.png and correct links", () => {
  const { document } = loadIndexHtml();
  const article = findArticle(document, "Albion Refining Calculator");
  assert.ok(article, "Albion Refining Calculator article should exist");

  const imgHtml = article.innerHTML;
  assert.ok(
    imgHtml.includes("imgs/albioncalc.png"),
    "Albion card should use imgs/albioncalc.png"
  );

  const links = getProjectLinks(article);
  const liveLink = links.find((l) => l.href === "https://albion-refining-calculator.vercel.app");
  assert.ok(liveLink, "Albion card should link to its live URL");

  const repoLink = links.find((l) => l.href === "https://github.com/Jokskuyy/Albion-Refining-Calculator");
  assert.ok(repoLink, "Albion card should link to its repo URL");
});

// 3. Smart Home links to repo, has no live-demo anchor, visible "Live demo not available".
test("Property 3.3: Smart Home card has repo link, no live-demo anchor, and 'Live demo not available'", () => {
  const { document } = loadIndexHtml();
  const article = findArticle(document, "Smart Home IoT");
  assert.ok(article, "Smart Home IoT article should exist");

  const links = getProjectLinks(article);
  const repoLink = links.find((l) => l.href === "https://github.com/Jokskuyy/smart_home");
  assert.ok(repoLink, "Smart Home card should link to its repo URL");

  // No live-demo anchor
  const liveLink = links.find((l) =>
    l.text.toLowerCase().includes("live demo") ||
    l.text.toLowerCase().includes("live site")
  );
  assert.equal(liveLink, undefined, "Smart Home card should have no live-demo anchor");

  // Visible "Live demo not available"
  const articleText = article.textContent;
  assert.ok(
    articleText.includes("Live demo not available"),
    "Smart Home card should contain 'Live demo not available'"
  );
});

// 4. Recehin links to repo, has no live-demo anchor, visible "Live demo not available".
test("Property 3.4: Recehin card has repo link, no live-demo anchor, and 'Live demo not available'", () => {
  const { document } = loadIndexHtml();
  const article = findArticle(document, "Recehin");
  assert.ok(article, "Recehin article should exist");

  const links = getProjectLinks(article);
  const repoLink = links.find((l) => l.href === "https://github.com/Jokskuyy/recehin-app");
  assert.ok(repoLink, "Recehin card should link to its repo URL");

  const liveLink = links.find((l) =>
    l.text.toLowerCase().includes("live demo") ||
    l.text.toLowerCase().includes("live site")
  );
  assert.equal(liveLink, undefined, "Recehin card should have no live-demo anchor");

  const articleText = article.textContent;
  assert.ok(
    articleText.includes("Live demo not available"),
    "Recehin card should contain 'Live demo not available'"
  );
});

// 5. No project card references imgs/landingpage.png or imgs/mantra.png.
test("Property 3.5: No project card references imgs/landingpage.png or imgs/mantra.png", () => {
  const { document } = loadIndexHtml();
  const section = document.querySelector("#projects");
  const articles = section.querySelectorAll("article");

  for (const article of articles) {
    const html = article.innerHTML;
    assert.ok(
      !html.includes("imgs/landingpage.png"),
      `Project "${article.querySelector("h3")?.textContent}" should not reference imgs/landingpage.png`
    );
    assert.ok(
      !html.includes("imgs/mantra.png"),
      `Project "${article.querySelector("h3")?.textContent}" should not reference imgs/mantra.png`
    );
  }
});

// 6. Every external project link has target="_blank" and rel containing noopener and noreferrer.
test("Property 3.6: Every external project link has target=_blank and rel with noopener noreferrer", () => {
  const { document } = loadIndexHtml();
  const section = document.querySelector("#projects");
  const articles = section.querySelectorAll("article");

  for (const article of articles) {
    const links = getProjectLinks(article);
    for (const link of links) {
      assert.equal(
        link.target,
        "_blank",
        `Link "${link.href}" should have target="_blank"`
      );
      assert.ok(
        link.rel && link.rel.includes("noopener"),
        `Link "${link.href}" should have rel containing "noopener"`
      );
      assert.ok(
        link.rel && link.rel.includes("noreferrer"),
        `Link "${link.href}" should have rel containing "noreferrer"`
      );
    }
  }
});
