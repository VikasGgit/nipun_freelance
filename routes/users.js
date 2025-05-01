const express = require('express');
const auth = require('../middleware/auth.js');
const User = require('../modals/User.js');
const router = express.Router();

// Create admin (Superadmin only)
router.post('/', auth('superadmin'), async (req, res) => {
  try {
    const { email, password, role, region } = req.body;
    const user = new User({ email, password, role, region });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all admins (Superadmin only)
router.get('/', auth('superadmin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'admin' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;