import rateLimit from 'express-rate-limit';

// simple rate limiter for public endpoints
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max requests per IP per window
  message: { err: 1, msg: 'Too many requests, please try again later.' }
});

export default { public: publicLimiter };