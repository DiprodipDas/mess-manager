import React, { useState, useEffect } from 'react';
import { mealService, userService } from '../services/api';
import { 
  Calendar, 
  Users, 
  Coffee, 
  Utensils, 
  Moon, 
  Plus, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Meals = () => {
    const [users, setUsers] = useState([]);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [formData, setFormData] = useState({
        user_id: '',
        meal_type: 'lunch'
        // Removed: is_guest and guest_name
    });

    useEffect(() => {
        loadUsers();
        loadMeals();
    }, [selectedDate]);

    const loadUsers = async () => {
        try {
            const response = await userService.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadMeals = async () => {
        setLoading(true);
        try {
            const response = await mealService.getDaily(selectedDate);
            setMeals(response.data);
        } catch (error) {
            console.error('Error loading meals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.user_id) {
            // Optionally show a toast message
            return;
        }
        
        try {
            await mealService.add({
                user_id: formData.user_id,
                meal_type: formData.meal_type,
                meal_date: selectedDate,
                is_guest: false,        // Always false
                guest_name: null         // Always null
            });
            setFormData({ user_id: '', meal_type: 'lunch' });
            loadMeals();
        } catch (error) {
            console.error('Error adding meal:', error);
        }
    };

    const getMealIcon = (type) => {
        switch(type) {
            case 'breakfast': return <Coffee className="w-5 h-5 text-amber-500" />;
            case 'lunch': return <Utensils className="w-5 h-5 text-blue-500" />;
            case 'dinner': return <Moon className="w-5 h-5 text-indigo-500" />;
            default: return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const mealTypes = {
        breakfast: { 
            label: 'Breakfast', 
            icon: Coffee,
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-200'
        },
        lunch: { 
            label: 'Lunch', 
            icon: Utensils,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-200'
        },
        dinner: { 
            label: 'Dinner', 
            icon: Moon,
            color: 'from-indigo-500 to-purple-500',
            bg: 'bg-indigo-50',
            text: 'text-indigo-700',
            border: 'border-indigo-200'
        }
    };

    // Count meals by type
    const mealsByType = {
        breakfast: meals.filter(m => m.meal_type === 'breakfast'),
        lunch: meals.filter(m => m.meal_type === 'lunch'),
        dinner: meals.filter(m => m.meal_type === 'dinner')
    };

    return (
        <div className="space-y-6">
            {/* Header with gradient */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Meal Tracking
                    </h1>
                    <p className="text-gray-500 mt-1">Manage daily meals for mess members</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Date Selector Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Date
                            </label>
                            <input
                                type="date"
                                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* Quick stats */}
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">{meals.length}</div>
                            <div className="text-xs text-gray-500">Total Meals</div>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                                {Object.values(mealsByType).reduce((acc, curr) => acc + (curr?.length || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-500">Today</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Meal Form - Left Column */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">Add New Meal</h2>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span>Member</span>
                                </div>
                            </label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                value={formData.user_id}
                                onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                            >
                                <option value="">Select a member</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>Meal Type</span>
                                </div>
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(mealTypes).map(([key, { label, icon: Icon, color }]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFormData({...formData, meal_type: key})}
                                        className={`
                                            flex flex-col items-center p-3 rounded-xl border-2 transition-all
                                            ${formData.meal_type === key 
                                                ? `bg-gradient-to-r ${color} text-white border-transparent shadow-lg` 
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 mb-1 ${formData.meal_type === key ? 'text-white' : ''}`} />
                                        <span className="text-xs font-medium">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* REMOVED: Guest checkbox and guest name input */}

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/25"
                        >
                            Add Meal
                        </button>
                    </form>
                </div>

                {/* Today's Meals - Right Column */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Today's Meals
                                </h2>
                            </div>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {selectedDate}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(mealTypes).map(([type, { label, icon: Icon, color, bg, text, border }]) => {
                                    const typeMeals = mealsByType[type];
                                    
                                    return (
                                        <div key={type} className={`${bg} rounded-xl p-4 border ${border}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`p-1.5 bg-white rounded-lg shadow-sm`}>
                                                        <Icon className={`w-4 h-4 ${text}`} />
                                                    </div>
                                                    <h3 className={`font-semibold ${text}`}>{label}</h3>
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white ${text}`}>
                                                    {typeMeals.length} meal{typeMeals.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            
                                            {typeMeals.length > 0 ? (
                                                <div className="space-y-2">
                                                    {typeMeals.map((meal) => (
                                                        <div 
                                                            key={meal.id} 
                                                            className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                                    {meal.user_name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{meal.user_name}</p>
                                                                    {/* REMOVED: Guest display - guests handled in GuestMeals component */}
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(meal.created_at).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 bg-white/50 rounded-lg border-2 border-dashed border-gray-200">
                                                    <XCircle className="w-8 h-8 text-gray-300 mb-2" />
                                                    <p className="text-sm text-gray-400">No meals recorded</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total members present today</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {new Set(meals.map(m => m.user_id)).size} / {users.length}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={loadMeals}
                        className="px-4 py-2 bg-white text-gray-600 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Meals;