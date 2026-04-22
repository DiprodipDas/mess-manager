import pool from '../config/db.config.js';

// User Controllers
export const getAllUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE is_active = true ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const { name, phone, room_number } = req.body;
        const [result] = await pool.query(
            'INSERT INTO users (name, phone, room_number) VALUES (?, ?, ?)',
            [name, phone, room_number]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Meal Controllers
export const addMeal = async (req, res) => {
    try {
        const { user_id, meal_date, meal_type, is_guest, guest_name } = req.body;
        const [result] = await pool.query(
            'INSERT INTO meals (user_id, meal_date, meal_type, is_guest, guest_name) VALUES (?, ?, ?, ?, ?)',
            [user_id, meal_date, meal_type, is_guest || false, guest_name]
        );
        res.status(201).json({ message: 'Meal added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getDailyMeals = async (req, res) => {
    try {
        const { date } = req.params;
        const [rows] = await pool.query(
            `SELECT m.*, u.name as user_name 
             FROM meals m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.meal_date = ? 
             ORDER BY m.meal_type`,
            [date]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Expense Controllers
export const addExpense = async (req, res) => {
    try {
        const { expense_date, item_name, quantity, price, purchased_by, notes } = req.body;
        const [result] = await pool.query(
            'INSERT INTO expenses (expense_date, item_name, quantity, price, purchased_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [expense_date, item_name, quantity, price, purchased_by, notes]
        );
        res.status(201).json({ message: 'Expense added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMonthlyExpenses = async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        
        const [rows] = await pool.query(
            `SELECT e.*, u.name as purchased_by_name 
             FROM expenses e 
             JOIN users u ON e.purchased_by = u.id 
             WHERE e.expense_date BETWEEN ? AND ?
             ORDER BY e.expense_date DESC`,
            [startDate, endDate]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Payment Controllers
export const addPayment = async (req, res) => {
    try {
        const { user_id, amount, payment_date, payment_method, transaction_id, notes } = req.body;
        const [result] = await pool.query(
            'INSERT INTO payments (user_id, amount, payment_date, payment_method, transaction_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, amount, payment_date, payment_method, transaction_id, notes]
        );
        res.status(201).json({ message: 'Payment added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Calculation Controllers
export const calculateMonthlySummary = async (req, res) => {
    try {
        const { year, month } = req.params;
        const monthYear = `${year}-${month}`;

        // Get regular meals
        const [regularMeals] = await pool.query(
            `SELECT user_id, COUNT(*) as meal_count
             FROM meals 
             WHERE DATE_FORMAT(meal_date, '%Y-%m') = ?
             GROUP BY user_id`,
            [monthYear]
        );

        // Get guest meals (count these towards host's meals)
        const [guestMeals] = await pool.query(
            `SELECT host_member_id as user_id, COUNT(*) as meal_count
             FROM guest_meals 
             WHERE DATE_FORMAT(meal_date, '%Y-%m') = ?
             GROUP BY host_member_id`,
            [monthYear]
        );

        // Combine regular and guest meals
        const mealMap = new Map();
        
        // Add regular meals
        regularMeals.forEach(meal => {
            mealMap.set(meal.user_id, meal.meal_count);
        });
        
        // Add guest meals to host's count
        guestMeals.forEach(guest => {
            const currentCount = mealMap.get(guest.user_id) || 0;
            mealMap.set(guest.user_id, currentCount + guest.meal_count);
        });

        // Get all users
        const [users] = await pool.query(
            `SELECT id, name FROM users WHERE is_active = true`
        );

        // Get total expenses
        const [expenseRows] = await pool.query(
            `SELECT SUM(price) as total_expense 
             FROM expenses 
             WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?`,
            [monthYear]
        );

        const totalExpense = expenseRows[0]?.total_expense || 0;
        const totalMeals = Array.from(mealMap.values()).reduce((a, b) => a + b, 0);
        const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

        // Prepare user summaries
        const userSummaries = users.map(user => ({
            id: user.id,
            name: user.name,
            meal_count: mealMap.get(user.id) || 0,
            due: ((mealMap.get(user.id) || 0) * mealRate).toFixed(2)
        }));

        // Save to monthly_summary
        await pool.query(
            `INSERT INTO monthly_summary (month_year, total_meals, total_expense, meal_rate) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             total_meals = VALUES(total_meals),
             total_expense = VALUES(total_expense),
             meal_rate = VALUES(meal_rate)`,
            [monthYear, totalMeals, totalExpense, mealRate]
        );

        res.json({
            month: monthYear,
            totalMeals,
            totalExpense,
            mealRate: mealRate.toFixed(2),
            userSummaries
        });

    } catch (error) {
        console.error('Error calculating monthly summary:', error);
        res.status(500).json({ error: error.message });
    }
};