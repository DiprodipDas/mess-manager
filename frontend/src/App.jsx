import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Meals from './pages/Meals';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import GuestMeals from './pages/GuestMeals';
import Notifications from './pages/Notifications';
import ExportReports from './pages/ExportReports';
import Analytics from './pages/Analytics';
import FixedBills from './pages/FixedBills';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function AppContent() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="meals" element={<Meals />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="reports" element={<Reports />} />
                <Route path="guest-meals" element={<GuestMeals />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="export" element={<ExportReports />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="fixed-bills" element={<FixedBills />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
                <ToastContainer 
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />
            </Router>
        </AuthProvider>
    );
}

export default App;