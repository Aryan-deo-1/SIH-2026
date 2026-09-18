import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (err) {
    // Ignore invalid token on optional auth
  }
  next();
}

export function requireAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Authentication token required' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired authentication token' } });
  }
}
