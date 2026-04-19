import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';

export default function Posts() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('');
    const [formData, setFormData] = useState({ 
        channel_id: searchParams.get('channel') || '', 
        bank_type: 'moniepoint', 
        amount: 96000,
        caption: ''
    });
    const [previewImg, setPreviewImg] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Generating receipt...');
        setPreviewImg(null);
        try {
            const response = await client.post('bot/generate-receipt/', formData);
            setStatus(response.data.message || '✅ Receipt generated and sent!');
            if (response.data.image_url) {
                if (response.data.image_url.startsWith('http')) {
                    setPreviewImg(response.data.image_url);
                } else {
                    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/').replace('/api/', '');
                    setPreviewImg(`${base}${response.data.image_url}`);
                }
            }
        } catch (error) {
            const errDetail = error.response?.data?.error || error.message;
            setStatus(`❌ Error: ${errDetail}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="animate-fade-up">
            <h1>Receipt Generator</h1>
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="glass-panel" style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
                    <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>Generate authentic receipt mockups and instantly send them to your Telegram channels!</p>
                    <form onSubmit={handleGenerate}>
                        <label>Telegram Channel ID or Personal Chat ID</label>
                        <input 
                            type="text" 
                            value={formData.channel_id} 
                            onChange={(e) => setFormData({...formData, channel_id: e.target.value})} 
                            placeholder="e.g. -100 1234567890 (for channels)"
                        />
                        <p style={{ fontSize: '0.78rem', color: 'orange', marginTop: '5px', marginBottom: '0' }}>
                            ⚠️ Channel IDs must start with <strong>-100</strong> (e.g. <code>-1001234567890</code>). 
                            Your bot must also be added as an <strong>Admin</strong> in the channel.
                        </p>
                        
                        <label>Bank Template</label>
                        <select value={formData.bank_type} onChange={(e) => setFormData({...formData, bank_type: e.target.value})}>
                            <option value="random">⭐ SURPRISE ME (Random)</option>
                            <option value="text">📝 TEXT ONLY (No Image)</option>
                            <option value="moniepoint">Moniepoint (Dark Blue)</option>
                            <option value="opay">OPay (Clean Green)</option>
                            <option value="kongapay">KongaPay (Pink Table)</option>
                            <option value="sparkle">Sparkle (Star Logo)</option>
                            <option value="palmpay">PalmPay (Dark Watermark)</option>
                            <option value="vfd">VFD / Rigo (Checkmark)</option>
                        </select>

                        <label>Amount (minimum ₦96,000)</label>
                        <input 
                            type="number" 
                            value={formData.amount} 
                            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                            min="96000" 
                            required 
                        />

                        <label>Caption / Message (sent with the image)</label>
                        <textarea
                            value={formData.caption}
                            onChange={(e) => setFormData({...formData, caption: e.target.value})}
                            placeholder="Type your message here e.g:&#10;&#10;✅ Another successful transfer!&#10;💰 Investment pays off 🔥&#10;&#10;DM us to join the winning team!"
                            style={{
                                background: 'rgba(11, 20, 38, 0.6)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white',
                                padding: '14px',
                                borderRadius: '8px',
                                width: '100%',
                                height: '120px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                marginBottom: '20px'
                            }}
                        />
                        
                        <button type="submit" className="btn" style={{width: '100%'}} disabled={loading}>
                            {loading ? '⏳ Generating...' : '🚀 Generate & Send Now'}
                        </button>
                    </form>
                    {status && (
                        <p style={{
                            marginTop: '20px', 
                            padding: '12px', 
                            borderRadius: '8px',
                            background: status.includes('❌') ? 'rgba(227,25,95,0.1)' : 'rgba(21,209,134,0.1)',
                            color: status.includes('❌') ? 'var(--danger)' : 'var(--success)',
                            border: `1px solid ${status.includes('❌') ? 'rgba(227,25,95,0.3)' : 'rgba(21,209,134,0.3)'}`,
                            wordBreak: 'break-word'
                        }}>
                            {status}
                        </p>
                    )}
                </div>
                
                <div style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-muted)' }}>Live Image Preview</h3>
                    {previewImg ? (
                        <div className="glass-panel" style={{ padding: '10px', animation: 'fadeUp 0.5s ease', width: '100%', maxWidth: '320px' }}>
                            <img src={previewImg} alt="Generated Receipt" style={{ width: '100%', borderRadius: '8px' }} />
                            <p style={{ textAlign: 'center', margin: '10px 0 0 0', fontSize: '0.85rem', color: 'var(--success)' }}>✅ Sent to Telegram</p>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '320px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Image will appear here after generation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}