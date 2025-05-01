const jwt = require('jsonwebtoken');
const User = require('../modals/User');

// Middleware to verify JWT token and check user role
const auth = (roles = []) => {
  // If roles is a string, convert it to an array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user role is authorized
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      }

      // Attach user and token to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (err) {
      console.error('Authentication error:', err.message);
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = auth;