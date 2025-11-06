const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { verifyToken } = require('./middleware/verifyToken');
const { requireRole } = require('./middleware/requireRole');

const app = express();

// Security Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
//app.use(xss()); // GAVE LOGIN AND REGISTER BUGS SO i COMMENTED IT OUT FOR NOW
app.use(hpp());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
  }
}));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' Connected to MongoDB'))
  .catch(err => console.error(' MongoDB connection error:', err));

// Schemas
const UserSchema = new mongoose.Schema({
  fullName: String,
  idNumber: String,
  accountNumber: String,
  password: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' }
});

const TransactionSchema = new mongoose.Schema({
  userId: String,
  amount: Number,
  currency: String,
  provider: String,
  swiftCode: String,
  accountInfo: String,
  verified: { type: Boolean, default: false },
  submittedToSwift: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});


const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Registration
app.post('/api/register', async (req, res) => {
  console.log("Register payload:", req.body);
  const { fullName, idNumber, accountNumber, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ fullName, idNumber, accountNumber, password: hashedPassword });
    await user.save();
    console.log(" User registered:", user);
    res.status(201).json({ message: 'User registered securely' });
  } catch (err) {
    console.error(" Registration error:", err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
const SECRET = process.env.JWT_SECRET || 'yourSuperSecretKey';

app.post('/api/login', async (req, res) => {
  console.log("Login payload:", req.body);
  const { accountNumber, password } = req.body;
  try {
    const user = await User.findOne({ accountNumber });
    console.log("User found:", user);
    const match = await bcrypt.compare(password, user?.password || '');
    console.log("Password match:", match);

    if (!user || !match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      userId: user._id,
      role: user.role
    });
  } catch (err) {
    console.error(" Login error:", err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Payment
app.post('/api/pay', async (req, res) => {
  const { userId, amount, currency, provider, swiftCode, accountInfo } = req.body;
  try {
    const tx = new Transaction({ userId, amount, currency, provider, swiftCode, accountInfo });
    await tx.save();
    res.status(201).json({ message: 'Transaction stored securely' });
  } catch (err) {
    console.error(" Payment error:", err);
    res.status(500).json({ message: 'Transaction failed' });
  }
});

// Admin Panel
app.get('/api/admin/transactions', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (err) {
    console.error(" Admin fetch error:", err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});
// Mark transaction as verified
app.put('/api/admin/verify/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const tx = await Transaction.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
    res.json({ message: 'Transaction verified', tx });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Submit transaction to SWIFT
app.put('/api/admin/submit/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (!tx.verified) {
      return res.status(400).json({ message: 'Transaction must be verified before submission' });
    }

    tx.submittedToSwift = true;
    await tx.save();
    res.json({ message: 'Transaction submitted to SWIFT', tx });
  } catch (err) {
    res.status(500).json({ message: 'Submission failed' });
  }
});


// Start Server
app.listen(5000, () => console.log(' Server running on port 5000'));
