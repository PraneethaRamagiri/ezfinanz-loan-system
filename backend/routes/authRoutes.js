const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/google-login-mock', authController.googleLoginMock);

router.post('/send-email-otp', verifyToken, authController.sendEmailOtp);
router.post('/verify-email-otp', verifyToken, authController.verifyEmailOtp);

router.post('/send-phone-otp', verifyToken, authController.sendPhoneOtp);
router.post('/verify-phone-otp', verifyToken, authController.verifyPhoneOtp);

router.get('/me', verifyToken, authController.getMe);

module.exports = router;
