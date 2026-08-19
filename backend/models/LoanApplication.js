const mongoose = require('mongoose');

const LoanApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentStage: {
    type: String,
    enum: [
      'DRAFT',
      'EMAIL_VERIFIED',
      'PHONE_VERIFIED',
      'KYC_SUBMITTED',
      'ELIGIBILITY_CALCULATED',
      'LOAN_TERMS_SELECTED',
      'BANK_DETAILS_ADDED',
      'DECLARATION_ACCEPTED',
      'UNDER_ADMIN_REVIEW',
      'SELFIE_APPROVED',
      'SELFIE_REJECTED',
      'DISBURSED',
      'REJECTED'
    ],
    default: 'DRAFT',
    required: true
  },
  
  // KYC Section
  kyc: {
    fullName: String,
    dob: Date,
    age: Number,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String
    },
    idType: { type: String, enum: ['PAN', 'Aadhaar'] },
    idNumber: String,
    documentPath: String,
    isVerified: { type: Boolean, default: false }
  },

  // Financial & Eligibility Section
  financials: {
    monthlyIncome: Number,
    requestedAmount: Number,
    cibilScore: Number,
    existingDebts: Number,
    employerName: String,
    designation: String
  },
  eligibility: {
    status: { type: String, enum: ['ELIGIBLE', 'PARTIALLY_ELIGIBLE', 'NOT_ELIGIBLE'] },
    dtiRatio: Number,
    riskRating: String,
    maxApprovedAmount: Number,
    applicableInterestRate: Number,
    reason: String,
    calculatedAt: Date
  },

  // Selected Loan Terms Section
  selectedTerms: {
    amount: Number,
    tenureMonths: Number,
    interestRate: Number,
    monthlyEmi: Number,
    processingFee: Number,
    gst: Number,
    documentationFee: Number,
    totalDeductions: Number,
    netDisbursementAmount: Number,
    totalInterest: Number,
    totalRepayment: Number,
    monthlyIrr: Number,
    annualNominalIrr: Number,
    annualEffectiveIrr: Number,
    lockedAt: Date
  },

  // Bank Details Section
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountType: { type: String, enum: ['Savings', 'Current'] },
    isVerified: { type: Boolean, default: false }
  },

  // Declaration Section
  declaration: {
    accepted: { type: Boolean, default: false },
    acceptedAt: Date,
    ipAddress: String,
    version: { type: String, default: '1.0' }
  },

  // Selfie / Photo Verification Section
  selfie: {
    photoPath: String,
    uploadedAt: Date,
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date
  },

  // Disbursement Section
  disbursement: {
    utrNumber: String,
    disbursedAmount: Number,
    disbursedAt: Date,
    disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, {
  timestamps: true
});

LoanApplicationSchema.index({ currentStage: 1 });
LoanApplicationSchema.index({ user: 1 });

module.exports = mongoose.model('LoanApplication', LoanApplicationSchema);
