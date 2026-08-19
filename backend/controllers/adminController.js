const LoanApplication = require('../models/LoanApplication');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Get All Applications for Admin Dashboard
exports.getAllApplications = async (req, res, next) => {
  try {
    const { stage, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (stage && stage !== 'ALL') {
      query.currentStage = stage;
    }

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const totalApplications = await LoanApplication.countDocuments();
    const pendingReviewCount = await LoanApplication.countDocuments({ currentStage: 'UNDER_ADMIN_REVIEW' });
    const approvedCount = await LoanApplication.countDocuments({ currentStage: 'SELFIE_APPROVED' });
    const disbursedCount = await LoanApplication.countDocuments({ currentStage: 'DISBURSED' });
    const rejectedCount = await LoanApplication.countDocuments({ currentStage: { $in: ['SELFIE_REJECTED', 'REJECTED'] } });

    const totalVolumeResult = await LoanApplication.aggregate([
      { $match: { currentStage: 'DISBURSED' } },
      { $group: { _id: null, total: { $sum: '$selectedTerms.netDisbursementAmount' } } }
    ]);
    const totalDisbursedVolume = totalVolumeResult.length > 0 ? totalVolumeResult[0].total : 0;

    const skip = (page - 1) * limit;
    const applications = await LoanApplication.find(query)
      .populate('user', 'fullName email phone isEmailVerified isPhoneVerified')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      metrics: {
        totalApplications,
        pendingReviewCount,
        approvedCount,
        disbursedCount,
        rejectedCount,
        totalDisbursedVolume
      },
      data: applications
    });
  } catch (err) {
    next(err);
  }
};

// Get Full Application Details
exports.getApplicationById = async (req, res, next) => {
  try {
    const application = await LoanApplication.findById(req.params.id)
      .populate('user', 'fullName email phone isEmailVerified isPhoneVerified role createdAt');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' }
      });
    }

    const auditLogs = await AuditLog.find({ application: application._id })
      .populate('actionBy', 'fullName email role')
      .sort({ createdAt: -1 });

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

// Review Selfie (Approve / Reject)
exports.reviewSelfie = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const { id } = req.params;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Action must be APPROVE or REJECT.' }
      });
    }

    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' }
      });
    }

    const previousStage = application.currentStage;

    if (action === 'APPROVE') {
      application.selfie.status = 'APPROVED';
      application.selfie.reviewedBy = req.user._id;
      application.selfie.reviewedAt = new Date();
      application.currentStage = 'SELFIE_APPROVED';

      await AuditLog.create({
        application: application._id,
        actionBy: req.user._id,
        actionType: 'SELFIE_APPROVED',
        previousStage,
        newStage: 'SELFIE_APPROVED',
        notes: 'Admin approved submitted live selfie photo.'
      });
    } else {
      application.selfie.status = 'REJECTED';
      application.selfie.rejectionReason = rejectionReason || 'Selfie image clear check failed.';
      application.selfie.reviewedBy = req.user._id;
      application.selfie.reviewedAt = new Date();
      application.currentStage = 'SELFIE_REJECTED';

      await AuditLog.create({
        application: application._id,
        actionBy: req.user._id,
        actionType: 'SELFIE_REJECTED',
        previousStage,
        newStage: 'SELFIE_REJECTED',
        notes: `Admin rejected selfie: ${application.selfie.rejectionReason}`
      });
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: `Selfie review updated: ${action}D.`,
      data: {
        application
      }
    });
  } catch (err) {
    next(err);
  }
};

// Confirm Disbursement
exports.confirmDisbursement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' }
      });
    }

    if (application.currentStage !== 'SELFIE_APPROVED') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STAGE', message: 'Application selfie must be approved before confirming disbursement.' }
      });
    }

    const previousStage = application.currentStage;
    const utrNumber = `EZF-DISB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const amountToDisburse = application.selectedTerms ? application.selectedTerms.netDisbursementAmount : 0;

    application.disbursement = {
      utrNumber,
      disbursedAmount: amountToDisburse,
      disbursedAt: new Date(),
      disbursedBy: req.user._id
    };

    application.currentStage = 'DISBURSED';
    await application.save();

    await AuditLog.create({
      application: application._id,
      actionBy: req.user._id,
      actionType: 'DISBURSED',
      previousStage,
      newStage: 'DISBURSED',
      notes: notes || `Disbursement executed successfully. UTR: ${utrNumber}, Amount: ₹${amountToDisburse}`
    });

    res.status(200).json({
      success: true,
      message: 'Disbursement confirmed and funds transferred.',
      data: {
        disbursement: application.disbursement,
        currentStage: application.currentStage
      }
    });
  } catch (err) {
    next(err);
  }
};

// Stream KYC Document to Admin (Backend PDF Proxy Endpoint)
exports.streamKycDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await LoanApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application not found.' }
      });
    }

    if (!application.kyc || !application.kyc.documentPath) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'No KYC document uploaded for this application.' }
      });
    }

    let documentUrl = application.kyc.documentPath;

    // If local relative path, read directly from server disk
    if (!documentUrl.startsWith('http://') && !documentUrl.startsWith('https://')) {
      const localFilePath = path.join(__dirname, '..', documentUrl);
      if (!fs.existsSync(localFilePath)) {
        return res.status(404).json({
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: 'Local KYC document file not found.' }
        });
      }

      const buffer = fs.readFileSync(localFilePath);
      const isPdf = documentUrl.toLowerCase().endsWith('.pdf') || buffer.slice(0, 1024).toString('binary').includes('%PDF');
      res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'image/jpeg');
      res.setHeader('Content-Disposition', 'inline; filename="KYC_Document"');
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }

    // If Cloudinary / Remote HTTPS URL, fetch raw bytes directly from cloud
    const client = documentUrl.startsWith('https://') ? https : http;

    client.get(documentUrl, (cloudRes) => {
      if (cloudRes.statusCode >= 400) {
        return res.status(cloudRes.statusCode).json({
          success: false,
          error: {
            code: 'REMOTE_FETCH_FAILED',
            message: `Cloudinary storage returned HTTP ${cloudRes.statusCode} status.`
          }
        });
      }

      const chunks = [];
      cloudRes.on('data', (chunk) => chunks.push(chunk));
      cloudRes.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Inspect header bytes for PDF magic bytes (%PDF)
        const pdfMagicString = buffer.slice(0, 1024).toString('binary');
        const isPdf = pdfMagicString.includes('%PDF');

        if (!isPdf && documentUrl.toLowerCase().endsWith('.pdf')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PDF',
              message: 'Downloaded Cloudinary asset is not a valid PDF document.'
            }
          });
        }

        res.setHeader('Content-Type', isPdf ? 'application/pdf' : cloudRes.headers['content-type'] || 'image/jpeg');
        res.setHeader('Content-Disposition', 'inline; filename="KYC_Document"');
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      });
    }).on('error', (fetchErr) => {
      console.error('[Cloudinary Proxy Fetch Error]', fetchErr.message);
      return res.status(502).json({
        success: false,
        error: { code: 'PROXY_FETCH_ERROR', message: 'Failed to stream document from Cloudinary.' }
      });
    });
  } catch (err) {
    next(err);
  }
};
