import { useState } from 'react';
import client from '../api/client';

export default function Posts() {
    const [status, setStatus] = useState('');
    const [formData, setFormData] = useState({ channel_id: '1', bank_type: 'moniepoint', amount: 850000 });
    const [previewImg, setPreviewImg] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Generating receipt and pushing to Telegram...');
        setPreviewImg(null);
        try {
            const response = await client.post('bot/generate-receipt/', formData);
            setStatus('✅ Success! Image generated and queued for posting.');
            if (response.data.image_url) {
                setPreviewImg(`http://localhost:8000${response.data.image_url}`);
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
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                <div className="glass-panel" style={{ flex: '1', maxWidth: '500px' }}>
                    <p style={{ color: 'var(--text-muted)'}}>Generate educational mock receipts and instantly queue them to your Telegram channels!</p>
                    <form onSubmit={handleGenerate} style={{ marginTop: '30px' }}>
                        <label>Channel ID (Type "test" to preview only)</label>
                        <input type="text" value={formData.channel_id} onChange={(e) => setFormData({...formData, channel_id: e.target.value})} placeholder="e.g. 1 or 'test'" required />
                        
                        <label>Bank Template</label>
                        <select value={formData.bank_type} onChange={(e) => setFormData({...formData, bank_type: e.target.value})}>
                            <option value="random">⭐ SURPRISE ME (Random)</option>
                            <option value="moniepoint">Moniepoint (Dark Blue)</option>
                            <option value="opay">OPay (Clean Green)</option>
                            <option value="kongapay">KongaPay (Pink Table)</option>
                            <option value="sparkle">Sparkle (Star Logo)</option>
                            <option value="palmpay">PalmPay (Dark Watermark)</option>
                            <option value="vfd">VFD / Rigo (Checkmark)</option>
                        </select>

                        <label>Amount (Educational: minimum 500k)</label>
                        <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} min="500000" required />
                        
                        <button type="submit" className="btn" style={{marginTop:'10px', width: '100%'}} disabled={loading}>
                            {loading ? 'Processing...' : 'Generate & Queue Post'}
                        </button>
                    </form>
                    {status && <p style={{marginTop: '20px', color: status.includes('❌') ? 'var(--danger)' : 'var(--success)'}}>{status}</p>}
                </div>
                
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-muted)' }}>Live Image Preview</h3>
                    {previewImg ? (
                        <div className="glass-panel" style={{ padding: '10px', animation: 'fadeUp 0.5s ease', width: '100%', maxWidth: '350px' }}>
                            <img src={previewImg} alt="Generated Receipt" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} />
                            <p style={{ textAlign: 'center', margin: '15px 0 5px 0', fontSize: '0.9rem', color: 'var(--success)' }}>Successfully drawn onto file system</p>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '350px', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Image will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}