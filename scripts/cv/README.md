# Public CV

The CV uses ReportLab to produce a one-column A4 PDF with selectable text and
active contact/project links. The source contains the same approved profile,
internship, project ownership and education facts as the portfolio. It does not
invent impact metrics or claim an organizational deployment.

From the repository root:

```bash
python -m pip install reportlab pypdf
python scripts/cv/build_cv.py
python scripts/cv/validate_cv.py
```

The default output is `output/pdf/muhammad-iman-nugraha-cv.pdf`. The builder also
accepts `--output /path/to/cv.pdf`. No system fonts are required.

For layout QA, install Poppler, create `tmp/pdfs/`, then render and inspect the
result at full size:

```bash
pdftoppm -png -r 120 output/pdf/muhammad-iman-nugraha-cv.pdf tmp/pdfs/cv
```

Keep only the final PDF and the source scripts in version control; rendered QA
images are temporary. After changing text, rerun both checks and visually inspect
the rendered page for overflow, overlap, clipping and readable links.
