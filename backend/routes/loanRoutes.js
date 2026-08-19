const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/check-eligibility', verifyToken, loanController.checkEligibility);
router.post('/calculate-terms', loanController.calculateTerms);
router.post('/select-terms', verifyToken, loanController.selectTerms);

module.exports = router;
