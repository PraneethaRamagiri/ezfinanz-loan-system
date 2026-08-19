const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/declaration/accept', verifyToken, applicationController.acceptDeclaration);
router.post('/selfie/upload', verifyToken, upload.single('selfieImage'), applicationController.uploadSelfie);
router.get('/status', verifyToken, applicationController.getApplicationStatus);
router.get('/sanction-letter', verifyToken, applicationController.downloadSanctionLetter);

module.exports = router;
