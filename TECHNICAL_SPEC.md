# EZFinanz Personal Loan Application Solution - Technical Specification

## 1. Tech Stack Overview

| Layer | Technology | Version / Libraries | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + Vite | React 18.3, Vite 5.x | High-performance SPA with fast HMR |
| **Styling & UI** | Tailwind CSS | Tailwind v3.4, Lucide-React Icons | Utility-first responsive design system |
| **State & Routing** | React Router & Context | React Router v6 | Client-side routing, auth context, step guards |
| **Backend Runtime** | Node.js | Node.js v18+ | Event-driven backend API engine |
| **API Framework** | Express.js | Express v4.19 | REST API endpoints, middleware architecture |
| **Database** | MongoDB | MongoDB v6+ / Mongoose 8.x | Document database for flexible loan schemas |
| **Authentication** | JWT & Bcrypt | `jsonwebtoken`, `bcryptjs` | Bearer token auth, password hashing (10 rounds) |
| **File Handling** | Multer | `multer` | Disk storage for selfie photos & KYC documents |

---

## 2. Project Directory Structure

```
ezfinanz-loan-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Mongoose connection setup
│   ├── controllers/
│   │   ├── authController.js     # Auth, signup, login, OTP simulation
│   │   ├── kycController.js      # KYC details submission & document upload
│   │   ├── loanController.js     # Eligibility engine, EMI, IRR, loan customization
│   │   ├── bankController.js     # Bank account details & penny drop simulation
│   │   ├── adminController.js    # Admin dashboard, selfie approval, disbursement
│   │   └── applicationController.js # App state retrieval & progress tracking
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & RBAC check (verifyToken, requireAdmin)
│   │   ├── uploadMiddleware.js   # Multer file filter & disk storage engine
│   │   └── errorHandler.js       # Centralized JSON error middleware
│   ├── models/
│   │   ├── User.js               # Customer & Admin user schema
│   │   ├── LoanApplication.js    # Central loan application schema
│   │   └── AuditLog.js           # Admin actions & stage transition history
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── kycRoutes.js          # /api/kyc
│   │   ├── loanRoutes.js         # /api/loan
│   │   ├── bankRoutes.js         # /api/bank
│   │   ├── adminRoutes.js        # /api/admin
│   │   └── applicationRoutes.js # /api/application
│   ├── utils/
│   │   ├── financialCalculators.js # EMI & Newton-Raphson IRR algorithms
│   │   └── seedData.js           # Test data generator (sample customers & admin)
│   ├── uploads/                  # Uploaded files directory (selfies/docs)
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express application entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── Navbar.jsx        # Top header with role indicator & user info
    │   │   ├── Stepper.jsx       # 10-step progress stepper
    │   │   ├── CameraCapture.jsx # WebRTC live webcam capture canvas
    │   │   ├── LoanSummaryCard.jsx # Dynamic EMI & IRR calculation card
    │   │   ├── AdminAppViewerModal.jsx # Admin 360-degree application drawer
    │   │   └── ProtectedRoute.jsx  # Auth & step-guard routing wrapper
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Global User Auth state & token storage
    │   │   └── LoanContext.jsx   # Current Loan Application state sync
    │   ├── pages/
    │   │   ├── Login.jsx         # Login page with tab switch
    │   │   ├── Signup.jsx        # Customer signup
    │   │   ├── VerifyContact.jsx # Email & Phone OTP verification
    │   │   ├── KycStep.jsx       # KYC form & document upload
    │   │   ├── EligibilityStep.jsx # Financial inputs & eligibility check
    │   │   ├── EmiCustomizerStep.jsx # EMI slider & term lock
    │   │   ├── BankDetailsStep.jsx # Bank account & IFSC check
    │   │   ├── DeclarationStep.jsx # T&C checkbox & consent
    │   │   ├── SelfieStep.jsx    # WebRTC live selfie capture
    │   │   ├── ApplicationStatus.jsx # Timeline status tracking
    │   │   ├── Disbursement.jsx  # Final receipt & loan summary
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx # Admin applications grid
    │   │       └── AdminReview.jsx   # Application review screen
    │   ├── services/
    │   │   ├── api.js            # Axios instance with auth headers
    │   │   ├── authService.js    # Auth API wrappers
    │   │   └── loanService.js    # Loan API wrappers
    │   ├── App.jsx               # Routes setup
    │   ├── main.jsx              # Vite React entry point
    │   └── index.css             # Tailwind directive imports
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 3. Financial Calculation Algorithms & Mathematical Implementation

### 3.1 EMI Engine (`backend/utils/financialCalculators.js`)

```javascript
/**
 * Calculates Reducing Balance Monthly EMI
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (e.g. 15 for 15%)
 * @param {number} tenureMonths - Tenure in months (6, 12, 18, 24, 36)
 * @returns {number} Monthly EMI rounded to 2 decimals
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  if (!annualRate || annualRate <= 0) return Math.round(principal / tenureMonths);
  const r = (annualRate / 12) / 100;
  const emi = principal * r * (Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}
```

### 3.2 Newton-Raphson Internal Rate of Return (IRR) Implementation

```javascript
/**
 * Calculates exact IRR (Internal Rate of Return) for loan with net disbursement outflow
 * @param {number} netDisbursement - Net cash received by customer at t=0
 * @param {number} emi - Monthly EMI payment
 * @param {number} tenureMonths - Total repayment months
 * @returns {{ monthlyIRR: number, annualNominalIRR: number, annualEffectiveIRR: number }}
 */
function calculateIRR(netDisbursement, emi, tenureMonths) {
  const C0 = -Math.abs(netDisbursement);
  let m = 0.015; // Initial guess: 1.5% per month
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

  const monthlyIRR = m * 100;
  const annualNominalIRR = m * 12 * 100;
  const annualEffectiveIRR = (Math.pow(1 + m, 12) - 1) * 100;

  return {
    monthlyIRR: Number(monthlyIRR.toFixed(2)),
    annualNominalIRR: Number(annualNominalIRR.toFixed(2)),
    annualEffectiveIRR: Number(annualEffectiveIRR.toFixed(2))
  };
}
```

---

## 4. File Upload & Storage Architecture

1. **Multer Configuration (`backend/middleware/uploadMiddleware.js`)**:
   - Destination: `backend/uploads/` (sub-folders: `uploads/selfies/` and `uploads/documents/`).
   - Allowed Types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
   - Filename convention: `${applicationId}_${fieldType}_${Date.now()}.${ext}`.
   - Max file size: 5 MB (`5 * 1024 * 1024` bytes).
2. **Static File Serving**:
   - Express static middleware exposes `/uploads` route secured or publicly readable for dashboard previews:
     `app.use('/uploads', express.static(path.join(__dirname, 'uploads')));`

---

## 5. Security & Authentication Design

1. **Authentication Flow**:
   - User credentials checked against bcrypt hash.
   - JWT signed with `JWT_SECRET`, payload containing `{ userId, role, email }`.
   - Client sends token in `Authorization: Bearer <token>` header.
2. **Role-Based Authorization Middleware (`verifyToken` & `requireAdmin`)**:
   - `verifyToken`: Extracts Bearer token, verifies signature, attaches `req.user`.
   - `requireAdmin`: Checks `req.user.role === 'admin'`. Returns HTTP 403 Forbidden if not admin.
3. **Data Protection**:
   - Sensitive financial fields (Bank Account Numbers) masked in log outputs.
   - Password fields explicitly omitted (`select('-password')`) in Mongoose queries.

---

## 6. Error Handling Strategy

Standardized JSON Error Payload Format across all endpoints:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STEP_TRANSITION",
    "message": "Cannot submit bank details before selecting loan terms.",
    "details": null
  }
}
```

### Key Error Codes
- `UNAUTHORIZED` (401): Missing or expired JWT token.
- `FORBIDDEN` (403): User lacks admin privileges.
- `INVALID_STEP` (400): Application state out of sync with requested step.
- `ELIGIBILITY_FAILED` (400): Financial criteria fall below minimum requirements.
- `UPLOAD_ERROR` (400): Invalid file format or file size exceeded.
- `NOT_FOUND` (404): Application ID or record does not exist.
