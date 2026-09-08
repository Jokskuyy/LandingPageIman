# Muhammad Iman Nugraha — portfolio

A static, English-language portfolio for Junior Fullstack Developer applications.
Published at https://jokskuyy.github.io/LandingPageIman/ through GitHub Pages from
the root of the `main` branch.

## Develop and verify

```sh
npm ci
npm run build
npm test
python -m http.server 43187 --bind 127.0.0.1
```

Open http://127.0.0.1:43187/. Tailwind 3.4 compiles `styles/input.css` to the
committed `styles/site.css`; rebuild CSS after changing HTML classes or styles.
There is no browser-side Tailwind compiler or frontend framework runtime.
Keep asset and CV links relative so they also work under the Pages project path.

The tests check content, links, accessibility structure and navigation/contact
behavior. Browser verification covers 1280×720, 1440×900 and 390×844 layouts,
keyboard navigation, visible primary actions and a page with JavaScript absent.

## Content and evidence

The two primary projects are Dashboard Profile UPNVJ and Smart Home IoT. Project
descriptions distinguish screenshots, architecture diagrams and concept artwork.
Repository links provide implementation/test evidence; do not turn the presence
of a test file into a claim that its suite was run. The owner confirmed full
implementation of Dashboard and Smart Home. Smart Home is a coursework simulator.

Current education: Informatics graduate, UPN Veteran Jakarta, 2022–2026,
GPA 3.76/4.00. Historical `portfolio_prompt.md` describes an earlier iteration;
its student status and GPA are superseded by the current page and CV.

## CV

The public PDF is `output/pdf/muhammad-iman-nugraha-cv.pdf`. Rebuild and visually
validate it using the instructions in `scripts/cv/README.md`. It must remain one
page with selectable text and active links. Intermediate renders belong in the
ignored `tmp/` directory.

## Publishing

Commit the HTML, JavaScript, rebuilt CSS, referenced images and final PDF.
Publishing `main` triggers the existing GitHub Pages build. Verify the public
page, relative assets and PDF after the Pages deployment finishes.
The Albion demo is deployed independently from its own repository; update its
portfolio screenshot only after checking the released calculator.
