/**
 * EZFinanz Input Validation & Security Helper (Frontend)
 */

export const BANK_IFSC_MAP = {
  SBIN: 'State Bank of India',
  BARB: 'Bank of Baroda',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  AXIS: 'Axis Bank',
  UTIB: 'Axis Bank',
  KKBK: 'Kotak Mahindra Bank',
  PUNB: 'Punjab National Bank',
  CNRB: 'Canara Bank',
  MAHB: 'Bank of Maharashtra',
  UBIN: 'Union Bank of India'
};

export const validateAadhaar = (aadhaar) => {
  if (!aadhaar || typeof aadhaar !== 'string') {
    return 'Aadhaar number is required.';
  }
  const cleanAadhaar = aadhaar.replace(/\s+/g, '');
  if (!/^[0-9]{12}$/.test(cleanAadhaar)) {
    return 'Aadhaar number must contain exactly 12 numeric digits (e.g. 123456789012)';
  }
  return null;
};

export const validatePAN = (pan) => {
  if (!pan || typeof pan !== 'string') {
    return 'PAN number is required.';
  }
  const cleanPan = pan.toUpperCase().trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
    return 'PAN number must be 10 characters in format ABCDE1234F (5 letters, 4 digits, 1 letter)';
  }
  return null;
};

export const validateIdDocument = (idType, idNumber) => {
  if (idType === 'PAN') {
    return validatePAN(idNumber);
  }
  if (idType === 'Aadhaar') {
    return validateAadhaar(idNumber);
  }
  return 'Please select a valid ID document type.';
};

export const validateBankAccountNumber = (accountNumber) => {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return 'Bank account number is required.';
  }
  const cleanAcc = accountNumber.replace(/\s+/g, '');
  if (!/^[0-9]{9,18}$/.test(cleanAcc)) {
    return 'Bank account number must contain 9 to 18 numeric digits';
  }
  return null;
};

export const validateIFSC = (ifscCode) => {
  if (!ifscCode || typeof ifscCode !== 'string') {
    return 'IFSC code is required.';
  }
  const cleanIfsc = ifscCode.toUpperCase().trim();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
    return 'IFSC code must be 11 characters in format SBIN0000847 (4 letters, 0, 6 alphanumeric)';
  }
  return null;
};

export const validateBankAndIfsc = (bankName, ifscCode) => {
  const ifscErr = validateIFSC(ifscCode);
  if (ifscErr) {
    return ifscErr;
  }

  if (!bankName || typeof bankName !== 'string' || !bankName.trim()) {
    return 'Bank name is required.';
  }

  const prefix = ifscCode.trim().substring(0, 4).toUpperCase();
  const expectedBank = BANK_IFSC_MAP[prefix];

  if (expectedBank) {
    const normEntered = bankName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normExpected = expectedBank.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!normEntered.includes(normExpected) && !normExpected.includes(normEntered)) {
      return `Bank name does not match the IFSC code. IFSC ${ifscCode.toUpperCase().trim()} belongs to ${expectedBank}.`;
    }
  }

  return null;
};

export const validateDateOfBirth = (dob) => {
  if (!dob) {
    return 'Date of Birth is required.';
  }
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return 'Please enter a valid Date of Birth';
  }
  const today = new Date();
  if (birthDate > today) {
    return 'Date of Birth cannot be in the future';
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 21) {
    return `Applicant must be at least 21 years old (Current age: ${age})`;
  }
  if (age > 60) {
    return `Applicant age cannot exceed 60 years (Current age: ${age})`;
  }
  return null;
};

export const maskIdNumber = (idType, idNumber) => {
  if (!idNumber) return '';
  const clean = idNumber.replace(/\s+/g, '').toUpperCase();
  if (idType === 'Aadhaar' && clean.length === 12) {
    return `XXXX-XXXX-${clean.substring(8)}`;
  }
  if (idType === 'PAN' && clean.length === 10) {
    return `${clean.substring(0, 2)}****${clean.substring(8)}`;
  }
  return 'XXXX****XXXX';
};

export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return '';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length >= 4) {
    return `${'X'.repeat(clean.length - 4)}${clean.substring(clean.length - 4)}`;
  }
  return 'XXXXXXXXXXXX';
};
