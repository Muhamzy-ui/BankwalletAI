import { useState, useEffect } from 'react';
import client from '../api/client';
import { MessageSquareText, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function Captions() {
    const [captions, setCaptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', content: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchCaptions = async () => {
        setLoading(true);
        try {
            const { data } = await client.get('caption-templates/');
            setCaptions(data);
        } catch (err) {
            console.error("Failed to load captions", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCaptions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await client.post('caption-templates/', formData);
            setFormData({ name: '', content: '' });
            fetchCaptions();
        } catch (err) {
            alert('Failed to add message.');
        }
        setSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this message?")) return;
        try {
            await client.delete(`caption-templates/${id}/`);
            fetchCaptions();
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    return (
        <div className="animate-fade-up">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquareText size={32} color="var(--brand)" /> 
                Message Pool
            </h1>

            <div className="glass-panel" style={{ maxWidth: '800px', marginBottom: '40px' }}>
                <h3>Add New Auto-Message</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    When the background worker drops an automated receipt (or custom promo image), it will randomly pick a message from here! Add as many as you want.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Message Title/Theme</label>
                        <input 
                            placeholder="e.g. Morning Hype" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            required 
                        />
                    </div>
                    <div>
                        <label>The Message Content</label>
                        <textarea 
                            placeholder="✅ HUGE SUCCESS !! Join VIP today..." 
                            value={formData.content} 
                            onChange={e => setFormData({...formData, content: e.target.value})} 
                            required 
                            style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '8px', background: 'rgba(11,20,38,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>
                    
                    <button type="submit" className="btn" disabled={submitting} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Plus size={18} /> {submitting ? 'Adding...' : 'Add to Pool'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Available Messages</h3>
                <button onClick={fetchCaptions} style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {loading ? (
                <p>Loading messages...</p>
            ) : captions.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No auto-messages added yet. It will send empty captions until you add some.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr' }}>
                    {captions.map(caption => (
                        <div key={caption.id} className="glass-panel" style={{ padding: '20px', marginBottom: '0' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'var(--brand)' }}>{caption.name}</h4>
                            <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{caption.content}</p>
                            
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleDelete(caption.id)} style={{ background: 'rgba(227, 25, 95, 0.1)', color: 'var(--danger)', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Trash2 size={16} /> Delete Message
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}