const LoanApplication = require('../models/LoanApplication');
const AuditLog = require('../models/AuditLog');
const { validateDateOfBirth, validateIdDocument, maskIdNumber } = require('../utils/validators');

exports.submitKyc = async (req, res, next) => {
  try {
    const {
      fullName, dob, gender, addressLine1, addressLine2,
      city, state, pincode, idType, idNumber
    } = req.body;

    const validationErrors = {};

    if (!fullName || !fullName.trim()) {
      validationErrors.fullName = 'Full Name is required.';
    }

    const dobErr = validateDateOfBirth(dob);
    if (dobErr) {
      validationErrors.dob = dobErr;
    }

    if (!gender) {
      validationErrors.gender = 'Gender is required.';
    }

    if (!addressLine1 || !addressLine1.trim()) {
      validationErrors.addressLine1 = 'Address Line 1 is required.';
    }

    if (!city || !city.trim()) {
      validationErrors.city = 'City is required.';
    }

    if (!state || !state.trim()) {
      validationErrors.state = 'State is required.';
    }

    if (!pincode || !/^[0-9]{6}$/.test(pincode.replace(/\s+/g, ''))) {
      validationErrors.pincode = 'Pincode must be exactly 6 digits.';
    }

    const idErr = validateIdDocument(idType, idNumber);
    if (idErr) {
      validationErrors.idNumber = idErr;
    }

    // Return structured 400 Bad Request if any validation failed
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'KYC input validation failed.',
          details: validationErrors
        }
      });
    }

    const application = await LoanApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application record not found.' }
      });
    }

    // Calculate age safely
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const cleanIdNumber = idType === 'PAN'
      ? idNumber.toUpperCase().trim()
      : idNumber.replace(/\s+/g, '');

    let documentPath = application.kyc ? application.kyc.documentPath : null;
    if (req.file) {
      documentPath = `/uploads/documents/${req.file.filename}`;
    }

    const previousStage = application.currentStage;
    application.kyc = {
      fullName: fullName.trim(),
      dob: birthDate,
      age,
      gender,
      address: {
        line1: addressLine1.trim(),
        line2: addressLine2 ? addressLine2.trim() : '',
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.replace(/\s+/g, '')
      },
      idType,
      idNumber: cleanIdNumber,
      documentPath,
      isVerified: true
    };

    application.currentStage = 'KYC_SUBMITTED';
    await application.save();

    // Create Audit Log with masked sensitive ID number
    const maskedId = maskIdNumber(idType, cleanIdNumber);
    await AuditLog.create({
      application: application._id,
      actionBy: req.user._id,
      actionType: 'KYC_SUBMITTED',
      previousStage,
      newStage: 'KYC_SUBMITTED',
      notes: `KYC details submitted for ${fullName.trim()} (${idType}: ${maskedId})`
    });

    res.status(200).json({
      success: true,
      message: 'KYC details submitted and identity verified.',
      data: {
        kyc: application.kyc,
        currentStage: application.currentStage
      }
    });
  } catch (err) {
    next(err);
  }
};
