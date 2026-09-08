"""Check page count, selectable text and required hyperlinks in the public CV."""

from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
PDF = ROOT / "output/pdf/muhammad-iman-nugraha-cv.pdf"
reader = PdfReader(PDF)
assert len(reader.pages) == 1, "The public CV must fit on one A4 page."
page = reader.pages[0]
assert abs(float(page.mediabox.width) - 595.276) < 1
assert abs(float(page.mediabox.height) - 841.89) < 1
text = page.extract_text()
required_text = [
    "MUHAMMAD IMAN NUGRAHA", "Junior Fullstack Developer",
    "SUMMARY", "TECHNICAL SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION",
    "March 2025 - October 2025", "2022 - 2026", "3.76 / 4.00",
    "Dashboard Profile UPNVJ", "Smart Home IoT", "Coursework project",
    "imannnnugraha@gmail.com", "Individual implementation",
]
for item in required_text:
    assert item in text, f"Missing selectable text: {item}"
expected_urls = {
    "mailto:imannnnugraha@gmail.com",
    "https://github.com/Jokskuyy",
    "https://www.linkedin.com/in/muhammad-nugraha-9bb016286/",
    "https://github.com/Jokskuyy/dashboard-profile-upnvj",
    "https://dashboard-profile-upnvj.vercel.app",
    "https://github.com/Jokskuyy/smart_home",
}
actual_urls = {
    annotation.get_object().get("/A", {}).get("/URI")
    for annotation in page.get("/Annots", [])
    if annotation.get_object().get("/Subtype") == "/Link"
}
assert expected_urls <= actual_urls, f"Missing hyperlinks: {expected_urls - actual_urls}"
print(f"PASS: 1 A4 page, {len(text.split())} selectable words, {len(actual_urls)} active hyperlink targets.")
print(text)
