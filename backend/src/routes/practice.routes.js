const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practice.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const isStudent = [protect, authorize('STUDENT')];

router.get('/subjects', ...isStudent, practiceController.getPracticeSubjects);
router.post('/generate', ...isStudent, practiceController.generatePracticeQuiz);
router.post('/submit', ...isStudent, practiceController.submitPracticeAttempt);
router.get('/progress', ...isStudent, practiceController.getStudentPracticeProgress);

// Challenge Endpoints
router.post('/challenge', ...isStudent, practiceController.createChallenge);
router.get('/challenges', ...isStudent, practiceController.getStudentChallenges);
router.post('/challenge/submit', ...isStudent, practiceController.submitChallengeAttempt);

module.exports = router;
