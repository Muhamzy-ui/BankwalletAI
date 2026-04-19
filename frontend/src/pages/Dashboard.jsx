import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        client.get('dashboard/').then(res => setStats(res.data)).catch(console.error);
    }, []);

    const toggleBotState = async () => {
        try {
            const res = await client.post('dashboard/toggle-bot/');
            setStats(prev => ({ ...prev, bot_is_active: res.data.bot_is_active }));
        } catch (err) {
            console.error("Failed to toggle bot state", err);
            alert("Failed to toggle Bot State.");
        }
    };

    if (!stats) return <p>Loading Dashboard...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>Dashboard Overview</h1>
                
                <button 
                    onClick={toggleBotState}
                    style={{ 
                        padding: '10px 20px', 
                        borderRadius: '30px', 
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: stats.bot_is_active ? 'var(--danger)' : 'var(--success)',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                >
                    {stats.bot_is_active ? "⏸ Pause Bot" : "▶️ Resume Bot"}
                </button>
            </div>
            
            {!stats.bot_is_active && (
                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(227, 25, 95, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)' }}>
                    ⚠️ <strong>Bot is currently PAUSED.</strong> No automated messages or generated receipts will be sent to any channels until you resume it.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '30px' }}>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Active Channels</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--brand)' }}>{stats.active_channels}</h1>
                </div>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Posts Queued</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--success)' }}>{stats.queued_posts}</h1>
                </div>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Sent Today</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--brand)' }}>{stats.sent_today}</h1>
                </div>
                <div className="glass-panel">
                    <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Failed Posts</h3>
                    <h1 style={{ margin: '10px 0 0 0', color: 'var(--danger)' }}>{stats.failed_posts}</h1>
                </div>
            </div>
        </div>
    );
}