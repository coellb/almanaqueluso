import rateLimit from "express-rate-limit";

// Auth endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: "Demasiadas tentativas. Por favor tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Demasiados pedidos. Por favor tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});
