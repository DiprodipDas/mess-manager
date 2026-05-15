import React, { useState, useEffect } from 'react';
import { Calendar, Send, CheckCircle, XCircle, Clock, Users, Bell } from 'lucide-react';
import { mealConfirmationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const MealConfirmation = () => {
    const [confirmations, setConfirmations] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [mealType, setMealType] = useState('lunch');
    const [loading, setLoading] = useState(false);
    const { isAdmin, isManager } = useAuth();
    const canSendReminders = isAdmin || isManager;

    useEffect(() => {
        loadConfirmations();
    }, [selectedDate, mealType]);

    const loadConfirmations = async () => {
        setLoading(true);
        try {
            const response = await mealConfirmationService.getByDate(selectedDate, mealType);
            setSummary(response.data);
            setConfirmations(response.data.members || []);
        } catch (error) {
            console.error('Error loading confirmations:', error);
            toast.error('Failed to load confirmations');
        } finally {
            setLoading(false);
        }
    };

    // ✅ This is the function you asked about
    const handleSendReminders = async () => {
        try {
            await mealConfirmationService.sendPushReminders(mealType, selectedDate);
            toast.success('Push reminders sent successfully');
        } catch (error) {
            toast.error('Failed to send reminders');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'yes':
                return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Yes</span>;
            case 'no':
                return <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> No</span>;
            default:
                return <span className="flex items-center gap-1 text-yellow-600"><Clock className="w-4 h-4" /> Pending</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Meal Confirmation
                </h1>
                <p className="text-gray-500 mt-1">Confirm your meals for tomorrow</p>
            </div>

            {/* Stats Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Total Members</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Confirmed Yes</p>
                        <p className="text-2xl font-bold text-green-600">{summary.yes}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Confirmed No</p>
                        <p className="text-2xl font-bold text-red-600">{summary.no}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                            type="date"
                            className="px-4 py-2 border rounded-lg"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                        <select
                            className="px-4 py-2 border rounded-lg"
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value)}
                        >
                            <option value="lunch">🍛 Lunch</option>
                            <option value="dinner">🍲 Dinner</option>
                        </select>
                    </div>
                    {canSendReminders && (
                        <button
                            onClick={handleSendReminders}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Bell className="w-4 h-4" />
                            Send Reminders
                        </button>
                    )}
                </div>
            </div>

            {/* Confirmations Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {mealType === 'lunch' ? '🍛' : '🍲'} {mealType === 'lunch' ? 'Lunch' : 'Dinner'} Confirmations
                    </h2>
                </div>
                
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : confirmations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No confirmation records found
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {confirmations.map((member) => (
                            <div key={member.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-800">{member.name}</p>
                                </div>
                                <div>
                                    {getStatusBadge(member.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealConfirmation;