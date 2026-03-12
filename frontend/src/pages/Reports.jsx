import React, { useState } from 'react';
import { calculationService } from '../services/api';

const Reports = () => {
    const [summary, setSummary] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const response = await calculationService.getMonthlySummary(year, month);
            setSummary(response.data);
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Monthly Reports</h1>

            {/* Report Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-end space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                        <input
                            type="month"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {/* Report Results */}
            {summary && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    </div>

                    {/* Individual Member Summary */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-xl font-semibold text-gray-800">Member-wise Summary</h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meals</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {summary.userSummaries.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {user.meal_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                                            ৳{user.due}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {parseFloat(user.due) > 0 ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                    Due
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    Paid
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;