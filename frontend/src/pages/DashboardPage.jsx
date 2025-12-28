import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/**
 * DashboardPage Component
 * 
 * This is the main page users see after logging in
 * 
 * React concepts used:
 * - useAuth: Get current user data
 * - useNavigate: Programmatic navigation (for logout redirect)
 * - Link component: Navigation between pages (from react-router-dom)
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const isStoreLeader = user?.role?.toLowerCase() === 'store leader';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome back, {user?.first_name}!</p>
        </div>

        {/* Quick Actions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* View Shifts Card */}
          <Link
            to="/shifts"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">View Shifts</h3>
                <p className="text-sm text-gray-600">See all scheduled shifts</p>
              </div>
              <div className="text-blue-600 text-2xl">📅</div>
            </div>
          </Link>

          {/* Weekly Board Card (Store Leader only) */}
          {isStoreLeader && (
            <Link
              to="/weekly-board"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Weekly Board</h3>
                  <p className="text-sm text-gray-600">View weekly schedule</p>
                </div>
                <div className="text-indigo-600 text-2xl">📊</div>
              </div>
            </Link>
          )}

          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Profile</h3>
                <p className="text-sm text-gray-600">{user?.role}</p>
              </div>
              <div className="text-purple-600 text-2xl">👤</div>
            </div>
          </div>
        </div>

        {/* User Info Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900 font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-gray-900 font-medium">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="text-gray-900 font-medium">{user?.id}</p>
            </div>
            {user?.branch_id && (
              <div>
                <p className="text-sm text-gray-500">Branch ID</p>
                <p className="text-gray-900 font-medium">{user?.branch_id}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

