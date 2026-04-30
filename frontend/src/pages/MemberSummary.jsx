import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { memberExpenseService, expenseService } from '../services/api';
import { toast } from 'react-toastify';

const MemberSummary = () => {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [memberPurchases, setMemberPurchases] = useState({});
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const loadSummary = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            
            // Get member expenses (meals, rent, fixed bills)
            const response = await memberExpenseService.calculate(year, month);
            setSummary(response.data);
            
            // Get what each member spent on bazar (food purchases)
            const expensesRes = await expenseService.getMonthly(year, month);
            const purchaseMap = {};
            expensesRes.data.forEach(exp => {
                const userId = exp.purchased_by;
                const amount = parseFloat(exp.price);
                purchaseMap[userId] = (purchaseMap[userId] || 0) + amount;
            });
            setMemberPurchases(purchaseMap);
            
        } catch (error) {
            toast.error('Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, [selectedMonth]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Member-wise Expense Summary
                    </h1>
                    <p className="text-gray-500 mt-1">Final payable after adjusting bazar overpayment</p>
                </div>
                <input
                    type="month"
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                />
            </div>

            {/* Loading State */}
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
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 bg-orange-50">Bazar Purchase</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 bg-green-50">Food Overpayment<br/>(Purchase - Meal Cost)</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Individual Rent</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fixed Bills Share</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total Expense</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 bg-purple-50">FINAL PAYABLE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {summary.member_summaries.map((member) => {
                                    const mealCost = parseFloat(member.meal_cost);
                                    const bazarPurchase = memberPurchases[member.user_id] || 0;
                                    const overpayment = bazarPurchase - mealCost;
                                    
                                    const individualRent = parseFloat(member.individual_rent);
                                    const fixedBillsShare = parseFloat(member.fixed_bills_share);
                                    const totalExpense = parseFloat(member.total_expense);
                                    
                                    // FINAL PAYABLE = Total Expense - Overpayment
                                    // If overpayment is positive (they spent more on food), subtract from total expense
                                    // If overpayment is negative (they ate more than they purchased), add to total expense
                                    const finalPayable = totalExpense - overpayment;
                                    
                                    return (
                                        <tr key={member.user_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{member.total_meals}</td>
                                            <td className="px-4 py-3 text-gray-700">৳{mealCost.toFixed(2)}</td>
                                            <td className="px-4 py-3 bg-orange-50/30 text-orange-700 font-medium">
                                                ৳{bazarPurchase.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 bg-green-50/30">
                                                {overpayment > 0 ? (
                                                    <span className="text-green-600 font-semibold">
                                                        -৳{overpayment.toFixed(2)} (Deduct)
                                                    </span>
                                                ) : overpayment < 0 ? (
                                                    <span className="text-red-600 font-semibold">
                                                        +৳{Math.abs(overpayment).toFixed(2)} (Add)
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">৳0.00</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-amber-700">৳{individualRent.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-purple-700">৳{fixedBillsShare.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-gray-800 font-medium">৳{totalExpense.toFixed(2)}</td>
                                            <td className="px-4 py-3 bg-purple-50/30">
                                                <span className="font-bold text-purple-700 text-lg">
                                                    ৳{finalPayable.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-gray-800">Total</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{summary.total_meals}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">
                                        ৳{summary.member_summaries?.reduce((sum, m) => sum + parseFloat(m.meal_cost), 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-orange-700">
                                        ৳{Object.values(memberPurchases).reduce((sum, p) => sum + p, 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-green-700">
                                        ৳{(Object.values(memberPurchases).reduce((sum, p) => sum + p, 0) - 
                                           summary.member_summaries?.reduce((sum, m) => sum + parseFloat(m.meal_cost), 0)).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-amber-700">
                                        ৳{summary.member_summaries?.reduce((sum, m) => sum + parseFloat(m.individual_rent), 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-purple-700">
                                        ৳{summary.total_fixed_bills}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-800">
                                        ৳{summary.member_summaries?.reduce((sum, m) => sum + parseFloat(m.total_expense), 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-purple-700 bg-purple-50/30">
                                        ৳{summary.member_summaries?.reduce((sum, m) => {
                                            const mealCost = parseFloat(m.meal_cost);
                                            const bazarPurchase = memberPurchases[m.user_id] || 0;
                                            const overpayment = bazarPurchase - mealCost;
                                            const totalExp = parseFloat(m.total_expense);
                                            return sum + (totalExp - overpayment);
                                        }, 0).toFixed(2)}
                                    </td>
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