const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const LoanApplication = require('../models/LoanApplication');
const AuditLog = require('../models/AuditLog');
const { calculateLoanTerms } = require('./financialCalculators');

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('[Seed] Clearing existing database collections...');
    await User.deleteMany({});
    await LoanApplication.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[Seed] Creating demo accounts...');

    // 1. Admin Account
    const adminUser = await User.create({
      fullName: 'System Admin',
      email: 'admin@ezfinanz.com',
      phone: '9999999999',
      password: 'Admin@123456',
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    // 2. Eligible Customer (Ready for Admin Review)
    const eligibleUser = await User.create({
      fullName: 'Rajesh Sharma',
      email: 'eligible@example.com',
      phone: '9876543210',
      password: 'Customer@123456',
      role: 'customer',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    const eligibleTerms = calculateLoanTerms(300000, 24, 12.5);
    await LoanApplication.create({
      applicationNumber: 'EZF-2026-9001',
      user: eligibleUser._id,
      currentStage: 'UNDER_ADMIN_REVIEW',
      kyc: {
        fullName: 'Rajesh Sharma',
        dob: new Date('1992-06-15'),
        age: 34,
        gender: 'Male',
        address: { line1: '42 MG Road', line2: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
        idType: 'PAN',
        idNumber: 'ABCDE1234F',
        documentPath: '/uploads/documents/sample_pan.jpg',
        isVerified: true
      },
      financials: {
        monthlyIncome: 85000,
        requestedAmount: 300000,
        cibilScore: 780,
        existingDebts: 12000,
        employerName: 'Infosys Ltd',
        designation: 'Lead Architect'
      },
      eligibility: {
        status: 'ELIGIBLE',
        dtiRatio: 28.5,
        riskRating: 'Excellent',
        maxApprovedAmount: 500000,
        applicableInterestRate: 12.5,
        reason: 'Excellent CIBIL score and healthy DTI ratio.',
        calculatedAt: new Date()
      },
      selectedTerms: eligibleTerms,
      bankDetails: {
        accountHolderName: 'Rajesh Sharma',
        accountNumber: '918273645019',
        ifscCode: 'SBIN0000847',
        bankName: 'State Bank of India',
        accountType: 'Savings',
        isVerified: true
      },
      declaration: {
        accepted: true,
        acceptedAt: new Date(),
        ipAddress: '127.0.0.1',
        version: '1.0'
      },
      selfie: {
        photoPath: '/uploads/selfies/sample_selfie_rajesh.jpg',
        uploadedAt: new Date(),
        status: 'PENDING'
      }
    });

    // 3. Partially Eligible Customer
    const partialUser = await User.create({
      fullName: 'Ananya Verma',
      email: 'partial@example.com',
      phone: '9812345678',
      password: 'Customer@123456',
      role: 'customer',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    const partialTerms = calculateLoanTerms(150000, 18, 18.5);
    await LoanApplication.create({
      applicationNumber: 'EZF-2026-9002',
      user: partialUser._id,
      currentStage: 'LOAN_TERMS_SELECTED',
      kyc: {
        fullName: 'Ananya Verma',
        dob: new Date('1996-09-20'),
        age: 29,
        gender: 'Female',
        address: { line1: '108 Jubilee Hills', line2: 'Road No 36', city: 'Hyderabad', state: 'Telangana', pincode: '500033' },
        idType: 'Aadhaar',
        idNumber: '987654321098',
        documentPath: '/uploads/documents/sample_aadhaar.jpg',
        isVerified: true
      },
      financials: {
        monthlyIncome: 45000,
        requestedAmount: 250000,
        cibilScore: 680,
        existingDebts: 18000,
        employerName: 'Cognizant Solutions',
        designation: 'Software Engineer'
      },
      eligibility: {
        status: 'PARTIALLY_ELIGIBLE',
        dtiRatio: 52.1,
        riskRating: 'Fair',
        maxApprovedAmount: 150000,
        applicableInterestRate: 18.5,
        reason: 'Approved for partial amount due to moderate DTI ratio.',
        calculatedAt: new Date()
      },
      selectedTerms: partialTerms
    });

    // 4. Not Eligible Customer
    const ineligibleUser = await User.create({
      fullName: 'Vikram Singh',
      email: 'ineligible@example.com',
      phone: '9711223344',
      password: 'Customer@123456',
      role: 'customer',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    await LoanApplication.create({
      applicationNumber: 'EZF-2026-9003',
      user: ineligibleUser._id,
      currentStage: 'ELIGIBILITY_CALCULATED',
      kyc: {
        fullName: 'Vikram Singh',
        dob: new Date('1998-12-05'),
        age: 27,
        gender: 'Male',
        address: { line1: '15 Connaught Place', line2: 'Inner Circle', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
        idType: 'PAN',
        idNumber: 'XYZPS9876Q',
        isVerified: true
      },
      financials: {
        monthlyIncome: 20000,
        requestedAmount: 300000,
        cibilScore: 590,
        existingDebts: 15000,
        employerName: 'Retail Services',
        designation: 'Executive'
      },
      eligibility: {
        status: 'NOT_ELIGIBLE',
        dtiRatio: 75.0,
        riskRating: 'High Risk',
        maxApprovedAmount: 0,
        applicableInterestRate: 24.0,
        reason: 'CIBIL score is below 650 threshold and income is below ₹25,000.',
        calculatedAt: new Date()
      }
    });

    // 5. Fully Disbursed Customer
    const disbursedUser = await User.create({
      fullName: 'Priya Sundaram',
      email: 'disbursed@example.com',
      phone: '9988776655',
      password: 'Customer@123456',
      role: 'customer',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    const disbursedTerms = calculateLoanTerms(400000, 36, 12.5);
    await LoanApplication.create({
      applicationNumber: 'EZF-2026-9004',
      user: disbursedUser._id,
      currentStage: 'DISBURSED',
      kyc: {
        fullName: 'Priya Sundaram',
        dob: new Date('1990-03-12'),
        age: 36,
        gender: 'Female',
        address: { line1: '77 Anna Salai', line2: 'T Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017' },
        idType: 'PAN',
        idNumber: 'PRYSU1122K',
        isVerified: true
      },
      financials: {
        monthlyIncome: 110000,
        requestedAmount: 400000,
        cibilScore: 810,
        existingDebts: 10000,
        employerName: 'TCS Digital',
        designation: 'Senior Manager'
      },
      eligibility: {
        status: 'ELIGIBLE',
        dtiRatio: 22.0,
        riskRating: 'Excellent',
        maxApprovedAmount: 800000,
        applicableInterestRate: 12.5,
        reason: 'Prime underwriting score.',
        calculatedAt: new Date()
      },
      selectedTerms: disbursedTerms,
      bankDetails: {
        accountHolderName: 'Priya Sundaram',
        accountNumber: '445566778899',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountType: 'Savings',
        isVerified: true
      },
      declaration: { accepted: true, acceptedAt: new Date(), ipAddress: '127.0.0.1', version: '1.0' },
      selfie: {
        photoPath: '/uploads/selfies/sample_selfie_priya.jpg',
        uploadedAt: new Date(),
        status: 'APPROVED',
        reviewedBy: adminUser._id,
        reviewedAt: new Date()
      },
      disbursement: {
        utrNumber: 'EZF-DISB-2026-778899',
        disbursedAmount: disbursedTerms.netDisbursementAmount,
        disbursedAt: new Date(),
        disbursedBy: adminUser._id
      }
    });

    console.log('[Seed] Database populated successfully with demo accounts!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed Error]', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
