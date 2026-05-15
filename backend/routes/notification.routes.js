import express from 'express';
import {
    subscribe,
    sendMealReminderPush,
    getMealConfirmations
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Push notification routes
router.post('/subscribe', authenticate, subscribe);
router.post('/send-meal-reminder', authenticate, sendMealReminderPush);

router.get('/meal-confirmations', authenticate, getMealConfirmations);

export default router;