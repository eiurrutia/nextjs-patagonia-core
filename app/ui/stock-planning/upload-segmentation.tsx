'use client';
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export default function UploadSegmentation() {
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

      const rows = text
        .split('\n')
        .slice(1)
        .filter((row) => row.trim() !== '')
        .map((row) => row.split(delimiter));

      const data = rows.map((row) => ({
        SKU: row[0],
        COYHAIQUE: Number(row[1]) || 0,
        LASCONDES: Number(row[2]) || 0,
        MALLSPORT: Number(row[3]) || 0,
        COSTANERA: Number(row[4]) || 0,
        CONCEPCION: Number(row[5]) || 0,
        PTOVARAS: Number(row[6]) || 0,
        LADEHESA: Number(row[7]) || 0,
        PUCON: Number(row[8]) || 0,
        TEMUCO: Number(row[9]) || 0,
        OSORNO: Number(row[10]) || 0,
        ALERCE: Number(row[11]) || 0,
        BNAVENTURA: Number(row[12]) || 0,
      }));

      try {
        const response = await fetch('/api/stock-planning/upload-segments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to upload stock segmentation');
        }

        alert('File uploaded successfully!');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file.');
      } finally {
        setIsUploading(false);
        setFile(null);
        setIsModalOpen(false);
      }
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
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer"
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
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
