// Shared test harness: loads the static index.html from disk and parses it into
// a jsdom document so the assertion test files (10.2–10.8) can import a ready-to-
// query DOM without standing up a browser or build step.
//
// Usage:
//   import { loadIndexHtml, html } from "./harness.js";
//   const { document, window } = loadIndexHtml();
//
// `loadIndexHtml()` returns a fresh jsdom instance each call (so tests cannot
// leak DOM mutations into one another). `html` is the raw HTML string, handy for
// case-insensitive text scans (e.g. the freelance-terminology check in 10.7).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const __dirname = dirname(fileURLToPath(import.meta.url));

// index.html lives one level up from tests/.
export const INDEX_HTML_PATH = join(__dirname, "..", "index.html");

// Raw file contents, read once. Useful for plain-text/regex scans.
export const html = readFileSync(INDEX_HTML_PATH, "utf8");

/**
 * Parse index.html into a fresh jsdom document.
 *
 * Scripts are NOT executed: these are static-content assertions, so we only need
 * the parsed markup. Leaving scripts disabled keeps the harness fast and avoids
 * pulling the Tailwind CDN / parallax.js at test time.
 *
 * @returns {{ dom: JSDOM, window: Window, document: Document }}
 */
export function loadIndexHtml() {
  const dom = new JSDOM(html, {
    url: "https://example.com/",
    contentType: "text/html",
    // runScripts is intentionally omitted (defaults to no script execution).
  });
  return { dom, window: dom.window, document: dom.window.document };
}
