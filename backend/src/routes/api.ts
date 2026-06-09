import { Router, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  register,
  login,
  getMe,
  createInquiry,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
  chatAssistant,
  logEvent,
  getAnalytics
} from '../controllers/apiControllers';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kremlin_studios_super_secret_ai_9988';

// JWT authentication middleware
export const authenticateToken = (req: any, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user;
    next();
  });
};

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getMe);

// Guest Inquiries routes
router.post('/inquiries', createInquiry);
router.get('/inquiries', authenticateToken, getInquiries);
router.put('/inquiries/:id/status', authenticateToken, updateInquiryStatus);
router.delete('/inquiries/:id', authenticateToken, deleteInquiry);

// AI Concierge Chat route
router.post('/chat', chatAssistant);

// Analytics routes
router.post('/analytics/log', logEvent);
router.get('/analytics', authenticateToken, getAnalytics);

export default router;
