const User = require('../models/User'); // Adjusted for JSON-based model
const jwt = require('jsonwebtoken');

// Environment Variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure this is set in your .env

// Send OTP Controller
exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'Please enter a valid mobile number.' });
  }

  try {
    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Find or create user
    let user = await User.getUserByMobile(mobile);
    if (!user) {
      user = await User.createUser({ mobile });
    } else {
      // Update existing user
      user = await User.updateUser(user.id, { mobile });
    }

    // Update OTP and expiration
    const updatedUser = await User.updateUser(user.id, {
      otpCode,
      otpExpires: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    });

    // Simulate sending OTP via SMS
    console.log(`OTP for ${mobile} is ${otpCode}`);

    res.json({ message: 'Verification code sent.', code: otpCode }); // Include code for testing
  } catch (error) {
    console.error('Error in sendOtp:', error.message);
    res.status(500).json({ message: 'Failed to send verification code.' });
  }
};

// Check OTP Controller
exports.checkOtp = async (req, res) => {
  const { mobile, code } = req.body;
  if (!mobile || !code) {
    return res.status(400).json({ message: 'Please enter your mobile number and verification code.' });
  }

  try {
    const user = await User.getUserByMobile(mobile);
    if (!user) {
      return res.status(400).json({ message: 'No account found with this phone number.' });
    }

    if (user.otpCode !== code || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'The verification code is invalid.' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, mobile: user.mobile },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, mobile: user.mobile },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error('Error in checkOtp:', error.message);
    res.status(500).json({ message: 'Failed to verify the code.' });
  }
};

// Refresh Token Controller
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Access error. Please log in again.' });
  }

  jwt.verify(refreshToken, JWT_SECRET, (err, userData) => {
    if (err) {
      return res.status(403).json({ message: 'Access error. Please log in again.' });
    }

    const accessToken = jwt.sign(
      { id: userData.id, mobile: userData.mobile },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ accessToken });
  });
};
