import React, { useState, useEffect } from 'react';
import { Users, Phone, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle, UserPlus } from 'lucide-react';
import { guestMealService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const GuestMeals = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const { user, isAdmin } = useAuth();
    const [formData, setFormData] = useState({
        guest_name: '',
        guest_phone: '',
        meal_type: 'lunch',
        meal_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        loadGuests();
    }, []);

    const loadGuests = async () => {
        setLoading(true);
        try {
            const response = await guestMealService.getAll();
            setGuests(response.data);
        } catch (error) {
            toast.error('Failed to load guest meals');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await guestMealService.add({
                ...formData,
                host_member_id: user.id
            });
            toast.success('Guest meal added successfully');
            setShowForm(false);
            setFormData({ guest_name: '', guest_phone: '', meal_type: 'lunch', meal_date: '', notes: '' });
            loadGuests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add guest meal');
        }
    };

    const handlePayment = async (guestId) => {
        try {
            await guestMealService.markAsPaid(guestId);
            toast.success('Payment recorded');
            loadGuests();
        } catch (error) {
            toast.error('Failed to record payment');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Guest Meal Management
                    </h1>
                    <p className="text-gray-500 mt-1">Track and manage guest meals</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Add Guest Meal</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Guests</p>
                            <p className="text-2xl font-bold text-gray-800">{guests.length}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">This Month</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {guests.filter(g => g.meal_date?.startsWith(new Date().toISOString().slice(0,7))).length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Paid</p>
                            <p className="text-2xl font-bold text-green-600">
                                {guests.filter(g => g.is_paid).length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-amber-600">
                                {guests.filter(g => !g.is_paid).length}
                            </p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Guest Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-4">Add New Guest Meal</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={formData.guest_name}
                                    onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={formData.guest_phone}
                                    onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={formData.meal_type}
                                    onChange={(e) => setFormData({...formData, meal_type: e.target.value})}
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={formData.meal_date}
                                    onChange={(e) => setFormData({...formData, meal_date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                rows="2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                            >
                                Add Guest Meal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Guests List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">Guest Meals History</h2>
                </div>
                
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {guests.map((guest) => (
                            <div key={guest.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {guest.guest_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{guest.guest_name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Hosted by: {guest.host_name}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                            <div className="text-sm">
                                                <span className="text-gray-400">Meal:</span>
                                                <p className="font-medium text-gray-700 capitalize">{guest.meal_type}</p>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-gray-400">Date:</span>
                                                <p className="font-medium text-gray-700">
                                                    {new Date(guest.meal_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-gray-400">Status:</span>
                                                <p>
                                                    {guest.is_paid ? (
                                                        <span className="inline-flex items-center text-green-600">
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-amber-600">
                                                            <AlertCircle className="w-4 h-4 mr-1" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-gray-400">Phone:</span>
                                                <p className="font-medium text-gray-700">{guest.guest_phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        
                                        {guest.notes && (
                                            <p className="text-sm text-gray-500 mt-2 italic">"{guest.notes}"</p>
                                        )}
                                    </div>
                                    
                                    {!guest.is_paid && (
                                        <button
                                            onClick={() => handlePayment(guest.id)}
                                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            <span>Mark Paid</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {guests.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No guest meals recorded</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuestMeals;