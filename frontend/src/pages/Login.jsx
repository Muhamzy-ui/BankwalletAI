import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, Lock, User } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(username, password);
        if (!success) setError('Invalid credentials');
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--brand)', filter: 'blur(80px)' }}></div>
                
                <h1 style={{ textAlign: 'center', color: 'var(--text-main)', display:'flex', justifyContent:'center', gap:'12px', alignItems:'center', fontSize: '2rem' }}>
                    <Radio color="var(--brand)" size={32} /> Telebot Pro
                </h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px' }}>Secure SaaS Dashboard</p>
                
                {error && <div style={{ background: 'rgba(227, 25, 95, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid var(--danger)' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '15px', top: '16px', color: 'var(--text-muted)' }} />
                        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={{ paddingLeft: '45px' }} />
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '15px', top: '16px', color: 'var(--text-muted)' }} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: '45px' }} />
                    </div>
                    
                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px', height: '50px', fontSize: '1.1rem' }}>
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}