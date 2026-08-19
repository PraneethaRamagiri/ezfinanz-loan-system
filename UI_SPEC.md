# EZFinanz Personal Loan Application Solution - UI Specification

## 1. Design System & Visual Guidelines

### 1.1 Color Palette

```
Primary Brand:         #00A86B (EZFinanz Emerald Green)
Primary Hover:         #008F5B
Secondary Dark:        #1A202C (Slate Gray)
Background Accent:     #F4F7F6 (Soft Grey-Green Tint)
Card Background:       #FFFFFF (Pure White)
Border Color:          #E2E8F0 (Neutral Light Gray)

Status Colors:
- Success / Approved:  #10B981 (Emerald 500)
- Pending / Review:    #F59E0B (Amber 500)
- Error / Rejected:    #EF4444 (Red 500)
- Info / Active:       #3B82F6 (Blue 500)
```

### 1.2 Typography
- **Primary Font**: Inter / System UI sans-serif.
- **Headings**: Semi-bold to Bold (`font-semibold`, `font-bold`), slate gray `#1A202C`.
- **Form Labels**: Medium weight (`font-medium`), `#374151`.
- **Help Text / Subtitles**: Regular weight (`font-normal`), `#6B7280`.

### 1.3 UI Component Design System
- **Buttons**: Rounded-lg (`rounded-lg`), bold text, smooth hover transitions (`transition-all duration-200`). Primary: Emerald green with white text. Secondary: Outline slate gray.
- **Form Controls**: Floating label or clear top label inputs with focus ring (`focus:ring-2 focus:ring-emerald-500 focus:border-transparent`).
- **Cards**: Minimal shadow (`shadow-sm hover:shadow-md`), white background, subtle border (`border border-gray-200`).
- **Badges**: Rounded-full pill tags with pastel background and dark text (e.g. `bg-emerald-100 text-emerald-800`).

---

## 2. Customer Workflow Screens & Components

### 2.1 Navigation & Stepper Header (`/components/CustomerHeader.jsx` & `/components/Stepper.jsx`)
- **Header**: Displays EZFinanz Logo, current customer name, application ID badge, and "Logout" button.
- **Visual Stepper**: Horizontal 10-step progress bar (collapsible to step counter on mobile):
  1. Auth -> 2. Verify -> 3. KYC -> 4. Eligibility -> 5. EMI Terms -> 6. Bank -> 7. Declaration -> 8. Selfie -> 9. Status -> 10. Disbursement

---

### 2.2 Screen 1: Sign-Up & Login Page (`/login`, `/signup`)

#### Component Architecture
- `AuthLayout.jsx`: Split-screen layout (Left: EZFinanz branding, feature highlights; Right: Auth form card).
- `LoginForm.jsx`: Tab switcher for Email/Password, Phone OTP, and Google OAuth simulation.
- `SignupForm.jsx`: Account creation form with password strength indicator.

#### UI Elements & Inputs
- Email Input (`type="email"`, required)
- Password Input (`type="password"`, required, min 8 chars)
- Mobile Number Input (`type="tel"`, 10 digits)
- Toggle to Login / Signup
- "Quick Mock Login" buttons (e.g. "Fill Test Customer", "Fill Test Admin") for instant evaluator demoing.

---

### 2.3 Screen 2: Email & Phone Verification (`/verify-contact`)

#### UI Elements
- Dual Card Section:
  - **Card A: Email Verification**: Email display, 6-digit OTP input box, "Send/Resend OTP" button, "Simulated OTP Hint: 123456" badge.
  - **Card B: Mobile Verification**: Mobile number display, 6-digit OTP input box, "Send/Resend SMS OTP" button, "Simulated OTP Hint: 654321" badge.
- Success Checkmark badges upon individual verification.
- "Continue to KYC" button (disabled until both Email and Phone are verified).

---

### 2.4 Screen 3: KYC Details Collection (`/kyc`)

#### UI Elements & Inputs
- **Personal Details Card**:
  - Full Name (Text input, pre-filled from registration)
  - Date of Birth (Date picker, auto-computes age and validates 21-60 years)
  - Gender (Select dropdown: Male, Female, Other)
- **Address Details Card**:
  - Current Address Line 1 & Line 2 (Text inputs)
  - City, State, Pincode (6 digits regex validation)
- **ID Verification Card**:
  - ID Type Selection (Radio buttons: PAN Card / Aadhaar Card)
  - ID Number Input (Validated against regex: PAN `ABCDE1234F` or Aadhaar `123456789012`)
  - ID Document Upload (Drag-and-drop file dropzone, accepts JPG/PNG/PDF up to 5MB, optional file preview thumbnail)
  - "Simulate instant ID verification" button.
- "Submit & Proceed to Eligibility" button.

---

### 2.5 Screen 4: Loan Eligibility Check (`/eligibility`)

#### UI Elements & Inputs
- **Financial Details Form**:
  - Net Monthly Income (₹ Number input with standard currency formatting)
  - Requested Loan Amount (₹ Number input)
  - CIBIL / Credit Score (Number slider 300 to 900 + "Fetch Simulated Credit Score" button)
  - Existing Monthly Debt EMIs (₹ Number input)
  - Employer Name & Designation (Text inputs)
- **Eligibility Engine Results Card** (Appears dynamically upon clicking "Check Eligibility"):
  - **Status Badge**:
    - `Eligible` (Green banner: "Congratulations! You qualify for up to ₹X,XX,XXX")
    - `Partially Eligible` (Amber banner: "You qualify for a revised max loan of ₹Y,YY,YYY")
    - `Not Eligible` (Red banner: "Based on DTI/CIBIL ratio, loan cannot be approved at present")
  - **Key Metrics Grid**:
    - Debt-to-Income (DTI) % Progress Gauge (Green if $\le 45\%$, Amber if $46-60\%$, Red if $>60\%$)
    - Credit Tier (Excellent / Good / Fair / Poor)
    - Max Approved Credit Limit (₹)
- "Proceed to EMI Customizer" button (enabled for Eligible & Partially Eligible states).

---

### 2.6 Screen 5: EMI & Loan Term Customization (`/loan-customizer`)

#### Layout
Two-column interactive calculator layout:
- **Left Column: Interactive Sliders**:
  - Loan Amount Slider (Range: ₹10,000 to Approved Max Limit, step ₹5,000)
  - Tenure Selector (Pill button group: `6 M`, `12 M`, `18 M`, `24 M`, `36 M`)
- **Right Column: Real-Time Loan Terms Breakdown Card**:
  - Selected Principal: ₹X,XX,XXX
  - Annual Interest Rate (APR): X.X%
  - Processing Fee (2%): ₹X,XXX
  - GST on Processing Fee (18%): ₹XXX
  - Documentation Charges: ₹500
  - **Net Disbursement Amount**: ₹X,XX,XXX (Highlighted in Emerald Box)
  - **Monthly EMI**: ₹X,XXX / month (Large typography)
  - Total Interest Payable: ₹X,XXX
  - Total Repayment Amount: ₹X,XX,XXX
  - **Calculated IRR (Yield)**: XX.XX% p.a. (With tooltip explaining IRR formula)
- "Lock Terms & Add Bank Account" button.

---

### 2.7 Screen 6: Add Bank Account (`/bank-details`)

#### UI Elements & Inputs
- Account Holder Name (Text input, must match KYC Name)
- Bank Account Number (Text input, masked input option)
- Confirm Account Number (Must match Account Number)
- IFSC Code (Text input with auto-lookup simulation e.g., `SBIN0001234` populates "State Bank of India")
- Bank Name (Auto-filled or dropdown)
- Account Type (Radio selector: Savings / Current)
- "Simulate Penny Drop Verification" button (Displays instant green tick: "Account verified via ₹1 test transfer").
- "Save & Proceed to Declaration" button.

---

### 2.8 Screen 7: Confirmation of Declaration (`/declaration`)

#### UI Elements
- Scrollable Terms & Conditions Box containing legal clauses:
  - Truthfulness declaration of financial data.
  - Authorization for credit score check and bank data verification.
  - Consent for auto-debit collection of monthly EMIs.
- Mandatory Checkbox: *"I have read, understood, and accept all loan terms, fee structure, and credit check authorization."*
- Timestamped Digital Signature Preview (Auto-generated from User's Full Name).
- "Confirm & Proceed to Live Selfie" button.

---

### 2.9 Screen 8: Live Selfie / Photo Verification (`/selfie-upload`)

#### UI Elements & Camera Component (`/components/CameraCapture.jsx`)
- Interactive WebRTC Live Camera Feed:
  - Video viewport with oval face outline guide overlay.
  - "Capture Photo" button triggering instantaneous frame freeze to canvas.
  - Preview Captured Photo screen with "Retake Photo" and "Use This Photo" buttons.
- Fallback Dropzone: File selector button for uploading pre-saved photo if webcam is unavailable.
- Photo Quality Warning: "Ensure good lighting, no sunglasses or hat, face clearly visible."
- "Submit Final Application for Admin Review" button (Triggers state change to `UNDER_ADMIN_REVIEW`).

---

### 2.10 Screen 9: Application Status & Timeline Tracking (`/status`)

#### UI Elements
- Hero Banner: "Application Under Review" (or "Action Required" / "Approved").
- Visual Vertical Stepper Timeline with dates and status badges:
  - [x] Account Verification Completed
  - [x] Identity KYC Verified
  - [x] Loan Eligibility Approved
  - [x] Loan Terms & EMI Selected
  - [x] Bank Account Added
  - [x] Declaration Signed
  - [x] Live Selfie Submitted
  - [ ] **Admin Verification**: Current active stage with spinning pulse ring.
- Rejection Banner (If Selfie Rejected): Displays red alert box with Admin Rejection Reason and a prominent "Re-upload Selfie" button routing back to Step 8.

---

### 2.11 Screen 10: Final Disbursement Summary Page (`/disbursement`)

#### UI Elements
- Success Celebration Hero Animation (Confetti / Emerald check icon).
- Banner: "Loan Disbursed Successfully!"
- Key Receipt Details Grid:
  - Transaction Reference / UTR Number (e.g. `EZF-DISB-2026-889412`)
  - Disbursed Amount (₹ Net Amount transferred to bank)
  - Target Bank Account (Masked Account Number & Bank Name)
  - First EMI Due Date (e.g., 5th of next month)
- Repayment Amortization Schedule Drawer/Modal button.
- "Download Loan Sanction Letter (PDF Simulation)" button.

---

## 3. Admin Workflow Screens & Components

### 3.1 Admin Dashboard (`/admin/dashboard`)

#### UI Header & Summary Metrics Bar
- Top Header: Admin Portal Title, Admin User Profile, Logout button.
- Metric Cards Grid:
  - Total Applications Count
  - Pending Review Count (Amber)
  - Approved & Disbursed Count (Emerald)
  - Total Disbursed Volume (₹ Sum)

#### Data Table & Filters
- **Filter Tabs**: `All`, `Under Review`, `Selfie Approved`, `Disbursed`, `Rejected`.
- **Search Bar**: Instant filter by Applicant Name, Email, or Application ID.
- **Table Columns**:
  1. Application ID
  2. Applicant Name
  3. Loan Amount Requested
  4. Selected Tenure & EMI
  5. CIBIL Score badge
  6. Submission Timestamp
  7. Current Stage badge (`UNDER_ADMIN_REVIEW`, `SELFIE_APPROVED`, `DISBURSED`, `REJECTED`)
  8. Action Column: Primary "Inspect Application" button.

---

### 3.2 Full Application Journey Modal (`/components/AdminAppViewerModal.jsx`)

Comprehensive tabbed/accordion drawer showing all customer submissions:

```
+-------------------------------------------------------------------------+
| Application #EZF-10049 - Rajesh Kumar               [Close X]           |
+-------------------------------------------------------------------------+
| Status: UNDER_ADMIN_REVIEW   Submitted: 19 Aug 2026 10:15 AM           |
+-------------------------------------------------------------------------+
| [1. Auth & Verify] [2. KYC & Identity] [3. Financials] [4. EMI & IRR]   |
| [5. Bank Account]  [6. Declaration]    [7. Selfie Review]              |
+-------------------------------------------------------------------------+
| TAB 7: SELFIE REVIEW                                                    |
|                                                                         |
|  +-----------------------+     Applicant Photo Details:                 |
|  |                       |     - File Name: selfie_10049.jpg            |
|  |   [ Live Selfie ]     |     - Uploaded: 19 Aug 2026 10:14 AM         |
|  |     Photo View        |     - Match Confidence (Simulated): 98.4%    |
|  |                       |     - ID Document Photo: pan_card.jpg        |
|  +-----------------------+                                              |
|                                                                         |
|  [ APPROVE SELFIE ]        [ REJECT SELFIE (WITH REASON) ]              |
|                                                                         |
|  ---------------------------------------------------------------------  |
|  DISBURSEMENT SECTION (Enabled when Selfie Approved)                    |
|  [ CONFIRM DISBURSEMENT & TRANSFER FUNDS ]                              |
+-------------------------------------------------------------------------+
```

#### Interactive Actions in Modal
1. **Approve Selfie Button**: Sets application to `SELFIE_APPROVED`. Unlocks the "Confirm Disbursement" button.
2. **Reject Selfie Button**: Opens Rejection Reason Modal.
   - Presets dropdown: "Blurry image", "Face does not match ID document", "Image truncated/poor lighting", "Custom reason".
   - Textarea for custom notes.
   - Sets application stage back to `SELFIE_REJECTED` with reason stored in audit log.
3. **Confirm Disbursement Button**:
   - Triggers final disbursement action.
   - Generates simulated UTR number and updates application status to `DISBURSED`.
