import axios from 'axios';

// Use environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// User services
export const userService = {
    getAll: () => api.get('/users'),
    create: (data) => api.post('/users', data),
};

// Meal services
export const mealService = {
    add: (data) => api.post('/meals', data),
    getDaily: (date) => api.get(`/meals/daily/${date}`),
};

// Expense services
export const expenseService = {
    add: (data) => api.post('/expenses', data),
    getMonthly: (year, month) => api.get(`/expenses/monthly/${year}/${month}`),
};

// Payment services
export const paymentService = {
    add: (data) => api.post('/payments', data),
};

// Calculation services
export const calculationService = {
    getMonthlySummary: (year, month) => api.get(`/calculate/${year}/${month}`),
};


// Add these to your existing api.js

export const guestMealService = {
    getAll: () => api.get('/guest-meals'),
    add: (data) => api.post('/guest-meals', data),
    markAsPaid: (id) => api.put(`/guest-meals/${id}/pay`),
};

export const notificationService = {
    getAll: () => api.get('/notifications'),
    sendReminder: (userId, amount) => api.post('/notifications/reminder', { userId, amount }),
    sendBulkReminders: () => api.post('/notifications/bulk-reminders'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export const exportService = {
    toExcel: (year, month, type) => api.get('/export/excel', { 
        params: { year, month, type },
        responseType: 'blob' 
    }),
    toPDF: (year, month) => api.get('/export/pdf', { 
        params: { year, month },
        responseType: 'blob' 
    }),
};

export const analyticsService = {
    getAnalytics: (timeframe) => api.get('/analytics', { params: { timeframe } }),
};





export default api;