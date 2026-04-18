import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Send, Calendar, Image as ImageIcon, BarChart2, Settings as SettingsIcon, LogOut, Radio, Target } from 'lucide-react';

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
                    <Link to="/mapper" style={{ color: 'white', textDecoration: 'none', display:'flex', gap:'10px' }}><Target size={20}/> Visual Mapper</Link>
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