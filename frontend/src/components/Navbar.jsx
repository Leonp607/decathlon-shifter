import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Navbar Component
 * 
 * Modern navigation bar with:
 * - Gradient background
 * - Active route highlighting
 * - Smooth transitions
 * - Responsive design
 * - User info display
 * 
 * React Concepts:
 * - useLocation: Get current route for active link styling
 * - useAuth: Access user data and logout function
 * - useNavigate: Programmatic navigation
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStoreLeader = user?.role?.toLowerCase() === 'store leader';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Nav link styling
  const navLinkClass = (path) => {
    const baseClass = "px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm";
    if (isActive(path)) {
      return `${baseClass} bg-white text-blue-600 shadow-md font-semibold`;
    }
    return `${baseClass} text-white hover:bg-white/20 hover:text-white`;
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg border-b-4 border-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 group-hover:bg-white/30 transition-all duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Decathlon <span className="text-blue-100">Shifter</span>
              </h1>
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex gap-2 items-center">
              <Link
                to="/dashboard"
                className={navLinkClass('/dashboard')}
              >
                Dashboard
              </Link>
              <Link
                to="/my-shifts"
                className={navLinkClass('/my-shifts')}
              >
                My Shifts
              </Link>
              <Link
                to="/shifts"
                className={navLinkClass('/shifts')}
              >
                Shifts
              </Link>
              {isStoreLeader && (
                <Link
                  to="/weekly-board"
                  className={navLinkClass('/weekly-board')}
                >
                  Weekly Board
                </Link>
              )}
            </nav>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-medium">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-blue-100 text-xs">
                  {user?.role || 'User'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

