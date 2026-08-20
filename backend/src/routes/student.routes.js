const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const student = require('../controllers/student.controller');

const isStudent = [protect, authorize('STUDENT')];

// Profile
router.get('/profile',        ...isStudent, student.getProfile);
router.put('/profile',        ...isStudent, student.updateProfile);

// Exam Results
router.get('/results/exam',       ...isStudent, student.getExamResults);
router.get('/results/exam/:id',   ...isStudent, student.getExamResultById);

// Semester Results
router.get('/results/semester',     ...isStudent, student.getSemesterResults);
router.get('/results/semester/:id', ...isStudent, student.getSemesterResultById);

// Question Papers
router.get('/qp',     ...isStudent, student.getPublishedQPs);
router.get('/qp/:id', ...isStudent, student.getQPById);

// Assigned Teachers
router.get('/teachers', ...isStudent, student.getMyTeachers);

// Stream & Subjects
router.get('/stream',          ...isStudent, student.getMyStream);
router.get('/stream/subjects/:id', ...isStudent, student.getSubjectById);

module.exports = router;