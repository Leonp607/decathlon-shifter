import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createShift, updateShift, getShiftsByBranch } from '../api/shifts';
import { getBranchStaff } from '../api/branches';
import { useAuth } from '../context/AuthContext';
import { POSITIONS } from '../pages/WeeklyBoardPage';
import Navbar from './Navbar';

/**
 * ShiftForm Component
 * 
 * Handles both creating new shifts and editing existing ones
 * 
 * React Concepts:
 * - useParams: Get route parameters (shift ID if editing)
 * - Form state management: Multiple useState hooks for form fields
 * - Form validation: Client-side validation before submit
 * - Conditional logic: Different behavior for create vs edit
 */

export default function ShiftForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get shift ID from URL if editing
  const { user } = useAuth();
  const isEditMode = !!id; // true if we have an ID (editing), false if creating

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    branch_id: user?.branch_id || '',
    start_time: '',
    end_time: '',
    position: '',
    notes: '',
  });

  // Component state
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Fetch staff list and existing shift data (if editing)
  useEffect(() => {
    fetchStaff();
    if (isEditMode) {
      fetchShiftData();
    }
  }, [id, user?.branch_id]);

  const fetchStaff = async () => {
    if (!user?.branch_id) return;

    try {
      setLoadingStaff(true);
      const staffList = await getBranchStaff(user.branch_id);
      setStaff(staffList);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff list');
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchShiftData = async () => {
    if (!user?.branch_id) return;

    try {
      setLoading(true);
      const shifts = await getShiftsByBranch(user.branch_id);
      const shift = shifts.find((s) => s.id === parseInt(id));

      if (!shift) {
        setError('Shift not found');
        return;
      }

      // Format datetime for input fields (HTML datetime-local format: YYYY-MM-DDTHH:MM)
      const formatForInput = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        user_id: shift.user_id,
        branch_id: shift.branch_id,
        start_time: formatForInput(shift.start_time),
        end_time: formatForInput(shift.end_time),
        position: shift.position,
        notes: shift.notes || '',
      });
    } catch (err) {
      console.error('Error fetching shift:', err);
      setError('Failed to load shift data');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.user_id || !formData.start_time || !formData.end_time || !formData.position) {
      setError('Please fill in all required fields');
      return;
    }

    // Convert datetime strings to ISO format for API
    const shiftData = {
      user_id: formData.user_id,
      branch_id: formData.branch_id,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      position: formData.position,
      notes: formData.notes || null,
    };

    // Validate end_time is after start_time
    if (new Date(shiftData.end_time) <= new Date(shiftData.start_time)) {
      setError('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      if (isEditMode) {
        await updateShift(id, shiftData);
      } else {
        await createShift(shiftData);
      }
      // Redirect to shifts list on success
      navigate('/shifts');
    } catch (err) {
      console.error('Error saving shift:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to save shift. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading shift data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Shift' : 'Create New Shift'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Update shift details' : 'Schedule a new shift for an employee'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                id="user_id"
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                disabled={loading || loadingStaff}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
              >
                <option value="">Select an employee</option>
                {staff.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} ({employee.id})
                  </option>
                ))}
              </select>
              {loadingStaff && (
                <p className="mt-1 text-sm text-gray-500">Loading staff...</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
              />
            </div>

            {/* End Time */}
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
              />
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
              >
                <option value="">Select a position</option>
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Each position should have at least one employee per shift
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                placeholder="Additional notes about this shift..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Shift' : 'Create Shift'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/shifts')}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
