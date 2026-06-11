import React, { useState, useEffect } from 'react';
import { expenseService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Trash2, Edit2, Save, X, Eye, EyeOff, 
    Search, Download, Filter, TrendingUp, 
    Users, Calendar as CalendarIcon 
} from 'lucide-react';
import { toast } from 'react-toastify';

const Expenses = () => {
    const [users, setUsers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAllExpenses, setShowAllExpenses] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const { isAdmin, isManager } = useAuth();
    const canEdit = isAdmin || isManager;
    const canDelete = isAdmin || isManager;

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        expenseId: null,
        itemName: ''
    });

    // Get today's date
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
        expense_date: getTodayDate(),
        notes: ''
    });

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    );

    useEffect(() => {
        loadUsers();
        loadExpenses();
    }, [selectedMonth]);

    useEffect(() => {
        filterExpenses();
    }, [searchTerm, expenses]);

    const loadUsers = async () => {
        try {
            const response = await userService.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const response = await expenseService.getMonthly(year, month);
            setExpenses(response.data);
            setFilteredExpenses(response.data);
        } catch (error) {
            console.error('Error loading expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const filterExpenses = () => {
        if (!searchTerm.trim()) {
            setFilteredExpenses(expenses);
        } else {
            const filtered = expenses.filter(expense =>
                expense.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.purchased_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredExpenses(filtered);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.item_name || !formData.price || !formData.purchased_by) {
            toast.error('Please fill all required fields');
            return;
        }
        
        setLoading(true);
        try {
            const localDate = new Date(formData.expense_date);
            const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

            await expenseService.add({
                ...formData,
                expense_date: formattedDate
            });

            setFormData({
                item_name: '',
                quantity: '',
                price: '',
                purchased_by: '',
                expense_date: getTodayDate(),
                notes: ''
            });

            await loadExpenses();
            toast.success('Expense added successfully');
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Failed to add expense');
        } finally {
            setLoading(false);
        }
    };
//fixed with timezone-aware date handling and added edit/delete functionality for expenses.
  const handleEditClick = (expense) => {
    // Helper function to format date in local timezone
    const formatLocalDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    setEditingId(expense.id);
    setEditData({
        item_name: expense.item_name,
        quantity: expense.quantity || '',
        price: expense.price,
        purchased_by: expense.purchased_by,
        expense_date: formatLocalDate(expense.expense_date),
        notes: expense.notes || ''
    });
};

    const handleEditSave = async (id) => {
        try {
            await expenseService.update(id, editData);
            toast.success('Expense updated successfully');
            setEditingId(null);
            await loadExpenses();
        } catch (error) {
            console.error('Error updating expense:', error);
            toast.error('Failed to update expense');
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleDeleteClick = (expenseId, itemName) => {
        setDeleteModal({
            isOpen: true,
            expenseId: expenseId,
            itemName: itemName
        });
    };

    const confirmDelete = async () => {
        const { expenseId, itemName } = deleteModal;
        try {
            await expenseService.delete(expenseId);
            await loadExpenses();
            toast.success(`${itemName} deleted successfully`);
            setDeleteModal({ isOpen: false, expenseId: null, itemName: '' });
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Failed to delete expense');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ isOpen: false, expenseId: null, itemName: '' });
    };

    const getMemberTotal = () => {
        const totals = {};
        filteredExpenses.forEach(expense => {
            const name = expense.purchased_by_name;
            totals[name] = (totals[name] || 0) + parseFloat(expense.price);
        });
        return Object.entries(totals).sort((a, b) => b[1] - a[1]);
    };

    const totalExpense = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.price), 0);
    // const averageExpense = filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0;
    const displayedExpenses = showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 10);
    const memberTotals = getMemberTotal();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Bazar & Expenses
                    </h1>
                    <p className="text-gray-500 mt-1">Track and manage all mess expenses</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Expenses</p>
                            <p className="text-2xl font-bold text-blue-600">৳{totalExpense.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Items</p>
                            <p className="text-2xl font-bold text-gray-800">{filteredExpenses.length}</p>
                        </div>
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Filter className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                </div>
                {/* <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Average per Item</p>
                            <p className="text-2xl font-bold text-green-600">৳{averageExpense.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div> */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Top Spender</p>
                            <p className="text-xl font-bold text-purple-600 truncate">
                                {memberTotals[0]?.[0] || 'N/A'}
                            </p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-3 py-2 border border-gray-200 rounded-lg"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            {[...Array(12)].map((_, i) => {
                                const date = new Date();
                                date.setMonth(date.getMonth() - i);
                                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                                return <option key={i} value={value}>{label}</option>;
                            })}
                        </select>
                    </div>
                    
                    <div className="flex gap-3">
                        {!showAllExpenses ? (
                            <button
                                onClick={() => setShowAllExpenses(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Eye className="w-4 h-4" />
                                All Expenses ({filteredExpenses.length})
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAllExpenses(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                <EyeOff className="w-4 h-4" />
                                Show Recent
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Expense Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">Add New Expense</h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* ... form fields remain the same ... */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price (৳) *</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Purchased By *</label>
                            <select
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                rows="2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </form>
                </div>

                {/* Expenses List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {showAllExpenses ? 'All Expenses' : 'Recent Expenses'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Showing {displayedExpenses.length} of {filteredExpenses.length} expenses
                            {searchTerm && ` matching "${searchTerm}"`}
                        </p>
                    </div>
                    
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : displayedExpenses.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No expenses found
                            </div>
                        ) : (
                            displayedExpenses.map((expense) => (
                                <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    {editingId === expense.id ? (
                                        // Edit Mode
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editData.item_name}
                                                onChange={(e) => setEditData({...editData, item_name: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                placeholder="Item name"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={editData.quantity}
                                                    onChange={(e) => setEditData({...editData, quantity: e.target.value})}
                                                    className="px-3 py-2 border rounded-lg"
                                                    placeholder="Quantity"
                                                />
                                                <input
                                                    type="number"
                                                    value={editData.price}
                                                    onChange={(e) => setEditData({...editData, price: e.target.value})}
                                                    className="px-3 py-2 border rounded-lg"
                                                    placeholder="Price"
                                                />
                                            </div>
                                            <select
                                                value={editData.purchased_by}
                                                onChange={(e) => setEditData({...editData, purchased_by: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            >
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>{user.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="date"
                                                value={editData.expense_date}
                                                onChange={(e) => setEditData({...editData, expense_date: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditSave(expense.id)} className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                                    <Save className="w-4 h-4 inline mr-1" /> Save
                                                </button>
                                                <button onClick={handleEditCancel} className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                                                    <X className="w-4 h-4 inline mr-1" /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="font-medium text-gray-800">{expense.item_name}</div>
                                                    {expense.quantity && (
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                            {expense.quantity}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    by {expense.purchased_by_name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(expense.expense_date).toLocaleDateString()}
                                                </div>
                                                {expense.notes && (
                                                    <div className="text-xs text-gray-500 mt-1 italic">"{expense.notes}"</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-lg font-semibold text-green-600">
                                                    ৳{parseFloat(expense.price).toFixed(2)}
                                                </div>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleEditClick(expense)}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                        title="Edit expense"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteClick(expense.id, expense.item_name)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                                        title="Delete expense"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Member Spending Summary */}
            {memberTotals.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Spending Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {memberTotals.map(([name, total]) => (
                            <div key={name} className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
                                <p className="text-lg font-bold text-green-600">৳{total.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Delete Expense</h3>
                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to delete <strong className="text-gray-900">{deleteModal.itemName}</strong>?
                            <br />
                            <span className="text-sm text-gray-400">This action cannot be undone.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={cancelDelete} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-medium hover:from-red-700">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;