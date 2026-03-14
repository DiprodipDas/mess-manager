import pool from '../config/db.config.js';

// Get all guest meals
export const getAllGuestMeals = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT gm.*, 
                    u.name as host_name,
                    u.id as host_id
             FROM guest_meals gm
             JOIN users u ON gm.host_member_id = u.id
             ORDER BY gm.meal_date DESC, gm.created_at DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching guest meals:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get guest meals by host
export const getGuestMealsByHost = async (req, res) => {
    try {
        const { hostId } = req.params;
        const [rows] = await pool.query(
            `SELECT * FROM guest_meals 
             WHERE host_member_id = ? 
             ORDER BY meal_date DESC`,
            [hostId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add new guest meal
export const addGuestMeal = async (req, res) => {
    try {
        const { guest_name, guest_phone, meal_type, meal_date, notes, host_member_id } = req.body;

        // Check host's guest limit for the month
        const [monthCount] = await pool.query(
            `SELECT COUNT(*) as count 
             FROM guest_meals 
             WHERE host_member_id = ? 
             AND DATE_FORMAT(meal_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')`,
            [host_member_id, meal_date]
        );

        // Get host's guest limit (default 5)
        const [userLimit] = await pool.query(
            `SELECT guest_limit FROM users WHERE id = ?`,
            [host_member_id]
        );

        const limit = userLimit[0]?.guest_limit || 5;
        
        if (monthCount[0].count >= limit) {
            return res.status(400).json({ 
                error: `Guest limit reached for this month (max ${limit} guests)` 
            });
        }

        // Insert guest meal
        const [result] = await pool.query(
            `INSERT INTO guest_meals 
             (guest_name, guest_phone, meal_type, meal_date, notes, host_member_id, is_paid) 
             VALUES (?, ?, ?, ?, ?, ?, false)`,
            [guest_name, guest_phone, meal_type, meal_date, notes, host_member_id]
        );

        // Update user's guests count for the month
        await pool.query(
            `UPDATE users SET guests_this_month = guests_this_month + 1 
             WHERE id = ?`,
            [host_member_id]
        );

        // Get the inserted guest meal with host name
        const [newGuest] = await pool.query(
            `SELECT gm.*, u.name as host_name 
             FROM guest_meals gm
             JOIN users u ON gm.host_member_id = u.id
             WHERE gm.id = ?`,
            [result.insertId]
        );

        res.status(201).json(newGuest[0]);
    } catch (error) {
        console.error('Error adding guest meal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Mark guest meal as paid
export const markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_amount } = req.body;

        // Get meal rate for the month
        const [guestMeal] = await pool.query(
            `SELECT gm.*, 
                    (SELECT meal_rate FROM monthly_summary 
                     WHERE month_year = DATE_FORMAT(gm.meal_date, '%Y-%m')) as meal_rate
             FROM guest_meals gm
             WHERE gm.id = ?`,
            [id]
        );

        if (!guestMeal.length) {
            return res.status(404).json({ error: 'Guest meal not found' });
        }

        const mealRate = guestMeal[0].meal_rate || 100; // Default rate if not set
        const amount = payment_amount || mealRate;

        await pool.query(
            `UPDATE guest_meals 
             SET is_paid = true, 
                 payment_amount = ?,
                 payment_date = CURDATE() 
             WHERE id = ?`,
            [amount, id]
        );

        res.json({ message: 'Payment recorded successfully' });
    } catch (error) {
        console.error('Error marking as paid:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete guest meal
export const deleteGuestMeal = async (req, res) => {
    try {
        const { id } = req.params;

        // Get host info before deleting
        const [guest] = await pool.query(
            `SELECT host_member_id FROM guest_meals WHERE id = ?`,
            [id]
        );

        if (guest.length) {
            // Decrement guest count
            await pool.query(
                `UPDATE users SET guests_this_month = guests_this_month - 1 
                 WHERE id = ?`,
                [guest[0].host_member_id]
            );
        }

        await pool.query('DELETE FROM guest_meals WHERE id = ?', [id]);
        res.json({ message: 'Guest meal deleted successfully' });
    } catch (error) {
        console.error('Error deleting guest meal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get guest meal statistics
export const getGuestStats = async (req, res) => {
    try {
        const [stats] = await pool.query(
            `SELECT 
                COUNT(*) as total_guests,
                SUM(CASE WHEN is_paid = true THEN 1 ELSE 0 END) as paid_guests,
                SUM(CASE WHEN is_paid = false THEN 1 ELSE 0 END) as pending_guests,
                COUNT(DISTINCT host_member_id) as active_hosts,
                SUM(CASE 
                    WHEN DATE_FORMAT(meal_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') 
                    THEN 1 ELSE 0 
                END) as this_month_guests
             FROM guest_meals`
        );
        res.json(stats[0]);
    } catch (error) {
        console.error('Error getting guest stats:', error);
        res.status(500).json({ error: error.message });
    }
};