const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Only allowed when no user exists yet (first-time setup).
const register = async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(403).json({ success: false, message: 'Registration is disabled. An account already exists.' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.create({ username, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: { id: user._id, username: user.username },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      data: { id: user._id, username: user.username },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { id: user._id, username: user.username } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me };
