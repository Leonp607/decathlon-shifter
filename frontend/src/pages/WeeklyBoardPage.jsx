import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWeeklyBoard } from '../api/shifts';
import QuickAddShiftModal from '../components/QuickAddShiftModal';
import Navbar from '../components/Navbar';

/**
 * WeeklyBoardPage Component
 * 
 * Displays a weekly schedule view showing:
 * - Total employees per shift (morning, afternoon, evening) at the top of each day
 * - List of employees working in each shift period
 * 
 * React Concepts:
 * - Date manipulation: Calculating week start dates
 * - useEffect with dependencies: Refetch when week changes
 * - Complex data rendering: Nested arrays and objects
 * - Conditional rendering: Show different content based on data
 */

// Define the 7 positions (Capitan at top)
export const POSITIONS = [
  'Capitan (Shift manager)',
  'Cashtill',
  'Quechua (Hiking department)',
  'Mobility department',
  'Domyos (fitness department)',
  'Wedze (Ski department)',
  'Fitting rooms',
];

export default function WeeklyBoardPage() {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null); // {date, period}
  const isStoreLeader = user?.role?.toLowerCase() === 'store leader';
  const [weekStart, setWeekStart] = useState(() => {
    // Start with current week's Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  useEffect(() => {
    fetchWeeklyBoard();
  }, [weekStart, user?.branch_id]);

  const fetchWeeklyBoard = async () => {
    if (!user?.branch_id) {
      setError('No branch assigned');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Format date as YYYY-MM-DD for API
      const dateString = weekStart.toISOString().split('T')[0];
      const data = await getWeeklyBoard(user.branch_id, dateString);
      console.log('Weekly board data:', data); // Debug log
      setWeeklyData(data);
    } catch (err) {
      console.error('Error fetching weekly board:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to load weekly board';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
  };

  // Navigate to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeekStart(monday);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get day name
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Handle shift click to add employee
  const handleShiftClick = (date, period) => {
    if (isStoreLeader) {
      setSelectedShift({ date, period });
      setModalOpen(true);
    }
  };

  // Handle successful shift creation
  const handleShiftAdded = () => {
    console.log('Refreshing weekly board after shift creation...');
    fetchWeeklyBoard();
  };

  // Render position columns for a shift period
  const renderPositionColumns = (day, period) => {
    const periodKey = `${period}_by_position`;
    const positionsData = day[periodKey] || {};
    
    // Debug: Log the data structure
    if (Object.keys(positionsData).length > 0) {
      console.log(`Position data for ${period}:`, positionsData);
    }
    
    // Get all positions, even if empty
    return POSITIONS.map((position) => {
      const employees = positionsData[position] || [];
      return (
        <div
          key={position}
          className="mb-0.5 border-b border-gray-300 last:border-b-0 pb-0.5 last:pb-0"
        >
          <div className="text-[9px] font-bold text-gray-800 mb-0 leading-tight uppercase tracking-tight">
            {position}
          </div>
          {employees.length > 0 ? (
            <ul className="space-y-0">
              {employees.map((employee, idx) => {
                // Handle both old format (string) and new format (object with name and notes)
                const employeeName = typeof employee === 'string' ? employee : employee.name;
                const employeeNotes = typeof employee === 'object' && employee.notes ? employee.notes : null;
                
                return (
                  <li
                    key={idx}
                    className="text-xs bg-gradient-to-r from-gray-50 to-white px-1.5 py-1 rounded border-2 border-gray-500 leading-tight font-extrabold flex items-center justify-between gap-2 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <span className="flex-shrink-0 font-extrabold text-gray-950 tracking-tight">{employeeName}</span>
                    {employeeNotes && (
                      <span className="text-[10px] text-gray-600 italic font-normal flex-shrink-0 text-right max-w-[60%] truncate" title={employeeNotes}>
                        {employeeNotes}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[8px] text-gray-400 italic leading-tight pl-1">-</p>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading weekly board...</div>
      </div>
    );
  }

  if (error && !weeklyData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchWeeklyBoard}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const schedule = weeklyData?.schedule || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-3">
        {/* Week Navigation */}
        <div className="mb-3 flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
            <p className="text-xs text-gray-600 mt-0.5 font-medium">
              {weekStart.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric' 
              })} - {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={goToPreviousWeek}
              className="px-6 py-3 text-base font-medium border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-colors min-h-[44px]"
            >
              ← Previous
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-6 py-3 text-base font-medium border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-colors min-h-[44px]"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="px-6 py-3 text-base font-medium border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-colors min-h-[44px]"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Weekly Board Grid */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full" style={{ width: '100%' }}>
              {schedule.map((day, index) => (
                <div
                  key={day.date}
                  className="flex-shrink-0 border-r-2 border-gray-300 last:border-r-0 bg-white"
                  style={{ width: 'calc(100% / 7)', minWidth: '200px' }}
                >
                  {/* Day Header with Totals */}
                  <div className="bg-gradient-to-b from-blue-100 to-blue-50 p-1 border-b-2 border-blue-300">
                    <div className="font-bold text-[10px] text-gray-900 mb-0 leading-tight">
                      {getDayName(day.date)}
                    </div>
                    <div className="text-[9px] text-gray-700 mb-1 leading-tight font-medium">
                      {formatDate(day.date)}
                    </div>
                    
                    {/* Totals at the top */}
                    <div className="grid grid-cols-3 gap-0.5 text-[9px]">
                      <div className="bg-white px-1 py-0.5 rounded border border-gray-300 text-center">
                        <div className="text-[8px] text-gray-600 font-medium">M</div>
                        <div className="font-bold text-gray-900 text-[10px]">
                          {day.counts?.morning || 0}
                        </div>
                      </div>
                      <div className="bg-white px-1 py-0.5 rounded border border-gray-300 text-center">
                        <div className="text-[8px] text-gray-600 font-medium">Mid</div>
                        <div className="font-bold text-gray-900 text-[10px]">
                          {day.counts?.afternoon || 0}
                        </div>
                      </div>
                      <div className="bg-white px-1 py-0.5 rounded border border-gray-300 text-center">
                        <div className="text-[8px] text-gray-600 font-medium">E</div>
                        <div className="font-bold text-gray-900 text-[10px]">
                          {day.counts?.evening || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shift Periods */}
                  <div>
                    {/* Morning Shift */}
                    <div className="p-0.5 bg-yellow-50 border-l-4 border-yellow-500 mb-1 shadow-sm">
                      <div className="font-bold text-[9px] text-gray-900 mb-0.5 flex justify-between items-center leading-tight bg-yellow-100 px-1 py-0.5 rounded">
                        <span className="text-gray-800">🌅 Morning (08:00-15:00)</span>
                        {isStoreLeader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftClick(day.date, 'morning');
                            }}
                            className="w-3.5 h-3.5 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[10px] font-bold leading-none"
                            title="Add employee to this shift"
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div>
                        {renderPositionColumns(day, 'morning')}
                      </div>
                    </div>

                    {/* Afternoon Shift */}
                    <div className="p-0.5 bg-orange-50 border-l-4 border-orange-500 mb-1 shadow-sm">
                      <div className="font-bold text-[9px] text-gray-900 mb-0.5 flex justify-between items-center leading-tight bg-orange-100 px-1 py-0.5 rounded">
                        <span className="text-gray-800">☀️ Middle (11:00-19:30)</span>
                        {isStoreLeader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftClick(day.date, 'afternoon');
                            }}
                            className="w-3.5 h-3.5 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[10px] font-bold leading-none"
                            title="Add employee to this shift"
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div>
                        {renderPositionColumns(day, 'afternoon')}
                      </div>
                    </div>

                    {/* Evening Shift */}
                    <div className="p-0.5 bg-purple-50 border-l-4 border-purple-500 shadow-sm">
                      <div className="font-bold text-[9px] text-gray-900 mb-0.5 flex justify-between items-center leading-tight bg-purple-100 px-1 py-0.5 rounded">
                        <span className="text-gray-800">🌙 Evening (15:00-22:15)</span>
                        {isStoreLeader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftClick(day.date, 'evening');
                            }}
                            className="w-3.5 h-3.5 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[10px] font-bold leading-none"
                            title="Add employee to this shift"
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div>
                        {renderPositionColumns(day, 'evening')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-2 bg-blue-50 border border-blue-300 rounded-lg p-2 shadow-sm">
          <p className="text-[10px] text-blue-900 font-medium">
            <strong className="font-bold">Shift Times:</strong> Morning: 08:00-15:00 | Middle: 11:00-19:30 | Evening: 15:00-22:15
          </p>
        </div>
      </main>

      {/* Quick Add Shift Modal */}
      {selectedShift && (
        <QuickAddShiftModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedShift(null);
          }}
          date={selectedShift.date}
          shiftPeriod={selectedShift.period}
          onSuccess={handleShiftAdded}
        />
      )}
    </div>
  );
}
