import React, { useState, useEffect } from 'react';
import { expenseService, userService } from '../services/api';

const Expenses = () => {
    const [users, setUsers] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // Get today's date in local timezone
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        item_name: '',
        quantity: '',
        price: '',
        purchased_by: '',
        expense_date: getTodayDate(), // Use local date instead of ISO
        notes: ''
    });

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    );

    useEffect(() => {
        console.log('Current expense_date value:', formData.expense_date);
    }, [formData.expense_date]);

    useEffect(() => {
        loadUsers();
        loadExpenses();
    }, [selectedMonth]);

    const loadUsers = async () => {
        try {
            const response = await userService.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadExpenses = async () => {
        try {
            const [year, month] = selectedMonth.split('-');
            const response = await expenseService.getMonthly(year, month);
            setExpenses(response.data);
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create date in local timezone and format as YYYY-MM-DD
            const localDate = new Date(formData.expense_date);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            console.log('Submitting expense with date:', formattedDate); // Debug

            await expenseService.add({
                ...formData,
                expense_date: formattedDate
            });

            // Reset form
            setFormData({
                item_name: '',
                quantity: '',
                price: '',
                purchased_by: '',
                expense_date: new Date().toISOString().split('T')[0],
                notes: ''
            });

            loadExpenses();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const totalExpense = expenses.reduce((sum, exp) => sum + parseFloat(exp.price), 0);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Bazar & Expenses</h1>

            {/* Month Selector */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center space-x-4">
                    <label className="font-medium text-gray-700">Select Month:</label>
                    <input
                        type="month"
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                    <div className="text-lg font-semibold text-green-600">
                        Total: ৳{totalExpense.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Expense Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 5kg"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (৳)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Purchased By</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.purchased_by}
                                    onChange={(e) => setFormData({ ...formData, purchased_by: e.target.value })}
                                >
                                    <option value="">Select Member</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expense Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Add Expense
                            </button>
                        </div>
                    </form>
                </div>

                {/* Recent Expenses List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {expenses.slice(0, 10).map((expense) => (
                            <div key={expense.id} className="border-b border-gray-100 pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-gray-800">{expense.item_name}</div>
                                        <div className="text-sm text-gray-600">
                                            {expense.quantity && <span>{expense.quantity} • </span>}
                                            by {expense.purchased_by_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(expense.expense_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-lg font-semibold text-green-600">
                                        ৳{expense.price}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses;