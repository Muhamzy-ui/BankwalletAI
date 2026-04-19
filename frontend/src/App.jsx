import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Channels from './pages/Channels'
import Posts from './pages/Posts'
import Schedule from './pages/Schedule'
import Captions from './pages/Captions'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Gallery from './pages/Gallery'

export default function App() {
  const { token } = useAuth()
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="channels" element={<Channels />} />
          <Route path="posts" element={<Posts />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="captions" element={<Captions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="mapper" element={<Gallery />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}