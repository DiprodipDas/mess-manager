import express from 'express';
import {
    getAllUsers,
    createUser,
    addMeal,
    getDailyMeals,
    addExpense,
    getMonthlyExpenses,
    addPayment,
    calculateMonthlySummary
} from '../controllers/mess.controller.js';

const router = express.Router();

// User routes
router.get('/users', getAllUsers);
router.post('/users', createUser);

// Meal routes
router.post('/meals', addMeal);
router.get('/meals/daily/:date', getDailyMeals);

// Expense routes
router.post('/expenses', addExpense);
router.get('/expenses/monthly/:year/:month', getMonthlyExpenses);

// Payment routes
router.post('/payments', addPayment);

// Calculation routes
router.get('/calculate/:year/:month', calculateMonthlySummary);

export default router;