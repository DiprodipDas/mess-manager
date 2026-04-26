import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import messRoutes from './routes/mess.routes.js';
import authRoutes from './routes/auth.routes.js';
import exportRoutes from './routes/export.routes.js';
import analyticsRoutes from './routes/analytics.routes.js'; 
import guestMealRoutes from './routes/guestMeal.routes.js';
import fixedBillRoutes from './routes/fixedBill.routes.js';
import memberExpenseRoutes from './routes/memberExpense.routes.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', messRoutes);
app.use('/api/auth', authRoutes);  
app.use('/api/export', exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/guest-meals', guestMealRoutes);
app.use('/api/fixed-bills', fixedBillRoutes);
app.use('/api/member-expenses', memberExpenseRoutes);


// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Only listen when not on Vercel (Vercel handles the server)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;