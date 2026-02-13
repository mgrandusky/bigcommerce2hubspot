const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../../config');
const { db } = require('../../database');
const logger = require('../../utils/logger');

/**
 * Middleware to verify JWT token
 */
async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.admin.jwtSecret);
    
    // Get user from database
    const database = await require('../../database').initializeDatabase();
    const User = database.models.User;
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware to check if user has admin role
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
  return jwt.sign(
    { userId },
    config.admin.jwtSecret,
    { expiresIn: config.admin.jwtExpiresIn }
  );
}

/**
 * Hash password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  authMiddleware,
  requireAdmin,
  generateToken,
  hashPassword,
  comparePassword,
};
