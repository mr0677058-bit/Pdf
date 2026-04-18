# 1. Start with a heavy-duty Linux + Node.js foundation
FROM node:18-bullseye

# 2. Install all hardware-level engines (C++, Rust, Python, Ghostscript, OCR, and Java for Excel)
RUN apt-get update && apt-get install -y \
    g++ python3 python3-pip cargo \
    qpdf ghostscript poppler-utils tesseract-ocr default-jre \
    && rm -rf /var/lib/apt/lists/*

# 3. Set up the working directory
WORKDIR /app
COPY . .

# 4. Compile the C++ Engine
RUN g++ -O3 pdf_engine.cpp -o pdf_engine

# 5. Compile the Rust Assassin
RUN cd rust_engine && cargo build --release

# 6. Install Python AI & Data Science Libraries
RUN pip3 install --break-system-packages PyMuPDF pdf2image pytesseract tabula-py pandas Pillow nltk pdf2docx python-pptx networkx openpyxl
RUN python3 -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

# 7. Install Node.js Gateway modules
RUN npm install

# 8. Expose the specific port required by the Cloud and Ignite
ENV PORT=7860
EXPOSE 7860
CMD ["node", "server.js"]
