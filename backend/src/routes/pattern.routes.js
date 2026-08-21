const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const patternController = require('../controllers/pattern.controller');

// Board Patterns (Accessible to Teachers & Admins)
router.get('/board', protect, patternController.getBoardPatterns);
router.get('/board/:subjectName', protect, patternController.getBoardPatternBySubject);

// Custom Patterns (Teacher CRUD with Ownership Check)
router.post('/custom', protect, authorize('TEACHER', 'ADMIN'), patternController.createCustomPattern);
router.get('/custom', protect, authorize('TEACHER', 'ADMIN'), patternController.getCustomPatterns);
router.get('/custom/:id', protect, authorize('TEACHER', 'ADMIN'), patternController.getCustomPatternById);
router.put('/custom/:id', protect, authorize('TEACHER', 'ADMIN'), patternController.updateCustomPattern);
router.delete('/custom/:id', protect, authorize('TEACHER', 'ADMIN'), patternController.deleteCustomPattern);

module.exports = router;
