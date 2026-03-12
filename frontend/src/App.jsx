import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Meals from './pages/Meals';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100">
                {/* Navigation Bar */}
                <nav className="bg-blue-600 text-white shadow-lg">
                    <div className="max-w-full mx-auto px-4">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex space-x-4">
                                <Link to="/" className="px-3 py-2 rounded hover:bg-blue-700">Dashboard</Link>
                                <Link to="/users" className="px-3 py-2 rounded hover:bg-blue-700">Users</Link>
                                <Link to="/meals" className="px-3 py-2 rounded hover:bg-blue-700">Meals</Link>
                                <Link to="/expenses" className="px-3 py-2 rounded hover:bg-blue-700">Expenses</Link>
                                <Link to="/reports" className="px-3 py-2 rounded hover:bg-blue-700">Reports</Link>
                            </div>
                            <div className="text-lg font-bold">
                                Mess Management System
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="max-w-full px-4 py-6">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/meals" element={<Meals />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/reports" element={<Reports />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;