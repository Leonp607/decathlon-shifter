import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * DashboardPage Component
 * 
 * This is the main page users see after logging in
 * 
 * React concepts used:
 * - useAuth: Get current user data
 * - useNavigate: Programmatic navigation (for logout redirect)
 */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Decathlon Shifter</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Welcome, {user?.first_name} {user?.last_name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          
          {/* User Info Card */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Your Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
              {user?.branch_id && (
                <p><strong>Branch ID:</strong> {user?.branch_id}</p>
              )}
            </div>
          </div>

          {/* Placeholder for future content */}
          <div className="text-center py-12 text-gray-500">
            <p>Dashboard content coming soon...</p>
            <p className="text-sm mt-2">We'll add shift management, schedule views, and more here!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

