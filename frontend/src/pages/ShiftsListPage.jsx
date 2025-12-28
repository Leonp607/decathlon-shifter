import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWeeklyHoursByPosition, getShiftsByEmployee } from '../api/shifts';
import { getBranchStaff } from '../api/branches';
import Navbar from '../components/Navbar';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * ShiftsListPage Component
 * 
 * Analytics dashboard showing:
 * - Weekly hours by position (with week filter)
 * - Pie chart visualization
 * - Employee shift search
 * 
 * React Concepts:
 * - useEffect: Fetch data when component mounts or week changes
 * - useState: Manage analytics data, week selection, employee search
 * - Chart library integration: Recharts for data visualization
 * - Date manipulation: Week calculations
 */

// Colors for pie chart
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ShiftsListPage() {
  const { user } = useAuth();
  const [hoursData, setHoursData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => {
    // Start with current week's Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  // Employee search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeShifts, setEmployeeShifts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetchWeeklyHours();
    fetchStaff();
  }, [weekStart, user?.branch_id]);

  const fetchWeeklyHours = async () => {
    if (!user?.branch_id) {
      setError('No branch assigned');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const dateString = weekStart.toISOString().split('T')[0];
      const data = await getWeeklyHoursByPosition(user.branch_id, dateString);
      setHoursData(data);
    } catch (err) {
      console.error('Error fetching weekly hours:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!user?.branch_id) return;
    try {
      const staffList = await getBranchStaff(user.branch_id);
      setStaff(staffList);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const handleEmployeeSearch = async () => {
    if (!employeeSearch.trim() || !user?.branch_id) return;
    
    try {
      setSearching(true);
      setError('');
      const shifts = await getShiftsByEmployee(user.branch_id, employeeSearch.trim());
      setEmployeeShifts(shifts);
    } catch (err) {
      console.error('Error fetching employee shifts:', err);
      setError('Failed to load employee shifts. Please check the employee ID.');
      setEmployeeShifts([]);
    } finally {
      setSearching(false);
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeekStart(monday);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Prepare data for pie chart
  const chartData = hoursData?.hours_by_position 
    ? Object.entries(hoursData.hours_by_position)
        .map(([position, hours]) => ({
          name: position,
          value: parseFloat(hours.toFixed(2))
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const totalHours = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading && !hoursData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Shift Analytics</h2>
          <p className="text-gray-600 mt-1">View hours by position and employee shifts</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Week Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Week Selection</h3>
              <p className="text-sm text-gray-600">
                {formatDate(weekStart)} - {formatDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousWeek}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNextWeek}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Hours by Position Table and Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Hours by Position</h3>
            {chartData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No shifts found for this week</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Hours</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item, index) => (
                      <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{item.name}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {item.value.toFixed(2)}h
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {totalHours > 0 ? ((item.value / totalHours) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4 text-gray-900">Total</td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {totalHours.toFixed(2)}h
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Hours Distribution</h3>
            {chartData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data to display</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(2)} hours`, 'Hours']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Employee Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Search Shifts by Employee</h3>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmployeeSearch()}
                placeholder="Enter Employee ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                list="employee-list"
              />
              <datalist id="employee-list">
                {staff.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </datalist>
            </div>
            <button
              onClick={handleEmployeeSearch}
              disabled={searching || !employeeSearch.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {employeeShifts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Found {employeeShifts.length} shift(s) for employee: {employeeSearch}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Position
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employeeShifts.map((shift) => (
                      <tr key={shift.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDateTime(shift.start_time).split(',')[0]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {shift.position}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {shift.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
