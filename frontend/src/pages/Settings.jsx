import { useState, useEffect } from 'react';
import client from '../api/client';
import { Eye, EyeOff } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        bot_token: '',
        timezone: 'Africa/Lagos'
    });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);

    useEffect(() => {
        client.get('settings/')
            .then(res => {
                setSettings(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setStatus('Saving...');
        try {
            await client.put('settings/', settings);
            setStatus('✅ Settings saved successfully!');
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            setStatus('❌ Failed to save settings.');
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="animate-fade-up">
            <h1>Platform Settings</h1>
            
            <div className="glass-panel" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSave}>
                    <h3>🤖 Telegram Bot Configuration</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                        Paste your Telegram Bot Token from @BotFather here. This is required for the platform to send receipts to your channels.
                    </p>
                    <label>Bot Token</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={showToken ? "text" : "password"} 
                            value={settings.bot_token} 
                            onChange={(e) => setSettings({...settings, bot_token: e.target.value})}
                            placeholder="123456789:ABCDefghi..."
                            style={{ width: '100%', paddingRight: '45px' }}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            style={{ 
                                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', 
                                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' 
                            }}>
                            {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <h3 style={{ marginTop: '40px' }}>🌍 Global Configuration</h3>
                    <label>Timezone (For Smart Timers)</label>
                    <select 
                        value={settings.timezone}
                        onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    >
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="America/New_York">America/New_York (EST/EDT)</option>
                        <option value="UTC">UTC Standard</option>
                    </select>

                    <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button type="submit" className="btn">Save Configuration</button>
                        {status && <span style={{ color: status.includes('✅') ? 'var(--success)' : 'var(--danger)' }}>{status}</span>}
                    </div>
                </form>
            </div>
        </div>
    );
}