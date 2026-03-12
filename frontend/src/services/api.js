import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

export default api;