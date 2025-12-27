import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage Component
 * 
 * This is a "functional component" - the modern way to write React components
 * It uses "hooks" (useState, useNavigate, useAuth) to add functionality
 * 
 * Key React Concepts:
 * 1. useState - Manages component state (form inputs, error messages)
 * 2. useNavigate - Programmatic navigation (redirect after login)
 * 3. useAuth - Our custom hook to access auth functions
 * 4. Controlled components - Form inputs controlled by React state
 */
export default function LoginPage() {
  // useNavigate hook - lets us redirect programmatically
  const navigate = useNavigate();
  
  // useAuth hook - gives us login function and loading state
  const { login, loading: authLoading } = useAuth();

  // useState hook - creates state variables
  // State is data that can change, and when it changes, React re-renders the component
  const [email, setEmail] = useState(''); // Empty string = empty input
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Error message to show user
  const [isLoading, setIsLoading] = useState(false); // Loading state during login

  /**
   * Handle form submission
   * 
   * In React, we handle form submits manually (not browser default)
   * This gives us control over validation and error handling
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh (default form behavior)

    // Clear previous errors
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Set loading state (shows spinner, disables button)
    setIsLoading(true);

    try {
      // Call login function from AuthContext
      const result = await login(email, password);

      if (result.success) {
        // Login successful - redirect to dashboard
        navigate('/dashboard');
      } else {
        // Login failed - show error message
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      // Catch any unexpected errors
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      // Always stop loading, whether success or fail
      setIsLoading(false);
    }
  };

  /**
   * Controlled Input Pattern:
   * - value={email} - Input shows current state value
   * - onChange={(e) => setEmail(e.target.value)} - Update state when user types
   * 
   * This is the React way - React controls the input, not the browser
   */
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Decathlon Shifter
        </h1>
        <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

        {/* Error Message Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}