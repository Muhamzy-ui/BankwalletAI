import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Send, Calendar, Image as ImageIcon, BarChart2, Settings as SettingsIcon, LogOut, Radio, Target, Menu, X, MessageSquareText } from 'lucide-react';

export default function Layout() {
    const { logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // Auto-close menu on mobile when a link is clicked
    const closeMenu = () => setMobileOpen(false);

    const getLinkStyle = (path) => {
        const isActive = location.pathname === path;
        return {
            color: isActive ? 'var(--brand)' : 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 15px',
            borderRadius: '8px',
            background: isActive ? 'rgba(45, 111, 247, 0.1)' : 'transparent',
            transition: 'all 0.2s',
            fontWeight: isActive ? '600' : '400'
        };
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            
            {/* Mobile Header Toggle */}
            <div className="mobile-header" style={{
                display: 'none',
                padding: '20px',
                background: 'var(--bg)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'fixed',
                top: 0, left: 0, right: 0,
                zIndex: 50
            }}>
                <h2 style={{ color: 'var(--brand)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                    <Radio size={24}/> Telebot Pro
                </h2>
                <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'transparent', border: 'none', color: 'white' }}>
                    {mobileOpen ? <X size={28}/> : <Menu size={28}/>}
                </button>
            </div>

            {/* Injected Mobile CSS for Header */}
            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                    .mobile-header { display: flex !important; }
                    .main-content { padding-top: 80px !important; padding-left: 20px !important; padding-right: 20px !important;}
                    .sidebar {
                        position: fixed;
                        top: 70px;
                        left: ${mobileOpen ? '0' : '-100%'};
                        width: 100% !important;
                        height: calc(100vh - 70px);
                        z-index: 40;
                        transition: left 0.3s ease;
                        background: var(--bg) !important;
                    }
                }
            `}} />

            <aside className="sidebar" style={{ 
                width: '280px', 
                background: 'var(--panel)', 
                padding: '30px 20px', 
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            }}>
                <h2 className="desktop-brand" style={{ color: 'var(--brand)', marginBottom: '50px', display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '15px' }}>
                    <Radio /> Telebot Pro
                </h2>
                
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <Link to="/" onClick={closeMenu} style={getLinkStyle('/')}><Home size={20}/> Dashboard</Link>
                    <Link to="/channels" onClick={closeMenu} style={getLinkStyle('/channels')}><Send size={20}/> Channels</Link>
                    <Link to="/posts" onClick={closeMenu} style={getLinkStyle('/posts')}><ImageIcon size={20}/> Generator</Link>
                    <Link to="/mapper" onClick={closeMenu} style={getLinkStyle('/mapper')}><Target size={20}/> Automation Mapper</Link>
                    <Link to="/schedule" onClick={closeMenu} style={getLinkStyle('/schedule')}><Calendar size={20}/> Smart Timers</Link>
                    <Link to="/settings" onClick={closeMenu} style={getLinkStyle('/settings')}><SettingsIcon size={20}/> Bot Settings</Link>
                </nav>

                <div style={{ padding: '0 15px', marginTop: '40px' }}>
                    <button onClick={logout} style={{ 
                        background: 'rgba(227, 25, 95, 0.1)', 
                        color: 'var(--danger)', 
                        border: '1px solid rgba(227, 25, 95, 0.2)', 
                        cursor: 'pointer', 
                        padding: '12px', 
                        borderRadius: '8px',
                        display: 'flex', 
                        gap: '10px', 
                        fontSize: '14px',
                        width: '100%',
                        fontWeight: '600',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <LogOut size={18}/> Secure Logout
                    </button>
                </div>
            </aside>
            
            <main className="main-content" style={{ flex: 1, padding: '50px', overflowY: 'auto', background: 'var(--bg)' }}>
                <Outlet />
            </main>
        </div>
    );
}