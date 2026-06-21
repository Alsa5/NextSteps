import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { createAuthMiddleware } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';

const router = Router();

// Validation schemas
const submitQuizSchema = z.object({
  quizId: z.string(),
  weekNumber: z.number().int().positive().optional(),
  batch: z.string(),
  trainerEmail: z.string().email(),
  answers: z.array(z.object({
    questionId: z.union([z.string(), z.number()]),
    questionText: z.string(),
    selectedOption: z.number().int().min(0),
    correctOption: z.number().int().min(0),
    isCorrect: z.boolean(),
    selectedOptionText: z.string().optional(),
    correctOptionText: z.string().optional(),
    allOptions: z.array(z.string()).optional()
  })),
  quizTitle: z.string()
});

interface QuizResultsDeps {
  jwtSecret: string;
}

export const createQuizResultsRouter = (deps: QuizResultsDeps): Router => {
  const requireAuth = createAuthMiddleware(deps.jwtSecret);

  // Submit quiz results (called from maverick frontend)
  router.post('/submit', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const parsed = submitQuizSchema.parse(req.body);
      
      // Calculate score server-side (never trust client)
      const correctAnswers = parsed.answers.filter(a => a.isCorrect).length;
      const totalQuestions = parsed.answers.length;
      const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);

      const submission = {
        _id: new ObjectId(),
        quizId: parsed.quizId,
        weekNumber: parsed.weekNumber,
        batch: parsed.batch,
        trainerEmail: parsed.trainerEmail,
        maverickId: req.authUser.id,
        maverickName: req.authUser.email.split('@')[0] || 'Unknown Maverick', // Extract name from email
        quizTitle: parsed.quizTitle,
        answers: parsed.answers,
        score: correctAnswers,
        totalQuestions,
        scorePercent,
        submittedAt: new Date()
      };

      const db = getDb();
      await db.collection('quiz_submissions').insertOne(submission);

      console.log(`Quiz submission saved: ${req.authUser.email} scored ${scorePercent}% on "${parsed.quizTitle}"`);

      res.status(201).json({
        submissionId: submission._id,
        score: correctAnswers,
        totalQuestions,
        scorePercent,
        message: 'Quiz submitted successfully'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid submission data', details: error.errors });
        return;
      }
      console.error('Quiz submission error:', error);
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  });

  // Get batch overview (for trainers)
  router.get('/batch/:batchId', requireAuth, async (req: Request, res: Response) => {
    console.log('=== BATCH RESULTS ENDPOINT HIT ===');
    console.log('Route: GET /batch/:batchId');
    console.log('Params:', req.params);
    console.log('AuthUser:', req.authUser);
    
    try {
      if (!req.authUser || !['trainer', 'ld'].includes(req.authUser.role)) {
        console.log('Access denied - user role:', req.authUser?.role);
        res.status(403).json({ error: 'Access denied - trainers and L&D only' });
        return;
      }

      const { batchId } = req.params;
      console.log('Loading batch results for:', batchId);
      
      const db = getDb();

      // Get all submissions for this batch
      const submissions = await db.collection('quiz_submissions')
        .find({ batch: batchId })
        .sort({ submittedAt: -1 })
        .toArray();

      console.log(`Found ${submissions.length} submissions for batch ${batchId}`);

      // Group by quiz and calculate stats
      const quizStats = submissions.reduce((acc: any, sub: any) => {
        if (!acc[sub.quizId]) {
          acc[sub.quizId] = {
            quizId: sub.quizId,
            title: sub.quizTitle,
            weekNumber: sub.weekNumber,
            trainerEmail: sub.trainerEmail,
            submissions: [],
            submissionCount: 0,
            averageScore: 0,
            lowestScore: 100,
            highestScore: 0
          };
        }
        
        acc[sub.quizId].submissions.push(sub);
        acc[sub.quizId].submissionCount++;
        acc[sub.quizId].lowestScore = Math.min(acc[sub.quizId].lowestScore, sub.scorePercent);
        acc[sub.quizId].highestScore = Math.max(acc[sub.quizId].highestScore, sub.scorePercent);
        
        return acc;
      }, {});

      // Calculate averages
      Object.values(quizStats).forEach((quiz: any) => {
        const totalScore = quiz.submissions.reduce((sum: number, sub: any) => sum + sub.scorePercent, 0);
        quiz.averageScore = Math.round(totalScore / quiz.submissions.length);
      });

      // Get total mavericks in batch (mock for now - replace with actual batch roster)
      const totalMavericks = 20; // TODO: Get from actual batch roster

      const result = Object.values(quizStats).map((quiz: any) => ({
        quizId: quiz.quizId,
        title: quiz.title,
        weekNumber: quiz.weekNumber,
        submissionCount: quiz.submissionCount,
        totalMavericks,
        submissionRate: `${quiz.submissionCount}/${totalMavericks}`,
        averageScore: quiz.averageScore,
        lowestScore: quiz.lowestScore === 100 ? 0 : quiz.lowestScore,
        highestScore: quiz.highestScore
      }));

      console.log('Batch results compiled:', { 
        batch: batchId, 
        quizzesFound: result.length,
        totalSubmissions: submissions.length 
      });

      res.status(200).json({
        batch: batchId,
        quizzes: result.sort((a, b) => (a.weekNumber || 999) - (b.weekNumber || 999))
      });

    } catch (error: any) {
      console.error('Batch results error:', error);
      res.status(500).json({ error: 'Failed to fetch batch results', details: error.message });
    }
  });

  // Get detailed quiz results (for trainers and L&D)
  router.get('/quiz/:quizId', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || !['trainer', 'ld'].includes(req.authUser.role)) {
        res.status(403).json({ error: 'Access denied - trainers and L&D only' });
        return;
      }

      const { quizId } = req.params;
      const db = getDb();

      const submissions = await db.collection('quiz_submissions')
        .find({ quizId })
        .sort({ scorePercent: 1, submittedAt: 1 }) // Lowest scores first
        .toArray();

      if (submissions.length === 0) {
        res.status(200).json({
          quizId,
          submissions: [],
          questionBreakdown: []
        });
        return;
      }

      // Calculate per-question breakdown
      const questionStats: Record<number, any> = {};
      submissions.forEach((sub: any) => {
        sub.answers.forEach((answer: any, index: number) => {
          if (!questionStats[index]) {
            questionStats[index] = {
              questionNumber: index + 1,
              questionText: answer.questionText,
              totalAttempts: 0,
              wrongAnswers: 0,
              wrongRate: 0
            };
          }
          questionStats[index].totalAttempts++;
          if (!answer.isCorrect) {
            questionStats[index].wrongAnswers++;
          }
        });
      });

      // Calculate wrong rates
      Object.values(questionStats).forEach((q: any) => {
        q.wrongRate = Math.round((q.wrongAnswers / q.totalAttempts) * 100);
      });

      const questionBreakdown = Object.values(questionStats)
        .filter((q: any) => q.wrongRate > 50) // Flag questions with >50% wrong rate
        .sort((a: any, b: any) => b.wrongRate - a.wrongRate);

      res.status(200).json({
        quizId,
        quizTitle: submissions[0]?.quizTitle,
        weekNumber: submissions[0]?.weekNumber,
        submissions: submissions.map((sub: any) => ({
          submissionId: sub._id,
          maverickName: sub.maverickName,
          score: sub.score,
          totalQuestions: sub.totalQuestions,
          scorePercent: sub.scorePercent,
          submittedAt: sub.submittedAt
        })),
        questionBreakdown
      });

    } catch (error) {
      console.error('Quiz details error:', error);
      res.status(500).json({ error: 'Failed to fetch quiz details' });
    }
  });

  // Get single submission detail (for trainers and L&D)
  router.get('/submission/:submissionId', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || !['trainer', 'ld'].includes(req.authUser.role)) {
        res.status(403).json({ error: 'Access denied - trainers and L&D only' });
        return;
      }

      const { submissionId } = req.params;
      const db = getDb();

      const submission = await db.collection('quiz_submissions')
        .findOne({ _id: new ObjectId(submissionId as string) });

      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Also get the original quiz to fetch question options for proper answer display
      let originalQuiz = null;
      try {
        // Try to find the quiz in the AI-generated quiz collection or other storage
        // For now, we'll rely on the frontend to handle option text mapping
        // since quizzes are stored in localStorage in the current implementation
        originalQuiz = await db.collection('quizzes').findOne({ id: submission.quizId });
      } catch (error) {
        console.log('Could not fetch original quiz for options, frontend will handle mapping');
      }

      res.status(200).json({
        submissionId: submission._id,
        quizTitle: submission.quizTitle,
        weekNumber: submission.weekNumber,
        maverickName: submission.maverickName,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        scorePercent: submission.scorePercent,
        submittedAt: submission.submittedAt,
        answers: submission.answers,
        originalQuiz: originalQuiz // Include original quiz if found (for option text mapping)
      });

    } catch (error) {
      console.error('Submission detail error:', error);
      res.status(500).json({ error: 'Failed to fetch submission details' });
    }
  });

  // Manager overview (L&D only)
  router.get('/manager-overview', requireAuth, async (req: Request, res: Response) => {
    console.log('=== MANAGER OVERVIEW ENDPOINT HIT ===');
    console.log('Route: GET /manager-overview');
    console.log('AuthUser:', req.authUser);
    
    try {
      if (!req.authUser || req.authUser.role !== 'ld') {
        console.log('Access denied - user role:', req.authUser?.role);
        res.status(403).json({ error: 'Access denied - L&D only' });
        return;
      }

      const db = getDb();

      // Get all submissions grouped by batch
      const submissions = await db.collection('quiz_submissions')
        .find({})
        .sort({ submittedAt: -1 })
        .toArray();

      console.log(`Found ${submissions.length} total submissions across all batches`);

      // Group by batch
      const batchStats = submissions.reduce((acc: any, sub: any) => {
        if (!acc[sub.batch]) {
          acc[sub.batch] = {
            batch: sub.batch,
            trainerEmail: sub.trainerEmail,
            quizCount: new Set(),
            submissions: [],
            totalScore: 0
          };
        }
        
        acc[sub.batch].quizCount.add(sub.quizId);
        acc[sub.batch].submissions.push(sub);
        acc[sub.batch].totalScore += sub.scorePercent;
        
        return acc;
      }, {});

      // Calculate stats
      const result = Object.values(batchStats).map((batch: any) => ({
        batch: batch.batch,
        trainerEmail: batch.trainerEmail,
        trainerName: batch.trainerEmail.split('@')[0], // Extract name from email
        quizCount: batch.quizCount.size,
        totalSubmissions: batch.submissions.length,
        averageScore: batch.submissions.length > 0 
          ? Math.round(batch.totalScore / batch.submissions.length) 
          : 0
      }));

      console.log('Manager overview compiled:', { 
        batchesFound: result.length,
        totalSubmissions: submissions.length 
      });

      res.status(200).json({
        batches: result.sort((a, b) => a.batch.localeCompare(b.batch))
      });

    } catch (error: any) {
      console.error('Manager overview error:', error);
      res.status(500).json({ error: 'Failed to fetch manager overview', details: error.message });
    }
  });

  return router;
};