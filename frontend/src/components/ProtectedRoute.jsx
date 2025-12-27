import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * This is a "Higher-Order Component" pattern - a wrapper that adds functionality
 * 
 * What it does:
 * - Checks if user is authenticated
 * - If yes: renders the protected page (children)
 * - If no: redirects to login page
 * 
 * Industry pattern: Almost every React app uses this to protect routes
 * 
 * @param {React.ReactNode} children - The component/page to protect
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  // Prevents flash of login page if user is logged in
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  // Navigate component does the redirect (from react-router-dom)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated - render the protected page
  return children;
}


