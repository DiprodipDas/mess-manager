import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import messRoutes from './routes/mess.routes.js';
import authRoutes from './routes/auth.routes.js';
import exportRoutes from './routes/export.routes.js';
import analyticsRoutes from './routes/analytics.routes.js'; 
import guestMealRoutes from './routes/guestMeal.routes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', messRoutes);
app.use('/api/auth', authRoutes);  
app.use('/api/export', exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/guest-meals', guestMealRoutes);


// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});