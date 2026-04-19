import { useState, useEffect } from 'react';
import client from '../api/client';
import { Calendar, Trash2, Plus, RefreshCw, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Schedule() {
    const [windows, setWindows] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        channel: '',
        day_of_week: '0',
        start_time: '09:00',
        end_time: '17:00'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [winRes, chanRes] = await Promise.all([
                client.get('schedule-windows/'),
                client.get('channels/')
            ]);
            setWindows(winRes.data);
            setChannels(chanRes.data);
            if (chanRes.data.length > 0 && !formData.channel) {
                setFormData(prev => ({ ...prev, channel: chanRes.data[0].id }));
            }
        } catch (err) {
            console.error("Failed to fetch schedule data", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await client.post('schedule-windows/', formData);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to add time window. Ensure times do not overlap illegally.');
        }
        setSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this smart timer?")) return;
        try {
            await client.delete(`schedule-windows/${id}/`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to delete timer.");
        }
    };

    return (
        <div className="animate-fade-up">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={32} color="var(--brand)" /> 
                Smart Timers
            </h1>

            <div className="glass-panel" style={{ maxWidth: '800px', marginBottom: '40px' }}>
                <h3>Add New Posting Window</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    The backend Background Worker will automatically sprinkle your queued posts within these specified time windows so it looks perfectly human.
                </p>

                {channels.length === 0 ? (
                    <div style={{ color: 'var(--warning)', padding: '15px', background: 'rgba(255, 180, 0, 0.1)', borderRadius: '8px' }}>
                        ⚠️ You must connect a Telegram Channel first before adding timers!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label>Select Channel</label>
                                <select 
                                    value={formData.channel} 
                                    onChange={e => setFormData({...formData, channel: e.target.value})}
                                    style={{ marginBottom: 0 }}
                                    required
                                >
                                    {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label>Day of Week</label>
                                <select 
                                    value={formData.day_of_week} 
                                    onChange={e => setFormData({...formData, day_of_week: e.target.value})}
                                    style={{ marginBottom: 0 }}
                                    required
                                >
                                    {DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
                                </select>
                            </div>

                            <div>
                                <label>Start Time</label>
                                <input 
                                    type="time" 
                                    value={formData.start_time} 
                                    onChange={e => setFormData({...formData, start_time: e.target.value})} 
                                    style={{ marginBottom: 0 }}
                                    required 
                                />
                            </div>

                            <div>
                                <label>End Time</label>
                                <input 
                                    type="time" 
                                    value={formData.end_time} 
                                    onChange={e => setFormData({...formData, end_time: e.target.value})} 
                                    style={{ marginBottom: 0 }}
                                    required 
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="btn" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Plus size={18} /> {submitting ? 'Adding...' : 'Create Smart Timer'}
                        </button>
                    </form>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Active Posting Windows</h3>
                <button onClick={fetchData} style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {loading ? (
                <p>Loading smart timers...</p>
            ) : windows.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No timers active. Bot will not post automatically until a timer is set.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {windows.map(win => {
                        const chanName = channels.find(c => c.id === win.channel)?.name || 'Unknown Channel';
                        return (
                            <div key={win.id} className="glass-panel" style={{ padding: '20px', marginBottom: '0', borderLeft: '4px solid var(--brand)' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'white' }}>{chanName}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand)', fontWeight: 'bold', marginBottom: '10px' }}>
                                    <Calendar size={16} /> {DAYS[win.day_of_week]}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                    <Clock size={16} /> {win.start_time} - {win.end_time}
                                </div>
                                
                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={() => handleDelete(win.id)} style={{ background: 'rgba(227, 25, 95, 0.1)', color: 'var(--danger)', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Trash2 size={16} /> Delete Window
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}