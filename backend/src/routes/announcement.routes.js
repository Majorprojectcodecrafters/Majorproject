const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const announcementController = require('../controllers/announcement.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// File Upload Configuration (10MB limit, PNG/JPG/PDF only)
const upload = multer({
  dest: path.join(process.cwd(), 'tmp_uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and PDF attachments are permitted.'));
    }
  }
});

router.post('/', protect, authorize('ADMIN', 'TEACHER'), upload.single('attachment'), announcementController.createAnnouncement);
router.get('/', protect, announcementController.getAnnouncements);
router.delete('/:id', protect, authorize('ADMIN', 'TEACHER'), announcementController.deleteAnnouncement);

module.exports = router;
