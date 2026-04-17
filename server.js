const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const QRCode = require('qrcode');

const app = express();
app.use(cors()); 
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.post('/api/process', upload.array('files'), async (req, res) => {
    try {
        const action = req.body.action; 
        const password = req.body.password || '';
        const param = req.body.param || 'POLYGLOT_SECURE'; 
        const inputPath = req.files[0].path;
        let outputPath = path.join(__dirname, 'uploads', `out_${Date.now()}`);
        let outputName = 'Processed_Document.pdf';

        console.log(`[GATEWAY] Routing task: [${action.toUpperCase()}]`);

        // 1. C++ ENGINE
        if (['encrypt', 'decrypt', 'compress', 'grayscale'].includes(action)) {
            outputPath += '.pdf';
            execSync(`./pdf_engine ${action} "${inputPath}" "${outputPath}" "${param || password}"`);
        }
        // 2. C# MONO ENGINE
        else if (['word', 'pptx'].includes(action)) {
            const exts = { word: '.docx', pptx: '.pptx' };
            outputPath += exts[action]; outputName = `Document${exts[action]}`;
            execSync(`mono OfficeForge/Program.exe ${action} "${inputPath}" "${outputPath}"`);
        }
        // 3. PYTHON AI CORE
        else if (['ocr', 'excel', 'extract_text', 'pdf2img', 'redact', 'summary', 'html'].includes(action)) {
            const exts = { ocr: '.txt', excel: '.xlsx', extract_text: '.txt', pdf2img: '.zip', redact: '.pdf', summary: '.txt', html: '.html' };
            outputPath += exts[action]; outputName = `Document${exts[action]}`;
            execSync(`python3 vision.py ${action} "${inputPath}" "${outputPath}"`);
        }
        // 4. RUST ASSASSIN
        else if (['sign', 'steg'].includes(action)) {
            outputPath += '.pdf';
            execSync(`./rust_engine/target/release/rust_engine ${action} "${inputPath}" "${outputPath}" "${param}"`);
        }
        // 5. NODE.JS V8 ENGINE
        else {
            outputPath += '.pdf';
            let finalPdfBytes;
            if (action === 'merge') {
                const mergedPdf = await PDFDocument.create();
                for (const file of req.files) {
                    const pdf = await PDFDocument.load(fs.readFileSync(file.path), { ignoreEncryption: true });
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
                finalPdfBytes = await mergedPdf.save();
            } 
            else if (action === 'qr') { // FEATURE 24: QR TRACKER
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                const qrDataUrl = await QRCode.toDataURL(param);
                const qrImage = await pdf.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
                const page = pdf.getPages()[0];
                page.drawImage(qrImage, { x: page.getWidth() - 90, y: page.getHeight() - 90, width: 70, height: 70 });
                finalPdfBytes = await pdf.save();
            }
            else if (action === 'watermark') {
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                pdf.getPages().forEach(p => p.drawText(param, { x: 50, y: p.getSize().height/2, size: 40, color: rgb(0.8,0.2,0.2), rotate: degrees(-45), opacity: 0.4 }));
                finalPdfBytes = await pdf.save();
            }
            else if (action === 'split') {
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                const targetPage = param ? Math.max(0, parseInt(param) - 1) : 0;
                const newPdf = await PDFDocument.create();
                const [page] = await newPdf.copyPages(pdf, [targetPage]);
                newPdf.addPage(page);
                finalPdfBytes = await newPdf.save();
            }
            else if (action === 'remove_page') {
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                const targetPage = param ? Math.max(0, parseInt(param) - 1) : 0;
                if (pdf.getPageCount() > 1 && targetPage < pdf.getPageCount()) pdf.removePage(targetPage);
                finalPdfBytes = await pdf.save();
            }
            else if (action === 'add_blank') {
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                const targetPage = param ? Math.max(0, parseInt(param) - 1) : pdf.getPageCount();
                pdf.insertPage(Math.min(targetPage, pdf.getPageCount()));
                finalPdfBytes = await pdf.save();
            }
            else if (action === 'rotate') {
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                pdf.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle || 0) + 90)));
                finalPdfBytes = await pdf.save();
            }
            else if (action === 'img2pdf') {
                const imgBytes = fs.readFileSync(inputPath);
                const pdf = await PDFDocument.create();
                let img; try { img = await pdf.embedJpg(imgBytes); } catch(e) { img = await pdf.embedPng(imgBytes); }
                const page = pdf.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
                finalPdfBytes = await pdf.save();
            }
            else if (action === 'bates') {
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                pdf.getPages().forEach((p, i) => p.drawText(`Page ${i+1}`, { x: 20, y: 20, size: 12, color: rgb(0,0,0) }));
                finalPdfBytes = await pdf.save();
            }
            else if (action === 'sanitize') {
                const pdf = await PDFDocument.load(fs.readFileSync(inputPath));
                pdf.setTitle(''); pdf.setAuthor(''); pdf.setCreator('');
                finalPdfBytes = await pdf.save();
            }
            
            fs.writeFileSync(outputPath, finalPdfBytes);
        }

        req.files.forEach(f => { if(fs.existsSync(f.path)) fs.unlinkSync(f.path); }); 
        res.download(outputPath, outputName, () => {
            if(fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });

    } catch (error) {
        req.files.forEach(f => { if(fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        console.error("[ERROR]", error.message);
        res.status(500).json({ error: "System encountered an error processing the document." });
    }
});

// SYSTEM ANCHOR
const PORT = 3000;
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
    console.log(`\n======================================================`);
    console.log(`[SYSTEM] 25-Feature Polyglot Matrix Active`);
    console.log(`[SYSTEM] C++ | C# | RUST | PYTHON | NODEJS`);
    console.log(`======================================================\n`);
});
setInterval(() => {}, 1000 * 60 * 60); 
