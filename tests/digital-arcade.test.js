import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadIndexHtml, html, INDEX_HTML_PATH } from "./harness.js";

const PROJECT_ROOT = dirname(INDEX_HTML_PATH);

test("Digital arcade: legacy field-note and theatrical labels are absent", () => {
  const { document } = loadIndexHtml();
  const text = document.body.textContent;

  assert.doesNotMatch(text, /field\s+note\s*\/\s*\d+/i);
  assert.doesNotMatch(text, /recruiter\s+snapshot/i);
  assert.doesNotMatch(text, /initiate\s+protocol/i);
});

test("Muted arcade: exact dark, surface, blue, sage, and warm tokens are defined", () => {
  for (const color of [
    "#161A22",
    "#1D2430",
    "#242C3A",
    "#F2EEE6",
    "#AAB2C0",
    "#5267A6",
    "#B5C98B",
    "#CC826A",
  ]) {
    assert.ok(
      html.toUpperCase().includes(color),
      `redesign should define the ${color} color token`,
    );
  }

  assert.ok(!html.toUpperCase().includes("#B8FF3D"), "neon lime should be absent");
});

test("Digital arcade: hero uses the generated comic avatar, not the raw photo", () => {
  const { document } = loadIndexHtml();
  const heroImage = document.querySelector(
    '#hero img[src="imgs/iman-avatar-comic-sage.webp"]',
  );

  assert.ok(heroImage, "hero should reference the generated comic avatar");
  assert.equal(heroImage.getAttribute("width"), "1086");
  assert.equal(heroImage.getAttribute("height"), "1448");
  assert.equal(heroImage.getAttribute("fetchpriority"), "high");
  assert.ok(!html.includes("344.jpeg"), "raw face reference must not enter the site");
});

test("Digital arcade: supporting prop rig is lazy-loaded and dimensioned", () => {
  const { document } = loadIndexHtml();
  const propRig = document.querySelector(
    'img[src="imgs/fullstack-prop-rig-sage.webp"]',
  );

  assert.ok(propRig, "supporting comic prop rig should be rendered");
  assert.equal(propRig.getAttribute("loading"), "lazy");
  assert.equal(propRig.getAttribute("width"), "1774");
  assert.equal(propRig.getAttribute("height"), "887");
});

test("Muted arcade: supporting props and scroll companion are wired progressively", () => {
  const { document } = loadIndexHtml();
  const iotProp = document.querySelector('img[src="imgs/iot-node-sage.webp"]');
  const buildRack = document.querySelector(
    'img[src="imgs/build-cartridge-rack-sage.webp"]',
  );
  const companion = document.querySelector("[data-scroll-companion]");
  const companionStatus = companion?.querySelector("[data-companion-status]");

  assert.ok(iotProp, "Skills should render the IoT prop");
  assert.equal(iotProp.getAttribute("loading"), "lazy");
  assert.equal(iotProp.getAttribute("width"), "1641");
  assert.equal(iotProp.getAttribute("height"), "958");

  assert.ok(buildRack, "Projects should render the build cartridge rack");
  assert.equal(buildRack.getAttribute("loading"), "lazy");
  assert.equal(buildRack.getAttribute("width"), "1254");
  assert.equal(buildRack.getAttribute("height"), "1254");

  assert.ok(companion, "the decorative scroll companion should exist");
  assert.equal(companion.getAttribute("aria-hidden"), "true");
  assert.equal(companion.dataset.state, "ONLINE");
  assert.equal(companionStatus?.textContent.trim(), "ONLINE");
  assert.match(html, /imgs\/scroll-workstation-sage\.webp/);

  for (const asset of [
    "imgs/iman-avatar-comic-sage.webp",
    "imgs/fullstack-prop-rig-sage.webp",
    "imgs/scroll-workstation-sage.webp",
    "imgs/iot-node-sage.webp",
    "imgs/build-cartridge-rack-sage.webp",
  ]) {
    assert.ok(existsSync(join(PROJECT_ROOT, asset)), `${asset} should exist`);
    assert.ok(html.includes(asset), `${asset} should be referenced by the page`);
  }
});

test("Muted arcade: the header uses the candidate's full name", () => {
  const { document } = loadIndexHtml();
  const homeLink = document.querySelector('header a[href="#hero"]');

  assert.match(homeLink?.textContent || "", /Muhammad Iman Nugraha/);
});

test("Digital arcade: hero avoids fixed viewport-height sections", () => {
  const { document } = loadIndexHtml();
  const hero = document.querySelector("#hero");
  const classes = hero.className;

  assert.ok(!classes.includes("min-h-screen"));
  assert.ok(!classes.includes("h-screen"));
  assert.ok(!classes.includes("min-h-[85vh]"));
});

test("Digital arcade: forbidden visual shortcuts and transition-all are absent", () => {
  const { document } = loadIndexHtml();

  assert.equal(document.querySelector(".glass-panel"), null);
  assert.equal(document.querySelector(".geo-bg"), null);
  assert.doesNotMatch(html, /transition\s*:\s*all/i);
  assert.doesNotMatch(html, /transition-all/i);
  assert.doesNotMatch(html, /bg-gradient-to-/i);
});

test("Accessibility: skip link, reduced-motion fallback, and theme color exist", () => {
  const { document } = loadIndexHtml();
  const skipLink = document.querySelector('a[href="#main-content"]');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  assert.ok(skipLink, "page should provide a skip link to main content");
  assert.equal(themeColor?.getAttribute("content"), "#161A22");
  assert.match(html, /color-scheme\s*:\s*dark/i);
  assert.match(html, /prefers-reduced-motion\s*:\s*reduce/i);
});

test("Accessibility: headings are hierarchical and every image is dimensioned", () => {
  const { document } = loadIndexHtml();
  const headingLevels = [...document.querySelectorAll("h1, h2, h3")].map(
    (heading) => Number(heading.tagName.slice(1)),
  );

  assert.equal(headingLevels[0], 1, "the document should begin with one h1");
  for (let index = 1; index < headingLevels.length; index += 1) {
    assert.ok(
      headingLevels[index] <= headingLevels[index - 1] + 1,
      `heading level should not jump from h${headingLevels[index - 1]} to h${headingLevels[index]}`,
    );
  }

  for (const image of document.querySelectorAll("img")) {
    assert.notEqual(image.getAttribute("alt"), null, `${image.src} needs alt text`);
    assert.match(image.getAttribute("width") || "", /^\d+$/);
    assert.match(image.getAttribute("height") || "", /^\d+$/);
    if (!image.closest("#hero")) {
      assert.equal(image.getAttribute("loading"), "lazy");
    }
  }
});

test("Accessibility: external links are isolated and buttons declare their type", () => {
  const { document } = loadIndexHtml();

  for (const link of document.querySelectorAll('a[href^="https://"]')) {
    assert.equal(link.getAttribute("target"), "_blank");
    const rel = link.getAttribute("rel") || "";
    assert.match(rel, /noopener/);
    assert.match(rel, /noreferrer/);
  }

  for (const button of document.querySelectorAll("button")) {
    assert.equal(button.getAttribute("type"), "button");
  }
});

test("Interaction hooks: build selector and copy status are semantic", () => {
  const { document } = loadIndexHtml();
  const buildLinks = [
    ...document.querySelectorAll("#projects a[data-build-link]"),
  ];
  const copyButton = document.querySelector("button#copy-email");
  const copyStatus = document.querySelector("#copy-status");

  assert.deepEqual(
    buildLinks.map((link) => link.getAttribute("href")),
    [
      "#project-dashboard",
      "#project-smarthome",
      "#project-albion",
      "#project-recehin",
    ],
  );
  assert.equal(buildLinks[0].getAttribute("aria-current"), "true");
  assert.equal(copyButton?.getAttribute("type"), "button");
  assert.equal(copyButton?.dataset.email, "imannnnugraha@gmail.com");
  assert.equal(copyStatus?.getAttribute("aria-live"), "polite");
});
