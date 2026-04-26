import express from 'express';
import { calculateMemberExpenses, getMemberExpenses } from '../controllers/memberExpense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/calculate/:year/:month', calculateMemberExpenses);
router.get('/:year/:month', getMemberExpenses);

export default router;