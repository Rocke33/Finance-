"""
Build Full Technical Documentation PDF and Markdown for AIFinance (AI-Powered Personal Finance Assistant)
Author: Senior Technical Writer & Full-Stack Architect
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# ----------------------------------------------------------------------
# 1. NUMBERED CANVAS (RUNNING HEADERS & FOOTERS WITH "PAGE X OF Y")
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress headers and footers on the cover page
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(colors.HexColor("#0F382C"))
        self.drawString(54, 752, "AIFINANCE")

        self.setFont("Helvetica", 7)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(104, 752, "|  AI-Powered Personal Finance Assistant  —  Hackathon Technical Documentation")

        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(54, 744, 558, 744)

        # Footer
        self.line(54, 42, 558, 42)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 30, "Team Never Existed | Jahangirnagar University (CSE) — AIFinance Technical Documentation")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 30, page_str)
        self.restoreState()


# ----------------------------------------------------------------------
# 2. STYLES & COLOR PALETTE
# ----------------------------------------------------------------------
PRIMARY = colors.HexColor("#0F382C")      # Deep Forest Emerald
PRIMARY_LIGHT = colors.HexColor("#E8F5EE")
ACCENT = colors.HexColor("#E5484D")       # Coral Red (AIFinance Brand)
ACCENT_LIGHT = colors.HexColor("#FFF0F0")
DARK = colors.HexColor("#0F172A")         # Slate 900
BODY = colors.HexColor("#334155")         # Slate 700
MUTED = colors.HexColor("#64748B")        # Slate 500
BORDER = colors.HexColor("#CBD5E1")       # Slate 300
BORDER_LIGHT = colors.HexColor("#E2E8F0") # Slate 200
BG_CARD = colors.HexColor("#F8FAFC")      # Slate 50
SUCCESS = colors.HexColor("#10B981")
WARNING = colors.HexColor("#F59E0B")
DANGER = colors.HexColor("#EF4444")
PURPLE = colors.HexColor("#7C3AED")
BLUE = colors.HexColor("#0284C7")

def get_doc_styles():
    base = getSampleStyleSheet()

    # Custom styles
    styles = {
        'DocTitle': ParagraphStyle(
            'DocTitle',
            parent=base['Title'],
            fontName='Helvetica-Bold',
            fontSize=26,
            leading=32,
            textColor=DARK,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        'DocSub': ParagraphStyle(
            'DocSub',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=13,
            leading=18,
            textColor=MUTED,
            alignment=TA_LEFT,
            spaceAfter=15,
        ),
        'Badge': ParagraphStyle(
            'Badge',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=PRIMARY,
            alignment=TA_LEFT,
        ),
        'Heading1': ParagraphStyle(
            'H1',
            parent=base['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=PRIMARY,
            spaceBefore=16,
            spaceAfter=8,
            keepWithNext=True,
        ),
        'Heading2': ParagraphStyle(
            'H2',
            parent=base['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=DARK,
            spaceBefore=12,
            spaceAfter=6,
            keepWithNext=True,
        ),
        'Heading3': ParagraphStyle(
            'H3',
            parent=base['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=14,
            textColor=BODY,
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        ),
        'Body': ParagraphStyle(
            'Body',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12.5,
            textColor=BODY,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        'BodyJustify': ParagraphStyle(
            'BodyJustify',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12.5,
            textColor=BODY,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        'Bullet': ParagraphStyle(
            'Bullet',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=BODY,
            leftIndent=14,
            spaceAfter=3,
        ),
        'Code': ParagraphStyle(
            'Code',
            parent=base['Normal'],
            fontName='Courier',
            fontSize=7.5,
            leading=10.5,
            textColor=DARK,
        ),
        'TableHeader': ParagraphStyle(
            'TH',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=10,
            textColor=colors.white,
            alignment=TA_LEFT,
        ),
        'TableCell': ParagraphStyle(
            'TC',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=BODY,
        ),
        'TableCellBold': ParagraphStyle(
            'TCB',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=10,
            textColor=DARK,
        ),
        'CalloutText': ParagraphStyle(
            'CalloutText',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11.5,
            textColor=BODY,
        ),
        'CalloutTitle': ParagraphStyle(
            'CalloutTitle',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11.5,
            textColor=DARK,
        ),
        'TOCItem': ParagraphStyle(
            'TOCItem',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=12,
            textColor=PRIMARY,
        ),
        'TOCPage': ParagraphStyle(
            'TOCPage',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=MUTED,
            alignment=TA_RIGHT,
        ),
        'TeamHeader': ParagraphStyle(
            'TeamHeader',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13,
            textColor=PRIMARY,
            alignment=TA_CENTER,
        ),
        'TeamName': ParagraphStyle(
            'TeamName',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=DARK,
            alignment=TA_CENTER,
        ),
        'TeamRole': ParagraphStyle(
            'TeamRole',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=9.5,
            textColor=PRIMARY,
            alignment=TA_CENTER,
        ),
    }
    return styles


# ----------------------------------------------------------------------
# 3. COMPONENT HELPERS
# ----------------------------------------------------------------------
def make_callout(title, text, callout_type="note", styles=None):
    if styles is None:
        styles = get_doc_styles()
    
    color_map = {
        "note": (colors.HexColor("#0284C7"), colors.HexColor("#F0F9FF"), "NOTE"),
        "important": (colors.HexColor("#E5484D"), colors.HexColor("#FFF1F2"), "IMPORTANT"),
        "tip": (colors.HexColor("#10B981"), colors.HexColor("#F0FDF4"), "PRO TIP"),
        "warning": (colors.HexColor("#F59E0B"), colors.HexColor("#FFFBEB"), "WARNING"),
        "security": (colors.HexColor("#7C3AED"), colors.HexColor("#FAF5FF"), "SECURITY SAFEGUARD"),
    }
    
    border_col, bg_col, default_label = color_map.get(callout_type, color_map["note"])
    header_label = title if title else default_label

    content = [
        Paragraph(f"<b>{header_label}</b>", styles['CalloutTitle']),
        Spacer(1, 2),
        Paragraph(text, styles['CalloutText'])
    ]

    table = Table([[content]], colWidths=[504])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_col),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LINELEFT', (0, 0), (0, -1), 3.5, border_col),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    return table

def make_section_header(title, number_str, styles):
    content = [
        Spacer(1, 10),
        Paragraph(f"<font color='#E5484D'><b>SECTION {number_str}</b></font>", styles['Badge']),
        Spacer(1, 2),
        Paragraph(title, styles['Heading1']),
        HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=2, spaceAfter=8)
    ]
    return content

def make_table(headers, rows, col_widths, styles, header_bg=None):
    if header_bg is None:
        header_bg = PRIMARY

    table_data = []
    # Header row
    h_row = [Paragraph(f"<b>{h}</b>", styles['TableHeader']) for h in headers]
    table_data.append(h_row)

    # Data rows
    for row_idx, row in enumerate(rows):
        r_cells = []
        for cell_idx, val in enumerate(row):
            if isinstance(val, str):
                if cell_idx == 0:
                    p = Paragraph(f"<b>{val}</b>", styles['TableCellBold'])
                else:
                    p = Paragraph(val, styles['TableCell'])
            else:
                p = val
            r_cells.append(p)
        table_data.append(r_cells)

    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), header_bg),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
    ]

    for i in range(1, len(table_data)):
        if i % 2 == 0:
            t_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#F8FAFC")))

    table.setStyle(TableStyle(t_style))
    return table

print("Base helper classes compiled successfully.")
