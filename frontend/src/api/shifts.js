import api from './api';

/**
 * Shifts API Service
 * 
 * This file contains all the functions to interact with the shifts API
 * 
 * Industry Pattern: Service/API layer separation
 * - Keeps API calls organized in one place
 * - Easy to update if API changes
 * - Reusable across components
 */

/**
 * Get all shifts for a specific branch
 * @param {number} branchId - The branch ID
 * @returns {Promise<Array>} Array of shift objects
 */
export const getShiftsByBranch = async (branchId) => {
  const response = await api.get(`/shifts/branch/${branchId}`);
  return response.data;
};

/**
 * Create a new shift
 * @param {Object} shiftData - Shift data (user_id, branch_id, start_time, end_time, position, notes)
 * @returns {Promise<Object>} Created shift object
 */
export const createShift = async (shiftData) => {
  const response = await api.post('/shifts/', shiftData);
  return response.data;
};

/**
 * Update an existing shift
 * @param {number} shiftId - The shift ID to update
 * @param {Object} shiftData - Updated shift data
 * @returns {Promise<Object>} Updated shift object
 */
export const updateShift = async (shiftId, shiftData) => {
  const response = await api.put(`/shifts/${shiftId}`, shiftData);
  return response.data;
};

/**
 * Delete a shift
 * @param {number} shiftId - The shift ID to delete
 * @returns {Promise<void>}
 */
export const deleteShift = async (shiftId) => {
  await api.delete(`/shifts/${shiftId}`);
};

/**
 * Get weekly board view for a branch
 * @param {number} branchId - The branch ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @returns {Promise<Object>} Weekly report object
 */
export const getWeeklyBoard = async (branchId, startDate) => {
  const response = await api.get(`/shifts/weekly-board/${branchId}`, {
    params: { start_date: startDate },
  });
  return response.data;
};

/**
 * Get shift summary for a specific date
 * @param {number} branchId - The branch ID
 * @param {string} targetDate - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Summary object with morning/afternoon/evening counts
 */
export const getShiftSummary = async (branchId, targetDate) => {
  const response = await api.get(`/shifts/summary/${branchId}`, {
    params: { target_date: targetDate },
  });
  return response.data;
};

/**
 * Get weekly hours by position for a branch
 * @param {number} branchId - The branch ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @returns {Promise<Object>} Object with hours_by_position dictionary
 */
export const getWeeklyHoursByPosition = async (branchId, startDate) => {
  const response = await api.get(`/shifts/weekly-hours/${branchId}`, {
    params: { start_date: startDate },
  });
  return response.data;
};

/**
 * Get all shifts for a specific employee
 * @param {number} branchId - The branch ID
 * @param {string} userId - The user/employee ID
 * @returns {Promise<Array>} Array of shift objects
 */
export const getShiftsByEmployee = async (branchId, userId) => {
  const response = await api.get(`/shifts/employee/${branchId}/${userId}`);
  return response.data;
};

/**
 * Get all shifts for the currently authenticated user
 * @returns {Promise<Array>} Array of shift objects
 */
export const getMyShifts = async () => {
  const response = await api.get('/shifts/my-shifts');
  return response.data;
};
