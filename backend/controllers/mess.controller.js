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
        
        // Calculate total meals
        const [mealRows] = await pool.query(
            `SELECT COUNT(*) as total_meals 
             FROM meals 
             WHERE DATE_FORMAT(meal_date, '%Y-%m') = ?`,
            [monthYear]
        );
        
        // Calculate total expenses
        const [expenseRows] = await pool.query(
            `SELECT SUM(price) as total_expense 
             FROM expenses 
             WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?`,
            [monthYear]
        );
        
        const totalMeals = mealRows[0].total_meals || 0;
        const totalExpense = expenseRows[0].total_expense || 0;
        const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;
        
        // Save or update summary
        await pool.query(
            `INSERT INTO monthly_summary (month_year, total_meals, total_expense, meal_rate) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             total_meals = VALUES(total_meals),
             total_expense = VALUES(total_expense),
             meal_rate = VALUES(meal_rate)`,
            [monthYear, totalMeals, totalExpense, mealRate]
        );
        
        // Calculate individual user summaries
        const [userMeals] = await pool.query(
            `SELECT u.id, u.name, COUNT(m.id) as meal_count
             FROM users u
             LEFT JOIN meals m ON u.id = m.user_id AND DATE_FORMAT(m.meal_date, '%Y-%m') = ?
             WHERE u.is_active = true
             GROUP BY u.id, u.name`,
            [monthYear]
        );
        
        const summary = {
            month: monthYear,
            totalMeals,
            totalExpense,
            mealRate: mealRate.toFixed(2),
            userSummaries: userMeals.map(user => ({
                ...user,
                due: (user.meal_count * mealRate).toFixed(2)
            }))
        };
        
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};