# EZFinanz Personal Loan Application Solution - Implementation Plan

## 1. Plan Overview & Objectives

This implementation plan details the step-by-step technical roadmap to build the complete **EZFinanz Personal Loan Application Solution**.

The solution consists of:
1. **Node.js + Express Backend**: RESTful API with MongoDB / Mongoose, JWT authentication, bcrypt password security, Multer file handling, and financial underwriting algorithms (EMI & Newton-Raphson IRR).
2. **React + Vite + Tailwind CSS Frontend**: Responsive Single Page Application (SPA) supporting both the 10-step Customer Application Journey and the Admin Verification Portal.

---

## 2. Implementation Roadmap by Component

### Phase 1: Project Setup & Environment Bootstrap

#### 1.1 Root & Directory Structure
- Initialize project root `ezfinanz-loan-system` with subdirectories `/backend` and `/frontend`.
- Create `/backend/uploads/selfies` and `/backend/uploads/documents` directories.

#### 1.2 Backend Initialization
- Initialize Node.js project (`package.json`).
- Install core production dependencies:
  - `express`, `mongoose`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`, `multer`
- Install development dependencies:
  - `nodemon`
- Configure `server.js` with Express middleware, static `/uploads` route, and error handlers.
- Create `.env` file with `PORT=5000`, `MONGO_URI`, and `JWT_SECRET`.

#### 1.3 Frontend Initialization
- Create Vite React application (`npm create vite@latest frontend -- --template react`).
- Install dependencies:
  - `react-router-dom`, `axios`, `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`
- Configure Tailwind CSS (`tailwind.config.js`) with EZFinanz Emerald Green (`#00A86B`) color palette and custom fonts.

---

### Phase 2: Backend Core Engine & API Implementation

#### 2.1 Database Models (`/backend/models`)
- `User.js`: Schema for customers & admins with email/phone OTP flags and password hashing hook.
- `LoanApplication.js`: Schema tracking 10 application steps, KYC, eligibility, loan terms, bank details, declaration, selfie, audit state.
- `AuditLog.js`: Schema for immutable event logging.

#### 2.2 Security & Upload Middleware (`/backend/middleware`)
- `authMiddleware.js`: Implement `verifyToken` JWT validation and `requireAdmin` RBAC check.
- `uploadMiddleware.js`: Implement Multer disk storage engine filtering image/jpeg, image/png, application/pdf up to 5MB.
- `errorHandler.js`: Centralized JSON error format handler.

#### 2.3 Financial Underwriting & Calculation Utilities (`/backend/utils`)
- `financialCalculators.js`:
  - `calculateEMI(principal, annualRate, tenureMonths)`: Reducing balance EMI algorithm.
  - `calculateIRR(netDisbursement, emi, tenureMonths)`: Newton-Raphson iterative solver for exact monthly & annualized IRR.
  - `evaluateEligibility(income, requestedAmount, cibilScore, existingDebts)`: DTI ratio calculator & risk tier decision engine.

#### 2.4 Controllers & Routes (`/backend/controllers` & `/backend/routes`)
- `authController.js` & `authRoutes.js`: Signup, login, mock Google OAuth, email/phone OTP simulation.
- `kycController.js` & `kycRoutes.js`: KYC data & ID document save.
- `loanController.js` & `loanRoutes.js`: Check eligibility, calculate EMI/IRR, lock selected loan terms.
- `bankController.js` & `bankRoutes.js`: Bank details submission & simulated penny drop verification.
- `applicationController.js` & `applicationRoutes.js`: Declaration agreement, selfie upload, customer status timeline lookup.
- `adminController.js` & `adminRoutes.js`: Admin dashboard application listing, full journey lookup, selfie approve/reject action, disbursement confirmation with UTR generation.

#### 2.5 Database Seeding (`/backend/utils/seedData.js`)
- Script to populate:
  - Default Admin Account (`admin@ezfinanz.com` / `Admin@123456`).
  - Sample customer applications across various stages (`UNDER_ADMIN_REVIEW`, `DISBURSED`, `SELFIE_REJECTED`) for instant evaluator testing.

---

### Phase 3: Frontend Application & UI Components

#### 3.1 Global State Contexts (`/src/context`)
- `AuthContext.jsx`: Token management, user role, login/logout handlers.
- `LoanContext.jsx`: Application stage state sync, real-time recalculations, step state persistence.

#### 3.2 Shared Layout Components (`/src/components`)
- `Navbar.jsx`: Header with logo, role badge, user profile, and logout action.
- `Stepper.jsx`: Interactive visual 10-step progress stepper highlighting current stage.
- `LoanSummaryCard.jsx`: Live dynamic card rendering EMI, charges, net disbursement, and IRR %.
- `CameraCapture.jsx`: WebRTC video element canvas for capturing live webcam selfie.
- `AdminAppViewerModal.jsx`: Admin 360-degree drawer for reviewing submitted identity, financials, bank details, and selfie.

#### 3.3 Customer Workflow Screens (`/src/pages`)
- Step 1: `Login.jsx` & `Signup.jsx` (With instant demo autofill buttons).
- Step 2: `VerifyContact.jsx` (Email & Phone OTP inputs with toast hints).
- Step 3: `KycStep.jsx` (KYC details & document dropzone).
- Step 4: `EligibilityStep.jsx` (Income/CIBIL form & eligibility result badge).
- Step 5: `EmiCustomizerStep.jsx` (Interactive loan slider, tenure selector & real-time IRR breakdown).
- Step 6: `BankDetailsStep.jsx` (Bank details & penny drop check).
- Step 7: `DeclarationStep.jsx` (Legal T&C checkbox & digital signature preview).
- Step 8: `SelfieStep.jsx` (WebRTC live camera photo capture/upload).
- Step 9: `ApplicationStatus.jsx` (Timeline tracking & status update listener).
- Step 10: `Disbursement.jsx` (Disbursement receipt & UTR reference).

#### 3.4 Admin Portal Screens (`/src/pages/admin`)
- `AdminDashboard.jsx`: Metric cards, application table, status filters, search bar, review trigger.
- Integration of `AdminAppViewerModal.jsx` for selfie approval/rejection and disbursement confirmation.

---

### Phase 4: Integration & End-to-End Verification

#### 4.1 Integration Testing
- Verify full state machine transitions from Step 1 to Step 10.
- Verify real-time financial calculations (EMI & IRR) match frontend and backend calculations identically.
- Verify file uploads (selfie & KYC docs) store correctly in static directory and render properly in Admin viewer.
- Verify Admin Selfie Rejection triggers customer flow reset back to Step 8.
- Verify Admin Disbursement generates UTR and locks application state.

---

## 3. Verification & Test Plan

| Test Scenario | Action | Expected Result |
| :--- | :--- | :--- |
| **1. Customer Registration & OTP** | Enter email/phone, verify OTPs | Stage transitions `DRAFT` -> `EMAIL_VERIFIED` -> `PHONE_VERIFIED`. |
| **2. High CIBIL Underwriting** | Income: ₹80,000, Requested: ₹3,00,000, CIBIL: 780 | Status: `ELIGIBLE`, Rate: 12.5%, Max approved: ₹8,00,000. |
| **3. Low CIBIL Underwriting** | Income: ₹30,000, Requested: ₹5,00,000, CIBIL: 580 | Status: `NOT_ELIGIBLE` with explanation. |
| **4. EMI & IRR Calculator** | Amount: ₹2,00,000, Tenure: 24M, Rate: 15% | Computes correct EMI (~₹9,697), Net Disbursement (~₹1,94,780), and IRR (~17.8%). |
| **5. Live Camera Capture** | Click "Capture Photo" on WebRTC webcam canvas | Photo captured, uploaded via Multer, stage becomes `UNDER_ADMIN_REVIEW`. |
| **6. Admin Selfie Rejection** | Admin selects "Reject Selfie" with reason "Blurry" | Customer timeline shows rejection banner, routes back to camera capture. |
| **7. Admin Selfie Approval & Disbursement** | Admin approves selfie and clicks "Confirm Disbursement" | Generates UTR, transitions application to `DISBURSED`, displays final receipt to customer. |
