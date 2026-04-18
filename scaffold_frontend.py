import os

BASE = r"C:\Users\HP\Desktop\AI\telebot-pro\frontend\src"

def setup():
    dirs = ['api', 'context', 'components', 'pages']
    for d in dirs:
        os.makedirs(os.path.join(BASE, d), exist_ok=True)

    files = {
        'index.css': """
:root {
  --bg: #0b1426;
  --panel: #1b2a47;
  --text-main: #ffffff;
  --text-muted: #8b9ac1;
  --brand: #2d6ff7;
  --brand-hover: #4e88fa;
  --success: #15d186;
  --danger: #e3195f;
}

body {
  margin: 0;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background-color: var(--bg);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
}

.glass-panel {
  background: var(--panel);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 24px;
}

.btn {
  background: var(--brand);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn:hover { background: var(--brand-hover); }

input, select {
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 12px;
  border-radius: 6px;
  width: 100%;
  margin-bottom: 16px;
}
""",
        
        'main.jsx': """
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
""",
        'App.jsx': """
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
""",
        'api/client.js': """
import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;
""",
        'context/AuthContext.jsx': """
import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));

    const login = async (username, password) => {
        try {
            const res = await client.post('auth/login/', { username, password });
            localStorage.setItem('access_token', res.data.access);
            setToken(res.data.access);
            return true;
        } catch (error) {
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
""",
        'components/Layout.jsx': """
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Send, Calendar, Image as ImageIcon, BarChart2, Settings as SettingsIcon, LogOut, Radio } from 'lucide-react';

export default function Layout() {
    const { logout } = useAuth();
    
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <aside style={{ width: '250px', background: 'var(--panel)', padding: '20px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 style={{ color: 'var(--brand)', marginBottom: '40px', display:'flex', alignItems:'center', gap:'10px' }}><Radio /> Telebot Pro</h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Link to="/" style={{ color: 'white', textDecoration: 'none', display:'flex', gap:'10px' }}><Home size={20}/> Dashboard</Link>
                    <Link to="/channels" style={{ color: 'white', textDecoration: 'none', display:'flex', gap:'10px' }}><Send size={20}/> Channels</Link>
                    <Link to="/posts" style={{ color: 'white', textDecoration: 'none', display:'flex', gap:'10px' }}><ImageIcon size={20}/> Post Generator</Link>
                    <Link to="/schedule" style={{ color: 'white', textDecoration: 'none', display:'flex', gap:'10px' }}><Calendar size={20}/> Schedule Windows</Link>
                    <Link to="/captions" style={{ color: 'white', textDecoration: 'none', display:'flex', gap:'10px' }}><SettingsIcon size={20}/> AI Captions</Link>
                    <Link to="/analytics" style={{ color: 'white', textDecoration: 'none', display:'flex', gap:'10px' }}><BarChart2 size={20}/> Analytics</Link>
                    <button onClick={logout} style={{ background: 'transparent', color: 'var(--danger)', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: '40px', display:'flex', gap:'10px', fontSize:'16px' }}>
                        <LogOut size={20}/> Logout
                    </button>
                </nav>
            </aside>
            <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}
""",
        'pages/Login.jsx': """
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(username, password);
        if (!success) setError('Invalid credentials');
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ textAlign: 'center', color: 'var(--brand)', display:'flex', justifyContent:'center', gap:'10px', alignItems:'center' }}><Radio /> Telebot Pro</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Login to access your bot dashboard</p>
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit" className="btn" style={{ width: '100%' }}>Login</button>
                </form>
            </div>
        </div>
    );
}
""",
        'pages/Dashboard.jsx': """
import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        client.get('dashboard/').then(res => setStats(res.data)).catch(console.error);
    }, []);

    if (!stats) return <p>Loading Dashboard...</p>;

    return (
        <div>
            <h1>Dashboard Overview</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '30px' }}>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Active Channels</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--brand)' }}>{stats.active_channels}</h1>
                </div>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Posts Queued</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--success)' }}>{stats.queued_posts}</h1>
                </div>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Sent Today</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--brand)' }}>{stats.sent_today}</h1>
                </div>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Failed Posts</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--danger)' }}>{stats.failed_posts}</h1>
                </div>
            </div>
        </div>
    );
}
""",
        'pages/Channels.jsx': """export default function Channels() { return <div><h1>Manage Channels</h1><div className="glass-panel"><p>Add your Telegram Channels here.</p></div></div>; }""",
        'pages/Posts.jsx': """
import { useState } from 'react';
import client from '../api/client';

export default function Posts() {
    const [status, setStatus] = useState('');
    const [formData, setFormData] = useState({ channel_id: '1', bank_type: 'moniepoint', amount: 850000 });

    const handleGenerate = async (e) => {
        e.preventDefault();
        setStatus('Generating receipt and pushing to Telegram...');
        try {
            await client.post('bot/generate-receipt/', formData);
            setStatus('✅ Success! Image generated and queued for posting.');
        } catch (error) {
            setStatus('❌ Error: Ensure channel_id exists and you are an Admin.');
        }
    }

    return (
        <div>
            <h1>Receipt Generator</h1>
            <div className="glass-panel" style={{ maxWidth: '600px' }}>
                <p>Generate educational mock receipts and instantly queue them to your Telegram channels!</p>
                <form onSubmit={handleGenerate} style={{ marginTop: '20px' }}>
                    <label>Channel ID (Database ID)</label>
                    <input type="text" value={formData.channel_id} onChange={(e) => setFormData({...formData, channel_id: e.target.value})} placeholder="e.g. 1" required />
                    
                    <label>Bank Template</label>
                    <select value={formData.bank_type} onChange={(e) => setFormData({...formData, bank_type: e.target.value})}>
                        <option value="moniepoint">Moniepoint (Dark Blue)</option>
                        <option value="opay">Opay (Dark Green)</option>
                        <option value="wema">Wema Bank (Purple)</option>
                        <option value="vfd">VFD MFB</option>
                        <option value="kongapay">KongaPay</option>
                    </select>

                    <label>Amount (Educational: minimum 500k)</label>
                    <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} min="500000" required />
                    
                    <button type="submit" className="btn" style={{marginTop:'10px'}}>Generate & Queue Post</button>
                </form>
                {status && <p style={{marginTop: '20px', color: 'var(--success)'}}>{status}</p>}
            </div>
        </div>
    );
}
""",
        'pages/Schedule.jsx': """export default function Schedule() { return <div><h1>Schedule Windows</h1><div className="glass-panel"><p>Configure times when the bot is allowed to post to channels.</p></div></div>; }""",
        'pages/Captions.jsx': """export default function Captions() { return <div><h1>AI Captions (Claude)</h1><div className="glass-panel"><p>Manage automated AI framing rules.</p></div></div>; }""",
        'pages/Analytics.jsx': """export default function Analytics() { return <div><h1>Analytics & Logs</h1><div className="glass-panel"><p>View deep metrics.</p></div></div>; }""",
        'pages/Settings.jsx': """export default function Settings() { return <div><h1>Bot Settings</h1><div className="glass-panel"><p>Enter your Bot Token and API Keys here.</p></div></div>; }"""
    }

    for name, content in files.items():
        with open(os.path.join(BASE, name), 'w', encoding='utf-8') as f:
            f.write(content.strip())
            
    print("Frontend scaffolding complete.")

if __name__ == '__main__':
    setup()
