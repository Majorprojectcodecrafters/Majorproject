const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Teacher Quiz Routes
router.post('/generate', protect, authorize('TEACHER'), quizController.generateQuiz);
router.post('/:id/publish', protect, authorize('TEACHER'), quizController.publishQuiz);
router.get('/teacher', protect, authorize('TEACHER'), quizController.getTeacherQuizzes);
router.get('/teacher/:id', protect, authorize('TEACHER'), quizController.getTeacherQuizById);
router.delete('/:id', protect, authorize('TEACHER'), quizController.deleteQuiz);

// Student Quiz Routes
router.get('/student', protect, authorize('STUDENT'), quizController.getStudentQuizzes);
router.get('/student/:id', protect, authorize('STUDENT'), quizController.getStudentQuizDetails);
router.post('/student/:id/attempt', protect, authorize('STUDENT'), quizController.submitQuizAttempt);

module.exports = router;
