const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const teacher = require('../controllers/teacher.controller');
const qpController = require('../controllers/qp.controller');

const isTeacher = [protect, authorize('TEACHER')];

// Profile
router.get('/profile', ...isTeacher, teacher.getProfile);
router.put('/profile', ...isTeacher, teacher.updateProfile);

// Students
router.get('/students', ...isTeacher, teacher.getMyStudents);
router.get('/students/:id', ...isTeacher, teacher.getStudentById);

// Questions
router.post('/questions', ...isTeacher, teacher.createQuestion);
router.get('/questions', ...isTeacher, teacher.getAllQuestions);
router.get('/questions/:id', ...isTeacher, teacher.getQuestionById);
router.put('/questions/:id', ...isTeacher, teacher.updateQuestion);
router.delete('/questions/:id', ...isTeacher, teacher.deleteQuestion);

// Question Papers (reuse qp.controller)
router.post('/qp', ...isTeacher, qpController.createQP);
router.get('/qp', ...isTeacher, qpController.getAllQP);
router.get('/qp/:id', ...isTeacher, qpController.getQPById);
router.put('/qp/:id', ...isTeacher, qpController.updateQP);
router.delete('/qp/:id', ...isTeacher, qpController.deleteQP);
router.patch('/qp/:id/publish', ...isTeacher, qpController.publishQP);

// Export QP
router.get('/qp/:id/export/student', ...isTeacher, qpController.exportQPStudent);
router.get('/qp/:id/export/teacher', ...isTeacher, qpController.exportQPTeacher);

// Exam Results
router.post('/results/exam', ...isTeacher, teacher.createExamResult);
router.get('/results/exam', ...isTeacher, teacher.getExamResults);
router.put('/results/exam/:id', ...isTeacher, teacher.updateExamResult);
router.delete('/results/exam/:id', ...isTeacher, teacher.deleteExamResult);

// Semester Results
router.post('/results/semester', ...isTeacher, teacher.createSemesterResult);
router.get('/results/semester', ...isTeacher, teacher.getSemesterResults);
router.put('/results/semester/:id', ...isTeacher, teacher.updateSemesterResult);

// Subjects & Chapters
router.get('/subjects', ...isTeacher, teacher.getSubjects);
router.get('/subjects/:subjectId/chapters', ...isTeacher, teacher.getChaptersBySubject);

module.exports = router;