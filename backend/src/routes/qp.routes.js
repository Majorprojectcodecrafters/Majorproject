const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const qpController = require('../controllers/qp.controller');

// Teacher only
router.post('/',          protect, authorize('TEACHER'), qpController.createQP);
router.put('/:id',        protect, authorize('TEACHER'), qpController.updateQP);
router.patch('/:id/publish', protect, authorize('TEACHER'), qpController.publishQP);
router.delete('/:id',     protect, authorize('TEACHER'), qpController.deleteQP);

// Authenticated users
router.get('/',           protect, qpController.getAllQP);
router.get('/:id',        protect, qpController.getQPById);

module.exports = router;