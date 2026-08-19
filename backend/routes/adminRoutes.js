const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, requireAdmin);

router.get('/applications', adminController.getAllApplications);
router.get('/applications/:id', adminController.getApplicationById);
router.post('/applications/:id/selfie-review', adminController.reviewSelfie);
router.post('/applications/:id/disburse', adminController.confirmDisbursement);

module.exports = router;
