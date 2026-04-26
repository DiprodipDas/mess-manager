import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Utensils, Home, Receipt, TrendingUp, Download } from 'lucide-react';
import { memberExpenseService } from '../services/api';
import { toast } from 'react-toastify';

const MemberSummary = () => {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const loadSummary = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const response = await memberExpenseService.calculate(year, month);
            setSummary(response.data);
        } catch (error) {
            toast.error('Failed to load member summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, [selectedMonth]);

    const totalExpense = summary?.member_summaries?.reduce((sum, m) => sum + parseFloat(m.total_expense), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Member-wise Expense Summary
                    </h1>
                    <p className="text-gray-500 mt-1">Complete breakdown including rent & fixed bills</p>
                </div>
                <div className="flex items-center space-x-3">
                    <input
                        type="month"
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                    <button
                        onClick={loadSummary}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                        <TrendingUp className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Total Bazar Expense</p>
                        <p className="text-2xl font-bold text-blue-600">৳{summary.total_bazar_expense}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Total Meals</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.total_meals}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Meal Rate</p>
                        <p className="text-2xl font-bold text-green-600">৳{summary.meal_rate}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Total Member Expense</p>
                        <p className="text-2xl font-bold text-purple-600">৳{totalExpense.toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* Fixed Bills Info */}
            {summary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-800">Fixed Bills Distribution</h3>
                            <p className="text-sm text-gray-600">Total Fixed Bills: ৳{summary.total_fixed_bills}</p>
                            <p className="text-xs text-gray-500">Per Member Share: ৳{summary.fixed_bills_per_member}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>📋 Includes: Electricity, Water, Gas, Internet, Housekeeper, Maintenance, etc.</p>
                            <p>🏠 Individual rent is added separately based on room allocation.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Summary Table */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : summary ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Member</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Meals</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Meal Cost</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Individual Rent</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fixed Bills Share</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total Expense</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {summary.member_summaries.map((member, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{member.total_meals}</td>
                                        <td className="px-4 py-3 text-gray-600">৳{member.meal_cost}</td>
                                        <td className="px-4 py-3 text-gray-600">৳{member.individual_rent}</td>
                                        <td className="px-4 py-3 text-gray-600">৳{member.fixed_bills_share}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600">৳{member.total_expense}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-gray-800">Total</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{summary.total_meals}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">৳{summary.total_bazar_expense}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">
                                        ৳{summary.member_summaries?.reduce((sum, m) => sum + parseFloat(m.individual_rent), 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-800">৳{summary.total_fixed_bills}</td>
                                    <td className="px-4 py-3 font-bold text-green-600">৳{totalExpense.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : null}

        </div>
    );
};

export default MemberSummary;