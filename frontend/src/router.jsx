import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ShiftsListPage from './pages/ShiftsListPage'
import WeeklyBoardPage from './pages/WeeklyBoardPage'
import MyShiftsPage from './pages/MyShiftsPage'
import ShiftForm from './components/ShiftForm'
import ProtectedRoute from './components/ProtectedRoute'

/**
 * Router Configuration
 * 
 * This defines all the routes (pages) in our application
 * 
 * Route Structure:
 * - "/" - Public route (login page)
 * - "/dashboard" - Protected route (requires authentication)
 * - "/my-shifts" - Protected route (user's own shifts)
 * - "/shifts" - Protected route (shift analytics)
 * - "/shifts/edit/:id" - Protected route (edit existing shift)
 * - "/weekly-board" - Protected route (weekly schedule view)
 * 
 * Industry pattern: Use protected routes for authenticated pages
 * Dynamic routes use :id parameter to pass data
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
  {
    path: '/my-shifts',
    element: (
      <ProtectedRoute>
        <MyShiftsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/shifts',
    element: (
      <ProtectedRoute>
        <ShiftsListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/shifts/edit/:id',
    element: (
      <ProtectedRoute>
        <ShiftForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/weekly-board',
    element: (
      <ProtectedRoute>
        <WeeklyBoardPage />
      </ProtectedRoute>
    ),
  },
  // Catch-all route - redirect unknown paths to dashboard if logged in, or login if not
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
