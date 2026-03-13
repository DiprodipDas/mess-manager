import React, { useState, useEffect } from 'react';
import { Bell, Mail, Phone, CheckCircle, AlertCircle, Clock, Trash2, Send, Users } from 'lucide-react';
import { notificationService, userService } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSendForm, setShowSendForm] = useState(false);
    const { isAdmin } = useAuth();
    const [formData, setFormData] = useState({
        userId: 'all',
        amount: '',
        message: ''
    });

    useEffect(() => {
        loadNotifications();
        loadUsers();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await notificationService.getAll();
            setNotifications(response.data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await userService.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleSendReminder = async (e) => {
        e.preventDefault();
        try {
            if (formData.userId === 'all') {
                await notificationService.sendBulkReminders();
                toast.success('Bulk reminders sent successfully');
            } else {
                await notificationService.sendReminder(formData.userId, formData.amount);
                toast.success('Reminder sent successfully');
            }
            setShowSendForm(false);
            setFormData({ userId: 'all', amount: '', message: '' });
            loadNotifications();
        } catch (error) {
            toast.error('Failed to send reminder');
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'due_reminder':
                return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'monthly_report':
                return <Mail className="w-5 h-5 text-blue-500" />;
            case 'sms':
                return <Phone className="w-5 h-5 text-green-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Notifications
                    </h1>
                    <p className="text-gray-500 mt-1">Manage reminders and alerts</p>
                </div>
                
                {isAdmin && (
                    <button
                        onClick={() => setShowSendForm(!showSendForm)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                    >
                        <Send className="w-5 h-5" />
                        <span>Send Reminder</span>
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total</p>
                            <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Unread</p>
                            <p className="text-2xl font-bold text-amber-600">{unreadCount}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Email</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {notifications.filter(n => n.type === 'monthly_report').length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">SMS</p>
                            <p className="text-2xl font-bold text-green-600">
                                {notifications.filter(n => n.type === 'sms').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl">
                            <Phone className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Reminder Form */}
            {showSendForm && isAdmin && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-4">Send Due Reminder</h2>
                    <form onSubmit={handleSendReminder} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.userId}
                                onChange={(e) => setFormData({...formData, userId: e.target.value})}
                            >
                                <option value="all">All Members with Dues</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        {formData.userId !== 'all' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Due Amount (৳)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Message (Optional)</label>
                            <textarea
                                rows="2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowSendForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
                            >
                                Send Reminder
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notifications List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">Notification History</h2>
                </div>
                
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div 
                                    key={notification.id} 
                                    className={`p-6 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className={`p-2 rounded-lg ${!notification.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">
                                                        {notification.type?.replace('_', ' ').toUpperCase()}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{notification.message}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-4 mt-3">
                                                <div className="flex items-center text-xs text-gray-400">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {getTimeAgo(notification.sent_at)}
                                                </div>
                                                {notification.is_read ? (
                                                    <span className="flex items-center text-xs text-green-600">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Read
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-700"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isAdmin && (
                                            <button className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No notifications yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;