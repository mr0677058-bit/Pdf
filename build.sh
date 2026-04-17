#!/bin/bash
echo "========== IGNITING POLYGLOT CLOUD MATRIX =========="

# 1. Install System Compilers & Engines
echo "[1/4] Installing Core Languages..."
sudo apt update -y
sudo apt install -y g++ mono-complete python3 python3-pip cargo qpdf ghostscript poppler-utils tesseract-ocr

# 2. Build the C++ and C# Binaries
echo "[2/4] Forging Binaries..."
g++ -O3 pdf_engine.cpp -o pdf_engine
mcs OfficeForge/Program.cs

# 3. Build the Rust Assassin
echo "[3/4] Compiling Rust Core..."
cd rust_engine
cargo build --release
cd ..

# 4. Install Python & Node Dependencies
echo "[4/4] Installing AI Libraries and Node Modules..."
pip3 install --break-system-packages PyMuPDF pdf2image pytesseract tabula-py pandas Pillow nltk
npm install

echo "========== MATRIX READY. RUN 'node server.js' =========="
