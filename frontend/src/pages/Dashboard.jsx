import React, { useState, useEffect } from 'react';
import { calculationService, expenseService } from '../services/api';

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const summaryResponse = await calculationService.getMonthlySummary(currentYear, currentMonth);
            setSummary(summaryResponse.data);

            const expensesResponse = await expenseService.getMonthly(currentYear, currentMonth);
            setRecentExpenses(expensesResponse.data.slice(0, 5));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 mb-2">Total Meals</div>
                        <div className="text-3xl font-bold text-blue-600">{summary.totalMeals}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 mb-2">Total Expense</div>
                        <div className="text-3xl font-bold text-green-600">৳{summary.totalExpense}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 mb-2">Meal Rate</div>
                        <div className="text-3xl font-bold text-purple-600">৳{summary.mealRate}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 mb-2">Active Members</div>
                        <div className="text-3xl font-bold text-orange-600">{summary.userSummaries?.length || 0}</div>
                    </div>
                </div>
            )}

            {/* Recent Expenses */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Recent Expenses</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {recentExpenses.map((expense) => (
                        <div key={expense.id} className="px-6 py-4 flex justify-between">
                            <div>
                                <div className="font-medium text-gray-800">{expense.item_name}</div>
                                <div className="text-sm text-gray-600">by {expense.purchased_by_name}</div>
                            </div>
                            <div className="text-lg font-semibold text-green-600">৳{expense.price}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;