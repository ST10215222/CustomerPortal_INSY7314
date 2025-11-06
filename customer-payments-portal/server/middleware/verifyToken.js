const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'yourSuperSecretKey';

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
}

module.exports = { verifyToken };
