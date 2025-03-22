require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pdfParse = require('pdf-parse');
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Parse JSON bodies
app.use(bodyParser.json({ limit: '10mb' }));

// Endpoint to extract text from PDF
app.post('/upload-resume', async (req, res) => {
  console.log('Received upload request');
  try {
    if (!req.body.file) {
      console.log('No file data received');
      return res.status(400).json({ error: 'No file data received' });
    }
    
    console.log('Converting file from base64');
    const fileBuffer = Buffer.from(req.body.file, 'base64');
    
    console.log('Parsing PDF');
    const pdfData = await pdfParse(fileBuffer);
    
    console.log('Extracted text from PDF');
    const resumeText = pdfData.text;
    
    // Send back just the extracted text
    res.json({ text: resumeText });
    
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
    res.status(500).json({
      error: 'Failed to process PDF',
      message: error.message
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});