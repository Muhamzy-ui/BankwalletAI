import { useState, useEffect, useRef } from 'react';
import client from '../api/client';

export default function Mapper() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [status, setStatus] = useState('');
    const canvasRef = useRef(null);
    
    const [coords, setCoords] = useState({
        amount: null,
        date: null,
        sender: null,
        receiver: null,
        ref: null
    });
    
    // The current field we are mapping strokes to (amount, date, etc)
    const [activeField, setActiveField] = useState('amount');

    useEffect(() => {
        client.get('templates/').then(res => {
            setTemplates(res.data);
        }).catch(err => {
            setStatus('❌ Failed to fetch templates');
        });
    }, []);
    
    // When a template is clicked, check if it already has coordinates mapped
    const loadTemplate = async (template) => {
        setSelectedTemplate(template);
        setActiveField('amount');
        setStatus('Loaded ' + template.filename);
        
        try {
            const res = await client.get('templates/coords/');
            if (res.data && res.data[template.filename]) {
                setCoords(res.data[template.filename]);
                setStatus('✅ Loaded existing coordinates from database!');
            } else {
                setCoords({ amount: null, date: null, sender: null, receiver: null, ref: null });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCanvasClick = (e) => {
        if (!selectedTemplate) return;
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Calculate true X and Y matching the physical image dimensions
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        
        const x = Math.round((e.clientX - rect.left) * scaleX);
        const y = Math.round((e.clientY - rect.top) * scaleY);

        setCoords(prev => ({
            ...prev,
            [activeField]: [x, y]
        }));
    };

    const handleSave = async () => {
        try {
            setStatus('Saving...');
            await client.post('templates/coords/', {
                filename: selectedTemplate.filename,
                coordinates: coords
            });
            setStatus('✅ Coordinates perfectly locked in the Database!');
        } catch (e) {
            setStatus('❌ Failed to save coordinates');
        }
    };

    // Draw the markers over the image natively when the image or coords change
    useEffect(() => {
        if (!selectedTemplate || !canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = `http://localhost:8000${selectedTemplate.url}`;
        
        img.onload = () => {
            // Set canvas exactly to image physical bounds
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Draw points
            Object.keys(coords).forEach(key => {
                const point = coords[key];
                if (point) {
                    ctx.beginPath();
                    ctx.arc(point[0], point[1], 10, 0, 2 * Math.PI);
                    ctx.fillStyle = key === activeField ? '#15d186' : '#e3195f';
                    ctx.fill();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "white";
                    ctx.stroke();
                    
                    // Text label
                    ctx.font = "24px Arial";
                    ctx.fillStyle = "black";
                    ctx.fillText(key.toUpperCase(), point[0] + 15, point[1] + 10);
                }
            });
        };
    }, [selectedTemplate, coords, activeField]);

    return (
        <div className="animate-fade-up">
            <h1>Dynamic Coordinate Mapper</h1>
            <p style={{ color: 'var(--text-muted)' }}>Click exactly where the dynamic text should be generated for each template.</p>
            
            {status && <p style={{ color: status.includes('❌') ? 'var(--danger)' : 'var(--success)' }}>{status}</p>}
            
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                {/* Left Panel: Template List & Controls */}
                <div className="glass-panel" style={{ width: '300px', height: 'fit-content' }}>
                    <h3>Templates Queue</h3>
                    <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
                        {templates.map(t => (
                            <li key={t.filename} 
                                onClick={() => loadTemplate(t)}
                                style={{ 
                                    padding: '10px', 
                                    cursor: 'pointer', 
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    background: selectedTemplate?.filename === t.filename ? 'var(--brand)' : 'transparent',
                                    borderRadius: '6px'
                                }}>
                                {t.filename}
                            </li>
                        ))}
                    </ul>
                    
                    {selectedTemplate && (
                        <div style={{ marginTop: '30px' }}>
                            <h3>Mapping: {selectedTemplate.filename}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {['amount', 'date', 'sender', 'receiver', 'ref'].map(field => (
                                    <button 
                                        key={field}
                                        onClick={() => setActiveField(field)}
                                        className="btn"
                                        style={{ 
                                            background: activeField === field ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                                            color: activeField === field ? 'black' : 'white',
                                            textAlign: 'left'
                                        }}>
                                        {coords[field] ? '✅' : '❌'} Set {field.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            
                            <button onClick={handleSave} className="btn" style={{ width: '100%', marginTop: '30px', background: 'var(--brand)' }}>
                                Save Coordinates
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel: Canvas rendering */}
                <div className="glass-panel" style={{ flex: 1, minHeight: '600px', padding: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                    {selectedTemplate ? (
                        <canvas 
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            style={{ cursor: 'crosshair', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            <p>Select a template from the left to start mapping</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
