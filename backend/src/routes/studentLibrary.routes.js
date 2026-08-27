const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const { protect, authorize } = require('../middlewares/auth.middleware');
const studentLibraryController = require('../controllers/studentLibrary.controller');

// Multer staging configuration in system OS temp directory
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
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only PDF and Image files allowed for study materials'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Student Library Routes
router.post('/upload',               protect, authorize('ADMIN', 'TEACHER'), upload.single('file'), studentLibraryController.uploadStudyMaterial);
router.post('/sync',                 protect, authorize('ADMIN', 'TEACHER'), studentLibraryController.syncDriveMaterials);
router.get('/admin-tree',           protect, authorize('ADMIN'), studentLibraryController.getAdminDriveTree);
router.get('/materials',            protect, authorize('ADMIN', 'TEACHER', 'STUDENT'), studentLibraryController.getStudyMaterials);
router.get('/materials/:id/view',   protect, authorize('ADMIN', 'TEACHER', 'STUDENT'), studentLibraryController.streamStudyMaterialSecure);
router.delete('/materials/:id',     protect, authorize('ADMIN', 'TEACHER'), studentLibraryController.deleteStudyMaterial);

module.exports = router;
