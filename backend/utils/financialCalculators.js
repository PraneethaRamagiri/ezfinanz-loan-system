/**
 * Financial Calculators & Underwriting Engine
 */

/**
 * Calculates Reducing Balance Monthly EMI
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  if (!annualRate || annualRate <= 0) return Math.round((principal / tenureMonths) * 100) / 100;
  const r = (annualRate / 12) / 100;
  const emi = principal * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

/**
 * Calculates exact IRR using Newton-Raphson numerical algorithm
 */
function calculateIRR(netDisbursement, emi, tenureMonths) {
  const C0 = -Math.abs(netDisbursement);
  let m = 0.015; // Initial guess: 1.5% monthly
  const maxIterations = 100;
  const tolerance = 1e-7;

  for (let i = 0; i < maxIterations; i++) {
    let fVal = C0;
    let fPrime = 0;

    for (let t = 1; t <= tenureMonths; t++) {
      const discount = Math.pow(1 + m, t);
      fVal += emi / discount;
      fPrime -= (t * emi) / Math.pow(1 + m, t + 1);
    }

    if (Math.abs(fPrime) < 1e-12) break;

    const nextM = m - (fVal / fPrime);
    if (Math.abs(nextM - m) < tolerance) {
      m = nextM;
      break;
    }
    m = nextM;
  }

  const monthlyIrr = m * 100;
  const annualNominalIrr = m * 12 * 100;
  const annualEffectiveIrr = (Math.pow(1 + m, 12) - 1) * 100;

  return {
    monthlyIrr: Number(monthlyIrr.toFixed(2)),
    annualNominalIrr: Number(annualNominalIrr.toFixed(2)),
    annualEffectiveIrr: Number(annualEffectiveIrr.toFixed(2))
  };
}

/**
 * Full Loan Calculations Breakdown
 */
function calculateLoanTerms(principal, tenureMonths, annualRate) {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const processingFee = Math.max(Math.round(principal * 0.02 * 100) / 100, 1000);
  const gst = Math.round(processingFee * 0.18 * 100) / 100;
  const documentationFee = 500;
  const totalDeductions = Math.round((processingFee + gst + documentationFee) * 100) / 100;
  const netDisbursementAmount = Math.round((principal - totalDeductions) * 100) / 100;
  const totalRepayment = Math.round((emi * tenureMonths) * 100) / 100;
  const totalInterest = Math.round((totalRepayment - principal) * 100) / 100;
  const irr = calculateIRR(netDisbursementAmount, emi, tenureMonths);

  return {
    amount: principal,
    tenureMonths,
    interestRate: annualRate,
    monthlyEmi: emi,
    processingFee,
    gst,
    documentationFee,
    totalDeductions,
    netDisbursementAmount,
    totalInterest,
    totalRepayment,
    monthlyIrr: irr.monthlyIrr,
    annualNominalIrr: irr.annualNominalIrr,
    annualEffectiveIrr: irr.annualEffectiveIrr
  };
}

/**
 * Underwriting & Eligibility Evaluation Engine
 */
function evaluateEligibility(monthlyIncome, requestedAmount, cibilScore, existingDebts) {
  const monthlyDebts = Number(existingDebts) || 0;
  const income = Number(monthlyIncome) || 1;
  const requested = Number(requestedAmount) || 0;
  const score = Number(cibilScore) || 300;

  // DTI calculation
  const dtiRatio = Number(((monthlyDebts / income) * 100).toFixed(2));

  let status = 'NOT_ELIGIBLE';
  let riskRating = 'High Risk';
  let maxApprovedAmount = 0;
  let applicableInterestRate = 24.0;
  let reason = '';

  if (score < 650) {
    status = 'NOT_ELIGIBLE';
    riskRating = 'High Risk';
    reason = 'Credit score is below the minimum threshold of 650.';
  } else if (dtiRatio > 60) {
    status = 'NOT_ELIGIBLE';
    riskRating = 'High Risk';
    reason = `Debt-to-Income ratio (${dtiRatio}%) exceeds maximum permissible cap of 60%.`;
  } else if (income < 25000) {
    status = 'NOT_ELIGIBLE';
    riskRating = 'High Risk';
    reason = 'Monthly income is below the minimum required ₹25,000.';
  } else if (score >= 750 && dtiRatio <= 45) {
    status = 'ELIGIBLE';
    riskRating = 'Excellent';
    applicableInterestRate = 12.5;
    maxApprovedAmount = Math.min(income * 10, 1000000);
    reason = 'Applicant meets prime underwriting standards with excellent credit score and healthy DTI ratio.';
  } else if (score >= 700 && dtiRatio <= 50) {
    status = 'ELIGIBLE';
    riskRating = 'Good';
    applicableInterestRate = 15.0;
    maxApprovedAmount = Math.min(income * 8, 750000);
    reason = 'Applicant approved under standard tier with strong repayment capacity.';
  } else {
    status = 'PARTIALLY_ELIGIBLE';
    riskRating = 'Fair';
    applicableInterestRate = 18.5;
    maxApprovedAmount = Math.min(income * 5, Math.round(requested * 0.6));
    reason = 'Approved for partial loan amount due to moderate credit score or DTI ratio.';
  }

  // Adjust max approval if requested amount is lower
  if (status === 'ELIGIBLE' && requested <= maxApprovedAmount) {
    maxApprovedAmount = requested;
  }

  return {
    status,
    dtiRatio,
    riskRating,
    maxApprovedAmount,
    applicableInterestRate,
    reason,
    calculatedAt: new Date()
  };
}

module.exports = {
  calculateEMI,
  calculateIRR,
  calculateLoanTerms,
  evaluateEligibility
};
