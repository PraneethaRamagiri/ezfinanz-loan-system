# EZFinanz Personal Loan Application Solution - API Specification

## 1. Overview & Base Configuration

- **Base URL**: `http://localhost:5000/api`
- **Content Type**: `application/json` (unless `multipart/form-data` for file uploads)
- **Authentication**: HTTP Bearer Header (`Authorization: Bearer <jwt_token>`)
- **Response Format Standard**:
  ```json
  {
    "success": true,
    "message": "Operation successful description",
    "data": { ... }
  }
  ```

---

## 2. Authentication & Verification Routes (`/api/auth`)

### 2.1 Customer & Admin Signup
- **Method & Route**: `POST /api/auth/signup`
- **Request Body**:
  ```json
  {
    "fullName": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "phone": "9876543210",
    "password": "Password@123",
    "role": "customer"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account registered successfully. Please verify email and phone.",
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": "66c3...101",
        "fullName": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "phone": "9876543210",
        "role": "customer",
        "isEmailVerified": false,
        "isPhoneVerified": false
      },
      "application": {
        "id": "66c3...202",
        "applicationNumber": "EZF-1724041234-9981",
        "currentStage": "DRAFT"
      }
    }
  }
  ```

### 2.2 User Login
- **Method & Route**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "rajesh@example.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": "66c3...101",
        "fullName": "Rajesh Kumar",
        "role": "customer"
      },
      "currentStage": "DRAFT"
    }
  }
  ```

### 2.3 Simulated Google OAuth Login
- **Method & Route**: `POST /api/auth/google-login-mock`
- **Request Body**:
  ```json
  {
    "email": "google.user@example.com",
    "fullName": "Google User Test",
    "googleId": "mock_google_id_1002"
  }
  ```

### 2.4 Send / Resend Email OTP
- **Method & Route**: `POST /api/auth/send-email-otp`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP sent to email. (Simulated Code: 123456)",
    "data": { "simulatedOtp": "123456" }
  }
  ```

### 2.5 Verify Email OTP
- **Method & Route**: `POST /api/auth/verify-email-otp`
- **Request Body**: `{ "otp": "123456" }`
- **Response (200 OK)**: Modifies user status `isEmailVerified: true` and updates application stage to `EMAIL_VERIFIED`.

### 2.6 Send / Resend Phone OTP
- **Method & Route**: `POST /api/auth/send-phone-otp`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: `{ "success": true, "data": { "simulatedOtp": "654321" } }`

### 2.7 Verify Phone OTP
- **Method & Route**: `POST /api/auth/verify-phone-otp`
- **Request Body**: `{ "otp": "654321" }`
- **Response (200 OK)**: Modifies user status `isPhoneVerified: true` and updates application stage to `PHONE_VERIFIED`.

---

## 3. KYC & Identity Verification Routes (`/api/kyc`)

### 3.1 Submit KYC Details & ID Upload
- **Method & Route**: `POST /api/kyc/submit`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data Parameters**:
  - `fullName`: string
  - `dob`: "1992-05-15"
  - `gender`: "Male"
  - `addressLine1`: "123 Green Park"
  - `addressLine2`: "Sector 4"
  - `city`: "Hyderabad"
  - `state`: "Telangana"
  - `pincode`: "500081"
  - `idType`: "PAN"
  - `idNumber`: "ABCDE1234F"
  - `document` (Optional file upload: image/pdf)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "KYC details saved and ID verified.",
    "data": {
      "kyc": {
        "fullName": "Rajesh Kumar",
        "idType": "PAN",
        "idNumber": "ABCDE1234F",
        "isVerified": true
      },
      "currentStage": "KYC_SUBMITTED"
    }
  }
  ```

---

## 4. Loan Eligibility & Calculation Routes (`/api/loan`)

### 4.1 Check Loan Eligibility
- **Method & Route**: `POST /api/loan/check-eligibility`
- **Request Body**:
  ```json
  {
    "monthlyIncome": 75000,
    "requestedAmount": 300000,
    "cibilScore": 760,
    "existingDebts": 12000,
    "employerName": "TechCorp Ltd",
    "designation": "Senior Engineer"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "eligibility": {
        "status": "ELIGIBLE",
        "dtiRatio": 33.33,
        "riskRating": "Excellent",
        "maxApprovedAmount": 500000,
        "applicableInterestRate": 12.5,
        "reason": "Credit score and DTI ratio meet prime underwriting criteria."
      },
      "currentStage": "ELIGIBILITY_CALCULATED"
    }
  }
  ```

### 4.2 Real-Time EMI & Newton-Raphson IRR Calculator
- **Method & Route**: `POST /api/loan/calculate-terms`
- **Request Body**:
  ```json
  {
    "amount": 250000,
    "tenureMonths": 24,
    "interestRate": 14.5
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "amount": 250000,
      "tenureMonths": 24,
      "interestRate": 14.5,
      "monthlyEmi": 12061.42,
      "processingFee": 5000.00,
      "gst": 900.00,
      "documentationFee": 500.00,
      "totalDeductions": 6400.00,
      "netDisbursementAmount": 243600.00,
      "totalInterest": 39474.08,
      "totalRepayment": 289474.08,
      "monthlyIrr": 1.44,
      "annualNominalIrr": 17.28,
      "annualEffectiveIrr": 18.71
    }
  }
  ```

### 4.3 Lock Selected EMI Terms
- **Method & Route**: `POST /api/loan/select-terms`
- **Request Body**:
  ```json
  {
    "amount": 250000,
    "tenureMonths": 24
  }
  ```
- **Response (200 OK)**: Updates `selectedTerms` and advances state to `LOAN_TERMS_SELECTED`.

---

## 5. Bank Details & Declaration Routes (`/api/bank` & `/api/declaration`)

### 5.1 Add Bank Account & Penny Drop Check
- **Method & Route**: `POST /api/bank/add`
- **Request Body**:
  ```json
  {
    "accountHolderName": "Rajesh Kumar",
    "accountNumber": "918237465012",
    "ifscCode": "SBIN0001234",
    "bankName": "State Bank of India",
    "accountType": "Savings"
  }
  ```
- **Response (200 OK)**: Saves bank account details, marks `isVerified: true`, advances stage to `BANK_DETAILS_ADDED`.

### 5.2 Accept Legal Declaration
- **Method & Route**: `POST /api/declaration/accept`
- **Request Body**: `{ "accepted": true }`
- **Response (200 OK)**: Records timestamp and IP, advances stage to `DECLARATION_ACCEPTED`.

---

## 6. Live Selfie Photo Upload Routes (`/api/selfie`)

### 6.1 Upload Live Selfie Photo
- **Method & Route**: `POST /api/selfie/upload`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data**: `selfieImage` (File: JPG/PNG base64 or binary snapshot)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Selfie submitted successfully. Application is now under admin review.",
    "data": {
      "photoPath": "/uploads/selfies/EZF-10049_selfie.jpg",
      "currentStage": "UNDER_ADMIN_REVIEW"
    }
  }
  ```

---

## 7. Application Status & Timeline Routes (`/api/application`)

### 7.1 Get Customer Application Progress
- **Method & Route**: `GET /api/application/status`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Returns complete application object including current stage, submitted details, rejection reasons (if any), and timeline history.

---

## 8. Admin Management & Audit Routes (`/api/admin`)

### 8.1 List All Applications (Admin Dashboard)
- **Method & Route**: `GET /api/admin/applications`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**: `stage` (e.g. `UNDER_ADMIN_REVIEW`), `search` (name/email), `page`, `limit`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 12,
    "data": [
      {
        "id": "66c3...901",
        "applicationNumber": "EZF-1724041234-9981",
        "applicantName": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "requestedAmount": 300000,
        "selectedTenure": 24,
        "cibilScore": 760,
        "currentStage": "UNDER_ADMIN_REVIEW",
        "submittedAt": "2026-08-19T10:14:00.000Z"
      }
    ]
  }
  ```

### 8.2 Get Full 360-Degree Application Journey
- **Method & Route**: `GET /api/admin/applications/:id`
- **Response (200 OK)**: Complete un-redacted application details, KYC docs, bank info, selfie image URL, and audit trail logs.

### 8.3 Review & Approve/Reject Live Selfie
- **Method & Route**: `POST /api/admin/applications/:id/selfie-review`
- **Request Body**:
  ```json
  {
    "action": "APPROVE"  // Or "REJECT"
  }
  ```
  *(Or if REJECT)*:
  ```json
  {
    "action": "REJECT",
    "rejectionReason": "Blurry photo quality. Face features not clear."
  }
  ```
- **Response (200 OK)**: Updates `currentStage` to `SELFIE_APPROVED` or `SELFIE_REJECTED`. Creates entry in `AuditLog`.

### 8.4 Confirm Disbursement
- **Method & Route**: `POST /api/admin/applications/:id/disburse`
- **Request Body**: `{ "notes": "Approved for instant disbursement." }`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Disbursement confirmed and funds transferred.",
    "data": {
      "utrNumber": "EZF-DISB-2026-987123",
      "disbursedAmount": 243600.00,
      "disbursedAt": "2026-08-19T10:20:00.000Z",
      "currentStage": "DISBURSED"
    }
  }
  ```
