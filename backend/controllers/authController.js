const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoanApplication = require('../models/LoanApplication');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'ezfinanz_super_secret_jwt_key_2026_production_grade',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Signup
exports.signup = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Please provide full name, email, phone, and password.' }
      });
    }

    const cleanName = fullName.trim();
    const nameRegex = /^[a-zA-Z\s.-]{2,50}$/;
    if (!nameRegex.test(cleanName)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Full name must contain only letters and spaces (e.g. Rajesh Kumar). Numbers are not allowed.' }
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.replace(/\s+/g, '').trim();

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210).' }
      });
    }

    const existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this email or phone already exists.' }
      });
    }

    const userRole = role === 'admin' ? 'admin' : 'customer';
    const user = await User.create({
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password,
      role: userRole
    });

    let application = null;
    if (userRole === 'customer') {
      application = await LoanApplication.create({
        applicationNumber: `EZF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        user: user._id,
        currentStage: 'DRAFT'
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        },
        application: application ? {
          id: application._id,
          applicationNumber: application.applicationNumber,
          currentStage: application.currentStage
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login (Supports Email OR Phone Number Login)
exports.login = async (req, res, next) => {
  try {
    const { email, identifier, password } = req.body;
    const rawIdentifier = (email || identifier || '').trim();

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Please provide email or phone number and password.' }
      });
    }

    const isEmail = rawIdentifier.includes('@');
    let normalizedIdentifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace(/\s+/g, '');
    if (!isEmail) {
      normalizedIdentifier = normalizedIdentifier.replace(/[^0-9]/g, '');
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phone: normalizedIdentifier }
      ]
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password.' }
      });
    }

    const token = generateToken(user._id, user.role);
    let application = null;
    if (user.role === 'customer') {
      application = await LoanApplication.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        },
        application: application ? {
          id: application._id,
          applicationNumber: application.applicationNumber,
          currentStage: application.currentStage
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// Simulated Google OAuth Login
exports.googleLoginMock = async (req, res, next) => {
  try {
    const { email, fullName, googleId, createFresh } = req.body;
    const userEmail = email || `google.demo.${Date.now()}@ezfinanz.com`;

    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await User.create({
        fullName: fullName || 'Google Social Demo',
        email: userEmail,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        googleId: googleId || `google_${Date.now()}`,
        role: 'customer',
        isEmailVerified: true
      });
    }

    let application = await LoanApplication.findOne({ user: user._id });
    if (!application || createFresh) {
      if (application && createFresh) {
        application.currentStage = 'EMAIL_VERIFIED';
        await application.save();
      } else {
        application = await LoanApplication.create({
          applicationNumber: `EZF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          user: user._id,
          currentStage: 'EMAIL_VERIFIED'
        });
      }
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Google login successful (Simulated).',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        },
        application: application ? {
          id: application._id,
          applicationNumber: application.applicationNumber,
          currentStage: application.currentStage
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// Send Email OTP
exports.sendEmailOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const mockOtp = '123456';
    user.emailOtp = { code: mockOtp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent to your registered email.',
      data: { simulatedOtp: mockOtp }
    });
  } catch (err) {
    next(err);
  }
};

// Verify Email OTP
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (otp !== '123456' && (!user.emailOtp || user.emailOtp.code !== otp)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid OTP code. For demo mode, enter 123456.' }
      });
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    await user.save();

    const application = await LoanApplication.findOne({ user: user._id });
    if (application && application.currentStage === 'DRAFT') {
      application.currentStage = 'EMAIL_VERIFIED';
      await application.save();
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        isEmailVerified: true,
        currentStage: application ? application.currentStage : 'EMAIL_VERIFIED'
      }
    });
  } catch (err) {
    next(err);
  }
};

// Send Phone OTP
exports.sendPhoneOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const mockOtp = '654321';
    user.phoneOtp = { code: mockOtp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent to your mobile number.',
      data: { simulatedOtp: mockOtp }
    });
  } catch (err) {
    next(err);
  }
};

// Verify Phone OTP
exports.verifyPhoneOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (otp !== '654321' && (!user.phoneOtp || user.phoneOtp.code !== otp)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid OTP code. For demo mode, enter 654321.' }
      });
    }

    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    await user.save();

    const application = await LoanApplication.findOne({ user: user._id });
    if (application && (application.currentStage === 'EMAIL_VERIFIED' || application.currentStage === 'DRAFT')) {
      application.currentStage = 'PHONE_VERIFIED';
      await application.save();
    }

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully.',
      data: {
        isPhoneVerified: true,
        currentStage: application ? application.currentStage : 'PHONE_VERIFIED'
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get Me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const application = await LoanApplication.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      data: {
        user,
        application
      }
    });
  } catch (err) {
    next(err);
  }
};
