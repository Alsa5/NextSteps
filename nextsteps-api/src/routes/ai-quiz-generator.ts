import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { parse as csvParse } from 'csv-parse/sync';
import { createAuthMiddleware } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf', // .pdf
      'text/csv', // .csv
      'application/csv' // .csv alternate
    ];
    const allowedExtensions = ['.xlsx', '.xls', '.docx', '.pdf', '.csv'];
    
    const hasValidMime = allowedTypes.includes(file.mimetype);
    const hasValidExt = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidMime || hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload .xlsx, .xls, .docx, .pdf, or .csv files only.'));
    }
  }
});

// Validation schemas
const generateQuizSchema = z.object({
  weekContent: z.string().min(10),
  weekNumber: z.number().int().positive(),
  weekTitle: z.string(),
  questionsCount: z.number().int().min(3).max(20).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  focusKeywords: z.string().optional(),
});

const regenerateQuestionSchema = z.object({
  questionText: z.string(),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.number().int().min(0),
  focusKeywords: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

interface ExcelUploadDeps {
  jwtSecret: string;
}

export const createAiQuizGeneratorRouter = (deps: ExcelUploadDeps): Router => {
  const requireAuth = createAuthMiddleware(deps.jwtSecret);

  // Upload and parse various file formats
  router.post('/upload-syllabus', requireAuth, upload.single('syllabusFile'), async (req: Request, res: Response) => {
    try {
      // Debug logging
      console.log('=== UPLOAD REQUEST DEBUG ===');
      console.log('req.file:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer
      } : 'NO FILE');
      console.log('req.body:', req.body);
      console.log('authUser:', req.authUser ? { 
        id: req.authUser.id, 
        role: req.authUser.role 
      } : 'NO AUTH USER');

      if (!req.authUser || req.authUser.role !== 'trainer') {
        console.log('ERROR: Auth failed - user role:', req.authUser?.role);
        res.status(403).json({ error: 'Only trainers can upload syllabus files' });
        return;
      }

      if (!req.file) {
        console.log('ERROR: No file in request');
        res.status(400).json({ error: 'No file uploaded. Please select a file and try again.' });
        return;
      }

      if (!req.file.buffer) {
        console.log('ERROR: File buffer missing');
        res.status(400).json({ error: 'File buffer is missing from upload' });
        return;
      }

      if (!req.file.originalname) {
        console.log('ERROR: File originalname missing');
        res.status(400).json({ error: 'File name is missing from upload' });
        return;
      }

      const file = req.file;
      let weeks: Array<{ weekNumber: number; title: string; content: string }> = [];
      
      try {
        // Determine file type and parse accordingly
        const fileExtension = file.originalname.toLowerCase().split('.').pop();
        
        switch (fileExtension) {
          case 'xlsx':
          case 'xls':
            weeks = await parseExcelFile(file.buffer);
            break;
          case 'csv':
            weeks = await parseCsvFile(file.buffer);
            break;
          case 'docx':
            const wordContent = await parseWordFile(file.buffer);
            weeks = extractWeeksFromContent(wordContent, fileExtension);
            break;
          case 'pdf':
            const pdfContent = await parsePdfFile(file.buffer);
            weeks = extractWeeksFromContent(pdfContent, fileExtension);
            break;
          default:
            res.status(400).json({ error: 'Unsupported file type. Please upload .xlsx, .docx, .pdf, or .csv files.' });
            return;
        }

        if (weeks.length === 0) {
          res.status(400).json({ 
            error: 'No weeks or topics found in the file. Please ensure your file contains structured weekly content with week numbers.' 
          });
          return;
        }


        res.status(200).json({
          weeks,
          totalWeeks: weeks.length,
          fileName: file.originalname,
          fileType: fileExtension,
        });

      } catch (parseError) {
        console.error(`Error parsing ${file.originalname}:`, parseError);
        res.status(400).json({ 
          error: `Failed to parse ${file.originalname}. ${parseError instanceof Error ? parseError.message : 'The file may be corrupted or in an unsupported format.'}` 
        });
        return;
      }
      
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: error instanceof Error && error.message.includes('Invalid file type') 
          ? error.message 
          : 'Failed to process uploaded file' 
      });
    }
  });

  // Generate AI quiz for a specific week
  router.post('/generate-quiz', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'trainer') {
        res.status(403).json({ error: 'Only trainers can generate quizzes' });
        return;
      }

      const parsed = generateQuizSchema.parse(req.body);
      const quiz = await generateQuizWithAI(parsed);

      res.status(200).json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
        return;
      }
      console.error('Quiz generation error:', error);
      res.status(500).json({ error: 'Failed to generate quiz' });
    }
  });

  // Regenerate a single question
  router.post('/regenerate-question', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'trainer') {
        res.status(403).json({ error: 'Only trainers can regenerate questions' });
        return;
      }

      const parsed = regenerateQuestionSchema.parse(req.body);
      const question = await regenerateQuestionWithAI(parsed);

      res.status(200).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
        return;
      }
      console.error('Question regeneration error:', error);
      res.status(500).json({ error: 'Failed to regenerate question' });
    }
  });

  return router;
};

// File parsing functions
async function parseExcelFile(buffer: Buffer): Promise<Array<{ weekNumber: number; title: string; content: string }>> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  if (workbook.SheetNames.length === 0) {
    throw new Error('No sheets found in the Excel file');
  }

  // Parse first sheet with headers
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Excel file appears to be empty');
  }

  return parseTabularData(data);
}

async function parseWordFile(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  if (result.messages.length > 0) {
    console.warn('Word parsing warnings:', result.messages);
  }
  return result.value;
}

async function parsePdfFile(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseCsvFile(buffer: Buffer): Promise<Array<{ weekNumber: number; title: string; content: string }>> {
  const text = buffer.toString('utf-8');
  const records = csvParse(text, {
    skip_empty_lines: true,
    trim: true,
    columns: true, // Parse with headers
  });
  
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('CSV file appears to be empty');
  }

  return parseTabularData(records);
}

// New function to parse tabular data consistently
function parseTabularData(rows: any[]): Array<{ weekNumber: number; title: string; content: string }> {
  const weeks: Array<{ weekNumber: number; title: string; content: string }> = [];
  
  for (const row of rows) {
    // Find week number column (case-insensitive, various names)
    const weekNum = findColumnValue(row, ['week', 'week number', 'week #', 'wk', 'w']);
    
    // Find title/topic column
    const title = findColumnValue(row, ['topic', 'title', 'subject', 'chapter', 'module', 'lesson']);
    
    // Find content/description column
    const description = findColumnValue(row, [
      'description', 'content', 'notes', 'details', 'objectives', 
      'description / notes', 'description/notes', 'learning objectives'
    ]);
    
    // Skip rows without essential data
    if (!weekNum || !title) continue;
    
    // Parse week number
    let weekNumber: number;
    if (typeof weekNum === 'number') {
      weekNumber = weekNum;
    } else {
      const parsed = parseInt(String(weekNum).replace(/[^\d]/g, ''));
      if (isNaN(parsed) || parsed <= 0) continue;
      weekNumber = parsed;
    }
    
    // Build content from title + description
    let content = String(title).trim();
    if (description && String(description).trim()) {
      content += '. ' + String(description).trim();
    }
    
    if (content.length > 10) { // Ensure meaningful content
      weeks.push({
        weekNumber,
        title: String(title).trim(),
        content
      });
    }
  }
  
  return weeks.sort((a, b) => a.weekNumber - b.weekNumber);
}

// Helper to find column value with flexible matching
function findColumnValue(row: any, possibleNames: string[]): any {
  if (!row || typeof row !== 'object') return null;
  
  // Get all keys from the row
  const keys = Object.keys(row);
  
  for (const name of possibleNames) {
    // Try exact match first
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim()) {
      return row[name];
    }
    
    // Try case-insensitive match
    const matchingKey = keys.find(key => 
      key.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && String(row[matchingKey]).trim()) {
      return row[matchingKey];
    }
    
    // Try partial match (contains)
    const partialKey = keys.find(key => 
      key.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(key.toLowerCase())
    );
    if (partialKey && row[partialKey] !== undefined && row[partialKey] !== null && String(row[partialKey]).trim()) {
      return row[partialKey];
    }
  }
  
  return null;
}

function extractWeeksFromContent(content: string, fileType: string): Array<{ weekNumber: number; title: string; content: string }> {
  const weeks: Array<{ weekNumber: number; title: string; content: string }> = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentWeek: { weekNumber: number; title: string; content: string } | null = null;
  
  for (const line of lines) {
    // Improved week patterns with better capture groups
    const weekMatches = [
      // "Week 1: Introduction to JavaScript"
      /^week\s*(\d+)\s*[:.\-]\s*(.+)/i,
      // "1. Week: Introduction to JavaScript" 
      /^(\d+)\s*\.\s*week\s*[:.\-]?\s*(.+)/i,
      // "Week 1 - Introduction to JavaScript"
      /^week\s*(\d+)\s*[\-–]\s*(.+)/i,
      // "1: Introduction to JavaScript" (simple numbered format)
      /^(\d+)\s*[:.\-]\s*([a-zA-Z].{10,})/i,
      // "Chapter 1: Introduction to JavaScript"
      /^chapter\s*(\d+)\s*[:.\-]\s*(.+)/i,
      // "Module 1: Introduction to JavaScript"  
      /^module\s*(\d+)\s*[:.\-]\s*(.+)/i,
      // "Lesson 1: Introduction to JavaScript"
      /^lesson\s*(\d+)\s*[:.\-]\s*(.+)/i,
      // Just "Week 1" on its own line
      /^week\s*(\d+)$/i
    ];
    
    let weekFound = false;
    
    for (const pattern of weekMatches) {
      const match = line.match(pattern);
      if (match) {
        // Save previous week if exists
        if (currentWeek && currentWeek.content.trim()) {
          weeks.push(currentWeek);
        }
        
        const weekNumber = parseInt(match[1]);
        let title = match[2] || `Week ${weekNumber}`;
        
        // Clean up title - remove trailing punctuation and extra whitespace
        title = title.replace(/[:.;,-]+$/, '').trim();
        
        // Skip if title is too short or looks like a header artifact
        if (title.length < 3 || /^[|:.\-\s]+$/.test(title)) {
          title = `Week ${weekNumber}`;
        }
        
        currentWeek = {
          weekNumber,
          title,
          content: ''
        };
        weekFound = true;
        break;
      }
    }
    
    // If not a week header, add to current week's content
    if (!weekFound && currentWeek) {
      // Filter out obvious table artifacts and formatting
      if (line.length > 5 && !line.match(/^[\|\-\+\=\s]+$/)) {
        currentWeek.content += (currentWeek.content ? ' ' : '') + line;
      }
    } else if (!weekFound && !currentWeek && line.length > 30) {
      // If no week structure found but substantial content, create a default week
      if (weeks.length === 0) {
        currentWeek = {
          weekNumber: 1,
          title: 'Module Content',
          content: line
        };
      }
    }
  }
  
  // Add the last week
  if (currentWeek && currentWeek.content.trim()) {
    weeks.push(currentWeek);
  }
  
  // If no structured weeks found, try to split content into meaningful chunks
  if (weeks.length === 0 && content.trim().length > 100) {
    const paragraphs = content.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 50);
    paragraphs.forEach((chunk, index) => {
      // Try to extract a title from the first line of each chunk
      const lines = chunk.trim().split('\n');
      const firstLine = lines[0].trim();
      const restContent = lines.slice(1).join(' ').trim();
      
      let title = `Section ${index + 1}`;
      let content = chunk.trim();
      
      // If first line looks like a title (short, ends with colon, etc.)
      if (firstLine.length < 80 && (firstLine.includes(':') || firstLine.match(/^[A-Z]/))) {
        title = firstLine.replace(/[:.]+$/, '');
        content = restContent || firstLine;
      }
      
      weeks.push({
        weekNumber: index + 1,
        title,
        content
      });
    });
  }
  
  return weeks.sort((a, b) => a.weekNumber - b.weekNumber);
}

// AI quiz generation using Azure OpenAI
async function generateQuizWithAI(params: z.infer<typeof generateQuizSchema>) {
  const endpoint = env.AzureOpenAIEndpoint;
  const apiKey = env.AzureOpenAIKey;
  const deployment = env.AzureOpenAIDeployment ?? 'gpt-5';
  const apiVersion = env.AzureOpenAIApiVersion ?? '2025-01-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI is not configured');
  }

  const difficultyInstructions = {
    easy: 'Focus on basic concepts, definitions, and simple recall questions.',
    medium: 'Include application questions, problem-solving scenarios, and conceptual understanding.',
    hard: 'Create complex analysis questions, multi-step problems, and advanced application scenarios.'
  };

  const focusInstruction = params.focusKeywords 
    ? `Pay special attention to these keywords/topics: ${params.focusKeywords}.`
    : '';

  const systemPrompt = `You are an expert trainer creating quiz questions for software development training. 

Generate exactly ${params.questionsCount} multiple choice questions based on the following week's content:

Week ${params.weekNumber}: ${params.weekTitle}
Content: ${params.weekContent}

Difficulty Level: ${params.difficulty} - ${difficultyInstructions[params.difficulty]}
${focusInstruction}

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Questions should be practical and relevant to real-world software development
- Avoid trick questions or overly specific details
- Make incorrect options plausible but clearly wrong to someone who understands the topic

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is the correct answer"
    }
  ]
}`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: deployment.startsWith('gpt-5') ? 'developer' : 'system', content: systemPrompt }
      ],
      max_completion_tokens: 8000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content received from AI');
  }

  try {
    const parsedQuiz = JSON.parse(content);
    return {
      weekNumber: params.weekNumber,
      weekTitle: params.weekTitle,
      difficulty: params.difficulty,
      ...parsedQuiz,
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid AI response format');
  }
}

// Regenerate a single question
async function regenerateQuestionWithAI(params: z.infer<typeof regenerateQuestionSchema>) {
  const endpoint = env.AzureOpenAIEndpoint;
  const apiKey = env.AzureOpenAIKey;
  const deployment = env.AzureOpenAIDeployment ?? 'gpt-5';
  const apiVersion = env.AzureOpenAIApiVersion ?? '2025-01-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI is not configured');
  }

  const focusInstruction = params.focusKeywords 
    ? `Focus specifically on: ${params.focusKeywords}.`
    : '';

  const systemPrompt = `You are regenerating a single quiz question. Here's the current question:

Question: ${params.questionText}
Current options: ${params.options.join(', ')}
Current correct answer: ${params.options[params.correctAnswer]}

Please create a NEW question on the same topic but with different wording and options.
${focusInstruction}

Difficulty: ${params.difficulty}
Requirements:
- Same topic/concept but different question text
- Exactly 4 new options (A, B, C, D)
- Only one correct option
- Make it practical and relevant

Return ONLY valid JSON:
{
  "question": "New question text?",
  "options": ["New Option A", "New Option B", "New Option C", "New Option D"],
  "correct": 0,
  "explanation": "Why this answer is correct"
}`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: deployment.startsWith('gpt-5') ? 'developer' : 'system', content: systemPrompt }
      ],
      max_completion_tokens: 4000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content received from AI');
  }

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid AI response format');
  }
}