import { useState, useEffect } from 'react';
import client from '../api/client';
import { Target, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function Gallery() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const { data } = await client.get('gallery/');
            setImages(data);
        } catch (err) {
            console.error("Failed to load custom images", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            await client.post('gallery/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFile(null);
            document.getElementById('file-input').value = '';
            fetchImages();
        } catch (err) {
            alert('Failed to upload image.');
        }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this image? It will no longer be used for today's promos.")) return;
        try {
            await client.delete(`gallery/${id}/`);
            fetchImages();
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    return (
        <div className="animate-fade-up">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Target size={32} color="var(--brand)" /> 
                Daily Custom Images (Promo)
            </h1>

            <div className="glass-panel" style={{ maxWidth: '800px', marginBottom: '40px' }}>
                <h3>Upload Today's Image</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    If you upload any images here TODAY, the background worker will randomly post these images INSTEAD of the normal bank receipts! After midnight, it reverts to normal until you upload a new one.
                </p>

                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '15px' }}>
                        <input 
                            id="file-input"
                            type="file" 
                            accept="image/*"
                            onChange={e => setFile(e.target.files[0])} 
                            required 
                            style={{ padding: '10px', background: 'transparent' }}
                        />
                    </div>
                    
                    <button type="submit" className="btn" disabled={uploading || !file} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Plus size={18} /> {uploading ? 'Uploading...' : 'Add to Today\'s Pool'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Today's Active Images</h3>
                <button onClick={fetchImages} style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {loading ? (
                 <p>Loading images...</p>
            ) : images.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No images uploaded yet. The bot will send normal bank receipts.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {images.map(img => (
                        <div key={img.id} className="glass-panel" style={{ padding: '15px', marginBottom: '0', textAlign: 'center' }}>
                            <img src={img.image} alt="Promo" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
                            <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                Uploaded: {new Date(img.uploaded_at).toLocaleTimeString()}
                            </p>
                            
                            <button onClick={() => handleDelete(img.id)} style={{ width: '100%', background: 'rgba(227, 25, 95, 0.1)', color: 'var(--danger)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                                <Trash2 size={16} /> Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
