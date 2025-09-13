import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Devices from './pages/Devices'
import Records from './pages/Records'
import Persons from './pages/Persons'
import Backoffice from './pages/Backoffice'
import MySpace from './pages/MySpace'
import Navbar from './components/Navbar'

function useAuth() {
  const token = localStorage.getItem('token')
  return !!token
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  const authed = useAuth()
  const location = useLocation()
  return authed ? children : <Navigate to="/login" state={{ from: location }} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Navbar /></PrivateRoute>}>
        <Route index element={<Navigate to="/devices" replace />} />
        <Route path="devices" element={<Devices />} />
        <Route path="records" element={<Records />} />
        <Route path="persons" element={<Persons />} />
        <Route path="backoffice" element={<Backoffice />} />
        <Route path="my-space" element={<MySpace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
