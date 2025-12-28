import api from './api';

/**
 * Branches API Service
 * Similar pattern to shifts.js - centralized API calls
 */

/**
 * Get all branches
 * @returns {Promise<Array>} Array of branch objects
 */
export const getBranches = async () => {
  const response = await api.get('/branches/');
  return response.data;
};

/**
 * Get a single branch by ID
 * @param {number} branchId - The branch ID
 * @returns {Promise<Object>} Branch object with users
 */
export const getBranch = async (branchId) => {
  const response = await api.get(`/branches/${branchId}`);
  return response.data;
};

/**
 * Get all staff members for a branch
 * @param {number} branchId - The branch ID
 * @returns {Promise<Array>} Array of user objects
 */
export const getBranchStaff = async (branchId) => {
  const response = await api.get(`/users/branch-staff/${branchId}`);
  return response.data;
};
