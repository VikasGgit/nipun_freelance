const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../modals/User");
const MedicalStore = require("../modals/MedicalStore");
const router = express.Router();
const auth = require("../middleware/auth")

// Register (Superadmin creates admins, Admins create store owners)
router.post("/register", async (req, res) => {
  const { name, email, password, role="admin", region } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    // Create user
    user = new User({ name, email, password, role, region });
    await user.save();

    // If registering as store owner, create store
    if (role === "store_owner") {
      const store = new MedicalStore({
        name: `${name}'s Medical Store`,
        address: "Update address",
        contact: "Update contact",
        location: { coordinates: [0, 0] }, // Default location
        ownerId: user._id,
      });
      await store.save();

      // Link store to user
      user.storeId = store._id;
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24d",
    });

    res.json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    console.log("error", err)
    res.status(500).json({ msg: "Server error" });
  }
});




// Add to your auth routes
router.get('/check', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24d",
    });

    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;