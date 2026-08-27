import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['TEACHER', 'ADMIN', 'STUDENT']),
  dob: z.string().min(1, 'Date of birth is required'),
  education: z.string().optional(),
  experienceYears: z.number().optional(),
  classId: z.string().optional(),
  contact: z.string().optional(),
});

// Question Paper Generation schema
export const generateQPSchema = z.object({
  title: z.string().optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  chapterIds: z.array(z.string()).min(1, 'At least one chapter is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  totalMarks: z.number().min(1).default(50),
  durationMins: z.number().min(1).default(60),
  instructions: z.string().optional(),
  patternMode: z.enum(['BOARD', 'CUSTOM']).default('CUSTOM'),
  board: z.string().optional(),
  patternVersion: z.string().optional(),
  patternData: z.any().optional(),
  mcqCount: z.number().min(0).default(5),
  shortCount: z.number().min(0).default(3),
  longCount: z.number().min(0).default(2),
  grade: z.string().optional(),
  examDate: z.string().optional(),
});

// Save generated QP schema
export const saveQPSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  totalMarks: z.number().min(1),
  durationMins: z.number().min(1),
  instructions: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  patternMode: z.enum(['BOARD', 'CUSTOM']).optional(),
  board: z.string().optional(),
  patternVersion: z.string().optional(),
  patternData: z.any().optional(),
  examDate: z.string().optional(),
  questions: z.array(z.object({
    questionText: z.string(),
    marks: z.number(),
    difficulty: z.string(),
    type: z.string().optional(),
    chapterId: z.string().optional(),
    options: z.array(z.string()).optional(),
    answerKey: z.string().optional(),
  })),
});

// Create QP manually schema
export const createQPSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  totalMarks: z.number().min(1),
  durationMins: z.number().min(1),
  instructions: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  subjectId: z.string().min(1),
  questionIds: z.array(z.string()).optional(),
  templateId: z.string().optional(),
});
