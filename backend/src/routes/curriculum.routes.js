const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const curriculumController = require('../controllers/curriculum.controller');

// Public/Protected Cascading Curriculum Routes
router.get('/boards', protect, curriculumController.getBoards);
router.get('/classes', protect, curriculumController.getClasses);
router.get('/subjects', protect, curriculumController.getSubjectsByClass);
router.get('/units', protect, curriculumController.getUnits);
router.get('/chapters', protect, curriculumController.getChapters);
router.get('/topics', protect, curriculumController.getTopics);
router.get('/weightage', protect, curriculumController.getWeightage);
router.post('/sync-syllabus', protect, curriculumController.syncSyllabusTopics);

module.exports = router;
