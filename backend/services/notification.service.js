import nodemailer from 'nodemailer';
import pool from '../config/db.config.js';

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// SMS configuration (using Twilio example)
// const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

class NotificationService {
    static async sendDueReminder(userId, amount) {
        try {
            const [user] = await pool.query(
                'SELECT name, email, phone FROM users WHERE id = ?',
                [userId]
            );

            if (!user.length) return;

            const userData = user[0];
            
            // Send email
            await this.sendEmail({
                to: userData.email,
                subject: '⚠️ Mess Due Payment Reminder',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Hello ${userData.name}!</h2>
                        <p>This is a reminder that you have a pending due payment of <strong style="color: #e53e3e;">৳${amount}</strong> in your mess account.</p>
                        <p>Please clear your dues at the earliest convenience.</p>
                        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Due Amount:</strong> ৳${amount}</p>
                            <p style="margin: 10px 0 0;"><strong>Due Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                        <p>Thank you for your cooperation!</p>
                        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #718096; font-size: 14px;">This is an automated message from your Mess Management System.</p>
                    </div>
                `
            });

            // Send SMS (optional)
            // await this.sendSMS(userData.phone, `Reminder: You have a pending due of ৳${amount} in your mess account. Please pay at the earliest.`);

            // Log notification
            await pool.query(
                'INSERT INTO notifications (user_id, type, message, sent_at) VALUES (?, ?, ?, NOW())',
                [userId, 'due_reminder', `Due reminder sent for ৳${amount}`]
            );

            return true;
        } catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    }

    static async sendMonthlyReport(userId, reportData) {
        try {
            const [user] = await pool.query(
                'SELECT name, email FROM users WHERE id = ?',
                [userId]
            );

            if (!user.length) return;

            await this.sendEmail({
                to: user[0].email,
                subject: '📊 Your Monthly Mess Report',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Monthly Report for ${user[0].name}</h2>
                        <p>Here's your mess summary for ${reportData.month}:</p>
                        
                        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0;">Total Meals:</td>
                                    <td style="padding: 8px 0; font-weight: bold;">${reportData.totalMeals}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">Your Meals:</td>
                                    <td style="padding: 8px 0; font-weight: bold;">${reportData.userMeals}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">Amount Due:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: ${reportData.due > 0 ? '#e53e3e' : '#38a169'}">
                                        ৳${reportData.due}
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <p>Thank you for being part of our mess!</p>
                    </div>
                `
            });

            return true;
        } catch (error) {
            console.error('Monthly report error:', error);
            return false;
        }
    }

    static async sendEmail({ to, subject, html }) {
        try {
            await transporter.sendMail({
                from: `"Mess Manager" <${process.env.SMTP_FROM}>`,
                to,
                subject,
                html
            });
            return true;
        } catch (error) {
            console.error('Email error:', error);
            return false;
        }
    }

    static async sendSMS(to, message) {
        try {
            // Implement SMS sending logic here (Twilio, etc.)
            // await twilioClient.messages.create({
            //     body: message,
            //     to: to,
            //     from: process.env.TWILIO_PHONE
            // });
            return true;
        } catch (error) {
            console.error('SMS error:', error);
            return false;
        }
    }

    static async scheduleDueReminders() {
        try {
            // Get all users with dues
            const [users] = await pool.query(`
                SELECT u.id, u.name, u.email, u.phone, 
                       COALESCE(ms.due_amount, 0) as due_amount
                FROM users u
                LEFT JOIN monthly_summary ms ON u.id = ms.user_id
                WHERE ms.month_year = DATE_FORMAT(NOW(), '%Y-%m')
                AND ms.due_amount > 0
            `);

            for (const user of users) {
                await this.sendDueReminder(user.id, user.due_amount);
            }

            return true;
        } catch (error) {
            console.error('Schedule reminders error:', error);
            return false;
        }
    }
}

export default NotificationService;