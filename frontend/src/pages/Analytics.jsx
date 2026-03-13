import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    Calendar,
    Filter,
    Download,
    RefreshCw,
    PieChart as PieChartIcon,
    BarChart3,
    Activity
} from 'lucide-react';
import { analyticsService } from '../services/api';
import { toast } from 'react-toastify';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('month');
    const [data, setData] = useState({
        expenseTrend: [],
        categoryBreakdown: [],
        memberMeals: [],
        dailyAverage: [],
        comparison: {}
    });

    useEffect(() => {
        loadAnalytics();
    }, [timeframe]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const response = await analyticsService.getAnalytics(timeframe);
            setData(response.data);
        } catch (error) {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Advanced Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">Visual insights into your mess operations</p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Timeframe selector */}
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                        {['week', 'month', 'quarter', 'year'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setTimeframe(period)}
                                className={`
                                    px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all
                                    ${timeframe === period 
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }
                                `}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={loadAnalytics}
                        className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-800">৳{data.comparison?.totalExpense || 0}</p>
                    <p className="text-xs text-green-600 mt-2">↑ 12% from last period</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Avg. Meal Rate</p>
                    <p className="text-2xl font-bold text-gray-800">৳{data.comparison?.avgMealRate || 0}</p>
                    <p className="text-xs text-red-600 mt-2">↓ 3% from last period</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Meals</p>
                    <p className="text-2xl font-bold text-gray-800">{data.comparison?.totalMeals || 0}</p>
                    <p className="text-xs text-green-600 mt-2">↑ 8% from last period</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Active Members</p>
                    <p className="text-2xl font-bold text-gray-800">{data.comparison?.activeMembers || 0}</p>
                    <p className="text-xs text-blue-600 mt-2">↔ No change</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Trend Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data.expenseTrend}>
                            <defs>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data.categoryBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.categoryBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Member Meals Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Meals by Member</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.memberMeals}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="meals" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Daily Average */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Meal Average</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.dailyAverage}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="breakfast" stroke="#f59e0b" />
                            <Line type="monotone" dataKey="lunch" stroke="#3b82f6" />
                            <Line type="monotone" dataKey="dinner" stroke="#8b5cf6" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Highest expense day</p>
                        <p className="text-xl font-bold text-gray-800">Wednesday</p>
                        <p className="text-xs text-gray-500">Avg. ৳2,450 per week</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Most popular meal</p>
                        <p className="text-xl font-bold text-gray-800">Lunch</p>
                        <p className="text-xs text-gray-500">45% of all meals</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Top spending category</p>
                        <p className="text-xl font-bold text-gray-800">Vegetables</p>
                        <p className="text-xs text-gray-500">32% of total expense</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;