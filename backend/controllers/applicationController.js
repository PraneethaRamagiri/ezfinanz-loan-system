const LoanApplication = require('../models/LoanApplication');
const AuditLog = require('../models/AuditLog');
const { generateSanctionLetterPDF } = require('../utils/pdfGenerator');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { maskAccountNumber } = require('../utils/validators');

// Accept Declaration
exports.acceptDeclaration = async (req, res, next) => {
  try {
    const { accepted } = req.body;

    if (!accepted) {
      return res.status(400).json({
        success: false,
        error: { code: 'DECLARATION_REQUIRED', message: 'Declaration must be explicitly accepted to proceed.' }
      });
    }

    const application = await LoanApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application not found.' }
      });
    }

    const previousStage = application.currentStage;
    application.declaration = {
      accepted: true,
      acceptedAt: new Date(),
      ipAddress: req.ip || '127.0.0.1',
      version: '1.0'
    };

    application.currentStage = 'DECLARATION_ACCEPTED';
    await application.save();

    await AuditLog.create({
      application: application._id,
      actionBy: req.user._id,
      actionType: 'DECLARATION_SIGNED',
      previousStage,
      newStage: 'DECLARATION_ACCEPTED',
      notes: 'Legal terms & declaration accepted by customer.'
    });

    res.status(200).json({
      success: true,
      message: 'Declaration accepted successfully.',
      data: {
        declaration: application.declaration,
        currentStage: application.currentStage
      }
    });
  } catch (err) {
    next(err);
  }
};

// Upload Live Selfie Photo
exports.uploadSelfie = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FILE', message: 'Selfie image file is required.' }
      });
    }

    const application = await LoanApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application not found.' }
      });
    }

    const previousStage = application.currentStage;
    const cloudUrl = await uploadToCloudinary(req.file.path, 'selfies');
    const photoPath = cloudUrl || `/uploads/selfies/${req.file.filename}`;

    application.selfie = {
      photoPath,
      uploadedAt: new Date(),
      status: 'PENDING',
      rejectionReason: null
    };

    application.currentStage = 'UNDER_ADMIN_REVIEW';
    await application.save();

    await AuditLog.create({
      application: application._id,
      actionBy: req.user._id,
      actionType: 'SELFIE_UPLOADED',
      previousStage,
      newStage: 'UNDER_ADMIN_REVIEW',
      notes: `Live selfie photo uploaded: ${photoPath}`
    });

    res.status(200).json({
      success: true,
      message: 'Selfie submitted. Application is now under admin review.',
      data: {
        selfie: application.selfie,
        currentStage: application.currentStage
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get Application Status & Details
exports.getApplicationStatus = async (req, res, next) => {
  try {
    const application = await LoanApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'No loan application found for current user.' }
      });
    }

    const auditLogs = await AuditLog.find({ application: application._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        application,
        auditLogs
      }
    });
  } catch (err) {
    next(err);
  }
};

// Download Official Sanction Letter (PDF)
exports.downloadSanctionLetter = async (req, res, next) => {
  try {
    const application = await LoanApplication.findOne({ user: req.user._id }).populate('user');
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application record not found.' }
      });
    }

    if (application.currentStage !== 'DISBURSED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_DISBURSED',
          message: 'Sanction letter is available after loan disbursement.'
        }
      });
    }

    generateSanctionLetterPDF(application, res);
  } catch (err) {
    next(err);
  }
};
