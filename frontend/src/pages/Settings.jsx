import { useState, useEffect } from 'react';
import client from '../api/client';
import { Eye, EyeOff, Timer, Trash2, ImageIcon, RefreshCw } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        bot_token: '',
        timezone: 'Africa/Lagos',
        default_send_interval_minutes: 5
    });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(true);

    useEffect(() => {
        client.get('settings/')
            .then(res => {
                setSettings(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setTemplatesLoading(true);
        try {
            const res = await client.get('templates/');
            setTemplates(res.data);
        } catch (err) {
            console.error("Failed to load templates", err);
        }
        setTemplatesLoading(false);
    };

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

    const handleDeleteTemplate = async (filename) => {
        if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
        try {
            await client.delete(`templates/${encodeURIComponent(filename)}/`);
            fetchTemplates();
        } catch (err) {
            alert("Failed to delete template.");
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="animate-fade-up">
            <h1>Platform Settings</h1>
            
            {/* Bot Token */}
            <div className="glass-panel" style={{ maxWidth: '600px', marginBottom: '30px' }}>
                <form onSubmit={handleSave}>
                    <h3>🤖 Telegram Bot Configuration</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                        Paste your Telegram Bot Token from @BotFather here.
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

                    {/* ── Custom Posting Interval ─────────────────────── */}
                    <h3 style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Timer size={22} color="var(--brand)" />
                        Auto-Posting Interval
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        How many minutes should the bot wait between automatic posts? (minimum 1 minute)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input
                            type="number"
                            min="1"
                            max="1440"
                            value={settings.default_send_interval_minutes}
                            onChange={(e) => setSettings({...settings, default_send_interval_minutes: parseInt(e.target.value) || 5})}
                            style={{ width: '120px' }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>minutes between posts</span>
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button type="submit" className="btn">Save Configuration</button>
                        {status && <span style={{ color: status.includes('✅') ? 'var(--success)' : 'var(--danger)' }}>{status}</span>}
                    </div>
                </form>
            </div>

            {/* ── Template Manager ──────────────────────────────── */}
            <div className="glass-panel" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <ImageIcon size={22} color="var(--brand)" /> Fallback Template Images
                    </h3>
                    <button onClick={fetchTemplates} style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    These are the <code>*changethename*</code> / <code>*sendlikethis*</code> images stored on the server that the bot picks from randomly. Delete any you no longer want.
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--brand)', marginBottom: '20px' }}>
                    💡 <strong>Tip:</strong> Include the amount in the filename to make text captions auto-fill! Example: <code>receipt_<strong>50000</strong>_changethename.jpg</code>
                </p>

                {templatesLoading ? (
                    <p>Loading templates...</p>
                ) : templates.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No templates found. Upload images with <code>changethename</code> or <code>sendlikethis</code> in the filename to the server's <code>media/templates/</code> folder.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {templates.map(t => (
                            <div key={t.filename} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={t.url} alt={t.filename} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', background: '#111' }}
                                        onError={(e) => { e.target.style.display='none'; }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{t.filename}</span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteTemplate(t.filename)}
                                    style={{ background: 'rgba(227,25,95,0.15)', color: 'var(--danger)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}