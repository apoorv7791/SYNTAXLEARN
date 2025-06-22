// Simple pass-through middleware - no authentication required
import jwt from 'jsonwebtoken';

export default function(req, res, next) {
  next();
}
