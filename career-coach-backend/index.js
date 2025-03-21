const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const app = express();

// Enable CORS for requests from http://localhost:3000
app.use(cors({
    origin: 'http://localhost:3000', // Allow only this origin
    methods: ['GET', 'POST'], // Allow only these HTTP methods
    credentials: true, // Allow cookies and credentials
}));

app.use(bodyParser.json({ limit: '10mb' }));

// Hugging Face API configuration
const HF_API_KEY = ''; // Replace with your Hugging Face API key
const DEEPSEEK_MODEL = 'deepseek-ai/deepseek-llm-7b-base'; // Replace with the specific DeepSeek model

// Route for resume parsing and analysis
app.post('/upload-resume', async (req, res) => {
    const fileBuffer = Buffer.from(req.body.file, 'base64'); // Get file buffer from frontend
    try {
        // Extract text from PDF
        const pdfData = await pdfParse(fileBuffer);
        const resumeText = pdfData.text;

        // Send text to DeepSeek model for analysis
        const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${DEEPSEEK_MODEL}`,
            { inputs: `Analyze this resume and suggest improvements: ${resumeText}` },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_KEY}`,
                },
            }
        );

        // Send analysis back to frontend
        res.json({ analysis: hfResponse.data[0].generated_text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process resume' });
    }
});

// Route for mock interview questions
app.post('/generate-questions', async (req, res) => {
    const { role } = req.body; // Get job role from frontend
    try {
        // Generate interview questions using DeepSeek
        const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${DEEPSEEK_MODEL}`,
            { inputs: `Generate 5 interview questions for a ${role} role.` },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_KEY}`,
                },
            }
        );

        // Send questions back to frontend
        res.json({ questions: hfResponse.data[0].generated_text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});