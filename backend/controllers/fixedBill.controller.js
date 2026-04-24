import pool from '../config/db.config.js';

// Get all fixed bills
export const getAllFixedBills = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM fixed_bills WHERE is_active = true ORDER BY id'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching fixed bills:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a fixed bill
export const updateFixedBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { bill_amount, notes, is_active } = req.body;
        
        const [result] = await pool.query(
            'UPDATE fixed_bills SET bill_amount = ?, notes = ?, is_active = ? WHERE id = ?',
            [bill_amount, notes || null, is_active !== undefined ? is_active : true, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Bill not found' });
        }
        
        res.json({ message: 'Bill updated successfully' });
    } catch (error) {
        console.error('Error updating fixed bill:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add new fixed bill
export const addFixedBill = async (req, res) => {
    try {
        const { bill_name, bill_amount, notes } = req.body;
        
        // Check if bill already exists
        const [existing] = await pool.query(
            'SELECT id FROM fixed_bills WHERE bill_name = ?',
            [bill_name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Bill with this name already exists' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO fixed_bills (bill_name, bill_amount, notes) VALUES (?, ?, ?)',
            [bill_name, bill_amount, notes || null]
        );
        
        res.status(201).json({ 
            message: 'Bill added successfully', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error adding fixed bill:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete fixed bill
export const deleteFixedBill = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query(
            'DELETE FROM fixed_bills WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Bill not found' });
        }
        
        res.json({ message: 'Bill deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get total fixed bills for current month
export const getMonthlyFixedTotal = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT SUM(bill_amount) as total FROM fixed_bills WHERE is_active = true'
        );
        
        // Store in monthly summary
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        await pool.query(
            `INSERT INTO monthly_fixed_summary (month_year, total_fixed_bills) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE 
             total_fixed_bills = VALUES(total_fixed_bills)`,
            [currentMonth, rows[0]?.total || 0]
        );
        
        res.json({ 
            total: rows[0]?.total || 0,
            month: currentMonth
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};