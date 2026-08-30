const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const admin = require('../controllers/admin.controller');

const isAdmin = [protect, authorize('ADMIN')];

// Dashboard
router.get('/dashboard', ...isAdmin, admin.getDashboard);

// Users
router.post('/users',       ...isAdmin, admin.createUser);
router.get('/users',        ...isAdmin, admin.getAllUsers);
router.get('/users/:id',    ...isAdmin, admin.getUserById);
router.put('/users/:id',    ...isAdmin, admin.updateUser);
router.delete('/users/:id', ...isAdmin, admin.deleteUser);

// Classes
router.post('/classes',       ...isAdmin, admin.createClass);
router.get('/classes',        ...isAdmin, admin.getAllClasses);
router.put('/classes/:id',    ...isAdmin, admin.updateClass);
router.delete('/classes/:id', ...isAdmin, admin.deleteClass);

// Streams
router.post('/streams',       ...isAdmin, admin.createStream);
router.get('/streams',        ...isAdmin, admin.getAllStreams);
router.put('/streams/:id',    ...isAdmin, admin.updateStream);
router.delete('/streams/:id', ...isAdmin, admin.deleteStream);

// Subjects
router.post('/subjects',       ...isAdmin, admin.createSubject);
router.get('/subjects',        ...isAdmin, admin.getAllSubjects);
router.put('/subjects/:id',    ...isAdmin, admin.updateSubject);
router.delete('/subjects/:id', ...isAdmin, admin.deleteSubject);

// Chapters
router.post('/chapters',       ...isAdmin, admin.createChapter);
router.get('/chapters',        ...isAdmin, admin.getAllChapters);
router.put('/chapters/:id',    ...isAdmin, admin.updateChapter);
router.delete('/chapters/:id', ...isAdmin, admin.deleteChapter);

// Teacher-Student Assignment
router.post('/assign',   ...isAdmin, admin.assignTeacherToStudent);
router.delete('/assign', ...isAdmin, admin.unassignTeacherFromStudent);

// Teacher-Class-Subject Allocation
router.post('/teacher-assignments',       ...isAdmin, admin.createTeacherAssignment);
router.get('/teacher-assignments',        ...isAdmin, admin.getTeacherAssignments);
router.delete('/teacher-assignments/:id', ...isAdmin, admin.deleteTeacherAssignment);
router.put('/students/:studentId/class',   ...isAdmin, admin.updateStudentClass);

// Templates
router.post('/templates',       ...isAdmin, admin.createTemplate);
router.get('/templates',        ...isAdmin, admin.getAllTemplates);
router.put('/templates/:id',    ...isAdmin, admin.updateTemplate);
router.delete('/templates/:id', ...isAdmin, admin.deleteTemplate);

module.exports = router;