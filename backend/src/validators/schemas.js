// Input validation schemas
const Joi = require('joi');

const authSchemas = {
  register: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(100),
    role: Joi.string().valid('ADMIN', 'TEACHER', 'STUDENT').required(),
    dob: Joi.date().required(),
    // Teacher fields
    education: Joi.when('role', {
      is: 'TEACHER',
      then: Joi.string().max(255),
      otherwise: Joi.forbidden()
    }),
    experienceYears: Joi.when('role', {
      is: 'TEACHER',
      then: Joi.number().min(0).max(60),
      otherwise: Joi.forbidden()
    }),
    // Student fields
    uniqueId: Joi.when('role', {
      is: 'STUDENT',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    }),
    contact: Joi.when('role', {
      is: 'STUDENT',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    }),
    classId: Joi.when('role', {
      is: 'STUDENT',
      then: Joi.string().uuid().required(),
      otherwise: Joi.forbidden()
    }),
    streamId: Joi.when('role', {
      is: 'STUDENT',
      then: Joi.string().uuid().required(),
      otherwise: Joi.forbidden()
    })
  }).unknown(false),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }).unknown(false)
};

const questionSchemas = {
  create: Joi.object({
    questionText: Joi.string().required().max(2000),
    questionType: Joi.string().valid('MCQ', 'SHORT_ANSWER', 'LONG_ANSWER').required(),
    marks: Joi.number().required().min(1).max(100),
    difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').required(),
    subjectId: Joi.string().uuid().required(),
    chapterId: Joi.string().uuid().required(),
    answerKey: Joi.string().required().max(5000),
    options: Joi.when('questionType', {
      is: 'MCQ',
      then: Joi.array().items(Joi.string()).min(4).max(6).required(),
      otherwise: Joi.forbidden()
    }),
    explanation: Joi.string().max(5000)
  }).unknown(false)
};

const questionPaperSchemas = {
  create: Joi.object({
    title: Joi.string().required().max(200),
    totalMarks: Joi.number().required().min(10).max(1000),
    durationMins: Joi.number().required().min(10).max(480),
    instructions: Joi.string().max(2000),
    difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').required(),
    subjectId: Joi.string().uuid().required(),
    templateId: Joi.string().uuid(),
    questionIds: Joi.array().items(Joi.string().uuid())
  }).unknown(false)
};

const classSchemas = {
  create: Joi.object({
    name: Joi.string().required().max(100),
    description: Joi.string().max(500)
  }).unknown(false)
};

const streamSchemas = {
  create: Joi.object({
    name: Joi.string().required().max(100),
    classId: Joi.string().uuid().required()
  }).unknown(false)
};

const subjectSchemas = {
  create: Joi.object({
    name: Joi.string().required().max(100),
    code: Joi.string().required().max(20),
    classId: Joi.string().uuid().required()
  }).unknown(false)
};

const examResultSchemas = {
  create: Joi.object({
    studentId: Joi.string().uuid().required(),
    questionPaperId: Joi.string().uuid().required(),
    obtainedMarks: Joi.number().required().min(0),
    totalMarks: Joi.number().required().min(0),
    status: Joi.string().valid('COMPLETED', 'PENDING', 'EVALUATED').required(),
    feedback: Joi.string().max(2000)
  }).unknown(false)
};

module.exports = {
  authSchemas,
  questionSchemas,
  questionPaperSchemas,
  classSchemas,
  streamSchemas,
  subjectSchemas,
  examResultSchemas
};
