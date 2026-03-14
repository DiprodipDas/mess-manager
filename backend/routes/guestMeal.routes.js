import express from 'express';
import {
    getAllGuestMeals,
    getGuestMealsByHost,
    addGuestMeal,
    markAsPaid,
    deleteGuestMeal,
    getGuestStats
} from '../controllers/guestMeal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllGuestMeals);
router.get('/stats', getGuestStats);
router.get('/host/:hostId', getGuestMealsByHost);
router.post('/', addGuestMeal);
router.put('/:id/pay', markAsPaid);
router.delete('/:id', deleteGuestMeal);

export default router;