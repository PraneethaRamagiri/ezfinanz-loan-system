const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/submit', verifyToken, upload.single('document'), kycController.submitKyc);

module.exports = router;
