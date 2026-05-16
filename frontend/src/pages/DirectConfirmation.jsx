import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { mealConfirmationService } from '../services/api';
import { toast } from 'react-toastify';

const DirectConfirmation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    
    const urlConfirm = searchParams.get('confirm');
    const mealType = searchParams.get('type');
    const date = searchParams.get('date');
    
    useEffect(() => {
        // Check if we have confirm parameter
        if (urlConfirm && (urlConfirm === 'yes' || urlConfirm === 'no') && mealType && date) {
            // Has confirm parameter - auto-save
            saveConfirmation(urlConfirm);
        } else if (mealType && date) {
            // No confirm parameter - show buttons for user to select
            setShowButtons(true);
        }
    }, []);
    
    const saveConfirmation = async (status) => {
        setLoading(true);
        try {
            await mealConfirmationService.updateDirect({
                status: status,
                meal_type: mealType,
                confirmation_date: date
            });
            
            setSelectedStatus(status);
            setConfirmed(true);
            toast.success(`You have confirmed ${status === 'yes' ? 'YES' : 'NO'} for ${mealType} on ${date}`);
            
            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/meal-confirmation');
            }, 2000);
            
        } catch (error) {
            console.error('Confirmation error:', error);
            toast.error('Failed to save confirmation');
        } finally {
            setLoading(false);
        }
    };
    
    // If no confirm parameter, show Yes/No buttons
    if (showButtons && !loading && !confirmed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Your Meal</h2>
                <p className="text-gray-600 mb-6">{mealType} for {date}</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => saveConfirmation('yes')}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        ✅ Yes, I will eat
                    </button>
                    <button
                        onClick={() => saveConfirmation('no')}
                        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        ❌ No, I won't eat
                    </button>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Saving your confirmation...</p>
            </div>
        );
    }
    
    if (confirmed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                {selectedStatus === 'yes' ? (
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                ) : (
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                )}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedStatus === 'yes' ? 'Confirmed!' : 'Declined'}
                </h2>
                <p className="text-gray-600">
                    You have confirmed <strong>{selectedStatus === 'yes' ? 'YES' : 'NO'}</strong> for {mealType} on {date}
                </p>
                <p className="text-sm text-gray-400 mt-4">Redirecting...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-gray-600">Invalid confirmation request</p>
            <button 
                onClick={() => navigate('/meal-confirmation')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
                Go to Meal Confirmation
            </button>
        </div>
    );
};

export default DirectConfirmation;