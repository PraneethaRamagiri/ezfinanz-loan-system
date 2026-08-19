const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const kycRoutes = require('./routes/kycRoutes');
const loanRoutes = require('./routes/loanRoutes');
const bankRoutes = require('./routes/bankRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Ensure upload directories exist on server filesystem
const uploadsDir = path.join(__dirname, 'uploads');
const selfiesDir = path.join(uploadsDir, 'selfies');
const docsDir = path.join(uploadsDir, 'documents');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(selfiesDir)) fs.mkdirSync(selfiesDir, { recursive: true });
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

// CORS Middleware Configuration
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  'https://ezfinanz-loan-portal.vercel.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded files via absolute filesystem path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'EZFinanz Loan System API',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Express Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 EZFinanz API Server running on port ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}).catch((err) => {
  console.error('[Server Error] Failed to initialize backend server:', err.message);
  process.exit(1);
});
