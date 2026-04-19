import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Send, Trash2, Plus, RefreshCw, PenTool } from 'lucide-react';

export default function Channels() {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', channel_id: '', channel_username: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchChannels = async () => {
        setLoading(true);
        try {
            const { data } = await client.get('channels/');
            setChannels(data);
        } catch (err) {
            console.error("Failed to load channels", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await client.post('channels/', formData);
            setFormData({ name: '', channel_id: '', channel_username: '' });
            fetchChannels();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add channel. Ensure ID format is correct.');
        }
        setSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this channel? Posts queued for it will fail.")) return;
        try {
            await client.delete(`channels/${id}/`);
            fetchChannels();
        } catch (err) {
            console.error(err);
            alert("Failed to delete.");
        }
    };

    return (
        <div className="animate-fade-up">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Send size={32} color="var(--brand)" /> 
                Manage Channels
            </h1>

            <div className="glass-panel" style={{ maxWidth: '700px', marginBottom: '40px' }}>
                <h3>Add New Telegram Channel</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Note: Your bot must be added as an Administrator to the target channel beforehand! The Channel ID usually starts with -100.
                </p>

                {error && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label>Internal Name (For you)</label>
                            <input 
                                placeholder="e.g. Main Crypto Signal Channel" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label>Telegram Chat/Channel ID</label>
                            <input 
                                placeholder="e.g. -100123456789 or 8342713750" 
                                value={formData.channel_id} 
                                onChange={e => setFormData({...formData, channel_id: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>
                    
                    <button type="submit" className="btn" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Plus size={18} /> {submitting ? 'Adding...' : 'Connect Channel Permanently'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Your Connected Channels</h3>
                <button onClick={fetchChannels} style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {loading ? (
                <p>Loading channels...</p>
            ) : channels.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No channels connected yet. Add one above!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {channels.map(channel => (
                        <div key={channel.id} className="glass-panel" style={{ padding: '20px', marginBottom: '0' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{channel.name}</h4>
                            <p style={{ margin: '5px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>ID: {channel.channel_id}</p>
                            
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <Link to={`/posts?channel=${channel.id}`} style={{ textDecoration: 'none', background: 'rgba(45, 111, 247, 0.1)', color: 'var(--brand)', border: '1px solid rgba(45, 111, 247, 0.2)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <PenTool size={16} /> Send Post
                                </Link>
                                <button onClick={() => handleDelete(channel.id)} style={{ background: 'rgba(227, 25, 95, 0.1)', color: 'var(--danger)', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Trash2 size={16} /> Disconnect
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}