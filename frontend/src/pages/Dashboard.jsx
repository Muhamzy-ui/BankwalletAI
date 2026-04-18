import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        client.get('dashboard/').then(res => setStats(res.data)).catch(console.error);
    }, []);

    if (!stats) return <p>Loading Dashboard...</p>;

    return (
        <div>
            <h1>Dashboard Overview</h1>
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