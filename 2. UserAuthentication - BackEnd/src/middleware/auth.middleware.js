const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

      if (!token) 
        return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user    = await User.findById(decoded.id).select('-password -refreshToken -resetToken -verifyToken');

      if (!user)
        return res.status(401).json({ success: false, message: 'User not found' });
      
      if (!user.isActive)
        return res.status(403).json({ success: false, message: 'Account is deactivated' });

    req.user = user;
    next();
  } 
  catch (error) {
      if (error.name === 'TokenExpiredError')
        return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    
      res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = protectRoute;
