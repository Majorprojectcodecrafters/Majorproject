const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middlewares/auth.middleware');
const ragController = require('../controllers/rag.controller');

// Multer config — updated to handle grade/subject subfolders
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type === 'pyq' ? 'pyq' : 'textbooks';
    const grade = req.body.grade || '';
    const subject = req.body.subjectName?.toLowerCase() || 'general';
    const dir = path.join(process.cwd(), 'pdfs', type, grade, subject);

    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
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

// Admin routes
router.post('/ingest',                    protect, authorize('ADMIN'), upload.single('pdf'), ragController.ingestPDF);
router.get('/stats',                      protect, authorize('ADMIN'), ragController.getStats);
router.delete('/pdf/:fileName',           protect, authorize('ADMIN'), ragController.deletePDF);
router.delete('/grade/:grade',            protect, authorize('ADMIN'), ragController.deleteByGrade);
router.delete('/subject/:subjectId',      protect, authorize('ADMIN'), ragController.deleteBySubject);

// Teacher routes
router.post('/generate', protect, authorize('TEACHER'), ragController.generateQP);
router.post('/save',     protect, authorize('TEACHER'), ragController.saveGeneratedQP);

module.exports = router;