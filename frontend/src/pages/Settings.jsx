import { useState, useEffect } from 'react';
import client from '../api/client';

export default function Settings() {
    const [settings, setSettings] = useState({
        bot_token: '',
        anthropic_api_key: '',
        auto_caption_enabled: true,
        auto_caption_prompt: '',
        timezone: 'Africa/Lagos'
    });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get('bot/settings/')
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
            await client.put('bot/settings/', settings);
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
                    <input 
                        type="password" 
                        value={settings.bot_token} 
                        onChange={(e) => setSettings({...settings, bot_token: e.target.value})}
                        placeholder="123456789:ABCDefghi..."
                    />

                    <h3 style={{ marginTop: '40px' }}>🧠 AI Caption Generator</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                        Connect Claude AI to automatically generate rich, context-aware captions for your receipts.
                    </p>
                    <label>Anthropic API Key (Claude)</label>
                    <input 
                        type="password" 
                        value={settings.anthropic_api_key} 
                        onChange={(e) => setSettings({...settings, anthropic_api_key: e.target.value})}
                        placeholder="sk-ant-..."
                    />

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={settings.auto_caption_enabled}
                            onChange={(e) => setSettings({...settings, auto_caption_enabled: e.target.checked})}
                            style={{ width: 'auto', marginBottom: 0 }}
                        />
                        Enable AI Auto-Captions
                    </label>

                    {settings.auto_caption_enabled && (
                        <div style={{ marginTop: '15px' }}>
                            <label>AI Prompt Prompt Context</label>
                            <textarea 
                                value={settings.auto_caption_prompt}
                                onChange={(e) => setSettings({...settings, auto_caption_prompt: e.target.value})}
                                style={{ height: '80px' }}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button type="submit" className="btn">Save Configuration</button>
                        {status && <span style={{ color: status.includes('✅') ? 'var(--success)' : 'var(--danger)' }}>{status}</span>}
                    </div>
                </form>
            </div>
        </div>
    );
}