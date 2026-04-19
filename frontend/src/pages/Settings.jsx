import { useState, useEffect } from 'react';
import client from '../api/client';
import { Eye, EyeOff, Timer, Trash2, ImageIcon, RefreshCw, Pencil, Check, X } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        bot_token: '',
        timezone: 'Africa/Lagos',
        default_send_interval_minutes: 5
    });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);

    // Templates
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(true);
    
    // Rename state
    const [renamingFile, setRenamingFile] = useState(null);   // filename being renamed
    const [newName, setNewName] = useState('');
    const [renaming, setRenaming] = useState(false);

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
            setStatus('✅ Settings saved! Interval will take effect on next check.');
            setTimeout(() => setStatus(''), 4000);
        } catch (error) {
            setStatus('❌ Failed to save settings.');
        }
    };

    const handleDeleteTemplate = async (filename) => {
        if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
        try {
            await client.delete(`templates/${encodeURIComponent(filename)}/`);
            fetchTemplates();
        } catch {
            alert("Failed to delete template.");
        }
    };

    const startRename = (filename) => {
        // Strip extension from display name in the input
        const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
        setRenamingFile(filename);
        setNewName(nameWithoutExt);
    };

    const cancelRename = () => {
        setRenamingFile(null);
        setNewName('');
    };

    const submitRename = async (oldFilename) => {
        if (!newName.trim()) return;
        setRenaming(true);
        try {
            const res = await client.post('templates/rename/', { old_name: oldFilename, new_name: newName.trim() });
            // Update the list immediately without refetch
            setTemplates(prev => prev.map(t => t.filename === oldFilename
                ? { filename: res.data.filename, url: res.data.url }
                : t
            ));
            setRenamingFile(null);
            setNewName('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to rename.');
        }
        setRenaming(false);
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="animate-fade-up">
            <h1>Platform Settings</h1>

            {/* ── Bot Token & Global Config ── */}
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
                            onChange={(e) => setSettings({ ...settings, bot_token: e.target.value })}
                            placeholder="123456789:ABCDefghi..."
                            style={{ width: '100%', paddingRight: '45px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <h3 style={{ marginTop: '40px' }}>🌍 Global Configuration</h3>
                    <label>Timezone (For Smart Timers)</label>
                    <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="America/New_York">America/New_York (EST/EDT)</option>
                        <option value="UTC">UTC Standard</option>
                    </select>

                    {/* ── Custom Posting Interval ── */}
                    <h3 style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Timer size={22} color="var(--brand)" /> Auto-Posting Interval
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        How many minutes between automatic posts? (Minimum 1, max 1440)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input
                            type="number"
                            min="1"
                            max="1440"
                            value={settings.default_send_interval_minutes}
                            onChange={(e) => setSettings({ ...settings, default_send_interval_minutes: parseInt(e.target.value) || 5 })}
                            style={{ width: '120px' }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>minutes between posts</span>
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button type="submit" className="btn">Save Configuration</button>
                        {status && <span style={{ color: status.includes('✅') ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>{status}</span>}
                    </div>
                </form>
            </div>

            {/* ── Template Manager ── */}
            <div className="glass-panel" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <ImageIcon size={22} color="var(--brand)" /> Fallback Template Images
                    </h3>
                    <button onClick={fetchTemplates} style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    These are the <code>*changethename*</code> / <code>*sendlikethis*</code> images the bot picks randomly. Click the ✏️ pencil to rename, trash to delete.
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--brand)', marginBottom: '20px' }}>
                    💡 <strong>Amount Tip:</strong> Include an amount in the name to auto-fill <code>{'{amount}'}</code> in captions!<br />
                    Example: <code>receipt_<strong>50000</strong>_changethename.jpg</code>
                </p>

                {templatesLoading ? (
                    <p>Loading templates...</p>
                ) : templates.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No templates found on server.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {templates.map(t => (
                            <div key={t.filename} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 14px' }}>

                                {/* Image preview + name/rename area */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Clickable thumbnail */}
                                    <img
                                        src={t.url}
                                        alt={t.filename}
                                        title="Click to preview"
                                        onClick={() => window.open(t.url, '_blank')}
                                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', background: '#111', cursor: 'pointer', flexShrink: 0 }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />

                                    {/* Inline rename input or filename */}
                                    {renamingFile === t.filename ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                autoFocus
                                                value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') submitRename(t.filename); if (e.key === 'Escape') cancelRename(); }}
                                                style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                                                placeholder="new_name_50000_changethename"
                                            />
                                            <button onClick={() => submitRename(t.filename)} disabled={renaming} style={{ background: 'var(--success)', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'black' }}>
                                                <Check size={16} />
                                            </button>
                                            <button onClick={cancelRename} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'white' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{t.filename}</span>
                                    )}

                                    {/* Action buttons */}
                                    {renamingFile !== t.filename && (
                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <button onClick={() => startRename(t.filename)} title="Rename" style={{ background: 'rgba(21,209,134,0.15)', color: 'var(--success)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDeleteTemplate(t.filename)} title="Delete" style={{ background: 'rgba(227,25,95,0.15)', color: 'var(--danger)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}