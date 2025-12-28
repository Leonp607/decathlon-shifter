import { useState, useEffect } from 'react';
import { createShift } from '../api/shifts';
import { getBranchStaff } from '../api/branches';
import { useAuth } from '../context/AuthContext';
import { POSITIONS } from '../pages/WeeklyBoardPage';

/**
 * QuickAddShiftModal Component
 * 
 * Modal for quickly adding an employee to a specific shift time
 * 
 * React Concepts:
 * - Modal pattern: Overlay with form
 * - Controlled inputs: Form state management
 * - Event handlers: Close on backdrop click, submit form
 */
export default function QuickAddShiftModal({ isOpen, onClose, date, shiftPeriod, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    user_id: '',
    position: '',
    start_time: '',
    end_time: '',
    notes: '',
  });
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    if (isOpen && user?.branch_id) {
      fetchStaff();
      // Set default times based on shift period
      setDefaultTimes();
    }
  }, [isOpen, date, shiftPeriod, user?.branch_id]);

  const setDefaultTimes = () => {
    // Parse the date string (format: YYYY-MM-DD)
    const dateParts = date.split('T')[0].split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2]);
    
    let startHour, startMinute, endHour, endMinute;

    if (shiftPeriod === 'morning') {
      startHour = 8;
      startMinute = 0;
      endHour = 15;
      endMinute = 0;
    } else if (shiftPeriod === 'afternoon') {
      startHour = 11;
      startMinute = 0;
      endHour = 19;
      endMinute = 30;
    } else if (shiftPeriod === 'evening') {
      startHour = 15;
      startMinute = 0;
      endHour = 22;
      endMinute = 15;
    }

    // Create date objects in local timezone
    const startDate = new Date(year, month, day, startHour, startMinute, 0);
    const endDate = new Date(year, month, day, endHour, endMinute, 0);

    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatForInput = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const h = String(dateObj.getHours()).padStart(2, '0');
      const min = String(dateObj.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d}T${h}:${min}`;
    };

    const startTime = formatForInput(startDate);
    const endTime = formatForInput(endDate);

    console.log('Setting times:', { shiftPeriod, startTime, endTime, date }); // Debug

    setFormData(prev => ({
      ...prev,
      start_time: startTime,
      end_time: endTime,
    }));
  };

  const fetchStaff = async () => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.user_id || !formData.position || !formData.start_time || !formData.end_time) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      // Format datetime for API: Convert YYYY-MM-DDTHH:MM to YYYY-MM-DDTHH:MM:SS
      // Keep it as local time (no timezone conversion)
      const formatForAPI = (datetimeLocal) => {
        // datetimeLocal is in format: YYYY-MM-DDTHH:MM
        // Add seconds and return as-is (local time, no timezone)
        return datetimeLocal + ':00';
      };
      
      const shiftData = {
        user_id: formData.user_id,
        branch_id: user.branch_id,
        start_time: formatForAPI(formData.start_time),
        end_time: formatForAPI(formData.end_time),
        position: formData.position,
        notes: formData.notes || null,
      };

      await createShift(shiftData);
      // Close modal first
      onClose();
      // Then refresh the weekly board (with a small delay to ensure backend has processed)
      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (err) {
      console.error('Error creating shift:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to create shift. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Employee to Shift</h2>
            <p className="text-sm text-gray-600 mt-1">
              {shiftPeriod === 'morning' && '🌅 Morning Shift (08:00 - 15:00)'}
              {shiftPeriod === 'afternoon' && '☀️ Middle Shift (11:00 - 19:30)'}
              {shiftPeriod === 'evening' && '🌙 Evening Shift (15:00 - 22:15)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          {/* Position Selection */}
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
          </div>

          {/* Shift Time Info (Read-only) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-700 mb-1">
              <strong>Shift Time:</strong>
            </p>
            <p className="text-sm font-medium text-gray-900">
              {shiftPeriod === 'morning' && '08:00 - 15:00'}
              {shiftPeriod === 'afternoon' && '11:00 - 19:30'}
              {shiftPeriod === 'evening' && '15:00 - 22:15'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Times are automatically set based on the selected shift period
            </p>
          </div>

          {/* Hidden time inputs (still needed for API) */}
          <input type="hidden" name="start_time" value={formData.start_time} />
          <input type="hidden" name="end_time" value={formData.end_time} />

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
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Shift'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
