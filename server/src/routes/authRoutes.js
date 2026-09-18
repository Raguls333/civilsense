import express from 'express';
import { User } from '../models/index.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { realDb } from '../db/realDb.js';

const router = express.Router();

// Quick login for demo / role switching
router.post('/quick-login', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findOne({ role: role || 'Owner' });
    if (!user) {
      return res.status(404).json({ error: `User with role ${role} not found.` });
    }
    const token = generateToken(user);
    res.json({
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request Phone OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    // Fixed mock OTP for seamless testing & real SMS compatibility
    const code = '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    realDb.data.otpCodes[phone] = { code, expiresAt };
    realDb.save();

    console.log(`📱 [OTP SERVICE] OTP for ${phone} is: ${code}`);

    res.json({
      success: true,
      message: `OTP sent successfully to ${phone}. (Use test code: 123456)`,
      debugCode: code
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Phone OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, role, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required.' });
    }

    const savedOtp = realDb.data.otpCodes[phone];
    if (!savedOtp || savedOtp.code !== otp) {
      // Allow fallback default code 123456
      if (otp !== '123456') {
        return res.status(400).json({ error: 'Invalid or expired OTP code.' });
      }
    }

    let user = await User.findOne({ phone });
    if (!user) {
      // Auto-create user if first time login
      user = await User.create({
        name: name || `Contractor ${phone.slice(-4)}`,
        phone,
        role: role || 'Supervisor',
        preferredLanguage: 'en',
        projectAccess: ['proj_1']
      });
    }

    const token = generateToken(user);
    res.json({
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// Update preferred language
router.patch('/language', requireAuth, async (req, res) => {
  try {
    const { language } = req.body;
    const updated = await User.findByIdAndUpdate(req.user.id, { preferredLanguage: language });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
