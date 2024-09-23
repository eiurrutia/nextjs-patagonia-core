'use client';
import { useState } from 'react';
import { SimilarImage } from '@/app/lib/definitions';


const ImageUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
        setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        console.log('Submit');
        e.preventDefault();
        if (!file) return;

        setLoading(true); // Iniciar el estado de carga
        const formData = new FormData();
        formData.append('image', file);
        console.log('pegaremos a la api');

        try {
        const response = await fetch('/api/trade-in/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log('Imagenes similares obtenidas');
        setSimilarImages(data.similarImages); // Guardar las imágenes similares en el estado
        } catch (error) {
        console.error('Error uploading image:', error);
        } finally {
        setLoading(false); // Finalizar el estado de carga
        }
    };

    return (
        <div>
        <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileChange} accept="image/*" />
            <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Upload Image'}
            </button>
        </form>

        {loading && <p>Processing image...</p>}

        {/* Mostrar las imágenes similares si hay resultados */}
        {similarImages.length > 0 && (
            <div>
            <h3>Most Similar Images:</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
                {similarImages.map((image, index) => (
                <div key={index}>
                    <p>{image.item_color}</p>
                    <img
                    src={image.image_src}
                    alt={`Similar image ${index + 1}`}
                    style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                    />
                    <p>Similarity Score: {image.distance}</p>
                </div>
                ))}
            </div>
            </div>
        )}
        </div>
    );
};

export default ImageUpload;
