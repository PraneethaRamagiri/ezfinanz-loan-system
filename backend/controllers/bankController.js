const LoanApplication = require('../models/LoanApplication');
const AuditLog = require('../models/AuditLog');
const { validateBankAccountNumber, validateIFSC, validateBankAndIfsc, maskAccountNumber } = require('../utils/validators');

exports.addBankAccount = async (req, res, next) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, accountType } = req.body;

    const validationErrors = {};

    if (!accountHolderName || !accountHolderName.trim()) {
      validationErrors.accountHolderName = 'Account Holder Name is required.';
    }

    const accErr = validateBankAccountNumber(accountNumber);
    if (accErr) {
      validationErrors.accountNumber = accErr;
    }

    const ifscErr = validateIFSC(ifscCode);
    if (ifscErr) {
      validationErrors.ifscCode = ifscErr;
    }

    const bankIfscErr = validateBankAndIfsc(bankName, ifscCode);
    if (bankIfscErr) {
      validationErrors.bankName = bankIfscErr;
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Bank details validation failed.',
          details: validationErrors
        }
      });
    }

    const application = await LoanApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application not found.' }
      });
    }

    const cleanAccNumber = accountNumber.replace(/\s+/g, '');
    const cleanIfsc = ifscCode.toUpperCase().trim();

    const previousStage = application.currentStage;
    application.bankDetails = {
      accountHolderName: accountHolderName.trim(),
      accountNumber: cleanAccNumber,
      ifscCode: cleanIfsc,
      bankName: bankName.trim(),
      accountType: accountType || 'Savings',
      isVerified: true
    };

    application.currentStage = 'BANK_DETAILS_ADDED';
    await application.save();

    // Create Audit Log with masked account number
    const maskedAcc = maskAccountNumber(cleanAccNumber);
    await AuditLog.create({
      application: application._id,
      actionBy: req.user._id,
      actionType: 'BANK_ADDED',
      previousStage,
      newStage: 'BANK_DETAILS_ADDED',
      notes: `Bank account added: ${bankName.trim()} (Account: ${maskedAcc}, IFSC: ${cleanIfsc})`
    });

    res.status(200).json({
      success: true,
      message: 'Bank account added and verified via simulated penny drop.',
      data: {
        bankDetails: application.bankDetails,
        currentStage: application.currentStage
      }
    });
  } catch (err) {
    next(err);
  }
};
