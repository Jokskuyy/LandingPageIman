// Smoke test for the jsdom harness (task 10.1).
// Confirms the harness can load index.html from disk, parse it into a DOM, and
// locate the document <title>. This proves the test plumbing works before the
// content-assertion suites (10.2–10.8) build on top of it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndexHtml, html } from "./harness.js";

test("harness reads index.html from disk", () => {
  assert.ok(html.length > 0, "index.html should not be empty");
  assert.match(html, /<!DOCTYPE html>/i, "should look like an HTML document");
});

test("harness parses index.html into a jsdom document", () => {
  const { document } = loadIndexHtml();
  assert.ok(document, "document should be defined");
  assert.ok(document.documentElement, "document should have a root element");
});

test("harness finds the <title> element", () => {
  const { document } = loadIndexHtml();
  const title = document.querySelector("title");
  assert.ok(title, "a <title> element should exist");
  assert.ok(title.textContent.trim().length > 0, "title should not be empty");
});

test("loadIndexHtml returns isolated documents per call", () => {
  const first = loadIndexHtml().document;
  first.body.setAttribute("data-mutated", "yes");

  const second = loadIndexHtml().document;
  assert.equal(
    second.body.getAttribute("data-mutated"),
    null,
    "a fresh document should not carry mutations from a previous load"
  );
});
