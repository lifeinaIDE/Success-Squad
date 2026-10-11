import os
import json
import csv
import sys
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

def hex_to_rgb(hex_code):
    hex_code = hex_code.lstrip('#')
    return tuple(int(hex_code[i:i+2], 16) / 255.0 for i in (0, 2, 4))

def create_overlay(data, config, page_size):
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=page_size)
    
    for key, field in config.get('fields', {}).items():
        if key not in data:
            continue
        
        val = str(data[key])
        
        # We can't load custom fonts easily without TTF files here, so we map to Helvetica
        font_name = "Helvetica-Bold" if "Syne" in field.get("fontFamily", "") else "Helvetica"
        can.setFont(font_name, field.get("fontSize", 12))
        
        color = field.get("color", "#000000")
        can.setFillColorRGB(*hex_to_rgb(color))
        
        # Handle alignments
        x = field.get("x", 0)
        # Note: ReportLab origin is bottom-left, while config might assume top-left
        # Let's assume config is from bottom-left for PDF standards, or we must invert Y.
        # pdf-lib uses bottom-left origin just like reportlab.
        y = field.get("y", 0)
        
        if field.get("align") == "center":
            can.drawCentredString(x, y, val)
        elif field.get("align") == "right":
            can.drawRightString(x, y, val)
        else:
            can.drawString(x, y, val)

    can.save()
    packet.seek(0)
    return packet

def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_receipts.py <csv_file> <template_pdf>")
        sys.exit(1)

    csv_path = sys.argv[1]
    template_path = sys.argv[2]
    config_path = '../supabase/functions/generate-receipt/template.config.json'

    if not os.path.exists(config_path):
        print(f"Error: {config_path} not found.")
        sys.exit(1)

    with open(config_path, 'r') as f:
        config = json.load(f)

    out_dir = 'output_receipts'
    os.makedirs(out_dir, exist_ok=True)

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            team_id = row.get('team_id')
            if not team_id:
                continue

            # Map CSV columns to config keys
            data = {
                'receipt_no': row.get('receipt_no', ''),
                'payment_date': row.get('verified_at', row.get('created_at', '')),
                'team_name': row.get('teamName', ''),
                'leader_name': row.get('leaderName', ''),
                'registration_id': team_id,
                'event_name': row.get('event_id', ''),
                'applicable_fees': 'Rs. ' + row.get('amount', '0'),
                'amount_paid': 'Rs. ' + row.get('amount', '0'),
                'transaction_id': row.get('utr', row.get('order_id', '')),
                'payment_method': 'UPI'
            }

            template_pdf = PdfReader(template_path)
            writer = PdfWriter()

            for i in range(len(template_pdf.pages)):
                page = template_pdf.pages[i]
                
                # Check if we need to overlay on this page
                # Config has 'page' field for items
                page_items = {k: v for k, v in config.get('fields', {}).items() if v.get('page', 0) == i}
                
                if page_items:
                    # width/height typically extracted as float
                    w = float(page.mediabox.width)
                    h = float(page.mediabox.height)
                    
                    overlay_packet = create_overlay(data, {'fields': page_items}, (w, h))
                    overlay_pdf = PdfReader(overlay_packet)
                    page.merge_page(overlay_pdf.pages[0])
                
                writer.add_page(page)

            out_file = os.path.join(out_dir, f"{team_id}.pdf")
            with open(out_file, "wb") as out:
                writer.write(out)
                
            print(f"Generated {out_file}")

if __name__ == '__main__':
    main()
