import express from 'express';
import {
    getAllFixedBills,
    updateFixedBill,
    addFixedBill,
    deleteFixedBill,
    getMonthlyFixedTotal
} from '../controllers/fixedBill.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllFixedBills);
router.put('/:id', updateFixedBill);
router.post('/', addFixedBill);
router.delete('/:id', deleteFixedBill);
router.get('/monthly-total', getMonthlyFixedTotal);

export default router;