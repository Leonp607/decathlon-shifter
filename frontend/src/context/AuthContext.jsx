import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

/**
 * AuthContext - This is the heart of our authentication system
 * 
 * In React, Context API lets us share data across components without "prop drilling"
 * (passing props through many layers of components).
 * 
 * Industry pattern: Most React apps use Context for global state like auth, theme, etc.
 */

// Step 1: Create the context
// This creates a "box" where we can store and share auth data
const AuthContext = createContext(null);

/**
 * Custom hook to use auth context
 * This is a React pattern - we create a hook so components can easily access auth
 * Instead of: useContext(AuthContext), we use: useAuth()
 * 
 * Why? It's cleaner and provides better error messages if context is missing
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider Component
 * This wraps our app and provides auth state to all child components
 * 
 * What it does:
 * 1. Manages user state (logged in user data)
 * 2. Manages loading state (checking if user is logged in)
 * 3. Handles login/logout
 * 4. Automatically checks if user is logged in when app starts
 */
export const AuthProvider = ({ children }) => {
  // useState is a React Hook - it lets us store data that can change
  // When state changes, React automatically re-renders components using it
  const [user, setUser] = useState(null); // null = not logged in, object = logged in user
  const [loading, setLoading] = useState(true); // true while checking auth status

  /**
   * Check if user is already logged in (has valid token)
   * This runs once when the app starts (useEffect with empty dependency array)
   */
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // If no token, user is not logged in
      if (!token) {
        setLoading(false);
        return;
      }

      // Try to fetch current user info using the token
      // This validates that the token is still valid
      const response = await api.get('/users/me');
      setUser(response.data); // Store user data in state
    } catch (error) {
      // If request fails, token is invalid - clear it
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      // Always stop loading, whether success or fail
      setLoading(false);
    }
  };

  /**
   * Login function
   * @param {string} email - User's email
   * @param {string} password - User's password
   * 
   * This is async because API calls take time (network request)
   * async/await is modern JavaScript - makes async code easier to read
   */
  const login = async (email, password) => {
    try {
      // FormData is required by OAuth2PasswordRequestForm in FastAPI
      // username field = email (OAuth2 standard uses "username" for email)
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      // Make API call to login endpoint
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Required for FormData
        },
      });

      // Store token in localStorage (persists even after page refresh)
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);

      // Fetch user details using the token
      const userResponse = await api.get('/users/me');
      setUser(userResponse.data);

      return { success: true };
    } catch (error) {
      // Handle errors (wrong password, network error, etc.)
      console.error('Login failed:', error);
      
      // Return error message to show to user
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      return { success: false, error: message };
    }
  };

  /**
   * Logout function
   * Clears token and user data
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  /**
   * Value object - everything we want to share with child components
   * This is what components get when they use useAuth()
   */
  const value = {
    user,        // Current logged in user (null if not logged in)
    loading,     // true while checking auth status
    login,       // Function to log in
    logout,      // Function to log out
    isAuthenticated: !!user, // Boolean: true if user exists
  };

  // Provide the value to all child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


