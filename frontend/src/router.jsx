import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'

/**
 * Router Configuration
 * 
 * This defines all the routes (pages) in our application
 * 
 * Route Structure:
 * - "/" - Public route (login page)
 * - "/dashboard" - Protected route (requires authentication)
 * 
 * Industry pattern: Use protected routes for authenticated pages
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  // Catch-all route - redirect unknown paths to dashboard if logged in, or login if not
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
