const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/add', verifyToken, bankController.addBankAccount);

module.exports = router;
