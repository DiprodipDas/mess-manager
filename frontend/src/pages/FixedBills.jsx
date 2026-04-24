import React, { useState, useEffect } from 'react';
import { 
    Home, Droplet, Flame, Zap, Trash2, Users, Wrench, 
    Edit2, Save, X, Plus, AlertCircle, DollarSign,
    TrendingUp, Building2, Calendar
} from 'lucide-react';
import { fixedBillService } from '../services/api';
import { toast } from 'react-toastify';

const FixedBills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBill, setNewBill] = useState({
        bill_name: '',
        bill_amount: '',
        notes: ''
    });

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        setLoading(true);
        try {
            const response = await fixedBillService.getAll();
            setBills(response.data);
        } catch (error) {
            toast.error('Failed to load fixed bills');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (bill) => {
        setEditingId(bill.id);
        setEditValue(bill.bill_amount);
    };

    const handleSave = async (id) => {
        try {
            await fixedBillService.update(id, { 
                bill_amount: parseFloat(editValue)
            });
            toast.success('Bill updated successfully');
            setEditingId(null);
            loadBills();
        } catch (error) {
            toast.error('Failed to update bill');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue('');
    };

    const handleAddBill = async (e) => {
        e.preventDefault();
        if (!newBill.bill_name || !newBill.bill_amount) {
            toast.error('Please fill all required fields');
            return;
        }
        
        try {
            await fixedBillService.add({
                ...newBill,
                bill_amount: parseFloat(newBill.bill_amount)
            });
            toast.success('Bill added successfully');
            setShowAddForm(false);
            setNewBill({ bill_name: '', bill_amount: '', notes: '' });
            loadBills();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add bill');
        }
    };

    const handleDeleteBill = async (id, billName) => {
        if (window.confirm(`Are you sure you want to delete "${billName}"?`)) {
            try {
                await fixedBillService.delete(id);
                toast.success('Bill deleted successfully');
                loadBills();
            } catch (error) {
                toast.error('Failed to delete bill');
            }
        }
    };

    const getBillIcon = (billName) => {
        const name = billName.toLowerCase();
        if (name.includes('rent')) return <Home className="w-5 h-5" />;
        if (name.includes('water')) return <Droplet className="w-5 h-5" />;
        if (name.includes('gas')) return <Flame className="w-5 h-5" />;
        if (name.includes('electricity')) return <Zap className="w-5 h-5" />;
        if (name.includes('dust') || name.includes('utility')) return <Trash2 className="w-5 h-5" />;
        if (name.includes('housekeeper') || name.includes('bua')) return <Users className="w-5 h-5" />;
        if (name.includes('maintenance')) return <Wrench className="w-5 h-5" />;
        return <Building2 className="w-5 h-5" />;
    };

    const getIconColor = (billName) => {
        const name = billName.toLowerCase();
        if (name.includes('rent')) return 'text-blue-600 bg-blue-100';
        if (name.includes('water')) return 'text-cyan-600 bg-cyan-100';
        if (name.includes('gas')) return 'text-orange-600 bg-orange-100';
        if (name.includes('electricity')) return 'text-yellow-600 bg-yellow-100';
        if (name.includes('dust') || name.includes('utility')) return 'text-gray-600 bg-gray-100';
        if (name.includes('housekeeper') || name.includes('bua')) return 'text-purple-600 bg-purple-100';
        return 'text-green-600 bg-green-100';
    };

    const totalFixed = bills.reduce((sum, bill) => sum + parseFloat(bill.bill_amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Fixed Bills
                    </h1>
                    <p className="text-gray-500 mt-1">Manage monthly recurring expenses</p>
                    <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Note: Fixed bills are for tracking only and DO NOT affect meal rate calculation
                    </p>
                </div>
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl px-4 py-3 text-white text-center min-w-[150px]">
                    <div className="text-xs">Monthly Total</div>
                    <div className="text-xl font-bold">৳{totalFixed.toFixed(2)}</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Bills</p>
                            <p className="text-2xl font-bold text-gray-800">{bills.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Per Month</p>
                            <p className="text-2xl font-bold text-green-600">৳{totalFixed.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Per Person Share*</p>
                            <p className="text-2xl font-bold text-gray-800">
                                ৳{(totalFixed / 6).toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">*Based on 6 members</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Annual Total</p>
                            <p className="text-2xl font-bold text-gray-800">৳{(totalFixed * 12).toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Bill Button & Form */}
            <div>
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New Bill</span>
                    </button>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-xl font-semibold mb-4">Add New Fixed Bill</h2>
                        <form onSubmit={handleAddBill} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bill Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Internet Bill, Cable Bill"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={newBill.bill_name}
                                        onChange={(e) => setNewBill({...newBill, bill_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount (Monthly) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={newBill.bill_amount}
                                            onChange={(e) => setNewBill({...newBill, bill_amount: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Any additional details about this bill"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={newBill.notes}
                                    onChange={(e) => setNewBill({...newBill, notes: e.target.value})}
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
                                >
                                    Add Bill
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Bills List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-semibold text-gray-800">Monthly Fixed Expenses</h2>
                    <p className="text-sm text-gray-500 mt-1">Click edit ✏️ to modify any bill amount</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {bills.map((bill) => (
                            <div key={bill.id} className="p-5 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-xl ${getIconColor(bill.bill_name)}`}>
                                            {getBillIcon(bill.bill_name)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{bill.bill_name}</h3>
                                            <p className="text-xs text-gray-400">Monthly recurring expense</p>
                                            {bill.notes && (
                                                <p className="text-xs text-gray-500 mt-1 max-w-md">{bill.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        {editingId === bill.id ? (
                                            <>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-32 pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleSave(bill.id)}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                                    title="Save"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-right min-w-[100px]">
                                                    <div className="text-xl font-bold text-gray-800">
                                                        ৳{parseFloat(bill.bill_amount).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-400">per month</div>
                                                </div>
                                                <button
                                                    onClick={() => handleEdit(bill)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBill(bill.id, bill.bill_name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-amber-800">Important Note</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            Fixed bills (rent, utilities, salary, etc.) are tracked separately for accounting purposes 
                            and <strong className="font-semibold">DO NOT affect the meal rate calculation</strong>. 
                            The meal rate is calculated based only on bazar (food) expenses.
                        </p>
                        <p className="text-sm text-amber-700 mt-2">
                            💡 These are <strong>monthly recurring costs</strong>. Each bill amount is charged once per month.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FixedBills;