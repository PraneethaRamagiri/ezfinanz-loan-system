const LoanApplication = require('../models/LoanApplication');
const AuditLog = require('../models/AuditLog');
const { evaluateEligibility, calculateLoanTerms } = require('../utils/financialCalculators');

exports.checkEligibility = async (req, res, next) => {
  try {
    const { monthlyIncome, requestedAmount, cibilScore, existingDebts, employerName, designation } = req.body;

    if (!monthlyIncome || !requestedAmount || !cibilScore || employerName === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FINANCIAL_FIELDS', message: 'Please provide income, requested loan amount, CIBIL score, and employer details.' }
      });
    }

    const application = await LoanApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application record not found.' }
      });
    }

    const previousStage = application.currentStage;
    const eligibilityResult = evaluateEligibility(monthlyIncome, requestedAmount, cibilScore, existingDebts);

    application.financials = {
      monthlyIncome: Number(monthlyIncome),
      requestedAmount: Number(requestedAmount),
      cibilScore: Number(cibilScore),
      existingDebts: Number(existingDebts) || 0,
      employerName,
      designation
    };

    application.eligibility = eligibilityResult;
    application.currentStage = 'ELIGIBILITY_CALCULATED';
    await application.save();

    await AuditLog.create({
      application: application._id,
      actionBy: req.user._id,
      actionType: 'ELIGIBILITY_CHECKED',
      previousStage,
      newStage: 'ELIGIBILITY_CALCULATED',
      notes: `Eligibility checked: Status ${eligibilityResult.status}, DTI: ${eligibilityResult.dtiRatio}%, Max: ₹${eligibilityResult.maxApprovedAmount}`
    });

    res.status(200).json({
      success: true,
      message: 'Eligibility evaluation completed.',
      data: {
        financials: application.financials,
        eligibility: application.eligibility,
        currentStage: application.currentStage
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.calculateTerms = async (req, res, next) => {
  try {
    const { amount, tenureMonths, interestRate } = req.body;

    if (!amount || !tenureMonths) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CALCULATION_FIELDS', message: 'Amount and tenure are required.' }
      });
    }

    const rate = Number(interestRate) || 14.5;
    const loanTerms = calculateLoanTerms(Number(amount), Number(tenureMonths), rate);

    res.status(200).json({
      success: true,
      data: loanTerms
    });
  } catch (err) {
    next(err);
  }
};

exports.selectTerms = async (req, res, next) => {
  try {
    const { amount, tenureMonths } = req.body;

    const application = await LoanApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Loan application not found.' }
      });
    }

    if (!application.eligibility || application.eligibility.status === 'NOT_ELIGIBLE') {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_ELIGIBLE', message: 'Loan terms cannot be selected for an ineligible application.' }
      });
    }

    const maxLimit = application.eligibility.maxApprovedAmount || application.financials.requestedAmount;
    if (Number(amount) > maxLimit) {
      return res.status(400).json({
        success: false,
        error: { code: 'EXCEEDS_APPROVED_LIMIT', message: `Requested amount ₹${amount} exceeds max approved limit ₹${maxLimit}.` }
      });
    }

    const rate = application.eligibility.applicableInterestRate || 15.0;
    const calculatedTerms = calculateLoanTerms(Number(amount), Number(tenureMonths), rate);

    const previousStage = application.currentStage;
    application.selectedTerms = {
      ...calculatedTerms,
      lockedAt: new Date()
    };
    application.currentStage = 'LOAN_TERMS_SELECTED';
    await application.save();

    await AuditLog.create({
      application: application._id,
      actionBy: req.user._id,
      actionType: 'TERMS_LOCKED',
      previousStage,
      newStage: 'LOAN_TERMS_SELECTED',
      notes: `Loan terms locked: Amount ₹${amount}, Tenure: ${tenureMonths}M, EMI: ₹${calculatedTerms.monthlyEmi}, Net Disb: ₹${calculatedTerms.netDisbursementAmount}`
    });

    res.status(200).json({
      success: true,
      message: 'Loan terms locked successfully.',
      data: {
        selectedTerms: application.selectedTerms,
        currentStage: application.currentStage
      }
    });
  } catch (err) {
    next(err);
  }
};
