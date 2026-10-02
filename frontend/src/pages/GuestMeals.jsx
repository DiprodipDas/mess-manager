import React, { useState, useEffect } from "react";
import {
  Users,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  X,
  Trash2,
} from "lucide-react";
import { guestMealService, userService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const GuestMeals = () => {
  const [guests, setGuests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user, isAdmin, isManager } = useAuth();
  const canSelectHost = isAdmin || isManager;
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_phone: "",
    meal_type: "lunch",
    meal_date: new Date().toISOString().split("T")[0],
    notes: "",
    host_member_id: "",
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    guestId: null,
    guestName: "",
  });

  useEffect(() => {
    loadGuests();
    loadMembers();
  }, []);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const response = await guestMealService.getAll();
      setGuests(response.data);
    } catch (error) {
      toast.error("Failed to load guest meals");
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await userService.getAll();
      setMembers(response.data);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //Determine host: Admin can select, otherwise use logged-in user
    const hostId =
      canSelectHost && formData.host_member_id
        ? formData.host_member_id
        : user.id;

    // Validation for admin
    if (canSelectHost && !formData.host_member_id) {
      toast.error("Please select a host member");
      return;
    }

    try {
      await guestMealService.add({
        guest_name: formData.guest_name,
        guest_phone: formData.guest_phone,
        meal_type: formData.meal_type,
        meal_date: formData.meal_date,
        notes: formData.notes,
        host_member_id: hostId,
      });
      toast.success("Guest meal added successfully");
      setShowForm(false);
      setFormData({
        guest_name: "",
        guest_phone: "",
        meal_type: "lunch",
        meal_date: new Date().toISOString().split("T")[0],
        notes: "",
        host_member_id: "",
      });
      loadGuests();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add guest meal");
    }
  };

  const handlePayment = async (guestId) => {
    try {
      await guestMealService.markAsPaid(guestId);
      toast.success("Payment recorded");
      loadGuests();
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };

  const handleDeleteClick = (guestId, guestName) => {
    setDeleteModal({
      isOpen: true,
      guestId: guestId,
      guestName: guestName,
    });
  };

  const confirmDelete = async () => {
    const { guestId, guestName } = deleteModal;
    try {
      await guestMealService.delete(guestId);
      toast.success(`${guestName}'s guest meal deleted`);
      setDeleteModal({ isOpen: false, guestId: null, guestName: "" });
      loadGuests();
    } catch (error) {
      toast.error("Failed to delete guest meal");
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, guestId: null, guestName: "" });
  };

  return (
    <div className="space-y-6 pb-20">
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
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg z-10 relative"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Guest Meal</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500 mb-1">
                Total Guests
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {guests.length}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-purple-50 rounded-xl">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500 mb-1">
                This Month
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {
                  guests.filter((g) =>
                    g.meal_date?.startsWith(
                      new Date().toISOString().slice(0, 7),
                    ),
                  ).length
                }
              </p>
            </div>
            <div className="p-2 md:p-3 bg-blue-50 rounded-xl">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500 mb-1">Paid</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {guests.filter((g) => g.is_paid).length}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500 mb-1">Pending</p>
              <p className="text-xl md:text-2xl font-bold text-amber-600">
                {guests.filter((g) => !g.is_paid).length}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-amber-50 rounded-xl">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Guest Form - Mobile Optimized */}
      {showForm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowForm(false)}
          />

          {/* Form Modal for Mobile */}
          <div className="fixed inset-x-0 bottom-0 z-50 lg:relative lg:inset-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto lg:max-h-none">
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h2 className="text-xl font-semibold">Add Guest Meal</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl font-semibold mb-4 hidden lg:block">
              Add New Guest Meal
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ✅ NEW: Host Member Selector (Admin/Manager only) */}
              {canSelectHost && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.host_member_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        host_member_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Host Member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}{" "}
                        {member.room_number ? `(${member.room_number})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    As {isAdmin ? "Admin" : "Manager"}, you can add guest meals
                    for any member
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.guest_name}
                    onChange={(e) =>
                      setFormData({ ...formData, guest_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.guest_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, guest_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.meal_type}
                    onChange={(e) =>
                      setFormData({ ...formData, meal_type: e.target.value })
                    }
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.meal_date}
                    onChange={(e) =>
                      setFormData({ ...formData, meal_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
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
        </>
      )}

      {/* Guests List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            Guest Meals History
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="p-4 md:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {guest.guest_name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {guest.guest_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Hosted by: {guest.host_name}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="text-sm">
                        <span className="text-gray-400">Meal:</span>
                        <p className="font-medium text-gray-700 capitalize">
                          {guest.meal_type}
                        </p>
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
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-amber-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Phone:</span>
                        <p className="font-medium text-gray-700">
                          {guest.guest_phone || "N/A"}
                        </p>
                      </div>
                    </div>

                    {guest.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        "{guest.notes}"
                      </p>
                    )}
                  </div>

                  {!guest.is_paid && (
                    <button
                      onClick={() => handlePayment(guest.id)}
                      className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors self-start sm:self-center"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Mark Paid</span>
                    </button>
                  )}
                  {canSelectHost && (
                    <button
                      onClick={() =>
                        handleDeleteClick(guest.id, guest.guest_name)
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete guest meal"
                    >
                      <Trash2 className="w-4 h-4" />
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

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDelete}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
              Delete Guest Meal
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete{" "}
              <strong className="text-gray-900">{deleteModal.guestName}</strong>
              's guest meal?
              <br />
              <span className="text-sm text-gray-400">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-rose-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestMeals;
