import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users,
    DollarSign, 
    Utensils, 
    Receipt, 
    BarChart3,
    UserPlus,
    Bell,
    FileText,
    PieChart,
    LogOut,
    Menu,
    Calculator,
    UserCircle,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Members', path: '/users', icon: Users },
    { name: 'Meals', path: '/meals', icon: Utensils },
    { name: 'Fixed Bills', path: '/fixed-bills', icon: DollarSign },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Guest Meals', path: '/guest-meals', icon: UserPlus },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Member Summary', path: '/member-summary', icon: Calculator },
    { name: 'Export', path: '/export', icon: FileText },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'Developer', path: '/developer', icon: UserCircle },
];

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const NavLink = ({ item }) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
            <Link
                to={item.path}
                className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
                    ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                `}
            >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : ''}`} />
                <span>{item.name}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform transition-transform duration-300 lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-800">Mess Manager</h1>
                                <p className="text-xs text-gray-500">v2.0</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-1">
                            {navigation.map((item) => (
                                <NavLink key={item.path} item={item} />
                            ))}
                        </div>
                    </nav>

                    {/* User info & logout */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="lg:ml-64 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;