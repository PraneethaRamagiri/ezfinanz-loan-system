const LoanApplication = require('../models/LoanApplication');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../utils/cloudinary');

// Helper to parse cloudName, resourceType, deliveryType, and publicId from a Cloudinary URL
const parseCloudinaryUrl = (urlStr) => {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean);
    const resTypeIdx = parts.findIndex(p => ['upload', 'private', 'authenticated'].includes(p.toLowerCase()));
    
    if (resTypeIdx > 0) {
      const resourceType = parts[resTypeIdx - 1];
      const deliveryType = parts[resTypeIdx];
      let publicIdParts = parts.slice(resTypeIdx + 1);
      if (publicIdParts.length > 0 && /^s--[a-zA-Z0-9_-]+--$/.test(publicIdParts[0])) {
        publicIdParts = publicIdParts.slice(1);
      }
      if (publicIdParts.length > 0 && /^v\d+$/i.test(publicIdParts[0])) {
        publicIdParts = publicIdParts.slice(1);
      }
      const publicId = publicIdParts.join('/');
      return { cloudName: parts[0], resourceType, deliveryType, publicId };
    }
  } catch (e) {}
  return null;
};

// Helper to fetch buffer from HTTP/HTTPS URL
const fetchBufferFromUrl = (targetUrl) => {
  return new Promise((resolve) => {
    const client = targetUrl.startsWith('https://') ? https : http;
    client.get(targetUrl, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer: Buffer.concat(chunks)
        });
      });
    }).on('error', (err) => {
      resolve({ statusCode: 500, error: err, buffer: Buffer.alloc(0) });
    });
  });
};

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

    // Handle local disk relative path
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
      res.setHeader('Content-Disposition', 'inline; filename="KYC_Document.pdf"');
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }

    // Handle Cloudinary / Remote HTTPS URL
    let fetchRes = await fetchBufferFromUrl(documentUrl);

    // If initial fetch returned HTTP 401/403/404 or invalid PDF bytes, generate signed Cloudinary URL and retry
    if (fetchRes.statusCode >= 400 || (fetchRes.buffer && !fetchRes.buffer.slice(0, 1024).toString('binary').includes('%PDF') && documentUrl.toLowerCase().endsWith('.pdf'))) {
      const parsed = parseCloudinaryUrl(documentUrl);
      if (parsed) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || parsed.cloudName;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
          cloudinary.config({
            cloud_name: cloudName.trim(),
            api_key: apiKey.trim(),
            api_secret: apiSecret.trim(),
            secure: true
          });

          const cleanPublicId = parsed.publicId.replace(/\.pdf$/i, '');
          const isPdf = documentUrl.toLowerCase().endsWith('.pdf');

          // Method A: Signed URL with clean publicId and format
          const signedUrlA = cloudinary.url(cleanPublicId, {
            cloud_name: cloudName,
            resource_type: parsed.resourceType || 'image',
            type: parsed.deliveryType || 'upload',
            format: isPdf ? 'pdf' : '',
            sign_url: true,
            secure: true
          });
          let retryRes = await fetchBufferFromUrl(signedUrlA);

          // Method B: Signed Private Download URL
          if (retryRes.statusCode >= 400 || (isPdf && !retryRes.buffer.slice(0, 1024).toString('binary').includes('%PDF'))) {
            try {
              const privateUrl = cloudinary.utils.private_download_url(cleanPublicId, isPdf ? 'pdf' : '', {
                resource_type: parsed.resourceType || 'image',
                type: parsed.deliveryType || 'upload',
                expires_at: Math.floor(Date.now() / 1000) + 3600
              });
              const privateRes = await fetchBufferFromUrl(privateUrl);
              if (privateRes.statusCode === 200) {
                retryRes = privateRes;
              }
            } catch (e) {}
          }

          // Method C: Raw resource_type retry
          if (retryRes.statusCode >= 400 || (isPdf && !retryRes.buffer.slice(0, 1024).toString('binary').includes('%PDF'))) {
            const signedUrlRaw = cloudinary.url(parsed.publicId, {
              cloud_name: cloudName,
              resource_type: 'raw',
              type: parsed.deliveryType || 'upload',
              sign_url: true,
              secure: true
            });
            const rawRes = await fetchBufferFromUrl(signedUrlRaw);
            if (rawRes.statusCode === 200) {
              retryRes = rawRes;
            }
          }

          if (retryRes.statusCode === 200) {
            fetchRes = retryRes;
          }
        }
      }
    }

    if (fetchRes.statusCode >= 400) {
      return res.status(fetchRes.statusCode).json({
        success: false,
        error: {
          code: 'REMOTE_FETCH_FAILED',
          message: `Cloudinary storage returned HTTP ${fetchRes.statusCode} status.`
        }
      });
    }

    const buffer = fetchRes.buffer;
    const pdfMagicString = buffer.slice(0, 1024).toString('binary');
    const isPdf = pdfMagicString.includes('%PDF');

    if (!isPdf && documentUrl.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PDF',
          message: 'Downloaded Cloudinary asset is not a valid PDF document (missing %PDF magic signature).'
        }
      });
    }

    res.setHeader('Content-Type', isPdf ? 'application/pdf' : fetchRes.headers['content-type'] || 'image/jpeg');
    res.setHeader('Content-Disposition', 'inline; filename="KYC_Document.pdf"');
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};
