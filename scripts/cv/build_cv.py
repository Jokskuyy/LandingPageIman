"""Build the public, selectable-text one-page CV with ReportLab.

Run from any directory: python scripts/cv/build_cv.py
"""

from argparse import ArgumentParser
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / "output/pdf/muhammad-iman-nugraha-cv.pdf"
INK = colors.HexColor("#17241E")
MUTED = colors.HexColor("#43534A")
SAGE = colors.HexColor("#365B47")


def build_cv(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=19 * mm,
        rightMargin=19 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="Muhammad Iman Nugraha | Junior Fullstack Developer",
        author="Muhammad Iman Nugraha",
        subject="Junior Fullstack Developer CV",
        pageCompression=1,
    )
    base = ParagraphStyle(
        "base", fontName="Helvetica", fontSize=10.1, leading=14,
        textColor=INK, alignment=TA_LEFT, spaceAfter=5,
    )
    styles = {
        "name": ParagraphStyle("name", parent=base, fontName="Helvetica-Bold", fontSize=23, leading=27, spaceAfter=3),
        "role": ParagraphStyle("role", parent=base, fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=SAGE, spaceAfter=5),
        "contact": ParagraphStyle("contact", parent=base, fontSize=9.5, leading=13, textColor=MUTED, spaceAfter=2),
        "section": ParagraphStyle("section", parent=base, fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=SAGE, spaceBefore=12, spaceAfter=5, keepWithNext=True),
        "entry": ParagraphStyle("entry", parent=base, fontName="Helvetica-Bold", fontSize=10.5, leading=14, spaceAfter=3, keepWithNext=True),
        "meta": ParagraphStyle("meta", parent=base, fontSize=9.5, leading=12.5, textColor=MUTED, spaceAfter=5, keepWithNext=True),
        "body": base,
        "bullet": ParagraphStyle("bullet", parent=base, leftIndent=10, firstLineIndent=-8, spaceAfter=4),
    }
    story = []

    def para(text: str, style: str = "body") -> None:
        story.append(Paragraph(text, styles[style]))

    def bullet(text: str) -> None:
        para(f"- {text}", "bullet")

    def link(url: str, label: str) -> str:
        return f'<link href="{url}" color="#365B47"><u>{label}</u></link>'

    para("MUHAMMAD IMAN NUGRAHA", "name")
    para("Junior Fullstack Developer", "role")
    para("Jakarta, Indonesia | " + link("mailto:imannnnugraha@gmail.com", "imannnnugraha@gmail.com"), "contact")
    para(
        link("https://github.com/Jokskuyy", "github.com/Jokskuyy")
        + " | "
        + link("https://www.linkedin.com/in/muhammad-nugraha-9bb016286/", "LinkedIn: Muhammad Nugraha"),
        "contact",
    )
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#BDCEC2"), spaceAfter=0))

    para("SUMMARY", "section")
    para("Informatics graduate with frontend internship experience at Mantra. Build web interfaces, APIs, and database-backed applications with React, TypeScript, Express, and SQL.")

    para("TECHNICAL SKILLS", "section")
    para("<b>Frontend:</b> HTML, CSS, JavaScript, TypeScript, React, Tailwind CSS<br/>"
         "<b>Backend &amp; data:</b> Node.js, Express, REST APIs, MySQL, Supabase, PostgreSQL<br/>"
         "<b>Tools &amp; integration:</b> Git, Docker Compose, MQTT, Laravel API integration")

    para("EXPERIENCE", "section")
    para("Front-End Intern | Mantra (Teman Transisi)", "entry")
    para("March 2025 - October 2025", "meta")
    bullet("Implemented responsive web pages and admin dashboard interfaces using Tailwind CSS.")
    bullet("Added frontend validation for create, read, update, and delete (CRUD) workflows.")
    bullet("Collaborated with backend developers to integrate APIs in a Laravel application.")

    para("PROJECTS", "section")
    para("Dashboard Profile UPNVJ | Fullstack web application", "entry")
    para("Individual implementation | React, TypeScript, Express, Supabase | "
         + link("https://github.com/Jokskuyy/dashboard-profile-upnvj", "Source")
         + " | " + link("https://dashboard-profile-upnvj.vercel.app", "Live demo"), "meta")
    bullet("Built the frontend and backend for a profile-content dashboard with public pages and an authenticated admin interface.")
    bullet("Implemented Express APIs and configured data access using Supabase Row Level Security (RLS).")
    bullet("Used dynamic imports and memoized React context in the frontend implementation.")
    story.append(Spacer(1, 5))

    para("Smart Home IoT | Coursework project", "entry")
    para("Individual implementation | Express, MySQL, MQTT, Docker | "
         + link("https://github.com/Jokskuyy/smart_home", "Source and simulator instructions"), "meta")
    bullet("Built the web dashboard and backend services for sensor monitoring and light, fan, and smart-lock controls.")
    bullet("Connected device telemetry and commands over MQTT, with state persisted in MySQL.")
    bullet("Configured services with Docker Compose and a Node.js device simulator for demonstrations without physical hardware.")

    para("EDUCATION", "section")
    para("Universitas Pembangunan Nasional Veteran Jakarta", "entry")
    para("Informatics graduate | 2022 - 2026 | GPA: 3.76 / 4.00")

    doc.build(story)
    print(output)


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    build_cv(parser.parse_args().output.resolve())
