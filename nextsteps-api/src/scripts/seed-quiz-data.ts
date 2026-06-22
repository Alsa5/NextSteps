import { ObjectId } from 'mongodb';
import { getDb } from '../db/mongo.js';

async function seedQuizData() {
  try {
    const db = getDb();
    
    // Sample quiz submissions
    const submissions = [
      {
        _id: new ObjectId(),
        quizId: 'quiz-1640000000000',
        weekNumber: 1,
        batch: 'B-2025-13',
        trainerEmail: 'trainer@hexaware.com',
        maverickId: 'mav-001',
        maverickName: 'Priya Sharma',
        quizTitle: 'JavaScript Fundamentals - Week 1',
        answers: [
          { questionId: 0, questionText: 'What is a variable?', selectedOption: 0, correctOption: 0, isCorrect: true },
          { questionId: 1, questionText: 'Which is a loop?', selectedOption: 1, correctOption: 2, isCorrect: false },
          { questionId: 2, questionText: 'What is a function?', selectedOption: 2, correctOption: 2, isCorrect: true }
        ],
        score: 2,
        totalQuestions: 3,
        scorePercent: 67,
        submittedAt: new Date('2025-01-20T10:30:00Z')
      },
      {
        _id: new ObjectId(),
        quizId: 'quiz-1640000000000',
        weekNumber: 1,
        batch: 'B-2025-13',
        trainerEmail: 'trainer@hexaware.com',
        maverickId: 'mav-002',
        maverickName: 'Arjun Kumar',
        quizTitle: 'JavaScript Fundamentals - Week 1',
        answers: [
          { questionId: 0, questionText: 'What is a variable?', selectedOption: 0, correctOption: 0, isCorrect: true },
          { questionId: 1, questionText: 'Which is a loop?', selectedOption: 2, correctOption: 2, isCorrect: true },
          { questionId: 2, questionText: 'What is a function?', selectedOption: 1, correctOption: 2, isCorrect: false }
        ],
        score: 2,
        totalQuestions: 3,
        scorePercent: 67,
        submittedAt: new Date('2025-01-20T11:15:00Z')
      },
      {
        _id: new ObjectId(),
        quizId: 'quiz-1640000000001',
        weekNumber: 2,
        batch: 'B-2025-13',
        trainerEmail: 'trainer@hexaware.com',
        maverickId: 'mav-001',
        maverickName: 'Priya Sharma',
        quizTitle: 'React Hooks - Week 2',
        answers: [
          { questionId: 0, questionText: 'What is useState?', selectedOption: 0, correctOption: 0, isCorrect: true },
          { questionId: 1, questionText: 'What is useEffect?', selectedOption: 0, correctOption: 0, isCorrect: true },
          { questionId: 2, questionText: 'What is useContext?', selectedOption: 2, correctOption: 2, isCorrect: true },
          { questionId: 3, questionText: 'What is useMemo?', selectedOption: 1, correctOption: 1, isCorrect: true },
          { questionId: 4, questionText: 'What is useCallback?', selectedOption: 0, correctOption: 2, isCorrect: false }
        ],
        score: 4,
        totalQuestions: 5,
        scorePercent: 80,
        submittedAt: new Date('2025-01-21T14:20:00Z')
      }
    ];

    // Insert submissions
    await db.collection('quiz_submissions').deleteMany({}); // Clear existing
    await db.collection('quiz_submissions').insertMany(submissions);

    console.log(`✅ Seeded ${submissions.length} quiz submissions`);
    console.log('Sample data:');
    console.log('- B-2025-13: 2 quizzes, 3 total submissions');
    console.log('- Quiz 1: 2 submissions (67% avg)'); 
    console.log('- Quiz 2: 1 submission (80%)');
    console.log('');
    console.log('🎯 Test the results by:');
    console.log('1. Login as trainer role');
    console.log('2. Go to Assessment Results');
    console.log('3. Should see quiz statistics');
    console.log('4. Click into quiz details');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Export for use in other files
export { seedQuizData };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedQuizData().then(() => process.exit(0));
}