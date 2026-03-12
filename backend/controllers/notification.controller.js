import NotificationService from '../services/notification.service.js';
import pool from '../config/db.config.js';

export const sendReminder = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const result = await NotificationService.sendDueReminder(userId, amount);
        
        if (result) {
            res.json({ message: 'Reminder sent successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send reminder' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendBulkReminders = async (req, res) => {
    try {
        await NotificationService.scheduleDueReminders();
        res.json({ message: 'Bulk reminders sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getNotifications = async (req, res) => {
    try {
        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};