import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // You might need to install this: npm install uuid

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/temp', express.static(path.join(__dirname, 'temp')));

// Generate PDF endpoint
app.post('/generate-pdf', async (req, res) => {
  const { htmlContent } = req.body;

  if (!htmlContent) {
    return res.status(400).send('HTML content is required');
  }

  console.log(`Received request to generate PDF, HTML length: ${htmlContent.length}`);
  const requestId = uuidv4();
  const tempHtmlPath = path.join(tempDir, `temp-${requestId}.html`);
  const tempPdfPath = path.join(tempDir, `pdf-${requestId}.pdf`);

  try {
    // Write HTML to temp file
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
    console.log(`HTML saved to ${tempHtmlPath}`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Load HTML from file
    console.log('Loading HTML file into puppeteer...');
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    console.log('Generating PDF...');
    await page.pdf({
      path: tempPdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();
    
    console.log(`PDF saved to ${tempPdfPath}`);
    
    // Instead of sending binary data, provide a download URL
    const downloadUrl = `/temp/pdf-${requestId}.pdf`;
    res.json({ success: true, downloadUrl });
    
    // Clean up HTML file (keep PDF for download)
    fs.unlinkSync(tempHtmlPath);
    
    // Set timeout to remove PDF after 5 minutes
    setTimeout(() => {
      try {
        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
          console.log(`Cleaned up temporary PDF: ${tempPdfPath}`);
        }
      } catch (err) {
        console.error('Error cleaning up:', err);
      }
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Clean up temp files in case of error
    try {
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
      if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    res.status(500).send(`Failed to generate PDF: ${error.message}`);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(port, () => {
  console.log(`PDF generation server running on port ${port}`);
});