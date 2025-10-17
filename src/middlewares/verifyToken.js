import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const accessToken = authHeader?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ err: 1, msg: 'Missing access token' });
    }

    const secret = process.env.SECRET_KEY || process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT secret not set (process.env.SECRET_KEY or JWT_SECRET)');
      return res.status(500).json({ err: 1, msg: 'Server misconfiguration' });
    }

    jwt.verify(accessToken, secret, (err, payload) => {
      if (err) {
        return res.status(401).json({ err: 1, msg: 'Access token invalid or expired' });
      }

      // Expect payload contains at least user id and optionally role
      // Normalize req.user to an object with id and role to be used consistently
      req.user = {
        id: payload.id || payload.userId || payload.sub,
        role: payload.role || payload.userRole || null,
        raw: payload
      };

      if (!req.user.id) {
        return res.status(401).json({ err: 1, msg: 'Token does not contain user id' });
      }

      next();
    });
  } catch (e) {
    console.error('verifyToken error', e);
    return res.status(500).json({ err: 1, msg: 'Authentication error' });
  }
};

export default verifyToken;