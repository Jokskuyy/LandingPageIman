// Hero, Contact, and navigation content checks (task 10.2).
//
// Deterministic DOM assertions over the single rendered index.html, loaded via
// the shared jsdom harness. These verify the employment-focused Hero content,
// the contact details (selectable email + working links), and the five-entry
// desktop navigation.
//
// Requirements covered: 1.1, 1.2, 1.3, 1.5, 1.6, 6.1, 6.2, 6.3, 7.5

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml } from "./harness.js";

const EMAIL = "imannnnugraha@gmail.com";
const MAILTO = `mailto:${EMAIL}`;
const GITHUB_URL = "https://github.com/Jokskuyy";
const LINKEDIN_PLACEHOLDER = "[LINKEDIN_URL_PLACEHOLDER]";

// Collapse all runs of whitespace to a single space and trim, so assertions are
// robust against the source markup's newlines/indentation.
function normalize(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

// A hero "contact link" is an anchor pointing at the email or one of the two
// profile placeholders (as opposed to the in-page CTA anchors like #projects).
function isContactHref(href) {
  return href === MAILTO || href === GITHUB_URL || href === LINKEDIN_PLACEHOLDER;
}

// Locate the desktop navigation: the header <nav> that is shown on md+ screens
// (the mobile menu lives in a separate <nav> inside a <details>).
function getDesktopNav(document) {
  const navs = [...document.querySelectorAll("header nav")];
  return navs.find((nav) => nav.className.includes("md:flex")) || navs[0];
}

test("Hero displays the candidate name (R1.1)", () => {
  const { document } = loadIndexHtml();
  const hero = document.querySelector("#hero");
  assert.ok(hero, "a #hero section should exist");

  const heroText = normalize(hero.textContent).toUpperCase();
  assert.ok(
    heroText.includes("MUHAMMAD IMAN NUGRAHA"),
    'Hero should display the name "Muhammad Iman Nugraha"'
  );
});

test("Hero displays the professional title (R1.2)", () => {
  const { document } = loadIndexHtml();
  const hero = document.querySelector("#hero");
  const heroText = normalize(hero.textContent);
  assert.ok(
    heroText.includes("Fullstack Web Developer"),
    'Hero should display the title "Fullstack Web Developer"'
  );
});

test("Hero displays the exact headline (R1.3)", () => {
  const { document } = loadIndexHtml();
  const hero = document.querySelector("#hero");
  const headline =
    "Building responsive web platforms, dynamic UIs, and robust backend systems.";

  const match = [...hero.querySelectorAll("p")].some(
    (p) => normalize(p.textContent) === headline
  );
  assert.ok(match, `Hero should contain the exact headline: "${headline}"`);
});

test("Hero provides exactly three contact links: email + two profile placeholders (R1.5, R1.6)", () => {
  const { document } = loadIndexHtml();
  const hero = document.querySelector("#hero");

  const contactLinks = [...hero.querySelectorAll("a[href]")].filter((a) =>
    isContactHref(a.getAttribute("href"))
  );

  assert.equal(
    contactLinks.length,
    3,
    "Hero should provide exactly three contact links"
  );

  const hrefs = contactLinks.map((a) => a.getAttribute("href"));

  // Exactly one email mailto link (R1.6).
  assert.equal(
    hrefs.filter((h) => h === MAILTO).length,
    1,
    `Hero should have exactly one ${MAILTO} link`
  );
  // Exactly one GitHub profile link (R1.5).
  assert.equal(
    hrefs.filter((h) => h === GITHUB_URL).length,
    1,
    `Hero should have exactly one GitHub link using ${GITHUB_URL}`
  );
  // Exactly one LinkedIn placeholder profile link (R1.5).
  assert.equal(
    hrefs.filter((h) => h === LINKEDIN_PLACEHOLDER).length,
    1,
    `Hero should have exactly one LinkedIn link using ${LINKEDIN_PLACEHOLDER}`
  );
});

test("Contact section shows the email as selectable plain text (R6.1, R6.5)", () => {
  const { document } = loadIndexHtml();
  const contact = document.querySelector("#contact");
  assert.ok(contact, "a #contact section should exist");

  // A non-anchor element whose text is exactly the email address: copyable even
  // when no mail client is configured.
  const plainTextEmail = [...contact.querySelectorAll("*")].some(
    (el) =>
      el.tagName !== "A" &&
      el.children.length === 0 &&
      normalize(el.textContent) === EMAIL
  );
  assert.ok(
    plainTextEmail,
    `Contact section should show ${EMAIL} as selectable plain text`
  );
});

test("Contact section provides a working mailto email link (R6.2)", () => {
  const { document } = loadIndexHtml();
  const contact = document.querySelector("#contact");

  const mailtoLink = [...contact.querySelectorAll("a[href]")].find(
    (a) => a.getAttribute("href") === MAILTO
  );
  assert.ok(mailtoLink, `Contact section should contain a ${MAILTO} link`);
});

test("Contact section provides GitHub and LinkedIn links (R6.3)", () => {
  const { document } = loadIndexHtml();
  const contact = document.querySelector("#contact");
  const hrefs = [...contact.querySelectorAll("a[href]")].map((a) =>
    a.getAttribute("href")
  );

  assert.ok(
    hrefs.includes(GITHUB_URL),
    `Contact section should link to GitHub via ${GITHUB_URL}`
  );
  assert.ok(
    hrefs.includes(LINKEDIN_PLACEHOLDER),
    `Contact section should link to LinkedIn via ${LINKEDIN_PLACEHOLDER}`
  );
});

test("Desktop navigation has exactly five entries linking to the five sections (R7.5)", () => {
  const { document } = loadIndexHtml();
  const nav = getDesktopNav(document);
  assert.ok(nav, "a desktop navigation should exist in the header");

  const links = [...nav.querySelectorAll("a[href]")];
  assert.equal(links.length, 5, "desktop nav should have exactly five entries");

  const hrefs = links.map((a) => a.getAttribute("href"));
  assert.deepEqual(
    hrefs,
    ["#about", "#experience", "#skills", "#projects", "#contact"],
    "nav entries should link to the five sections in order"
  );
});
