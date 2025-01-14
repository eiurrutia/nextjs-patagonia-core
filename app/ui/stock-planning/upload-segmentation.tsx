'use client';
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export default function UploadSegmentation({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return commaCount >= semicolonCount ? ',' : ';';
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) setIsModalOpen(true);
  };

  const handleUpload = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsUploading(true);
      const text = event.target?.result as string;
      const delimiter = detectDelimiter(text);

      const lines = text.split('\n').filter((line) => line.trim() !== '');
      const headers = lines[0].split(delimiter).map(header => header.trim().toUpperCase());

      const rows = lines.slice(1).map(line => line.split(delimiter).map(value => value.trim()));
      const data = rows.map((row) => {
        const segment: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (header === 'SKU' || header === 'DELIVERY') {
            segment[header] = row[index];
          } else {
            segment[header] = Number(row[index]) || 0;
          }
        });
        return segment;
      });

      const batchSize = 7000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const isFirstBatch = i === 0;
  
        try {
          const response = await fetch('/api/stock-planning/upload-segments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: batch, isFirstBatch }),
          });
  
          if (!response.ok) {
            throw new Error('Failed to upload batch');
          }
        } catch (error) {
          console.error('Error uploading batch:', error);
          alert('Failed to upload batch.');
          return;
        }
      }
      alert('File uploaded successfully!');
      onUploadComplete();
      setIsUploading(false);
      setIsModalOpen(false);
      setFile(null);
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isModalOpen]);

  return (
    <>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileSelection}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="bg-steelblue text-white px-4 py-2 rounded-lg hover:bg-steelblue cursor-pointer"
        onClick={(event) => event.stopPropagation()} 
      >
        {isUploading ? 'Uploading...' : 'Actualizar Segmentación'}
      </label>

      {isModalOpen &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            autoFocus
          >
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Confirmación</h2>
              <p>
                Al cargar la nueva segmentación vas a pisar todos los datos
                actualmente cargados. ¿Estás seguro?
              </p>
              <div className="mt-4 flex justify-end space-x-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291l2.122-2.122A4 4 0 004 12H0c0 2.21.895 4.21 2.343 5.657l1.657 1.657z"
                        ></path>
                      </svg>
                      Cargando...
                    </span>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
