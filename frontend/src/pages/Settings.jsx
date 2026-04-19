import { useState, useEffect } from 'react';
import client from '../api/client';
import { Eye, EyeOff, Timer, Trash2, ImageIcon, RefreshCw, Pencil, Check, X, Upload } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        bot_token: '',
        timezone: 'Africa/Lagos',
        default_send_interval_minutes: 5
    });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);

    // DB Templates (Cloudinary)
    const [dbTemplates, setDbTemplates] = useState([]);
    const [dbLoading, setDbLoading] = useState(true);
    
    // Legacy Disk Templates
    const [diskTemplates, setDiskTemplates] = useState([]);
    const [diskLoading, setDiskLoading] = useState(true);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('changethename');
    const [uploadBank, setUploadBank] = useState('');
    const [uploadFile, setUploadFile] = useState(null);

    // Rename state
    const [renamingDiskFile, setRenamingDiskFile] = useState(null);
    const [newName, setNewName] = useState('');
    const [renaming, setRenaming] = useState(false);

    // Lightbox / Fullscreen Preview
    const [selectedPreview, setSelectedPreview] = useState(null);

    useEffect(() => {
        client.get('settings/')
            .then(res => {
                setSettings(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        
        fetchDbTemplates();
        fetchDiskTemplates();
    }, []);

    const fetchDbTemplates = async () => {
        setDbLoading(true);
        try {
            const { data } = await client.get('templates-db/');
            setDbTemplates(data);
        } catch (err) { console.error(err); }
        setDbLoading(false);
    };

    const fetchDiskTemplates = async () => {
        setDiskLoading(true);
        try {
            const { data } = await client.get('templates/');
            setDiskTemplates(data);
        } catch (err) { console.error(err); }
        setDiskLoading(false);
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setStatus('Saving...');
        try {
            await client.put('settings/', settings);
            setStatus('✅ Settings saved!');
            setTimeout(() => setStatus(''), 4000);
        } catch (error) { setStatus('❌ Failed to save.'); }
    };

    const handleUploadTemplate = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('image', uploadFile);
        fd.append('template_type', uploadType);
        fd.append('bank_name', uploadBank);
        
        try {
            await client.post('templates-db/', fd);
            setUploadFile(null);
            setUploadBank('');
            document.getElementById('template-file').value = '';
            fetchDbTemplates();
        } catch (err) { alert('Upload failed.'); }
        setUploading(false);
    };

    const handleDeleteDb = async (id) => {
        if (!window.confirm("Permanently delete this template from Cloudinary?")) return;
        try {
            await client.delete(`templates-db/${id}/`);
            fetchDbTemplates();
        } catch (err) { alert('Delete failed.'); }
    };

    const handleDeleteDisk = async (filename) => {
        if (!window.confirm("Delete this local template? (Warning: This is not permanent on Render until we push code)")) return;
        try {
            await client.delete(`templates/${encodeURIComponent(filename)}/`);
            fetchDiskTemplates();
        } catch (err) { alert('Delete failed.'); }
    };

    const startRenameDisk = (filename) => {
        const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
        setRenamingDiskFile(filename);
        setNewName(nameWithoutExt);
    };

    const submitRenameDisk = async (oldFilename) => {
        if (!newName.trim()) return;
        setRenaming(true);
        try {
            const res = await client.post('templates/rename/', { old_name: oldFilename, new_name: newName.trim() });
            setDiskTemplates(prev => prev.map(t => t.filename === oldFilename ? { filename: res.data.filename, url: res.data.url } : t));
            setRenamingDiskFile(null);
        } catch (err) { alert('Rename failed.'); }
        setRenaming(false);
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="animate-fade-up">
            <h1>Backend Configuration</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
                
                {/* ── Settings Form ── */}
                <div className="glass-panel">
                    <h3>🤖 Bot Configuration</h3>
                    <form onSubmit={handleSaveSettings}>
                        <label>Bot Token</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showToken ? "text" : "password"} value={settings.bot_token} onChange={(e) => setSettings({...settings, bot_token: e.target.value})} style={{ width: '100%', paddingRight: '45px' }} />
                            <button type="button" onClick={() => setShowToken(!showToken)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <label style={{ marginTop: '20px' }}>Timezone</label>
                        <select value={settings.timezone} onChange={(e) => setSettings({...settings, timezone: e.target.value})}>
                            <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                            <option value="UTC">UTC</option>
                        </select>

                        <label style={{ marginTop: '20px' }}>Auto-Post Interval (Minutes)</label>
                        <input type="number" min="1" value={settings.default_send_interval_minutes} onChange={(e) => setSettings({...settings, default_send_interval_minutes: parseInt(e.target.value) || 5})} />

                        <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button type="submit" className="btn">Save All</button>
                            {status && <span style={{ color: status.includes('✅') ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem' }}>{status}</span>}
                        </div>
                    </form>
                </div>

                {/* ── Upload New Template (Cloudinary) ── */}
                <div className="glass-panel" style={{ border: '2px dashed rgba(21, 209, 134, 0.3)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Upload size={20} color="var(--success)" /> Add Permanent Template</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload images here to save them to **Cloudinary**. These are permanent and will never be deleted by Render restarts.</p>
                    
                    <form onSubmit={handleUploadTemplate}>
                        <label>Image File</label>
                        <input id="template-file" type="file" accept="image/*" onChange={e => setUploadFile(e.target.files[0])} required />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                            <div>
                                <label>Bank Name</label>
                                <input type="text" placeholder="e.g. OPay" value={uploadBank} onChange={e => setUploadBank(e.target.value)} />
                            </div>
                            <div>
                                <label>Logic Type</label>
                                <select value={uploadType} onChange={e => setUploadType(e.target.value)}>
                                    <option value="changethename">ChangeTheName (Random)</option>
                                    <option value="sendlikethis">SendLikeThis (Static)</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn" style={{ width: '100%', marginTop: '20px' }} disabled={uploading}>
                            {uploading ? '⏳ Uploading to Cloudinary...' : 'Confirm Upload'}
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Active Cloudinary Templates ── */}
            <div className="glass-panel" style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>☁️ Cloudinary Templates (Permanent)</h3>
                    <button onClick={fetchDbTemplates} className="btn-icon"><RefreshCw size={16} /></button>
                </div>
                {dbLoading ? <p>Loading Cloudinary images...</p> : dbTemplates.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No permanent templates yet. Upload one above!</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                        {dbTemplates.map(t => (
                            <div key={t.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                                <img src={t.image} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} 
                                    onClick={() => setSelectedPreview(t.image)} title="Click to enlarge" />
                                <div style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--text-muted)' }}>
                                    <b>{t.bank_name || 'Generic'}</b> ({t.template_type})
                                </div>
                                <button onClick={() => handleDeleteDb(t.id)} style={{ marginTop: '10px', width: '100%', background: 'rgba(227,25,95,0.1)', color: 'var(--danger)', border: 'none', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}>
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Disk Templates ── */}
            <div className="glass-panel" style={{ marginTop: '30px', opacity: 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>📂 Built-in Templates (Local Storage)</h3>
                    <button onClick={fetchDiskTemplates} className="btn-icon"><RefreshCw size={16} /></button>
                </div>
                {diskLoading ? <p>Loading files...</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {diskTemplates.map(t => (
                            <div key={t.filename} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '8px 15px', borderRadius: '8px' }}>
                                <img src={t.url} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} 
                                    onClick={() => setSelectedPreview(t.url)} title="Click to enlarge" />
                                {renamingDiskFile === t.filename ? (
                                    <div style={{ flex: 1, display: 'flex', gap: '5px' }}>
                                        <input value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.8rem' }} />
                                        <button onClick={() => submitRenameDisk(t.filename)}  className="btn-icon" style={{ background: 'var(--success)' }}><Check size={14} /></button>
                                        <button onClick={() => setRenamingDiskFile(null)} className="btn-icon"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.filename}</span>
                                )}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => startRenameDisk(t.filename)} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><Pencil size={14}/></button>
                                    <button onClick={() => handleDeleteDisk(t.filename)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Image Preview Modal (Lightbox) ── */}
            {selectedPreview && (
                <div 
                    onClick={() => setSelectedPreview(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
                    }}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedPreview(null); }}
                            style={{
                                position: 'absolute', top: '-40px', right: '0', background: 'var(--danger)',
                                color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <img 
                            src={selectedPreview} 
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.1)' }} 
                        />
                        <p style={{ textAlign: 'center', marginTop: '15px', color: 'white', fontSize: '14px' }}>
                            Click anywhere outside the image to close
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}