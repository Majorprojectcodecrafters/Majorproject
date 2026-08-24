const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const { protect, authorize } = require('../middlewares/auth.middleware');
const ragController = require('../controllers/rag.controller');

// Multer config — transient staging in system OS temp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Knowledge Source Management (Admin & Teacher)
router.post('/ingest',                    protect, authorize('ADMIN', 'TEACHER'), upload.single('pdf'), ragController.ingestPDF);
router.get('/sources',                    protect, authorize('ADMIN', 'TEACHER'), ragController.getKnowledgeSources);
router.post('/sources/:id/reprocess',     protect, authorize('ADMIN', 'TEACHER'), ragController.reprocessKnowledgeSource);
router.get('/sources/:id/download',      protect, authorize('ADMIN', 'TEACHER', 'STUDENT'), ragController.downloadKnowledgeSource);
router.get('/stats',                      protect, authorize('ADMIN', 'TEACHER'), ragController.getStats);
router.delete('/source/:id',              protect, authorize('ADMIN', 'TEACHER'), ragController.deleteKnowledgeSource);
router.delete('/pdf/:fileName',           protect, authorize('ADMIN', 'TEACHER'), ragController.deletePDF);
router.delete('/grade/:grade',            protect, authorize('ADMIN', 'TEACHER'), ragController.deleteByGrade);
router.delete('/subject/:subjectId',      protect, authorize('ADMIN', 'TEACHER'), ragController.deleteBySubject);

// Teacher routes
router.post('/generate', protect, authorize('TEACHER'), ragController.generateQP);
router.post('/save',     protect, authorize('TEACHER'), ragController.saveGeneratedQP);

module.exports = router;