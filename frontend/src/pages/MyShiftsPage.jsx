import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyShifts } from '../api/shifts';
import Navbar from '../components/Navbar';

/**
 * MyShiftsPage Component
 * 
 * Modern weekly board view showing the user's shifts organized by day and shift period
 * 
 * React Concepts:
 * - useEffect: Fetch shifts when component mounts or week changes
 * - useState: Manage shifts data, loading states, and week navigation
 * - Date manipulation: Week calculations and shift categorization
 * - Conditional rendering: Show different UI based on data
 */

export default function MyShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => {
    // Start with current week's Sunday
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - day; // Go back to Sunday
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  useEffect(() => {
    fetchMyShifts();
  }, [weekStart]);

  const fetchMyShifts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyShifts();
      // Sort by start_time (ascending - earliest first)
      const sortedData = data.sort((a, b) => 
        new Date(a.start_time) - new Date(b.start_time)
      );
      setShifts(sortedData);
    } catch (err) {
      console.error('Error fetching my shifts:', err);
      setError('Failed to load your shifts. Please try again.');
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
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - day; // Go back to Sunday
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    setWeekStart(sunday);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get day name
  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Format time (HH:MM)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Calculate duration in hours
  const calculateHours = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = (end - start) / (1000 * 60 * 60);
    return parseFloat(diff.toFixed(2));
  };

  // Categorize shift by period (Morning, Middle, Evening)
  const categorizeShift = (startTime) => {
    const date = new Date(startTime);
    const hour = date.getHours();
    const minute = date.getMinutes();

    if (8 <= hour && hour < 11) {
      return 'morning';
    } else if (11 <= hour && hour < 15) {
      return 'middle';
    } else if (15 <= hour && hour < 19) {
      return 'evening';
    } else if (hour === 19) {
      return minute < 30 ? 'middle' : 'evening';
    } else if (hour >= 20 && hour <= 22) {
      return 'evening';
    }
    return 'evening'; // Default
  };

  // Organize shifts by day and period for the current week
  const organizeShiftsByWeek = () => {
    const weekData = {};
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      weekData[dateKey] = {
        date: new Date(date), // Store a copy
        morning: [],
        middle: [],
        evening: []
      };
    }

    // Filter and categorize shifts for the current week
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      
      // Only include shifts within the current week
      if (shiftDate >= weekStart && shiftDate <= weekEnd) {
        const dateKey = shiftDate.toISOString().split('T')[0];
        
        if (weekData[dateKey]) {
          const period = categorizeShift(shift.start_time);
          weekData[dateKey][period].push(shift);
        }
      }
    });

    return weekData;
  };

  // Render shift card with modern design
  const renderShiftCard = (shift, period) => {
    const hours = calculateHours(shift.start_time, shift.end_time);
    
    // Different color schemes based on shift period
    const colorSchemes = {
      morning: {
        gradient: 'from-yellow-50 to-amber-50',
        border: 'border-yellow-300',
        text: 'text-amber-900',
        badge: 'bg-yellow-500 text-white',
        iconBg: 'bg-yellow-100',
        timeText: 'text-amber-700'
      },
      middle: {
        gradient: 'from-orange-50 to-amber-50',
        border: 'border-orange-300',
        text: 'text-orange-900',
        badge: 'bg-orange-500 text-white',
        iconBg: 'bg-orange-100',
        timeText: 'text-orange-700'
      },
      evening: {
        gradient: 'from-purple-50 to-indigo-50',
        border: 'border-purple-300',
        text: 'text-purple-900',
        badge: 'bg-purple-500 text-white',
        iconBg: 'bg-purple-100',
        timeText: 'text-purple-700'
      }
    };
    
    const colors = colorSchemes[period] || colorSchemes.evening;
    
    return (
      <div 
        key={shift.id}
        className={`bg-gradient-to-br ${colors.gradient} border-l-4 ${colors.border} rounded-lg p-3 mb-2 shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Time and Duration */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className={`flex items-center gap-1.5 ${colors.timeText}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold text-sm">
                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                </span>
              </div>
              <span className={`${colors.badge} text-xs font-bold px-2 py-1 rounded-full shadow-sm`}>
                {hours}h
              </span>
            </div>
            
            {/* Position */}
            <div className={`flex items-center gap-2 mb-2 ${colors.text}`}>
              <div className={`w-8 h-8 ${colors.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-sm leading-tight">
                {shift.position}
              </span>
            </div>
            
            {/* Notes */}
            {shift.notes && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-xs text-gray-600 leading-relaxed italic">
                    {shift.notes}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading your shifts...</div>
      </div>
    );
  }

  const weekData = organizeShiftsByWeek();
  const weekDays = Object.keys(weekData).sort();

  // Calculate totals for the current week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const weekShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });

  const totalShifts = weekShifts.length;
  const totalHours = weekShifts.reduce((sum, shift) => 
    sum + calculateHours(shift.start_time, shift.end_time), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">My Shifts</h2>
          <p className="text-gray-600 mt-1">
            Welcome, <span className="font-semibold">{user?.first_name}</span>! Here's your weekly schedule.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Week Navigation */}
        <div className="mb-6 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatDate(weekStart)} (Sun) - {formatDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000))} (Sat)
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Current week view</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={goToPreviousWeek}
                className="px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                This Week
              </button>
              <button
                onClick={goToNextWeek}
                className="px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Board */}
        {weekDays.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border-2 border-gray-200 p-12 text-center">
            <div className="text-7xl mb-6 animate-bounce">📅</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">No shifts this week</p>
            <p className="text-gray-500 text-sm">Your shifts will appear here when they are scheduled.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="inline-flex min-w-full" style={{ height: '700px' }}>
                {weekDays.map((dateKey) => {
                  const dayData = weekData[dateKey];
                  const isToday = dateKey === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div
                      key={dateKey}
                      className={`flex-shrink-0 border-r-2 ${isToday ? 'border-blue-400' : 'border-gray-200'} last:border-r-0 ${
                        isToday ? 'bg-gradient-to-b from-blue-50 to-white' : 'bg-white'
                      } shadow-sm ${isToday ? 'shadow-blue-200' : ''} flex flex-col`}
                      style={{ width: 'calc(100% / 7)', minWidth: '200px', minHeight: '700px' }}
                    >
                      {/* Day Header */}
                      <div className={`${isToday ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200'} p-4 border-b-2 ${isToday ? 'border-blue-500' : 'border-gray-300'} relative flex-shrink-0`}>
                        {isToday && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-white text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              TODAY
                            </span>
                          </div>
                        )}
                        <div className={`font-bold text-base ${isToday ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {getDayName(dayData.date)}
                        </div>
                        <div className={`text-xs ${isToday ? 'text-blue-100' : 'text-gray-600'} font-medium`}>
                          {formatDate(dayData.date)}
                        </div>
                      </div>

                      {/* Shift Periods */}
                      <div className="p-3 space-y-4 flex flex-col h-full">
                        {/* Morning Shift */}
                        <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: '180px', maxHeight: '180px' }}>
                          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border border-yellow-200 flex-shrink-0">
                            <span className="text-base">🌅</span>
                            <div className="flex-1">
                              <div className="text-xs font-bold text-yellow-900 uppercase tracking-wide">Morning</div>
                              <div className="text-[10px] text-yellow-700 font-medium">08:00 - 15:00</div>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto min-h-0">
                            {dayData.morning.length > 0 ? (
                              <div>
                                {dayData.morning.map(shift => renderShiftCard(shift, 'morning'))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic px-3 py-6 h-full text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                                No shift
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Shift */}
                        <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: '180px', maxHeight: '180px' }}>
                          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg border border-orange-200 flex-shrink-0">
                            <span className="text-base">☀️</span>
                            <div className="flex-1">
                              <div className="text-xs font-bold text-orange-900 uppercase tracking-wide">Middle</div>
                              <div className="text-[10px] text-orange-700 font-medium">11:00 - 19:30</div>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto min-h-0">
                            {dayData.middle.length > 0 ? (
                              <div>
                                {dayData.middle.map(shift => renderShiftCard(shift, 'middle'))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic px-3 py-6 h-full text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                                No shift
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Evening Shift */}
                        <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: '180px', maxHeight: '180px' }}>
                          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200 flex-shrink-0">
                            <span className="text-base">🌙</span>
                            <div className="flex-1">
                              <div className="text-xs font-bold text-purple-900 uppercase tracking-wide">Evening</div>
                              <div className="text-[10px] text-purple-700 font-medium">15:00 - 22:15</div>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto min-h-0">
                            {dayData.evening.length > 0 ? (
                              <div>
                                {dayData.evening.map(shift => renderShiftCard(shift, 'evening'))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic px-3 py-6 h-full text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                                No shift
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {totalShifts > 0 && (
          <div className="mt-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl p-8 border-2 border-blue-400">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Week Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-100 text-sm font-medium">Total Shifts</p>
                </div>
                <p className="text-4xl font-extrabold text-white">{totalShifts}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-100 text-sm font-medium">Total Hours</p>
                </div>
                <p className="text-4xl font-extrabold text-white">{totalHours.toFixed(1)}h</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-blue-100 text-sm font-medium">Avg. per Day</p>
                </div>
                <p className="text-4xl font-extrabold text-white">
                  {weekDays.length > 0 ? (totalHours / weekDays.length).toFixed(1) : 0}h
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
