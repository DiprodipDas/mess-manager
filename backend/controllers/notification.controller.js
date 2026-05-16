import NotificationService from '../services/notification.service.js';
import pool from '../config/db.config.js';
import webpush from 'web-push';


// VAPID setup
webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

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

//below all for push notification

// to save subscription info in database
export const subscribe = async (req, res) => {
    try {
        // ✅ Handle both direct subscription object and wrapped format
        let subscription;
        if (req.body.subscription) {
            subscription = req.body.subscription;
        } else {
            subscription = JSON.stringify(req.body);
        }
        
        const userId = req.user.id;
        
        console.log('📝 Saving subscription for user:', userId);
        console.log('Subscription preview:', subscription.substring(0, 100));
        
        await pool.query(
            `INSERT INTO push_subscriptions (user_id, subscription) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE subscription = ?`,
            [userId, subscription, subscription]
        );
        
        console.log('✅ Subscription saved successfully');
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: error.message });
    }
};


// Function to send notification to all subscribed users
export const sendPushNotificationToAll = async (title, body, url = '/') => {
    try {
        const [subscriptions] = await pool.query(
            'SELECT subscription FROM push_subscriptions'
        );
        
        console.log(`📊 Subscriptions found: ${subscriptions.length}`);
        
        if (subscriptions.length === 0) {
            return [];
        }
        
        const payload = JSON.stringify({ title, body, url });
        const results = [];
        
        for (const sub of subscriptions) {
            try {
                // ✅ Parse the stored JSON string
                let subscription;
                if (typeof sub.subscription === 'string') {
                    subscription = JSON.parse(sub.subscription);
                } else {
                    subscription = sub.subscription;
                }
                
                console.log('📤 Sending to:', subscription.endpoint?.substring(0, 60));
                await webpush.sendNotification(subscription, payload);
                results.push({ success: true });
                console.log('✅ Sent successfully');
            } catch (err) {
                console.error('❌ Push failed:', err.message);
                results.push({ success: false, error: err.message });
            }
        }
        
        console.log(`📈 Success: ${results.filter(r => r.success).length}/${subscriptions.length}`);
        return results;
        
    } catch (error) {
        console.error('Bulk send error:', error);
        return [];
    }
};

// Meal confirmation reminder function (replaces previous email function)
export const sendMealReminderPush = async (req, res) => {
    try {
        const { meal_type, date } = req.body;
        console.log(`📨 Send reminder for ${meal_type} on ${date}`);
        
        const [members] = await pool.query(
            'SELECT id, name FROM users WHERE is_active = true'
        );
        console.log(`👥 Total members: ${members.length}`);
        
        // Create pending entries for all members
        for (const member of members) {
            await pool.query(
                `INSERT INTO meal_confirmations (user_id, confirmation_date, meal_type, status) 
                 VALUES (?, ?, ?, 'pending')
                 ON DUPLICATE KEY UPDATE status = 'pending', responded_at = NULL`,
                [member.id, date, meal_type]
            );
        }
        
        const title = `🍽️ Meal Confirmation - ${meal_type}`;
        const body = `Please confirm your ${meal_type} for ${date}. Tap to respond.`;
        const url = `/direct-confirmation?type=${meal_type}&date=${date}`;
        
        console.log('📤 Sending push notifications...');
        const payload = { title, body, url, meal_type, date };
        const results = await sendPushNotificationToAllWithPayload(payload);
        
        console.log(`✅ Done. Success: ${results.filter(r => r.success).length}/${results.length}`);
        
        res.json({ 
            message: 'Push reminders sent successfully',
            successCount: results.filter(r => r.success).length,
            totalCount: results.length
        });
        
    } catch (error) {
        console.error('Push reminder error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Meal confirmation
export const getMealConfirmations = async (req, res) => {
    try {
        const { date, meal_type } = req.query;
        
        const [confirmations] = await pool.query(
            `SELECT mc.*, u.name 
             FROM meal_confirmations mc
             JOIN users u ON mc.user_id = u.id
             WHERE mc.confirmation_date = ? AND mc.meal_type = ?
             ORDER BY u.name`,
            [date, meal_type]
        );
        
        const summary = {
            total: confirmations.length,
            yes: confirmations.filter(c => c.status === 'yes').length,
            no: confirmations.filter(c => c.status === 'no').length,
            pending: confirmations.filter(c => c.status === 'pending').length,
            members: confirmations
        };
        
        res.json(summary);
    } catch (error) {
        console.error('Error getting meal confirmations:', error);
        res.status(500).json({ error: error.message });
    }
};

// Direct confirmation from notification
export const directConfirmation = async (req, res) => {
    try {
        const { status, meal_type, confirmation_date } = req.body;
        const userId = req.user.id;
        
        console.log(`📝 Direct confirmation: User ${userId} - ${status} for ${meal_type} on ${confirmation_date}`);
        
        const [result] = await pool.query(
            `UPDATE meal_confirmations 
             SET status = ?, responded_at = NOW() 
             WHERE user_id = ? AND confirmation_date = ? AND meal_type = ?`,
            [status, userId, confirmation_date, meal_type]
        );
        
        if (result.affectedRows === 0) {
            // If no pending entry exists, create one
            await pool.query(
                `INSERT INTO meal_confirmations (user_id, confirmation_date, meal_type, status, responded_at) 
                 VALUES (?, ?, ?, ?, NOW())`,
                [userId, confirmation_date, meal_type, status]
            );
        }
        
        res.json({ message: 'Confirmation saved successfully', status });
        
    } catch (error) {
        console.error('Direct confirmation error:', error);
        res.status(500).json({ error: error.message });
    }
};


// Add this function to your notification.controller.js
export const sendPushNotificationToAllWithPayload = async (payload) => {
    try {
        const [subscriptions] = await pool.query(
            'SELECT subscription FROM push_subscriptions'
        );
        
        console.log(`📊 Subscriptions found: ${subscriptions.length}`);
        
        if (subscriptions.length === 0) {
            return [];
        }
        
        const payloadString = JSON.stringify(payload);
        const results = [];
        
        for (const sub of subscriptions) {
            try {
                let subscription;
                if (typeof sub.subscription === 'string') {
                    subscription = JSON.parse(sub.subscription);
                } else {
                    subscription = sub.subscription;
                }
                
                await webpush.sendNotification(subscription, payloadString);
                results.push({ success: true });
                console.log('✅ Push sent successfully');
            } catch (err) {
                console.error('❌ Push failed:', err.message);
                results.push({ success: false, error: err.message });
            }
        }
        
        console.log(`📈 Success: ${results.filter(r => r.success).length}/${subscriptions.length}`);
        return results;
        
    } catch (error) {
        console.error('Bulk send error:', error);
        return [];
    }
};