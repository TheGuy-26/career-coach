require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pdfParse = require('pdf-parse');
const { InferenceClient } = require("@huggingface/inference");

const app = express();

// Initialize the Hugging Face Inference Client
const client = new InferenceClient(process.env.HF_API_KEY);

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
    
    res.json({ text: resumeText });
    
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
    res.status(500).json({
      error: 'Failed to process PDF',
      message: error.message
    });
  }
});

// Add this to your existing backend code

// Endpoint to ask questions about the resume text
app.post('/ask-question', async (req, res) => {
    try {
      const { text, question } = req.body;
      
      if (!text || !question) {
        return res.status(400).json({ error: 'Both text and question are required' });
      }

      const chatCompletion = await client.chatCompletion({
        provider: "together",
        model: "deepseek-ai/DeepSeek-R1",
        messages: [
            {
              role: "system",
              content: "You are a helpful assistant that analyzes resumes and provides insights.",
            },
            {
              role: "user",
              content: `Resume Text: ${text}`,
            },
          ],
          max_tokens: 5000,
        });

    // Extract the response from the model
    const answer = chatCompletion.choices[0].message.content;

    // Send the answer back to the client
    res.json({ answer });
  } catch (error) {
    console.error('Error asking question:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    res.status(500).json({
      error: 'Failed to process question',
      message: error.message,
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});