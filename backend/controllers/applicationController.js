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

    const { applicationNumber, kyc, selectedTerms, bankDetails, disbursement } = application;
    const applicantName = kyc?.fullName || req.user.fullName || 'Valued Customer';
    const filename = `EZFinanz_Sanction_Letter_${applicationNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Header Branding
    doc.fillColor('#059669').fontSize(22).font('Helvetica-Bold').text('EZFINANZ', 50, 40);
    doc.fillColor('#475569').fontSize(10).font('Helvetica').text('Digital Personal Loan Platform', 50, 65);
    doc.moveTo(50, 80).lineTo(545, 80).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Title
    doc.moveDown(1.5);
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('PERSONAL LOAN SANCTION & DISBURSEMENT LETTER', { align: 'center' });
    doc.moveDown(1);

    // Date & App Info Header
    const issueDate = disbursement?.disbursedAt ? new Date(disbursement.disbursedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Date of Issue: ${issueDate}`, 50, 130);
    doc.text(`Application Ref: ${applicationNumber}`, 350, 130, { align: 'right' });

    doc.moveTo(50, 145).lineTo(545, 145).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

    // Applicant Box
    doc.rect(50, 160, 495, 60).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('APPLICANT DETAILS', 65, 170);
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Full Name: ${applicantName}`, 65, 188);
    doc.text(`KYC Address: ${kyc?.address?.line1 || ''}, ${kyc?.address?.city || ''}, ${kyc?.address?.state || ''} - ${kyc?.address?.pincode || ''}`, 65, 202);

    // Loan Breakdown Box
    doc.rect(50, 235, 495, 160).fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold').text('LOAN & DISBURSEMENT SUMMARY', 65, 245);

    doc.fontSize(10).font('Helvetica').fillColor('#1e293b');
    doc.text(`Sanctioned Loan Amount:`, 65, 268);
    doc.font('Helvetica-Bold').text(`Rs. ${selectedTerms?.amount?.toLocaleString('en-IN') || 0}`, 260, 268);

    doc.font('Helvetica').text(`Net Amount Disbursed:`, 65, 286);
    doc.font('Helvetica-Bold').fillColor('#047857').text(`Rs. ${disbursement?.disbursedAmount?.toLocaleString('en-IN') || selectedTerms?.netDisbursementAmount?.toLocaleString('en-IN') || 0}`, 260, 286);

    doc.font('Helvetica').fillColor('#1e293b').text(`Monthly EMI:`, 65, 304);
    doc.font('Helvetica-Bold').text(`Rs. ${selectedTerms?.monthlyEmi?.toLocaleString('en-IN') || 0} / month`, 260, 304);

    doc.font('Helvetica').text(`Repayment Tenure:`, 65, 322);
    doc.font('Helvetica-Bold').text(`${selectedTerms?.tenureMonths || 0} Months`, 260, 322);

    doc.font('Helvetica').text(`Interest Rate (APR):`, 65, 340);
    doc.font('Helvetica-Bold').text(`${selectedTerms?.interestRate || 14.5}% p.a.`, 260, 340);

    doc.font('Helvetica').text(`First EMI Due Date:`, 65, 358);
    doc.font('Helvetica-Bold').text(`5th of Next Month`, 260, 358);

    doc.font('Helvetica').text(`Application Status:`, 65, 376);
    doc.font('Helvetica-Bold').fillColor('#047857').text(`DISBURSED (COMPLETED)`, 260, 376);

    // Bank Details Box
    doc.rect(50, 410, 495, 100).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('DISBURSEMENT BANK ACCOUNT DETAILS', 65, 420);

    const maskedAcc = maskAccountNumber(bankDetails?.accountNumber);

    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Bank Name: ${bankDetails?.bankName || 'N/A'}`, 65, 440);
    doc.text(`Masked Account Number: ${maskedAcc}`, 65, 458);
    doc.text(`IFSC Code: ${bankDetails?.ifscCode || 'N/A'}`, 65, 476);
    doc.text(`Bank Transaction UTR: ${disbursement?.utrNumber || 'EZF-DISB-2026-998877'}`, 65, 494);

    // Terms & Security Note
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b');
    doc.text('Important Note: This loan is subject to EZFinanz terms & conditions. Sensitive identity and financial credentials (PAN, Aadhaar, Account Numbers) are masked for security.', 50, 530, { width: 495, align: 'justify' });

    // Footer
    doc.moveTo(50, 720).lineTo(545, 720).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('This is a computer-generated sanction letter and does not require a physical signature.', 50, 730, { align: 'center' });
    doc.text('EZFinanz Consumer Financial Services Ltd | Customer Support: support@ezfinanz.com', 50, 742, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
};
