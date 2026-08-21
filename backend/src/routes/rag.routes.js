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

// Knowledge Source Management (Admin & Teacher)
router.post('/ingest',                    protect, authorize('ADMIN', 'TEACHER'), upload.single('pdf'), ragController.ingestPDF);
router.get('/sources',                    protect, authorize('ADMIN', 'TEACHER'), ragController.getKnowledgeSources);
router.get('/stats',                      protect, authorize('ADMIN', 'TEACHER'), ragController.getStats);
router.delete('/source/:id',              protect, authorize('ADMIN', 'TEACHER'), ragController.deleteKnowledgeSource);
router.delete('/pdf/:fileName',           protect, authorize('ADMIN', 'TEACHER'), ragController.deletePDF);
router.delete('/grade/:grade',            protect, authorize('ADMIN', 'TEACHER'), ragController.deleteByGrade);
router.delete('/subject/:subjectId',      protect, authorize('ADMIN', 'TEACHER'), ragController.deleteBySubject);

// Teacher routes
router.post('/generate', protect, authorize('TEACHER'), ragController.generateQP);
router.post('/save',     protect, authorize('TEACHER'), ragController.saveGeneratedQP);

module.exports = router;