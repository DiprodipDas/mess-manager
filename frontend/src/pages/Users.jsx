import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Edit2, Save, X, DollarSign, Phone, Home, Calendar, User } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const { user: currentUser, isAdmin, isManager } = useAuth();
    
    // Check if user has edit permissions (admin or manager)
    const canEdit = isAdmin || isManager;

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditData({
            name: user.name,
            phone: user.phone,
            room_number: user.room_number || '',
            individual_rent: user.individual_rent || 0,
            join_date: user.join_date?.split('T')[0] || new Date().toISOString().split('T')[0]
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleSaveEdit = async (userId) => {
        try {
            await userService.update(userId, editData);
            toast.success('Member updated successfully');
            setEditingId(null);
            loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update member');
        }
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Mess Members
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {canEdit ? 'Click edit ✏️ to modify member details' : 'View-only mode'}
                    </p>
                </div>
                <div className="text-sm text-gray-500">
                    Total Members: {users.length}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Room</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Individual Rent</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Joined Date</th>
                                {canEdit && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                                        No members found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        {editingId === user.id ? (
                                            // Edit Mode
                                            <>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={editData.name}
                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="tel"
                                                        value={editData.phone}
                                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={editData.room_number}
                                                        onChange={(e) => handleInputChange('room_number', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., Room 101"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">৳</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editData.individual_rent}
                                                            onChange={(e) => handleInputChange('individual_rent', e.target.value)}
                                                            className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={editData.join_date}
                                                        onChange={(e) => handleInputChange('join_date', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                {canEdit && (
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleSaveEdit(user.id)}
                                                                className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                                title="Save"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </>
                                        ) : (
                                            // View Mode
                                            <>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-800">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{user.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Home className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{user.room_number || 'Not assigned'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <DollarSign className="w-4 h-4 text-green-500" />
                                                        <span className="font-medium text-green-600">
                                                            {user.individual_rent ? `৳${parseFloat(user.individual_rent).toFixed(2)}` : 'Not set'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{formatDate(user.join_date)}</span>
                                                    </div>
                                                </td>
                                                {canEdit && (
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Member"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default Users;