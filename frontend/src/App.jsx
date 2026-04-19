import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Pipeline from './pages/Pipeline'
import Profile from './pages/Profile'
import HowItWorks from './pages/HowItWorks'
import Simulator from './pages/Simulator'
import Learning from './pages/Learning'
import Market from './pages/Market'
import JobDetail from './pages/JobDetail'
import Login from './pages/Login'
import Register from './pages/Register'

function PublicShell() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Outlet />
      </main>
    </div>
  )
}

function AppShell() {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicShell />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Route>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="profile" element={<Profile />} />
            <Route path="simulator" element={<Simulator />} />
            <Route path="learning" element={<Learning />} />
            <Route path="market" element={<Market />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
