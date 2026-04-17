import sys, os, warnings, zipfile, re
warnings.filterwarnings("ignore")

action = sys.argv[1]
input_path = sys.argv[2]
output_path = sys.argv[3]

try:
    if action == "ocr":
        from PIL import Image
        import pytesseract
        try:
            img = Image.open(input_path)
            img.verify() 
            text = pytesseract.image_to_string(Image.open(input_path))
        except:
            from pdf2image import convert_from_path
            text = "".join([pytesseract.image_to_string(img) + "\n" for img in convert_from_path(input_path)])
        with open(output_path, 'w', encoding='utf-8') as f: f.write(text if text.strip() else "No text found.")

    elif action == "excel":
        import tabula, pandas as pd
        dfs = tabula.read_pdf(input_path, pages='all', multiple_tables=True)
        if dfs: pd.concat(dfs).to_excel(output_path, index=False)
        else: pd.DataFrame({'System': ['No tables found']}).to_excel(output_path, index=False)

    elif action == "extract_text":
        import fitz
        text = "".join([page.get_text() for page in fitz.open(input_path)])
        nb = "========================================\n RAW NOTEBOOK EXTRACTION \n========================================\n\n"
        for idx, line in enumerate([l for l in text.split('\n') if l.strip()]):
            nb += f" {idx+1:03d} |  {line}\n     |---------------------------------\n"
        with open(output_path, 'w', encoding='utf-8') as f: f.write(nb)

    elif action == "pdf2img":
        from pdf2image import convert_from_path
        with zipfile.ZipFile(output_path, 'w') as z:
            for i, img in enumerate(convert_from_path(input_path, dpi=200)):
                img_path = f"page_{i+1}.jpg"
                img.save(img_path, "JPEG")
                z.write(img_path)
                os.remove(img_path)

    # FEATURE 21: THE REDACTION ENGINE
    elif action == "redact":
        import fitz
        doc = fitz.open(input_path)
        # Regex patterns to detect Emails and standard Phone Numbers
        patterns = [r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', r'\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b']
        for page in doc:
            for pattern in patterns:
                for inst in page.search_for(pattern, quads=True): # quads used for regex
                    page.add_redact_annot(inst, fill=(0, 0, 0))
            page.apply_redactions()
        doc.save(output_path)

    # FEATURE 22: EXECUTIVE AUTO-SUMMARY
    elif action == "summary":
        import fitz
        from collections import Counter
        text = " ".join([page.get_text() for page in fitz.open(input_path)])
        words = re.findall(r'\w+', text.lower())
        word_freq = Counter(words)
        sentences = text.split('.')
        sent_scores = {s: sum(word_freq.get(w.lower(), 0) for w in re.findall(r'\w+', s)) for s in sentences}
        summary = sorted(sent_scores, key=sent_scores.get, reverse=True)[:5]
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("EXECUTIVE SUMMARY (Top 5 Sentences):\n\n" + ".\n\n".join(summary) + ".")

    # FEATURE 25: PDF TO HTML5 WEB APP
    elif action == "html":
        import fitz
        doc = fitz.open(input_path)
        html_content = "<html><head><style>body{font-family:sans-serif; margin:40px; background:#f4f7f6;} .page{background:#fff; padding:20px; margin-bottom:20px; box-shadow:0 2px 4px rgba(0,0,0,0.1);}</style></head><body>"
        for page in doc:
            html_content += f"<div class='page'>{page.get_text('html')}</div>"
        html_content += "</body></html>"
        with open(output_path, 'w', encoding='utf-8') as f: f.write(html_content)

except Exception as e:
    print(f"[PYTHON ERROR] {str(e)}")
    sys.exit(1)
